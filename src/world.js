import * as THREE from 'three';
import { getTheme } from './themes.js';
import { directionalDestination } from './navigation.js';

// Authored geometry, materials, motion, and layout. The destinations are content slots,
// not a game simulation; arrows follow their current positions on the screen.
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);

function randomFrom(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function modelKit(group) {
  const materials = new Set();
  const geometries = new Set();
  const mat = (color, options = {}) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.08, ...options });
    materials.add(material);
    return material;
  };
  const geo = (geometry) => {
    geometries.add(geometry);
    return geometry;
  };
  const mesh = (geometry, material, x = 0, y = 0, z = 0, parent = group) => {
    geometries.add(geometry);
    materials.add(material);
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const box = (w, h, d, material, x = 0, y = 0, z = 0, parent = group) =>
    mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
  const cylinder = (top, bottom, height, material, x = 0, y = 0, z = 0, parent = group, segments = 32) =>
    mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material, x, y, z, parent);
  const sphere = (radius, material, x = 0, y = 0, z = 0, parent = group) =>
    mesh(new THREE.SphereGeometry(radius, 24, 16), material, x, y, z, parent);
  const ring = (radius, tube, material, x = 0, y = 0, z = 0, parent = group) => {
    const object = mesh(new THREE.TorusGeometry(radius, tube, 8, 64), material, x, y, z, parent);
    object.rotation.x = Math.PI / 2;
    return object;
  };
  const beam = (a, b, radius, material, parent = group) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const object = cylinder(radius, radius, start.distanceTo(end), material, 0, 0, 0, parent, 8);
    object.position.copy(start).lerp(end, 0.5);
    object.quaternion.setFromUnitVectors(UP, end.sub(start).normalize());
    return object;
  };
  return {
    mat, geo, mesh, box, cylinder, sphere, ring, beam,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      group.clear();
    },
  };
}

function islandGeometry(radius, height, seed) {
  const random = randomFrom(seed);
  const points = [];
  for (let i = 0; i < 14; i++) {
    const angle = i / 14 * TAU;
    const r = radius * (0.87 + random() * 0.19);
    points.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
  }
  const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points), {
    depth: height, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3, steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function attachStop(kit, stops, id, position, labelHeight, accent) {
  stops[id] = { position: new THREE.Vector3(...position), label: new THREE.Vector3(position[0], labelHeight, position[2]) };
  const marker = kit.ring(0.27, 0.012, accent, position[0], position[1] + 0.01, position[2]);
  marker.userData.destination = id;
  return marker;
}

function buildSea(group) {
  const kit = modelKit(group);
  const limestone = kit.mat('#efe9d7');
  const cutStone = kit.mat('#c7cdbd');
  const sand = kit.mat('#88b9b0');
  const ink = kit.mat('#164248');
  const brass = kit.mat('#d6b581', { metalness: 0.65, roughness: 0.3 });
  const white = kit.mat('#faf5e9');
  const glass = kit.mat('#58b3b4', { metalness: 0.35, roughness: 0.2 });
  const glow = kit.mat('#85ede0', { emissive: '#48ac9e', emissiveIntensity: 0.7 });
  const water = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vWorld; uniform float uTime;
      void main() {
        vec3 p = position;
        float wave = sin(p.x * 0.7 + uTime * 0.38) * cos(p.y * 0.52 + uTime * 0.24);
        p.z += wave * 0.045;
        vec4 world = modelMatrix * vec4(p, 1.0); vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `varying vec3 vWorld; uniform float uTime;
      void main() {
        float ripple = sin(vWorld.x * 2.0 + vWorld.z * 1.1 + uTime * 0.5);
        float crossing = sin(vWorld.z * 3.0 - vWorld.x * 0.6 - uTime * 0.3);
        float shimmer = pow(max(0.0, ripple * crossing), 14.0);
        float distanceFade = 1.0 - smoothstep(2.0, 16.0, length(vWorld.xz));
        vec3 water = mix(vec3(0.023, 0.078, 0.102), vec3(0.041, 0.24, 0.27), distanceFade);
        water += vec3(0.13, 0.24, 0.23) * shimmer * distanceFade * 0.24;
        gl_FragColor = vec4(water, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  // Keep the boundary beyond the camera's far plane; the sea must not read as
  // a rectangular tabletop. The grid density stays fixed for the same draw cost.
  const ocean = kit.mesh(new THREE.PlaneGeometry(400, 400, 70, 70), water, 0, -0.13, 0);
  ocean.rotation.x = -Math.PI / 2;
  ocean.castShadow = false;
  // Spread around the camera's ground-plane axes: an upper research island,
  // two side islands, and a foreground harbor. Journal and Journey have
  // different screen columns as well as different depths.
  const positions = { work: [5.4, 0.36, -0.45], research: [-3.0, 0.36, -3.9], journal: [-5.2, 0.36, 1.55], journey: [1.45, 0.36, 5.1], news: [2.4, 0.36, -5.2] };
  const stops = {};
  Object.entries(positions).forEach(([id, p], i) => {
    const radius = id === 'news' ? 1.12 : id === 'journey' ? 1.8 : 1.85;
    kit.mesh(islandGeometry(radius + 0.23, 0.12, 67 + i), sand, p[0], -0.09, p[2]);
    kit.mesh(islandGeometry(radius, 0.36, 67 + i), cutStone, p[0], -0.04, p[2]);
    kit.mesh(islandGeometry(radius * 0.92, 0.11, 67 + i), limestone, p[0], 0.31, p[2]);
    attachStop(kit, stops, id, p, id === 'news' ? 3.9 : 2.65, glow);
  });
  // Scale each coherent landmark assembly around its own island, preserving
  // doors, mullions, and support spacing. The map gains room without losing
  // the readable ceramic objects that give each destination its identity.
  const finishLandmark = (position, start, scale = 1.12) => {
    const pieces = group.children.slice(start);
    const landmark = new THREE.Group();
    landmark.position.set(...position);
    pieces.forEach((piece) => {
      piece.position.sub(landmark.position);
      landmark.add(piece);
    });
    landmark.scale.setScalar(scale);
    group.add(landmark);
  };
  // A terraced studio: a pergola, a colored door, and a low parapet.
  const w = positions.work;
  let landmarkStart = group.children.length;
  kit.box(1.7, 0.9, 1.2, white, w[0], 0.98, w[2]);
  kit.box(1.86, 0.1, 1.36, limestone, w[0], 1.49, w[2]);
  kit.box(0.35, 0.64, 0.04, ink, w[0] + 0.43, 0.84, w[2] + 0.622);
  kit.box(0.52, 0.35, 0.04, glass, w[0] - 0.42, 1.0, w[2] + 0.622);
  for (let i = 0; i < 7; i++) kit.box(0.065, 0.065, 0.9, brass, w[0] - 0.67 + i * 0.2, 1.72, w[2] + 0.3);
  [-0.7, 0.7].forEach((x) => kit.box(0.04, 0.3, 0.04, brass, w[0] + x, 1.61, w[2] + 0.66));
  finishLandmark(w, landmarkStart);
  // Observatory with an open dome slit and a precise telescope, not a stock icon.
  const r = positions.research;
  landmarkStart = group.children.length;
  kit.cylinder(0.85, 0.85, 0.65, white, r[0], 0.8, r[2]);
  const dome = kit.mesh(new THREE.SphereGeometry(0.88, 32, 16, 0.13, TAU - 0.27, 0, Math.PI / 2), ink, r[0], 1.12, r[2]);
  dome.rotation.y = -0.6;
  const telescope = new THREE.Group();
  telescope.position.set(r[0], 1.35, r[2]);
  telescope.rotation.z = -0.6;
  kit.cylinder(0.12, 0.12, 0.95, brass, 0, 0.35, 0, telescope);
  kit.cylinder(0.15, 0.15, 0.08, glass, 0, 0.85, 0, telescope);
  group.add(telescope);
  finishLandmark(r, landmarkStart);
  // Journal courtyard and cypress: a quiet outdoor desk rather than another building.
  const j = positions.journal;
  landmarkStart = group.children.length;
  kit.box(1.75, 0.22, 1.65, white, j[0], 0.59, j[2]);
  kit.box(1.75, 0.63, 0.11, limestone, j[0], 0.95, j[2] - 0.76);
  kit.box(0.82, 0.06, 0.48, brass, j[0], 1.05, j[2] + 0.18);
  [-0.3, 0.3].forEach((x) => kit.box(0.06, 0.42, 0.3, ink, j[0] + x, 0.83, j[2] + 0.18));
  const book = kit.box(0.3, 0.025, 0.24, white, j[0], 1.1, j[2] + 0.18);
  book.rotation.y = 0.28;
  kit.cylinder(0.15, 0.22, 0.3, limestone, j[0] + 0.74, 0.85, j[2] - 0.35);
  const cypress = kit.sphere(0.45, ink, j[0] + 0.74, 1.57, j[2] - 0.35);
  cypress.scale.set(0.5, 1.8, 0.5);
  finishLandmark(j, landmarkStart, 1.08);
  // Harbor steps, a pier, and mooring posts.
  const h = positions.journey;
  landmarkStart = group.children.length;
  for (let i = 0; i < 4; i++) kit.box(1.7 - i * 0.2, 0.09, 0.5, white, h[0], 0.15 + i * 0.1, h[2] + 0.92 - i * 0.31);
  kit.box(0.56, 0.08, 1.25, brass, h[0] + 0.72, 0.18, h[2] + 1.35);
  [-0.18, 0.18].forEach((x) => kit.cylinder(0.04, 0.04, 0.38, ink, h[0] + 0.72 + x, 0.2, h[2] + 1.86));
  kit.ring(0.61, 0.035, ink, h[0] - 0.34, 0.57, h[2] - 0.3);
  finishLandmark(h, landmarkStart, 1.08);
  // News lighthouse; its slow beam gives the world a distinct, legible motion.
  const n = positions.news;
  landmarkStart = group.children.length;
  kit.cylinder(0.27, 0.43, 2.1, white, n[0], 1.46, n[2]);
  kit.cylinder(0.36, 0.36, 0.08, brass, n[0], 2.51, n[2]);
  kit.cylinder(0.23, 0.23, 0.34, glass, n[0], 2.72, n[2]);
  kit.cylinder(0, 0.35, 0.23, ink, n[0], 3.0, n[2]);
  kit.sphere(0.12, glow, n[0], 2.72, n[2]);
  const beacon = new THREE.Group();
  beacon.position.set(n[0], 2.72, n[2]);
  const lightBeam = kit.mesh(new THREE.ConeGeometry(0.46, 3, 24, 1, true), kit.mat('#93e9da', { transparent: true, opacity: 0.075, depthWrite: false, side: THREE.DoubleSide }), 1.5, 0, 0, beacon);
  lightBeam.rotation.z = Math.PI / 2;
  group.add(beacon);
  finishLandmark(n, landmarkStart, 1.08);
  // A tiny sailboat, with a curved ceramic hull and cotton sail.
  const traveler = new THREE.Group();
  const hull = kit.sphere(0.42, white, 0, 0.14, 0, traveler);
  hull.scale.set(0.43, 0.28, 1.15);
  kit.box(0.22, 0.04, 0.63, brass, 0, 0.21, 0, traveler);
  kit.cylinder(0.013, 0.013, 0.83, ink, 0, 0.57, 0, traveler, 8);
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0.018, 0); sailShape.lineTo(0.018, 0.73); sailShape.quadraticCurveTo(0.19, 0.29, 0.46, 0); sailShape.closePath();
  const sail = kit.mesh(new THREE.ShapeGeometry(sailShape), kit.mat('#fff7e5', { side: THREE.DoubleSide }), 0, 0.25, 0, traveler);
  sail.rotation.y = Math.PI / 2;
  group.add(traveler);
  return {
    kit, stops, traveler, background: '#071d27', fog: ['#071d27', 29, 61], camera: [11.5, 11.4, 14.5], target: [0, 0.1, 0],
    travelPoint(id) { const p = stops[id].position; return new THREE.Vector3(p.x, 0, p.z + 1.9); },
    animate(time) {
      water.uniforms.uTime.value = time;
      beacon.rotation.y = time * 0.23;
      traveler.children[0].rotation.z = Math.sin(time * 1.2) * 0.025;
      traveler.position.y = Math.sin(time * 1.6) * 0.028;
    },
  };
}

function buildOrbital(group) {
  const kit = modelKit(group);
  const ceramic = kit.mat('#d8dbe7', { metalness: 0.26, roughness: 0.4 });
  const graphite = kit.mat('#283349', { metalness: 0.65, roughness: 0.35 });
  const trim = kit.mat('#8b91af', { metalness: 0.65 });
  const glow = kit.mat('#b2aaff', { emissive: '#8772ec', emissiveIntensity: 0.8 });
  const amber = kit.mat('#e6bf85', { emissive: '#98734b', emissiveIntensity: 0.25 });
  const glass = kit.mat('#77b6ce', { metalness: 0.7, roughness: 0.12 });
  const stops = {};
  const positions = { work: [5.28, 1.05, -0.96], research: [-4.36, 2, -3.98], journal: [-5.34, 0.5, 2.38], journey: [1.76, 0, 4.68], news: [2.04, 0.4, -5.78] };
  // Fine illuminated rails describe an authored constellation, not sea islands.
  [['journey', 'journal'], ['journal', 'research'], ['research', 'news'], ['news', 'work'], ['work', 'journey']].forEach(([a, b]) => {
    const p = positions[a]; const q = positions[b];
    kit.beam([p[0], p[1] - 0.42, p[2]], [q[0], q[1] - 0.42, q[2]], 0.025, trim);
    kit.beam([p[0], p[1] - 0.37, p[2]], [q[0], q[1] - 0.37, q[2]], 0.009, glow);
  });
  Object.entries(positions).forEach(([id, p]) => {
    const radius = id === 'news' ? 0.85 : 1.35;
    kit.cylinder(radius, radius * 0.78, 0.18, ceramic, p[0], p[1] - 0.18, p[2]);
    kit.cylinder(radius * 0.64, radius * 0.85, 0.4, graphite, p[0], p[1] - 0.46, p[2]);
    kit.ring(radius + 0.09, 0.018, glow, p[0], p[1] - 0.12, p[2]);
    // Raise the dish's label above its antenna so News and the workshop remain
    // clearly separate on narrow screens, without shrinking the station.
    const labelHeight = id === 'research' ? 2.65 : id === 'news' ? 2.75 : 1.95;
    attachStop(kit, stops, id, p, p[1] + labelHeight, glow);
  });
  const w = positions.work;
  kit.box(1.5, 0.8, 1.1, ceramic, w[0], w[1] + 0.5, w[2]);
  kit.box(0.7, 0.4, 0.04, glass, w[0], w[1] + 0.58, w[2] + 0.56);
  const arrays = [];
  [-1, 1].forEach((side) => {
    kit.beam([w[0], w[1] + 0.5, w[2]], [w[0] + side * 1.9, w[1] + 0.5, w[2]], 0.035, trim);
    const panel = kit.box(1.1, 0.045, 0.88, graphite, w[0] + side * 1.45, w[1] + 0.5, w[2]);
    panel.rotation.z = side * -0.28;
    arrays.push(panel);
    for (let i = 0; i < 5; i++) kit.box(0.01, 0.055, 0.89, trim, w[0] + side * 1.45 - 0.43 + i * 0.21, w[1] + 0.51, w[2]);
  });
  const r = positions.research;
  kit.cylinder(0.13, 0.32, 0.8, graphite, r[0], r[1] + 0.3, r[2]);
  const instrument = new THREE.Group();
  instrument.position.set(r[0], r[1] + 1.02, r[2]);
  const outer = kit.ring(0.73, 0.034, ceramic, 0, 0, 0, instrument);
  outer.rotation.set(0.6, 0, 0.35);
  const middle = kit.ring(0.59, 0.026, glow, 0, 0, 0, instrument);
  middle.rotation.set(0.1, 0.6, 1.2);
  kit.sphere(0.24, glass, 0, 0, 0, instrument);
  group.add(instrument);
  const j = positions.journal;
  kit.cylinder(0.66, 0.66, 0.08, graphite, j[0], j[1] + 0.08, j[2]);
  for (let i = 0; i < 5; i++) {
    const angle = i / 5 * TAU;
    const tablet = kit.box(0.38, 0.6, 0.045, ceramic, j[0] + Math.cos(angle) * 0.72, j[1] + 0.55, j[2] + Math.sin(angle) * 0.72);
    tablet.rotation.y = Math.PI / 2 - angle;
    kit.sphere(0.027, glow, j[0] + Math.cos(angle) * 0.74, j[1] + 0.91, j[2] + Math.sin(angle) * 0.74);
  }
  const h = positions.journey;
  const dock = kit.ring(0.87, 0.12, ceramic, h[0], h[1] + 0.85, h[2]);
  dock.rotation.x = 0;
  kit.box(1.9, 0.1, 0.58, graphite, h[0], h[1] + 0.05, h[2]);
  const n = positions.news;
  kit.cylinder(0.05, 0.1, 1.2, trim, n[0], n[1] + 0.55, n[2]);
  const dish = kit.mesh(new THREE.SphereGeometry(0.65, 24, 14, 0, TAU, 0, Math.PI * 0.42), ceramic, n[0], n[1] + 1.3, n[2]);
  dish.rotation.set(0.45, 0, -0.4);
  kit.beam([n[0], n[1] + 1.2, n[2]], [n[0] + 0.25, n[1] + 1.86, n[2] + 0.3], 0.015, amber);
  // Seeded stars are geometry. Nothing is fetched from a skybox service.
  const starRandom = randomFrom(701);
  const starPositions = new Float32Array(320 * 3);
  for (let i = 0; i < 320; i++) {
    const angle = starRandom() * TAU;
    const radius = 18 + starRandom() * 20;
    starPositions[i * 3] = Math.cos(angle) * radius;
    starPositions[i * 3 + 1] = 2 + starRandom() * 22;
    starPositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const starsGeometry = kit.geo(new THREE.BufferGeometry());
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: '#b8c7e8', size: 0.035, transparent: true, opacity: 0.65, sizeAttenuation: true });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  group.add(stars);
  const traveler = new THREE.Group();
  const capsule = kit.sphere(0.25, ceramic, 0, 0, 0, traveler);
  capsule.scale.set(0.75, 0.75, 1.65);
  const canopy = kit.sphere(0.17, glass, 0, 0.13, -0.03, traveler);
  canopy.scale.set(0.8, 0.6, 1.1);
  const engine = kit.cylinder(0.085, 0.11, 0.08, glow, 0, 0, 0.39, traveler, 16);
  engine.rotation.x = Math.PI / 2;
  group.add(traveler);
  return {
    kit, stops, traveler, background: '#090f23', fog: ['#090f23', 37, 79], camera: [13, 12.5, 17.33], target: [0, 0.5, 0],
    travelPoint(id) { const p = stops[id].position; return new THREE.Vector3(p.x, p.y + 0.72, p.z + 1.6); },
    animate(time) {
      instrument.rotation.y = time * 0.17;
      middle.rotation.z = time * 0.2;
      stars.rotation.y = time * 0.002;
      traveler.children[0].rotation.z = Math.sin(time * 1.1) * 0.02;
    },
    dispose() { starsMaterial.dispose(); },
  };
}

function buildWoodland(group) {
  const kit = modelKit(group);
  const earth = kit.mat('#163b35');
  const moss = kit.mat('#4f7660');
  const path = kit.mat('#9ba98a');
  const timber = kit.mat('#a38766');
  const dark = kit.mat('#29443e');
  const roof = kit.mat('#799282', { metalness: 0.25 });
  const pale = kit.mat('#e8dfc7');
  const foliage = kit.mat('#315c4b');
  const lightFoliage = kit.mat('#476e51');
  const glow = kit.mat('#deefac', { emissive: '#c1d780', emissiveIntensity: 0.75 });
  const glass = kit.mat('#a4d2bc', { transparent: true, opacity: 0.18, roughness: 0.08, metalness: 0.15, depthWrite: false, side: THREE.DoubleSide });
  const stops = {};
  const positions = { work: [5.35, 0.16, -0.35], research: [-2.8, 0.16, -4.4], journal: [-5.35, 0.16, 1.55], journey: [1.65, 0.16, 5.0], news: [2.5, 0.16, -5.45] };
  const land = kit.cylinder(10.5, 10.2, 0.4, earth, 0, -0.22, 0, group, 96);
  land.scale.z = 0.86;
  const under = kit.cylinder(10.2, 9.2, 0.45, dark, 0, -0.62, 0, group, 96);
  under.scale.z = 0.86;
  Object.entries(positions).forEach(([id, p]) => {
    const clearing = kit.cylinder(id === 'journey' ? 1.45 : 1.65, 1.55, 0.05, moss, p[0], 0.02, p[2]);
    clearing.scale.z = 0.85;
    const rim = kit.ring(1.5, 0.012, path, p[0], 0.07, p[2]);
    rim.scale.z = 0.85;
    attachStop(kit, stops, id, p, id === 'news' ? 3.8 : 2.5, glow);
  });
  const trailRoutes = [
    ['journey', 'journal', [-1.8, 0.085, 3.25]],
    ['journey', 'work', [4.3, 0.085, 3.4]],
    ['journal', 'research', [-5.45, 0.085, -1.6]],
    ['research', 'news', [-0.1, 0.085, -6.1]],
    ['news', 'work', [5.15, 0.085, -3.1]],
  ];
  const trailCurves = trailRoutes.map(([from, to, bend]) => {
    const a = positions[from]; const b = positions[to];
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(a[0], 0.085, a[2]),
      new THREE.Vector3(...bend),
      new THREE.Vector3(b[0], 0.085, b[2]),
    ]);
  });
  trailCurves.forEach((curve) => {
    const trail = kit.mesh(new THREE.TubeGeometry(curve, 32, 0.075, 6, false), path);
    trail.scale.y = 0.18;
    trail.position.y = 0.055;
    trail.castShadow = false;
  });
  // Meandering narrow creek, drawn as a flat ribbon, with small stepping stones.
  const stream = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8, 0.06, 3.5), new THREE.Vector3(-5, 0.06, 3), new THREE.Vector3(-2, 0.06, 1.4),
    new THREE.Vector3(1, 0.06, 0), new THREE.Vector3(3, 0.06, -1.8), new THREE.Vector3(7, 0.06, -2.6),
  ]);
  const points = stream.getPoints(80);
  const ribbonPositions = []; const ribbonIndices = [];
  points.forEach((point, i) => {
    const tangent = stream.getTangent(i / 80);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(0.2);
    ribbonPositions.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z);
    if (i < 80) ribbonIndices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  });
  const ribbon = new THREE.BufferGeometry();
  ribbon.setAttribute('position', new THREE.Float32BufferAttribute(ribbonPositions, 3));
  ribbon.setIndex(ribbonIndices); ribbon.computeVertexNormals();
  kit.mesh(ribbon, kit.mat('#6fada8', { metalness: 0.45, roughness: 0.18, side: THREE.DoubleSide }));
  for (let i = 0; i < 4; i++) kit.cylinder(0.13, 0.15, 0.07, pale, -2.6 + i * 0.2, 0.12, 1.63 + i * 0.18, group, 12);
  // Trees share geometry and materials, but each canopy gets a distinct seeded form.
  const random = randomFrom(991);
  const trunkGeometry = kit.geo(new THREE.CylinderGeometry(0.06, 0.1, 1.4, 7));
  const canopyGeometry = kit.geo(new THREE.IcosahedronGeometry(0.78, 1));
  for (let i = 0; i < 95; i++) {
    const angle = random() * TAU;
    const radius = Math.sqrt(random()) * 9.0;
    const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius * 0.8;
    if (Object.values(positions).some((p) => Math.hypot(p[0] - x, p[2] - z) < 2.2)) continue;
    if (trailCurves.some((curve) => curve.getPoints(12).some((p) => Math.hypot(p.x - x, p.z - z) < 0.75))) continue;
    if (z > 2 && Math.abs(x) < 5.5) continue; // Keep the reading foreground open.
    const scale = 0.65 + random() * 0.6;
    const trunk = kit.mesh(trunkGeometry, timber, x, 0.7 * scale, z);
    trunk.scale.set(scale, scale, scale);
    const crown = kit.mesh(canopyGeometry, i % 3 ? foliage : lightFoliage, x, 1.6 * scale, z);
    crown.scale.set(scale * 0.8, scale * 1.35, scale * 0.8);
    crown.rotation.y = random() * TAU;
  }
  // Maker hut, with an asymmetrical sloping roof and a workbench outside.
  const w = positions.work;
  kit.box(1.55, 0.93, 1.1, timber, w[0], 0.67, w[2]);
  const hutRoof = kit.box(1.85, 0.1, 1.5, roof, w[0], 1.21, w[2]);
  hutRoof.rotation.z = -0.1;
  kit.box(0.32, 0.66, 0.035, dark, w[0] + 0.35, 0.53, w[2] + 0.565);
  kit.box(0.53, 0.32, 0.035, glow, w[0] - 0.35, 0.79, w[2] + 0.565);
  kit.box(0.75, 0.07, 0.38, pale, w[0] - 0.6, 0.67, w[2] + 0.97);
  [-0.25, 0.25].forEach((x) => kit.box(0.05, 0.55, 0.24, dark, w[0] - 0.6 + x, 0.39, w[2] + 0.97));
  // Glasshouse: slim timber mullions, actual transparent panels, and seedlings.
  const r = positions.research;
  kit.box(1.8, 0.12, 1.4, pale, r[0], 0.17, r[2]);
  kit.box(1.72, 0.94, 1.32, glass, r[0], 0.71, r[2]);
  [-0.85, 0, 0.85].forEach((x) => [-0.65, 0.65].forEach((z) => kit.box(0.035, 1.02, 0.035, timber, r[0] + x, 0.72, r[2] + z)));
  [-0.65, 0.65].forEach((z) => kit.box(1.76, 0.035, 0.035, timber, r[0], 1.23, r[2] + z));
  [-1, 1].forEach((side) => {
    const panel = kit.box(1.05, 0.028, 1.35, glass, r[0] + side * 0.44, 1.43, r[2]);
    panel.rotation.z = -side * 0.4;
    kit.beam([r[0] + side * 0.88, 1.23, r[2] - 0.67], [r[0], 1.62, r[2] - 0.67], 0.024, timber);
    kit.beam([r[0] + side * 0.88, 1.23, r[2] + 0.67], [r[0], 1.62, r[2] + 0.67], 0.024, timber);
  });
  kit.beam([r[0], 1.62, r[2] - 0.7], [r[0], 1.62, r[2] + 0.7], 0.025, timber);
  for (let i = 0; i < 6; i++) {
    const x = r[0] - 0.5 + (i % 3) * 0.5; const z = r[2] - 0.32 + Math.floor(i / 3) * 0.65;
    kit.cylinder(0.12, 0.09, 0.18, timber, x, 0.34, z, group, 12);
    kit.sphere(0.13, lightFoliage, x, 0.51, z);
  }
  const j = positions.journal;
  kit.box(1.25, 0.12, 0.38, timber, j[0], 0.55, j[2]);
  [-0.44, 0.44].forEach((x) => kit.box(0.09, 0.38, 0.32, dark, j[0] + x, 0.3, j[2]));
  kit.box(1.25, 0.43, 0.07, timber, j[0], 0.83, j[2] - 0.18);
  kit.box(0.31, 0.03, 0.24, pale, j[0] + 0.18, 0.635, j[2]);
  kit.cylinder(0.028, 0.035, 1.48, timber, j[0] - 0.77, 0.79, j[2] + 0.45);
  kit.sphere(0.14, glow, j[0] - 0.77, 1.54, j[2] + 0.45);
  const h = positions.journey;
  const arch = kit.mesh(new THREE.TorusGeometry(0.88, 0.055, 8, 48, Math.PI), timber, h[0], 0.25, h[2]);
  arch.rotation.z = 0;
  kit.box(0.7, 0.035, 0.2, pale, h[0], 1.1, h[2]);
  [-0.5, 0, 0.5].forEach((x) => kit.cylinder(0.17, 0.18, 0.05, path, h[0] + x * 0.1, 0.1, h[2] + 0.3 + x, group, 12));
  const n = positions.news;
  [-0.48, 0.48].forEach((x) => [-0.48, 0.48].forEach((z) => kit.box(0.055, 2.05, 0.055, timber, n[0] + x, 1.1, n[2] + z)));
  kit.box(1.16, 0.12, 1.16, pale, n[0], 2.12, n[2]);
  [-0.55, 0.55].forEach((z) => kit.box(1.16, 0.045, 0.035, timber, n[0], 2.62, n[2] + z));
  [-0.55, 0.55].forEach((x) => kit.box(0.035, 0.045, 1.16, timber, n[0] + x, 2.62, n[2]));
  for (let i = 0; i < 8; i++) kit.box(0.33, 0.035, 0.08, timber, n[0], 0.25 + i * 0.25, n[2] + 0.57);
  [-0.2, 0.2].forEach((x) => kit.box(0.04, 2.12, 0.04, timber, n[0] + x, 1.15, n[2] + 0.57));
  const traveler = new THREE.Group();
  kit.sphere(0.075, glow, 0, 0, 0, traveler);
  const wingMaterial = kit.mat('#cfdfb1', { transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const wings = [-1, 1].map((side) => {
    const wing = kit.mesh(new THREE.SphereGeometry(0.1, 12, 8), wingMaterial, side * 0.09, 0.04, 0, traveler);
    wing.scale.set(1, 0.1, 0.5);
    return wing;
  });
  const halo = kit.sphere(0.24, kit.mat('#d6ed9d', { transparent: true, opacity: 0.035, depthWrite: false }), 0, 0, 0, traveler);
  group.add(traveler);
  return {
    kit, stops, traveler, background: '#0c2427', fog: ['#0c2427', 24, 48], camera: [13, 13.5, 17.33], target: [0, 0.3, 0],
    travelPoint(id) { const p = stops[id].position; return new THREE.Vector3(p.x, 1.18, p.z + 1.32); },
    animate(time) {
      wings.forEach((wing, i) => { wing.rotation.z = Math.sin(time * 15) * (i ? -0.2 : 0.2); });
      halo.scale.setScalar(0.9 + Math.sin(time * 2) * 0.08);
    },
  };
}

const BUILDERS = { sea: buildSea, orbital: buildOrbital, woodland: buildWoodland };

/**
 * Owns its canvas, projected HTML buttons, input listeners, and WebGL resources.
 * select() mirrors external content selection silently. Actual world interactions
 * invoke onVisit immediately; travel is visual and never gates access to content.
 */
export function createWorld({ mount, themeId = 'sea', destinations = [], onVisit = () => {}, onStatus = () => {}, onExit = () => {} } = {}) {
  if (!mount) throw new TypeError('createWorld requires a mount element.');
  const noop = () => {};
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch {
    onStatus({ ready: false, message: 'The 3D view is unavailable here. Every destination is still available in the reading view.' });
    return { select: noop, setTheme: noop, setMotion: noop, destroy: noop };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.className = 'world-canvas';
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;position:absolute;inset:0;';
  mount.append(renderer.domElement);
  if (!mount.hasAttribute('tabindex')) mount.tabIndex = 0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 130);
  const hemisphere = new THREE.HemisphereLight('#c0e3de', '#0c1c2b', 2.2);
  scene.add(hemisphere);
  const keyLight = new THREE.DirectionalLight('#fff2d8', 3.0);
  keyLight.position.set(-8, 14, 7);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 35 });
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.025;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight('#7dabbf', 1.3);
  fillLight.position.set(9, 4, -9);
  scene.add(fillLight);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const initialTouch = window.matchMedia('(pointer: coarse)').matches;
  let motionRequested = !reducedMotion.matches && !initialTouch;
  let world;
  let worldGroup;
  let selectedId = destinations.some((stop) => stop.id === 'journey') ? 'journey' : destinations[0]?.id || 'work';
  let labels = [];
  let frame = 0;
  let destroyed = false;
  let contextLost = false;
  let inView = true;
  let invalidated = true;
  let elapsed = 0;
  let previousTimestamp = 0;
  let transition = null;
  let width = 1;
  let height = 1;
  let lastArrowAt = -Infinity;
  const labelPosition = new THREE.Vector3();
  const canDraw = () => !destroyed && !contextLost && inView && !document.hidden && width > 1 && height > 1;
  const moving = () => motionRequested && !reducedMotion.matches;

  function updateLabels() {
    labels.forEach(({ element, id }) => {
      labelPosition.copy(world.stops[id].label).project(camera);
      const visible = labelPosition.z > -1 && labelPosition.z < 1;
      element.hidden = !visible;
      element.style.left = `${(labelPosition.x * 0.5 + 0.5) * width}px`;
      element.style.top = `${(-labelPosition.y * 0.5 + 0.5) * height}px`;
      element.classList.toggle('is-active', id === selectedId);
      element.setAttribute('aria-pressed', String(id === selectedId));
    });
  }

  function draw(timestamp) {
    frame = 0;
    if (!canDraw()) { previousTimestamp = 0; return; }
    const dt = previousTimestamp ? Math.min((timestamp - previousTimestamp) / 1000, 0.06) : 0;
    previousTimestamp = timestamp;
    if (moving()) {
      elapsed += dt;
      if (transition) {
        transition.progress = Math.min(transition.progress + dt / 1.15, 1);
        const t = transition.progress;
        const ease = t * t * (3 - 2 * t);
        world.traveler.position.copy(transition.from).lerp(transition.to, ease);
        const direction = transition.to.clone().sub(transition.from);
        if (direction.lengthSq() > 0.00001) world.traveler.rotation.y = Math.atan2(direction.x, direction.z);
        if (t === 1) transition = null;
      }
      world.animate(elapsed);
    }
    renderer.render(scene, camera);
    updateLabels();
    invalidated = false;
    if (moving()) frame = requestAnimationFrame(draw);
    else previousTimestamp = 0;
  }

  function invalidate() {
    invalidated = true;
    if (canDraw() && !frame) frame = requestAnimationFrame(draw);
  }

  function suspend() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTimestamp = 0;
  }

  function resize() {
    width = Math.round(mount.clientWidth);
    height = Math.round(mount.clientHeight);
    if (!width || !height || !world) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    let scale = Math.max(1, Math.sqrt(1.45 / camera.aspect));
    camera.updateProjectionMatrix();
    // Fit projected labels as well as objects. A wide desktop composition should
    // never push the lighthouse or its button out of a narrow mobile frame.
    const padding = Math.min(24, width * 0.06);
    for (let attempt = 0; attempt < 14; attempt++) {
      camera.position.set(...world.camera).multiplyScalar(scale);
      camera.lookAt(...world.target);
      camera.updateMatrixWorld();
      const fits = labels.every(({ element, id }) => {
        const stop = world.stops[id];
        labelPosition.copy(stop.label).project(camera);
        const x = (labelPosition.x * 0.5 + 0.5) * width;
        const y = (-labelPosition.y * 0.5 + 0.5) * height;
        const halfWidth = element.offsetWidth / 2;
        const halfHeight = element.offsetHeight / 2;
        return x - halfWidth >= padding && x + halfWidth <= width - padding && y - halfHeight >= 76 && y + halfHeight <= height - 88;
      });
      if (fits) break;
      scale *= 1.08;
    }
    invalidate();
  }

  function select(id) {
    if (destroyed || !world?.stops[id]) return;
    if (selectedId === id && transition) return;
    selectedId = id;
    const target = world.travelPoint(id);
    if (moving() && canDraw()) transition = { from: world.traveler.position.clone(), to: target, progress: 0 };
    else { world.traveler.position.copy(target); transition = null; }
    invalidate();
  }

  function activate(id, openReader = false) {
    select(id);
    onVisit(id, { openReader });
  }

  function announce() {
    onStatus({ ready: true, message: 'Click a landmark or the background to explore. Arrows follow the map; Enter reads the selected destination; Escape leaves the map.' });
  }

  function setTheme(id) {
    if (destroyed || contextLost) return;
    suspend();
    transition = null;
    elapsed = 0;
    labels.forEach(({ element }) => element.remove());
    labels = [];
    if (world) { world.dispose?.(); world.kit.dispose(); scene.remove(worldGroup); }
    const theme = getTheme(id);
    worldGroup = new THREE.Group();
    world = BUILDERS[theme.id](worldGroup);
    scene.add(worldGroup);
    scene.background = new THREE.Color(world.background);
    scene.fog = new THREE.Fog(...world.fog);
    hemisphere.color.set(theme.id === 'orbital' ? '#b8c7ff' : theme.id === 'woodland' ? '#c9e5c2' : '#c0e3de');
    destinations.filter((stop) => world.stops[stop.id]).forEach((stop) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'world-label';
      element.textContent = stop.label;
      element.dataset.destination = stop.id;
      element.setAttribute('aria-label', `Visit ${stop.label}`);
      element.addEventListener('click', event => {
        // Native keyboard activation opens the reader. A pointer visit stays in
        // the map so the next arrow keeps exploration going.
        const openReader = event.detail === 0;
        activate(stop.id, openReader);
        if (!openReader) mount.focus({ preventScroll: true });
      });
      mount.append(element);
      labels.push({ element, id: stop.id });
    });
    if (!world.stops[selectedId]) selectedId = destinations[0]?.id || 'work';
    world.traveler.position.copy(world.travelPoint(selectedId));
    world.animate(0);
    resize();
    announce();
  }

  function setMotion(enabled) {
    if (destroyed) return;
    motionRequested = Boolean(enabled);
    suspend();
    // Pause freezes ambient geometry and an in-flight traveler at their current pose.
    invalidate();
  }

  function handleKey(event) {
    if (destroyed || contextLost || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const focusedLabel = event.target.closest?.('.world-label');
    if (!mount.contains(document.activeElement) || (event.target !== mount && !focusedLabel)) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      mount.blur();
      onExit();
      return;
    }
    if (event.key === 'Enter' && event.target === mount) {
      event.preventDefault();
      if (!event.repeat) activate(selectedId, true);
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const now = performance.now();
    if (event.repeat && now - lastArrowAt < 180) return;
    lastArrowAt = now;
    const originId = focusedLabel?.dataset.destination || selectedId;
    const points = labels.map(({ element, id }) => {
      labelPosition.copy(world.stops[id].label).project(camera);
      const x = (labelPosition.x * 0.5 + 0.5) * width;
      const y = (-labelPosition.y * 0.5 + 0.5) * height;
      return { id, x, y, visible: labelPosition.z > -1 && labelPosition.z < 1 && x >= 0 && x <= width && y >= 0 && y <= height && !element.hidden };
    });
    const next = directionalDestination(points, originId, event.key);
    if (next) {
      activate(next);
      if (focusedLabel) labels.find(label => label.id === next)?.element.focus({ preventScroll: true });
    } else {
      const direction = event.key.slice(5).toLowerCase();
      onStatus({ ready: true, message: `No landmark farther ${direction}. Try another arrow, or press Enter to read this destination.` });
    }
  }

  function handleBackgroundPointer(event) {
    if (!destroyed && !contextLost && event.target === renderer.domElement && event.button === 0) mount.focus({ preventScroll: true });
  }

  function handleVisibility() {
    if (document.hidden) suspend();
    else if (invalidated || moving()) invalidate();
  }
  function handleReducedMotion() { suspend(); invalidate(); }
  function handleContextLost(event) {
    event.preventDefault();
    contextLost = true;
    suspend();
    renderer.domElement.hidden = true;
    renderer.domElement.style.display = 'none';
    labels.forEach(({ element }) => { element.hidden = true; });
    onStatus({ ready: false, message: 'The 3D view stopped because its graphics context was lost. The reading view still contains every destination. Reload to retry the world.' });
  }
  function handleWindowBlur() { previousTimestamp = 0; }
  mount.addEventListener('keydown', handleKey);
  mount.addEventListener('pointerdown', handleBackgroundPointer);
  mount.addEventListener('blur', handleWindowBlur);
  window.addEventListener('blur', handleWindowBlur);
  document.addEventListener('visibilitychange', handleVisibility);
  reducedMotion.addEventListener('change', handleReducedMotion);
  renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (!inView) suspend();
    else if (invalidated || moving()) invalidate();
  }, { threshold: 0.01 });
  intersectionObserver.observe(mount);
  setTheme(themeId);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    suspend();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    mount.removeEventListener('keydown', handleKey);
    mount.removeEventListener('pointerdown', handleBackgroundPointer);
    mount.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('visibilitychange', handleVisibility);
    reducedMotion.removeEventListener('change', handleReducedMotion);
    renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
    labels.forEach(({ element }) => element.remove());
    world?.dispose?.();
    world?.kit.dispose();
    keyLight.shadow.map?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    scene.clear();
  }

  return { select, setTheme, setMotion, destroy };
}
