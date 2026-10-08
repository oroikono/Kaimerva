import * as THREE from 'three';
import { createRealmSurface } from './realm-surfaces.js';

const UP = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;
const IDS = ['work', 'research', 'journal'];

function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function shape(points) {
  const value = new THREE.Shape();
  value.moveTo(...points[0]);
  points.slice(1).forEach(point => value.lineTo(...point));
  value.closePath();
  return value;
}

/** Original, bounded shoreline scenery. It owns its maps and is not a hit target. */
export function createCoastalDetail({ stops, route, bearing = 0 } = {}) {
  if (!Number.isFinite(bearing) || !Array.isArray(route?.order) || route.order.length < 3
    || typeof route.point !== 'function' || !IDS.every(id => stops?.[id]?.position?.isVector3
      && stops[id].position.toArray().every(Number.isFinite))) {
    throw new TypeError('Coastal detail requires finite Work, Research and Journal stops and a closed route.');
  }
  const routePoints = Array.from({ length: 512 }, (_, i) => route.point(i / 512 * route.order.length));
  if (!routePoints.every(p => p?.isVector3 && p.toArray().every(Number.isFinite))
    || route.point(0).distanceTo(route.point(route.order.length)) > 1e-5) {
    throw new TypeError('Coastal detail requires a finite closed route.');
  }
  const center = routePoints.reduce((sum, p) => sum.add(p), new THREE.Vector3()).multiplyScalar(1 / routePoints.length);
  for (const id of IDS) if (Math.hypot(stops[id].position.x - center.x, stops[id].position.z - center.z) < 0.1) {
    throw new RangeError('A coastal stop needs a distinct outward shore direction.');
  }
  const group = new THREE.Group();
  group.name = 'coastal-shore-detail';
  const geometries = new Set();
  const materials = new Set();
  const instances = new Set();
  const stoneStudy = createRealmSurface('stone', 173);
  const timberStudy = createRealmSurface('timber', 211);
  const studies = [stoneStudy, timberStudy];
  let disposed = false;
  const own = geometry => { geometries.add(geometry); return geometry; };
  const material = (color, options = {}) => {
    const result = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...options });
    materials.add(result); return result;
  };
  const stoneMaps = { map: stoneStudy.map, bumpMap: stoneStudy.bumpMap, roughnessMap: stoneStudy.roughnessMap };
  const timberMaps = { map: timberStudy.map, bumpMap: timberStudy.bumpMap, roughnessMap: timberStudy.roughnessMap };
  const limestone = material('#d0c4a9', { ...stoneMaps, bumpScale: 0.035, roughness: 0.96 });
  const wetStone = material('#526967', { ...stoneMaps, bumpScale: 0.03, roughness: 0.43 });
  const driftwood = material('#99806a', { ...timberMaps, bumpScale: 0.017, roughness: 0.91 });
  const darkWood = material('#514b3e', { ...timberMaps, bumpScale: 0.022, roughness: 0.96 });
  const rope = material('#baaa83', { bumpMap: timberStudy.bumpMap, bumpScale: 0.006, roughness: 0.97 });
  const iron = material('#394446', { metalness: 0.83, roughness: 0.61 });
  const bronze = material('#a17e49', { metalness: 0.78, roughness: 0.42 });
  const foliage = material('#2f493e', { roughness: 1 });
  const amber = material('#edcd92', { emissive: '#ffc887', emissiveIntensity: 1.15, roughness: 0.25 });
  const poolSurface = new THREE.MeshPhysicalMaterial({ color: '#315d65', roughness: 0.17,
    metalness: 0.15, transparent: true, opacity: 0.72, clearcoat: 0.55, clearcoatRoughness: 0.12,
    side: THREE.DoubleSide, depthWrite: false });
  materials.add(poolSurface);
  const mesh = (geometry, surface, name, parent) => {
    const result = new THREE.Mesh(own(geometry), surface);
    result.name = name; result.castShadow = true; result.receiveShadow = true;
    parent.add(result); return result;
  };
  const scratch = new THREE.Object3D();
  const batch = (geometry, surface, transforms, name, parent, tint = false) => {
    const result = new THREE.InstancedMesh(own(geometry), surface, transforms.length);
    result.name = name; result.castShadow = true; result.receiveShadow = true;
    transforms.forEach((transform, i) => {
      scratch.position.copy(transform.position || new THREE.Vector3());
      scratch.quaternion.copy(transform.quaternion || new THREE.Quaternion());
      scratch.scale.copy(transform.scale || new THREE.Vector3(1, 1, 1));
      scratch.updateMatrix(); result.setMatrixAt(i, scratch.matrix);
      if (tint) result.setColorAt(i, new THREE.Color().setScalar(0.82 + i % 4 * 0.045));
    });
    result.instanceMatrix.needsUpdate = true;
    result.computeBoundingBox(); result.computeBoundingSphere();
    instances.add(result); parent.add(result); return result;
  };
  const transform = (x, y, z, sx = 1, sy = 1, sz = 1, yaw = 0) => ({
    position: new THREE.Vector3(x, y, z), scale: new THREE.Vector3(sx, sy, sz),
    quaternion: new THREE.Quaternion().setFromAxisAngle(UP, yaw),
  });
  const beam = (a, b, radius) => ({ position: a.clone().lerp(b, 0.5),
    scale: new THREE.Vector3(radius, a.distanceTo(b), radius),
    quaternion: new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize()) });
  const box = own(new THREE.BoxGeometry(1, 1, 1));
  const post = own(new THREE.CylinderGeometry(1, 1.13, 1, 9));
  const pools = [];
  const roots = [];

  function ledgeGeometry(seed) {
    const sample = random(seed); const phases = [sample() * TAU, sample() * TAU];
    const rings = [[0.27, 0.2], [0.61, 0.15], [0.69, 0.02], [0.85, -0.05], [1, -0.27]];
    const depression = (x, z) => 0.085 * (1 - THREE.MathUtils.smoothstep(Math.hypot((x + 0.15) / 0.42, z / 0.23), 0.55, 1.2));
    const segments = 28; const vertices = [0, 0.21 - depression(0, 0), 0]; const uvs = [0, 0]; const indices = [];
    rings.forEach(([radius, height], row) => {
      for (let i = 0; i < segments; i++) {
        const angle = i / segments * TAU;
        const chipped = 1 + Math.sin(angle * 5 + phases[0]) * 0.085 + Math.sin(angle * 9 + phases[1]) * 0.04;
        const x = Math.cos(angle) * radius * 1.33 * chipped;
        const z = Math.sin(angle) * radius * 0.6 * chipped;
        vertices.push(x, height + Math.sin(angle * 7 + phases[1]) * (row < 2 ? 0.012 : 0.028)
          - (row < 2 ? depression(x, z) : 0), z);
        uvs.push(x * 1.7, z * 1.7);
        const a = 1 + row * segments + i; const b = 1 + row * segments + (i + 1) % segments;
        if (row < rings.length - 1) indices.push(a, b, a + segments, b, b + segments, a + segments);
      }
    });
    const bottom = vertices.length / 3; vertices.push(0, -0.33, 0); uvs.push(0, 0);
    for (let i = 0; i < segments; i++) {
      indices.push(0, 1 + (i + 1) % segments, 1 + i);
      indices.push(bottom, 1 + 4 * segments + i, 1 + 4 * segments + (i + 1) % segments);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
  }

  function tidePool(parent, seed) {
    const sample = random(seed);
    const outer = Array.from({ length: 12 }, (_, i) => {
      const angle = i / 12 * TAU; const radius = 0.94 + sample() * 0.12;
      return [Math.cos(angle) * 0.47 * radius, Math.sin(angle) * 0.28 * radius];
    });
    const inner = outer.map(([x, y]) => [x * 0.74, y * 0.65]);
    const rim = shape(outer);
    const hole = new THREE.Path(); hole.moveTo(...inner[0]);
    inner.slice(1).forEach(p => hole.lineTo(...p)); hole.closePath(); rim.holes.push(hole);
    const basin = new THREE.ExtrudeGeometry(rim, { depth: 0.085, bevelEnabled: true, bevelThickness: 0.012,
      bevelSize: 0.018, bevelSegments: 2, steps: 1 });
    basin.rotateX(-Math.PI / 2);
    const bowl = mesh(basin, wetStone, 'anchored-shore-pool-rim', parent);
    bowl.position.set(-0.15, 0.14, 0);
    const surfaceGeometry = new THREE.ShapeGeometry(shape(inner)); surfaceGeometry.rotateX(-Math.PI / 2);
    const water = mesh(surfaceGeometry, poolSurface, 'still-shore-pool-water', parent);
    water.position.set(-0.15, 0.19, 0); water.castShadow = false;
    pools.push(water);
  }

  function jetty(parent, seed) {
    const sample = random(seed); const pier = new THREE.Group();
    pier.name = 'timber-mooring-jetty'; pier.position.set(1.1, 0.22, 0.15); pier.rotation.y = Math.PI / 2;
    parent.add(pier);
    const planks = Array.from({ length: 11 }, (_, i) => transform(0, 0.26 + sample() * 0.008, i * 0.15,
      0.7 + sample() * 0.03, 0.073, 0.131, (sample() - 0.5) * 0.018));
    batch(box, driftwood, planks, 'uneven-deck-planks', pier, true);
    const tops = []; const bases = []; const braces = []; const rails = [];
    for (const x of [-0.33, 0.33]) for (const z of [0.06, 0.79, 1.53]) {
      tops.push(transform(x, 0.45, z, 0.042, 0.77, 0.042));
      bases.push(transform(x, -0.31, z, 0.046, 0.76, 0.046));
    }
    batch(post, driftwood, tops, 'weathered-pier-posts', pier, true);
    batch(post, darkWood, bases, 'submerged-pier-posts', pier);
    for (const x of [-0.27, 0.27]) {
      rails.push(transform(x, 0.16, 0.8, 0.07, 0.12, 1.79));
      braces.push(beam(new THREE.Vector3(x, -0.18, 0.09), new THREE.Vector3(x, 0.19, 0.73), 0.045));
      braces.push(beam(new THREE.Vector3(x, -0.18, 1.52), new THREE.Vector3(x, 0.19, 0.87), 0.045));
      const ropePoints = [new THREE.Vector3(x * 1.22, 0.73, 0.06), new THREE.Vector3(x * 1.22, 0.63, 0.4),
        new THREE.Vector3(x * 1.22, 0.73, 0.79), new THREE.Vector3(x * 1.22, 0.63, 1.14), new THREE.Vector3(x * 1.22, 0.73, 1.53)];
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ropePoints), 24, 0.014, 5, false), rope,
        'sagging-rope-handrail', pier);
    }
    batch(box, darkWood, rails, 'load-bearing-deck-rails', pier);
    batch(post, darkWood, braces, 'diagonal-pier-braces', pier);
    const cleatShape = shape([[-0.11, 0.07], [-0.12, 0.035], [-0.034, 0.031], [-0.034, 0],
      [0.034, 0], [0.034, 0.031], [0.12, 0.035], [0.11, 0.07], [0.025, 0.054], [-0.025, 0.054]]);
    const cleat = new THREE.ExtrudeGeometry(cleatShape, { depth: 0.04, bevelEnabled: true,
      bevelSize: 0.007, bevelThickness: 0.007, bevelSegments: 1, steps: 1 }); cleat.translate(0, 0, -0.02);
    batch(cleat, iron, [-1, 1].map(side => transform(side * 0.23, 0.3, 1.39)), 'cast-mooring-cleats', pier);
    const coilPoints = Array.from({ length: 65 }, (_, i) => {
      const angle = i / 64 * TAU * 3.1; const radius = 0.043 + i / 64 * 0.093;
      return new THREE.Vector3(Math.cos(angle) * radius - 0.1, 0.31 + i / 64 * 0.005,
        Math.sin(angle) * radius + 1.11);
    });
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPoints), 64, 0.01, 5, false), rope,
      'deck-mooring-rope-coil', pier);
    const lamp = new THREE.Group(); lamp.name = 'warm-mooring-lantern'; lamp.position.set(0.25, 0.74, 1.52); pier.add(lamp);
    mesh(new THREE.CylinderGeometry(0.057, 0.062, 0.12, 10), amber, 'lantern-lit-core', lamp).castShadow = false;
    const frame = [-1, 1].flatMap(x => [-1, 1].map(z => transform(x * 0.05, 0, z * 0.05, 0.009, 0.16, 0.009)));
    batch(box, bronze, frame, 'lantern-corner-frame', lamp);
    mesh(new THREE.CylinderGeometry(0.076, 0.065, 0.024, 10), bronze, 'lantern-foot', lamp).position.y = -0.078;
    mesh(new THREE.ConeGeometry(0.094, 0.07, 10), bronze, 'lantern-weather-cap', lamp).position.y = 0.103;
    const light = new THREE.PointLight('#ffcc92', 0.75, 2.6, 2);
    light.name = 'mooring-lamp-spill'; light.castShadow = false; lamp.add(light);
  }

  const cypressTrunks = []; const cypressCrowns = [];
  IDS.forEach((id, index) => {
    const p = stops[id].position;
    const outward = new THREE.Vector3(p.x - center.x, 0, p.z - center.z).normalize();
    const shore = new THREE.Group(); shore.name = `${id}-coastal-dressing`;
    // +Z is outward, +X follows the shore; the boat loop stays on the inner side.
    shore.position.set(p.x, 0, p.z); shore.rotation.y = Math.atan2(outward.x, outward.z);
    group.add(shore); roots.push(shore);
    const shelf = new THREE.Group(); shelf.name = 'eroded-shore-shelf'; shelf.position.set(-0.26, 0, 2.1); shore.add(shelf);
    mesh(ledgeGeometry(317 + index * 19), limestone, 'weathered-limestone-ledge', shelf);
    tidePool(shelf, 371 + index * 23);
    const blocks = [];
    const sample = random(433 + index * 31);
    for (let row = 0; row < 2; row++) for (let stone = 0; stone < 5; stone++) {
      if (row === 1 && (stone + index) % 4 === 0) continue;
      blocks.push(transform(-0.9 + stone * 0.4 + row * 0.11, 0.5 + row * 0.17,
        0.99 + (sample() - 0.5) * 0.04, 0.36 + sample() * 0.035, 0.15 + sample() * 0.025,
        0.24 + sample() * 0.028, (sample() - 0.5) * 0.14));
    }
    const wallGeometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
    const wallVertices = wallGeometry.attributes.position;
    for (let i = 0; i < wallVertices.count; i++) {
      const x = wallVertices.getX(i); const y = wallVertices.getY(i); const z = wallVertices.getZ(i);
      wallVertices.setXYZ(i, x + Math.sin(x * 13 + y * 9 + z * 7) * 0.025,
        y + Math.sin(x * 11 - y * 7 + z * 19) * 0.023, z + Math.sin(x * 17 + y * 5 - z * 13) * 0.019);
    }
    wallGeometry.computeVertexNormals();
    batch(wallGeometry, limestone, blocks, 'broken-retaining-wall-courses', shore, true);
    if (id !== 'journal') jetty(shore, 487 + index * 13);
    shore.updateMatrix();
    // Two slender Mediterranean trees per dressed island, rooted behind walls.
    for (const side of [-1, 1]) {
      const base = new THREE.Vector3(side * 0.88 - 0.12, 0.43, 0.72).applyMatrix4(shore.matrix);
      const height = 1.22 + index * 0.09 + (side > 0 ? 0.12 : 0);
      cypressTrunks.push(transform(base.x, base.y + height * 0.39, base.z, 0.032, height * 0.77, 0.032));
      for (let tier = 0; tier < 3; tier++) {
        cypressCrowns.push(transform(base.x + Math.sin(tier * 2 + index) * 0.016,
          base.y + height * (0.47 + tier * 0.23), base.z, 0.17 - tier * 0.035,
          height * 0.75, 0.135 - tier * 0.028, bearing + side * 0.2));
      }
    }
  });
  batch(post, darkWood, cypressTrunks, 'slender-cypress-trunks', group);
  const crownGeometry = new THREE.ConeGeometry(1, 1, 9, 5);
  const crownVertices = crownGeometry.attributes.position;
  for (let i = 0; i < crownVertices.count; i++) {
    const x = crownVertices.getX(i); const y = crownVertices.getY(i); const z = crownVertices.getZ(i);
    const variation = 0.94 + Math.sin(x * 21 + z * 17 + y * 13) * 0.1;
    crownVertices.setXYZ(i, x * variation, y, z * variation);
  }
  crownGeometry.computeVertexNormals();
  batch(crownGeometry, foliage, cypressCrowns, 'layered-cypress-foliage', group, true);
  group.updateMatrixWorld(true);
  // Shore-aligned boxes include posts, ropes and water-contact ledges. A world
  // AABB spans the empty inside corner of a rotated jetty and overstates its
  // intrusion. Instance transforms are included in each local bound.
  const boxes = roots.map(root => {
    const inverse = root.matrixWorld.clone().invert();
    const box = new THREE.Box3();
    root.traverse(object => {
      if (!object.isMesh) return;
      object.geometry.computeBoundingBox();
      const matrix = new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld);
      for (let i = 0; i < (object.isInstancedMesh ? object.count : 1); i++) {
        const transform = matrix.clone();
        if (object.isInstancedMesh) {
          const instance = new THREE.Matrix4(); object.getMatrixAt(i, instance); transform.multiply(instance);
        }
        box.union(object.geometry.boundingBox.clone().applyMatrix4(transform));
      }
    });
    return { box, inverse };
  });
  let clearance = Infinity;
  for (const p of routePoints) for (const { box, inverse } of boxes) {
    const local = p.clone().applyMatrix4(inverse);
    const dx = Math.max(box.min.x - local.x, 0, local.x - box.max.x);
    const dz = Math.max(box.min.z - local.z, 0, local.z - box.max.z);
    clearance = Math.min(clearance, Math.hypot(dx, dz));
  }
  const dispose = () => {
    if (disposed) return;
    disposed = true; group.removeFromParent(); group.clear();
    instances.forEach(value => value.dispose());
    geometries.forEach(value => value.dispose());
    materials.forEach(value => value.dispose());
    studies.forEach(value => value.dispose());
    instances.clear(); geometries.clear(); materials.clear();
  };
  if (clearance < 1.05) {
    dispose(); throw new RangeError(`Coastal dressing would enter the sailing corridor (sampled bound ${clearance.toFixed(3)}).`);
  }
  group.userData.minimumRouteCenterClearance = clearance;
  return {
    group,
    update(time = 0) {
      if (disposed) return;
      const now = Number.isFinite(time) ? time : 0;
      pools.forEach((water, i) => { water.position.y = 0.19 + Math.sin(now * 0.31 + i * 1.7) * 0.003; });
    },
    dispose,
  };
}
