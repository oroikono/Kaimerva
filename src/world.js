import * as THREE from 'three';
import { getTheme } from './themes.js?v=39a02493892c';
import { cycleDirection, cyclicDestination, targetPhase } from './navigation.js?v=39a02493892c';
import { createFigurePassage } from './figure-passage.js?v=39a02493892c';
import { createRealmAtmosphere } from './realm-atmosphere.js?v=39a02493892c';
import { createRealmPortal } from './realm-portal.js?v=39a02493892c';
import { createRealmSurface } from './realm-surfaces.js?v=39a02493892c';
import { createVoyageMotion } from './voyage.js?v=39a02493892c';
import { createVoyageCamera } from './voyage-clearance.js?v=39a02493892c';
import { createCoastalDetail } from './coastal-detail.js?v=39a02493892c';
import { createExploration } from './exploration.js?v=39a02493892c';
import { createExplorationBeacons } from './exploration-beacons.js?v=39a02493892c';

// Authored geometry, materials, motion, and layout. The destinations are content slots,
// arranged along a closed route; exploration follows its neighboring stops.
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

/** Register only an authored landmark's roots, excluding terrain and scenery. */
export function bindLandmarkTargets(stop, objects) {
  stop.hitObjects = objects.filter(Boolean);
  const sphere = new THREE.Sphere(stop.position.clone(), 0);
  for (const root of stop.hitObjects) {
    root.updateWorldMatrix(true, true);
    root.traverse(object => {
      if (!object.isMesh || !object.geometry) return;
      if (!object.geometry.boundingSphere) object.geometry.computeBoundingSphere();
      const bound = object.geometry.boundingSphere.clone().applyMatrix4(object.matrixWorld);
      sphere.radius = Math.max(sphere.radius, sphere.center.distanceTo(bound.center) + bound.radius);
    });
  }
  // Geometry spheres include the full sweep of rotating parts around these
  // fixed stops. This broad phase avoids raycasting unrelated landmark meshes.
  sphere.radius += 0.025;
  stop.hitSphere = sphere;
}

/** Pick the nearest visible hit among explicitly registered destinations. */
export function pickLandmark(raycaster, stops, ids = Object.keys(stops)) {
  let closest = null;
  for (const id of ids) {
    const stop = stops[id];
    if (!stop?.hitObjects?.length || !raycaster.ray.intersectsSphere(stop.hitSphere)) continue;
    for (const root of stop.hitObjects) root.updateWorldMatrix(true, true);
    const hit = raycaster.intersectObjects(stop.hitObjects, true).find(({ object }) => {
      // Three.js raycasts invisible descendants, so check the full ancestry.
      for (let parent = object; parent; parent = parent.parent) if (!parent.visible) return false;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      return materials.some(material => material?.visible !== false && !(material?.transparent && material.opacity === 0));
    });
    if (hit && (!closest || hit.distance < closest.distance)) closest = { id, distance: hit.distance, object: hit.object };
  }
  return closest;
}

// Reserve the actual reader width and allow for shutters swinging toward the
// camera. Fitting only the flat plate clips the open cabinet's nearer doors.
export function inspectionCameraPose({ anchor, bearing = 0, width, height, fov = 36 }) {
  const phone = width <= 600;
  const aspect = width / height;
  const availableWidth = phone ? 1 : 0.6;
  const extent = phone ? 9.4 : 11.6;
  const distance = Math.max(phone ? 30 : 12.3, extent / (2 * Math.tan(fov * Math.PI / 360) * aspect * availableWidth) * 1.11);
  const viewportHeight = 2 * distance * Math.tan(fov * Math.PI / 360);
  const viewportWidth = viewportHeight * aspect;
  const right = new THREE.Vector3(Math.cos(bearing), 0, -Math.sin(bearing));
  const forward = new THREE.Vector3(Math.sin(bearing), 0, Math.cos(bearing));
  const target = anchor.clone().addScaledVector(right, phone ? 0 : viewportWidth * 0.2);
  if (phone) target.y -= viewportHeight * 0.265;
  return { target, position: target.clone().addScaledVector(forward, distance) };
}

/** Fixed-bearing lower gateway view; portrait screens keep the whole arch. */
export function portalCameraPose({ anchor, bearing, aspect, fov = 36 }) {
  const distance = Math.max(12.8, 4.1 / (2 * Math.tan(fov * Math.PI / 360) * aspect) * 1.3);
  const position = anchor.clone().addScaledVector(new THREE.Vector3(Math.sin(bearing), 0, Math.cos(bearing)), distance);
  position.y += distance * 0.075;
  return { target: anchor.clone(), position };
}

/** Fit the actual body bounds and the host's measured native label boxes. */
export function atlasCameraPose({ world, width, height, labels = [], fov = 36 }) {
  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 130);
  const target = new THREE.Vector3(...world.target);
  const point = new THREE.Vector3();
  const padding = Math.min(24, width * 0.06);
  let scale = Math.max(1, Math.sqrt(1.45 / camera.aspect));
  let fits = false;
  const contains = (anchor, halfWidth = 0, halfHeight = 0) => {
    point.copy(anchor).project(camera);
    const x = (point.x * 0.5 + 0.5) * width;
    const y = (-point.y * 0.5 + 0.5) * height;
    return point.z >= -1 && point.z <= 1 && x - halfWidth >= padding && x + halfWidth <= width - padding
      && y - halfHeight >= 76 && y + halfHeight <= height - 88;
  };
  for (let attempt = 0; attempt < 24; attempt++) {
    camera.position.set(...world.camera).multiplyScalar(scale);
    camera.lookAt(target); camera.updateMatrixWorld();
    fits = labels.every(label => contains(world.stops[label.id].label, label.width / 2, label.height / 2))
      && (world.fitPoints || []).every(anchor => contains(anchor));
    if (fits) break;
    scale *= 1.08;
  }
  return { target, position: camera.position.clone(), fits };
}

/** Keep the readable plate above scenery in the complete authored scene. */
export function inspectionSceneAnchor({ world, collection }) {
  const anchor = (world.stops[collection]?.position || world.stops.work.position).clone();
  anchor.y = Math.max(anchor.y + 4.82, world.inspectionElevation);
  return anchor;
}

function buildSea(group) {
  const kit = modelKit(group);
  const surfaceTextures = new Set();
  // Small, deterministic material studies are authored here rather than fetched
  // texture packs. Separate linear height maps keep the relief physically legible.
  const materialStudy = (kind, seed) => {
    const size = 128; const color = new Uint8Array(size * size * 4); const height = new Uint8Array(size * size * 4);
    const hash = (x, y) => {
      let value = Math.imul(x + seed * 131, 374761393) ^ Math.imul(y + seed * 59, 668265263);
      value = Math.imul(value ^ (value >>> 13), 1274126177);
      return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
    };
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const grain = hash(x, y); const broad = hash(Math.floor(x / 8), Math.floor(y / 8));
      let tone; let relief;
      if (kind === 'linen') {
        const warp = x % 4 < 2 ? 1 : 0; const weft = y % 4 < 2 ? 1 : 0;
        tone = 0.83 + (warp + weft) * 0.055 + grain * 0.05;
        relief = 0.22 + warp * 0.3 + weft * 0.3 + grain * 0.06;
      } else if (kind === 'wood') {
        const fibers = Math.sin(x * 0.42 + Math.sin(y * TAU / size) * 2.1 + broad * 0.8);
        tone = 0.79 + fibers * 0.1 + grain * 0.065;
        relief = 0.48 + fibers * 0.18 + grain * 0.1;
      } else {
        const pores = grain < 0.065 ? 0.17 : 0;
        tone = 0.87 + broad * 0.07 + grain * 0.045 - pores;
        relief = 0.42 + grain * 0.22 + broad * 0.12 - pores;
      }
      const offset = (y * size + x) * 4;
      color.fill(Math.round(THREE.MathUtils.clamp(tone, 0, 1) * 255), offset, offset + 3); color[offset + 3] = 255;
      height.fill(Math.round(THREE.MathUtils.clamp(relief, 0, 1) * 255), offset, offset + 3); height[offset + 3] = 255;
    }
    const texture = (data, colorSpace) => {
      const result = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      result.colorSpace = colorSpace; result.wrapS = result.wrapT = THREE.RepeatWrapping;
      result.magFilter = THREE.LinearFilter; result.minFilter = THREE.LinearMipmapLinearFilter;
      result.generateMipmaps = true; result.needsUpdate = true;
      surfaceTextures.add(result); return result;
    };
    return { map: texture(color, THREE.SRGBColorSpace), bumpMap: texture(height, THREE.NoColorSpace) };
  };
  const stoneStudy = materialStudy('stone', 71);
  const woodStudy = materialStudy('wood', 23);
  const linenStudy = materialStudy('linen', 41);
  const limestone = kit.mat('#d4c6a7', { ...stoneStudy, bumpScale: 0.023, roughness: 0.94, metalness: 0 });
  const cutStone = kit.mat('#ffffff', { ...stoneStudy, bumpScale: 0.018, vertexColors: true, roughness: 0.96, metalness: 0 });
  const sand = kit.mat('#177f91', { transparent: true, opacity: 0.35, depthWrite: false });
  const ink = kit.mat('#173547', { metalness: 0.45, roughness: 0.4 });
  const brass = kit.mat('#ac8453', { metalness: 0.8, roughness: 0.32 });
  const white = kit.mat('#f2e9d6', { ...stoneStudy, bumpScale: 0.007, roughness: 0.87, metalness: 0 });
  const wood = kit.mat('#a78257', { ...woodStudy, bumpScale: 0.012, roughness: 0.79, metalness: 0 });
  const foliage = kit.mat('#344d37', { ...stoneStudy, bumpScale: 0.012, roughness: 0.95, metalness: 0 });
  const glass = kit.mat('#77b8c7', { metalness: 0.16, roughness: 0.12 });
  const glow = kit.mat('#8ee8db', { emissive: '#3ebbaa', emissiveIntensity: 1.2, roughness: 0.25 });
  const water = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uField: { value: 0 }, uSpacing: { value: 0.5 },
      uIslands: { value: [] }, uRadii: { value: [] }, uCoastPhases: { value: [] },
      uReflection: { value: null }, uReflectionMatrix: { value: new THREE.Matrix4() },
      uReflectionStrength: { value: 0 },
      uKeyDirection: { value: new THREE.Vector3(-0.54, 0.2, -0.817).normalize() },
      uKeyColor: { value: new THREE.Color('#c2ceff') }, uHazeColor: { value: new THREE.Color('#253653') },
    },
    vertexShader: `varying vec3 vWorld; varying vec4 vReflection; uniform float uTime;
      uniform mat4 uReflectionMatrix;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vec2 p = world.xz;
        float a = dot(p, vec2(0.94, 0.33)) * 1.6 + uTime * 0.78;
        float b = dot(p, vec2(-0.37, 0.93)) * 2.8 - uTime * 1.03;
        float c = dot(p, vec2(0.3, 0.88)) * 0.32 - uTime * 0.25;
        world.y += sin(a) * 0.025 + sin(b) * 0.014 + sin(c) * 0.045;
        vWorld = world.xyz; vReflection = uReflectionMatrix * world;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `varying vec3 vWorld; varying vec4 vReflection;
      uniform float uTime; uniform float uField; uniform float uSpacing;
      uniform sampler2D uReflection; uniform float uReflectionStrength;
      uniform vec3 uKeyDirection; uniform vec3 uKeyColor; uniform vec3 uHazeColor;
      uniform vec2 uIslands[5]; uniform float uRadii[5]; uniform vec3 uCoastPhases[5];
      float grain(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec2 p = vWorld.xz;
        float a = dot(p, vec2(0.94, 0.33)) * 1.6 + uTime * 0.78;
        float b = dot(p, vec2(-0.37, 0.93)) * 2.8 - uTime * 1.03;
        float c = dot(p, vec2(0.3, 0.88)) * 0.32 - uTime * 0.25;
        vec2 slope = cos(a) * 0.04 * vec2(0.94, 0.33) + cos(b) * 0.0392 * vec2(-0.37, 0.93);
        slope += cos(c) * 0.0144 * vec2(0.3, 0.88);
        slope += sin(p * 18.0 + vec2(uTime * 0.65, -uTime * 0.43)) * 0.012;
        vec3 normal = normalize(vec3(-slope.x, 1.0, -slope.y));
        vec3 view = normalize(cameraPosition - vWorld);
        float fresnel = 0.025 + 0.975 * pow(1.0 - max(dot(view, normal), 0.0), 5.0);
        float nearestBank = 100.0;
        for (int i = 0; i < 5; i++) {
          vec2 relative = p - uIslands[i];
          float angle = atan(relative.y, relative.x);
          vec3 phases = uCoastPhases[i];
          float irregular = 0.96 + sin(angle * 3.0 + phases.x) * 0.11 + sin(angle * 5.0 + phases.y) * 0.065 + sin(angle * 11.0 + phases.z) * 0.026;
          float shelves = sin(angle * 13.0 + phases.x) * 0.019 + sin(angle * 23.0 + phases.y) * 0.012;
          float edge = uRadii[i] * (irregular + shelves);
          nearestBank = min(nearestBank, length(relative) - edge);
        }
        float shallow = 1.0 - smoothstep(0.0, 1.65, nearestBank);
        vec3 sea = mix(vec3(0.005, 0.078, 0.16), vec3(0.018, 0.27, 0.23), shallow * 0.8);
        float caustic = pow(1.0 - abs(sin(p.x * 4.6 + sin(p.y * 3.4 + uTime * 0.4)) * sin(p.y * 4.3 + sin(p.x * 3.6 - uTime * 0.32))), 17.0);
        sea += vec3(0.06, 0.14, 0.095) * caustic * shallow * 0.22;
        float foamBand = exp(-abs(nearestBank - 0.06 - sin(a * 0.7) * 0.055) * 24.0);
        float foam = foamBand * smoothstep(0.28, 0.86, grain(floor(p * 45.0)));
        sea = mix(sea, vec3(0.62, 0.74, 0.68), foam * 0.6);
        vec2 reflectionUV = vReflection.xy / max(vReflection.w, 0.001);
        reflectionUV += normal.xz * (0.013 + 0.004 * sin(a));
        float reflectionValid = smoothstep(0.01, 0.05, reflectionUV.x) * (1.0 - smoothstep(0.95, 0.99, reflectionUV.x));
        reflectionValid *= smoothstep(0.01, 0.05, reflectionUV.y) * (1.0 - smoothstep(0.95, 0.99, reflectionUV.y));
        vec2 reflectionSample = clamp(reflectionUV, 0.002, 0.998);
        vec3 reflected = texture2D(uReflection, reflectionSample).rgb * 0.5;
        reflected += texture2D(uReflection, reflectionSample + vec2(0.0009, 0.0006)).rgb * 0.25;
        reflected += texture2D(uReflection, reflectionSample - vec2(0.0009, 0.0006)).rgb * 0.25;
        sea = mix(sea, reflected, (0.1 + fresnel * 0.82) * uReflectionStrength * reflectionValid);
        vec3 halfDirection = normalize(uKeyDirection + view);
        float moonGlint = pow(max(dot(normal, halfDirection), 0.0), 240.0);
        sea += uKeyColor * moonGlint * 0.9;
        float atmospheric = 1.0 - exp(-length(cameraPosition - vWorld) * 0.0035);
        sea = mix(sea, uHazeColor, atmospheric);
        // An illustrative analytic field, not measured ocean or paper data.
        float frequency = 4.2;
        vec2 source = normalize(vec2(1.3, -0.65)) * mix(0.55, 2.55, uSpacing);
        float sourceA = length(p + source);
        float sourceB = length(p - source);
        float interference = sin(sourceA * frequency - uTime * 0.9) + sin(sourceB * frequency + uTime * 0.66);
        float fronts = pow(1.0 - abs(sin((sourceA - sourceB) * frequency * 0.7 - uTime * 0.19)), 16.0);
        float depth = 0.55 + sin(p.x * 0.43) * cos(p.y * 0.39) * 0.24 + sin(length(p) * 0.51) * 0.17;
        float contours = pow(1.0 - abs(sin(depth * 37.0)), 20.0);
        float envelope = 1.0 - smoothstep(6.3, 11.0, length(p));
        vec3 field = vec3(0.015, 0.08, 0.13) + vec3(0.045, 0.43, 0.38) * fronts;
        field += vec3(0.17, 0.12, 0.055) * contours * 0.65;
        field += vec3(0.02, 0.13, 0.17) * (interference * 0.25 + 0.5);
        sea = mix(sea, sea * 0.62 + field, uField * envelope);
        gl_FragColor = vec4(sea, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  // Keep the boundary beyond the camera's far plane; the sea must not read as
  // a rectangular tabletop. The grid density stays fixed for the same draw cost.
  const oceanGeometry = new THREE.PlaneGeometry(400, 400, 160, 160);
  const oceanVertices = oceanGeometry.attributes.position;
  // Concentrate vertices in the visible bay, while retaining a distant boundary.
  for (let i = 0; i < oceanVertices.count; i++) {
    oceanVertices.setXY(i, Math.pow(oceanVertices.getX(i) / 200, 3) * 200, Math.pow(oceanVertices.getY(i) / 200, 3) * 200);
  }
  oceanGeometry.computeBoundingSphere();
  const ocean = kit.mesh(oceanGeometry, water, 0, -0.13, 0);
  ocean.rotation.x = -Math.PI / 2;
  ocean.castShadow = false;
  // A clockwise loop, authored in the camera's ground-plane basis. The center
  // stays open water; every visible edge follows the circumference.
  const order = ['work', 'research', 'journal', 'journey', 'news'];
  const bearing = Math.atan2(11.5, 14.5);
  const right = new THREE.Vector3(Math.cos(bearing), 0, -Math.sin(bearing));
  const near = new THREE.Vector3(Math.sin(bearing), 0, Math.cos(bearing));
  const positions = Object.fromEntries(order.map((id, i) => {
    const angle = -Math.PI / 2 + i * TAU / order.length;
    const p = right.clone().multiplyScalar(Math.cos(angle) * 6.0).addScaledVector(near, Math.sin(angle) * 6.0);
    return [id, [p.x, 0.36, p.z]];
  }));
  const stops = {};
  water.uniforms.uIslands.value = order.map((id) => new THREE.Vector2(positions[id][0], positions[id][2]));
  water.uniforms.uRadii.value = order.map((id) => id === 'news' ? 1.12 : id === 'journey' ? 1.8 : 1.85);
  water.uniforms.uCoastPhases.value = order.map((_, i) => { const random = randomFrom(67 + i); return new THREE.Vector3(random() * TAU, random() * TAU, random() * TAU); });
  const sculptedIsland = (radius, seed) => {
    const random = randomFrom(seed);
    const phases = [random() * TAU, random() * TAU, random() * TAU];
    const segments = 80;
    // Close pairs of terraces make erosion shelves and crisp limestone strata;
    // the low inner relief still gives the landmark assemblies stable ground.
    const rings = [0.23, 0.46, 0.64, 0.75, 0.8, 0.815, 0.855, 0.87, 0.9, 0.915, 0.955, 0.99, 1.045];
    const heights = [0.47, 0.48, 0.46, 0.44, 0.43, 0.335, 0.32, 0.22, 0.21, 0.115, 0.095, -0.01, -0.25];
    const vertices = [0, 0.47, 0]; const colors = []; const uvs = [0.5, 0.5]; const indices = [];
    const top = new THREE.Color('#d7c9a5'); const cliff = new THREE.Color('#c0b697'); const wet = new THREE.Color('#526b64');
    colors.push(top.r, top.g, top.b);
    const color = new THREE.Color();
    for (let r = 0; r < rings.length; r++) for (let i = 0; i < segments; i++) {
      const angle = i / segments * TAU;
      const irregular = 0.96 + Math.sin(angle * 3 + phases[0]) * 0.11 + Math.sin(angle * 5 + phases[1]) * 0.065 + Math.sin(angle * 11 + phases[2]) * 0.026;
      const shelfBreaks = Math.sin(angle * 13 + phases[0]) * 0.019 + Math.sin(angle * 23 + phases[1]) * 0.012;
      const rim = radius * (rings[r] * irregular + (r > 3 ? shelfBreaks : 0));
      const noise = Math.sin(angle * 5 + phases[2]) * (r > 3 ? 0.035 : 0.018);
      const x = Math.cos(angle) * rim; const y = heights[r] + noise; const z = Math.sin(angle) * rim;
      vertices.push(x, y, z); uvs.push(x * 0.53 + 0.5, z * 0.53 + y * 0.45 + 0.5);
      color.copy(r < 4 ? top : r < 11 ? cliff : wet);
      color.multiplyScalar((r > 4 && r % 2 === 1 ? 0.89 : 1) * (0.94 + Math.sin(angle * 9 + phases[0]) * 0.05));
      colors.push(color.r, color.g, color.b);
      if (r < rings.length - 1) {
        const a = 1 + r * segments + i; const b = 1 + r * segments + (i + 1) % segments;
        indices.push(a, b, a + segments, b, b + segments, a + segments);
      }
    }
    for (let i = 0; i < segments; i++) indices.push(0, 1 + (i + 1) % segments, 1 + i);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    return geometry;
  };
  Object.entries(positions).forEach(([id, p], i) => {
    const radius = id === 'news' ? 1.12 : id === 'journey' ? 1.8 : 1.85;
    const shoal = kit.mesh(sculptedIsland(radius * 1.23, 67 + i), sand, p[0], -0.61, p[2]);
    shoal.castShadow = false;
    kit.mesh(sculptedIsland(radius, 67 + i), cutStone, p[0], 0, p[2]);
    const rockRandom = randomFrom(101 + i * 19);
    // Unequal clusters follow the authored coast, breaking the repeated disc
    // silhouette without adding texture downloads or unbounded instance counts.
    for (let rock = 0; rock < 10; rock++) {
      const angle = rock / 10 * TAU + i * 0.73 + rockRandom() * 0.18;
      const coast = 0.81 + rockRandom() * 0.11;
      const boulder = kit.mesh(new THREE.DodecahedronGeometry(0.1 + rockRandom() * 0.13, 1), limestone, p[0] + Math.cos(angle) * radius * coast, 0.13 + rockRandom() * 0.12, p[2] + Math.sin(angle) * radius * coast);
      const points = boulder.geometry.attributes.position;
      const rockPhase = rockRandom() * TAU;
      for (let vertex = 0; vertex < points.count; vertex++) {
        const relief = 0.95 + Math.sin(points.getX(vertex) * 31 + points.getY(vertex) * 23 + points.getZ(vertex) * 19 + rockPhase) * 0.12;
        points.setXYZ(vertex, points.getX(vertex) * relief, points.getY(vertex) * relief, points.getZ(vertex) * relief);
      }
      boulder.geometry.computeVertexNormals();
      boulder.scale.set(1.3, 0.35 + rockRandom() * 0.4, 0.75 + rockRandom() * 0.35);
      boulder.rotation.set(rockRandom() * 0.3, angle, rockRandom() * 0.25);
    }
    attachStop(kit, stops, id, p, id === 'news' ? 3.9 : 2.65, glow);
  });
  // Low, distant headlands give the lower view a horizon and scale. They are
  // scenery, outside both the five-stop loop and its registered hit targets.
  const distantStone = kit.mat('#34434e', { ...stoneStudy, bumpScale: 0.03, roughness: 0.98, metalness: 0 });
  for (const [index, distance, offset, radius, rise] of [[0, 29, -14, 7, 2.5], [1, 42, 11, 9, 3.1], [2, 51, -4, 6, 1.9]]) {
    const vertices = [0, rise, 0]; const uv = [0.5, 0.5]; const indices = [];
    const rings = [0.24, 0.49, 0.73, 1]; const segments = 56;
    for (let ring = 0; ring < rings.length; ring++) for (let i = 0; i < segments; i++) {
      const angle = i / segments * TAU;
      const irregular = 1 + Math.sin(angle * 3 + index) * 0.13 + Math.sin(angle * 7 - index * 2) * 0.08;
      const r = radius * rings[ring] * irregular;
      const y = ring === 3 ? -0.25 : rise * Math.pow(1 - rings[ring], 0.78)
        * (0.84 + Math.sin(angle * 2 + index) * 0.13 + Math.cos(angle * 5) * 0.11);
      vertices.push(Math.cos(angle) * r, y, Math.sin(angle) * r);
      uv.push(Math.cos(angle) * r * 0.18, Math.sin(angle) * r * 0.18);
      const a = 1 + ring * segments + i; const b = 1 + ring * segments + (i + 1) % segments;
      if (!ring) indices.push(0, b, a);
      if (ring < rings.length - 1) indices.push(a, b, a + segments, b, b + segments, a + segments);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    const position = near.clone().multiplyScalar(-distance).addScaledVector(right, offset);
    const headland = kit.mesh(geometry, distantStone, position.x, 0, position.z);
    headland.name = `distant-headland-${index}`; headland.castShadow = false; headland.receiveShadow = false;
  }
  // Scale each coherent landmark assembly around its own island, preserving
  // doors, mullions, and support spacing. The map gains room without losing
  // the readable landmark silhouettes that give each destination its identity.
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
    return landmark;
  };
  // A terraced studio: a pergola, a colored door, and a low parapet.
  const w = positions.work;
  let landmarkStart = group.children.length;
  kit.box(1.7, 0.9, 1.2, white, w[0], 0.98, w[2]);
  kit.box(1.86, 0.1, 1.36, limestone, w[0], 1.49, w[2]);
  kit.box(0.35, 0.64, 0.04, ink, w[0] + 0.43, 0.84, w[2] + 0.622);
  kit.box(0.52, 0.35, 0.04, glass, w[0] - 0.42, 1.0, w[2] + 0.622);
  for (let i = 0; i < 7; i++) kit.box(0.065, 0.065, 0.9, wood, w[0] - 0.67 + i * 0.2, 1.72, w[2] + 0.3);
  [-0.7, 0.7].forEach((x) => kit.box(0.04, 0.3, 0.04, wood, w[0] + x, 1.61, w[2] + 0.66));
  const roofWing = kit.box(1.08, 0.035, 0.83, glass, w[0] - 0.29, 1.83, w[2] - 0.13);
  roofWing.rotation.z = -0.11;
  kit.beam([w[0] - 0.78, 1.52, w[2] - 0.45], [w[0] - 0.78, 1.89, w[2] - 0.45], 0.015, brass);
  kit.beam([w[0] + 0.28, 1.52, w[2] - 0.45], [w[0] + 0.28, 1.77, w[2] - 0.45], 0.015, brass);
  kit.box(1.6, 0.012, 0.014, glow, w[0], 0.57, w[2] + 0.65);
  bindLandmarkTargets(stops.work, [finishLandmark(w, landmarkStart)]);
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
  const observatoryOrbit = kit.ring(1.11, 0.022, brass, r[0], 1.82, r[2]);
  observatoryOrbit.rotation.set(0.36, 0, -0.18);
  kit.ring(0.96, 0.009, glow, r[0], 1.65, r[2]);
  bindLandmarkTargets(stops.research, [finishLandmark(r, landmarkStart)]);
  // Journal courtyard and cypress: a quiet outdoor desk rather than another building.
  const j = positions.journal;
  landmarkStart = group.children.length;
  kit.box(1.75, 0.22, 1.65, white, j[0], 0.59, j[2]);
  kit.box(1.75, 0.63, 0.11, limestone, j[0], 0.95, j[2] - 0.76);
  kit.box(0.82, 0.06, 0.48, wood, j[0], 1.05, j[2] + 0.18);
  [-0.3, 0.3].forEach((x) => kit.box(0.06, 0.42, 0.3, ink, j[0] + x, 0.83, j[2] + 0.18));
  const book = kit.box(0.3, 0.025, 0.24, white, j[0], 1.1, j[2] + 0.18);
  book.rotation.y = 0.28;
  kit.cylinder(0.15, 0.22, 0.3, limestone, j[0] + 0.74, 0.85, j[2] - 0.35);
  kit.cylinder(0.025, 0.041, 0.63, wood, j[0] + 0.74, 1.21, j[2] - 0.35, group, 8);
  for (let crown = 0; crown < 4; crown++) {
    const cypress = kit.mesh(new THREE.IcosahedronGeometry(0.29 - crown * 0.033, 1), foliage, j[0] + 0.74, 1.3 + crown * 0.23, j[2] - 0.35);
    cypress.scale.set(0.8, 1.28, 0.77); cypress.rotation.y = crown * 0.7;
  }
  bindLandmarkTargets(stops.journal, [finishLandmark(j, landmarkStart, 1.08)]);
  // Harbor steps, a pier, and mooring posts.
  const h = positions.journey;
  landmarkStart = group.children.length;
  for (let i = 0; i < 5; i++) kit.box(1.25 + i * 0.1, 0.08, 0.44, white, h[0], 0.03 + i * 0.12, h[2] + 2.08 - i * 0.29);
  for (let plank = 0; plank < 8; plank++) kit.box(0.58, 0.075, 0.16, wood, h[0] + 0.71, 0.09, h[2] + 1.4 + plank * 0.18);
  [-0.2, 0.2].forEach((x) => kit.cylinder(0.04, 0.04, 0.4, ink, h[0] + 0.71 + x, 0.17, h[2] + 2.56));
  const harbor = finishLandmark(h, landmarkStart, 0.45);
  harbor.rotation.y = Math.atan2(-h[0], -h[2]);
  // The gateway is an actual open, weathered structure on the outer shore.
  // Its foundation stays outside the sailing corridor; no image covers the bay.
  const portalPosition = new THREE.Vector3(h[0], 0.43, h[2]).addScaledVector(near, 0.45);
  const portal = createRealmPortal({ position: portalPosition, bearing, scale: 0.78 });
  group.add(portal.group);
  const portalBounds = new THREE.Box3().setFromObject(portal.group);
  stops.journey.label.copy(portalPosition).setY(portalBounds.max.y + 0.42);
  bindLandmarkTargets(stops.journey, [harbor, portal.group]);
  const fitPoints = [];
  for (const x of [portalBounds.min.x, portalBounds.max.x]) for (const y of [portalBounds.min.y, portalBounds.max.y])
    for (const z of [portalBounds.min.z, portalBounds.max.z]) fitPoints.push(new THREE.Vector3(x, y, z));
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
  const lightBeam = kit.mesh(new THREE.ConeGeometry(0.46, 3, 24, 1, true), kit.mat('#93e9da', { transparent: true, opacity: 0.02, depthWrite: false, side: THREE.DoubleSide }), 1.5, 0, 0, beacon);
  lightBeam.rotation.z = Math.PI / 2;
  lightBeam.castShadow = false;
  group.add(beacon);
  const lighthouse = finishLandmark(n, landmarkStart, 1.08);
  // The faint sweeping beam is scenery, not an oversized click target.
  bindLandmarkTargets(stops.news, lighthouse.children.filter(piece => piece !== beacon));
  // A slender bronze-trimmed sailing craft and a small, original sailor figure.
  const traveler = new THREE.Group();
  const boatBody = new THREE.Group();
  traveler.add(boatBody);
  const hull = kit.sphere(0.62, white, 0, 0.2, 0, boatBody);
  hull.scale.set(0.44, 0.28, 1.37);
  const gunwale = kit.sphere(0.63, brass, 0, 0.26, 0, boatBody);
  gunwale.scale.set(0.44, 0.035, 1.35);
  kit.box(0.39, 0.04, 1.1, wood, 0, 0.3, -0.04, boatBody);
  for (let plank = 0; plank < 4; plank++) kit.box(0.005, 0.006, 1.06, brass, -0.14 + plank * 0.092, 0.323, -0.04, boatBody);
  kit.box(0.27, 0.035, 0.46, wood, 0, 0.34, -0.24, boatBody);
  kit.cylinder(0.015, 0.019, 1.46, brass, 0, 1.02, 0.08, boatBody, 10);
  const sailGeometry = (width, height, fullness) => {
    const segments = 14; const vertices = []; const uvs = []; const indices = []; const rows = [];
    for (let row = 0; row <= segments; row++) {
      const v = row / segments; const count = segments - row; rows.push(vertices.length / 3);
      for (let column = 0; column <= count; column++) {
        const u = count ? column / count : 0;
        vertices.push(0.025 + width * u * (1 - v) * (1 + Math.sin(v * Math.PI) * 0.16), height * v, Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * fullness);
        uvs.push(u * (1 - v), v);
        if (row < segments && column < count) {
          const a = rows[row] + column; const b = a + 1;
          const c = rows[row] + count + 1 + column;
          indices.push(a, b, c);
          if (column < count - 1) indices.push(b, c + 1, c);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
  };
  const sailCloth = kit.mat('#f7efd9', { ...linenStudy, bumpScale: 0.005, side: THREE.DoubleSide, roughness: 0.96, metalness: 0 });
  const sail = kit.mesh(sailGeometry(0.73, 1.25, 0.13), sailCloth, 0, 0.43, 0.08, boatBody);
  sail.rotation.y = Math.PI / 2 + 0.1;
  const jib = kit.mesh(sailGeometry(0.6, 1.08, 0.095), sailCloth, 0, 0.44, 0.12, boatBody);
  jib.rotation.y = -Math.PI / 2 - 0.14;
  kit.beam([0, 0.45, 0.73], [0, 1.72, 0.08], 0.005, brass, boatBody);
  kit.beam([0, 0.46, -0.69], [0, 1.67, 0.08], 0.005, brass, boatBody);
  const skin = kit.mat('#c59774', { roughness: 0.9 });
  const sailor = new THREE.Group();
  sailor.position.set(0.06, 0.35, -0.44);
  kit.cylinder(0.053, 0.064, 0.15, ink, 0, 0.18, 0, sailor, 12);
  kit.sphere(0.06, skin, 0, 0.31, 0, sailor);
  kit.cylinder(0.061, 0.061, 0.028, white, 0, 0.354, 0, sailor, 12);
  [-1, 1].forEach((side) => {
    kit.cylinder(0.018, 0.021, 0.12, white, side * 0.028, 0.065, 0, sailor, 8);
    kit.beam([side * 0.065, 0.235, 0], [side * 0.035, 0.2, 0.105], 0.017, skin, sailor);
  });
  const helm = kit.ring(0.062, 0.009, brass, 0, 0.19, 0.13, sailor);
  helm.rotation.x = 0.4;
  boatBody.add(sailor);
  kit.sphere(0.023, glow, -0.21, 0.34, 0.25, boatBody);
  kit.sphere(0.023, kit.mat('#e4c08a', { emissive: '#c2955c', emissiveIntensity: 0.8 }), 0.21, 0.34, 0.25, boatBody);
  group.add(traveler);
  // A suspended scientific lens is an approachable object in the world, not
  // a HUD. Its analytic projection is separate from the permanent bronze body.
  const instrument = new THREE.Group();
  instrument.position.y = 1.28;
  const outerLens = kit.ring(1.2, 0.037, brass, 0, 0, 0, instrument);
  outerLens.rotation.set(1.35, 0.22, -0.1);
  const innerLens = kit.ring(1.06, 0.018, ink, 0, 0, 0, instrument);
  innerLens.rotation.set(1.35, 0.22, -0.1);
  const lensDisk = kit.mesh(new THREE.CircleGeometry(1.04, 64), kit.mat('#497f99', { transparent: true, opacity: 0.36, metalness: 0.6, roughness: 0.09, side: THREE.DoubleSide, depthWrite: false }), 0, 0, 0, instrument);
  lensDisk.rotation.copy(outerLens.rotation);
  lensDisk.castShadow = false;
  const equator = kit.ring(0.57, 0.013, brass, 0, 0.03, 0, instrument);
  equator.rotation.set(0.4, 0.5, 1.1);
  const lensCore = kit.sphere(0.17, glow, 0, 0.03, 0, instrument);
  const lensCrown = kit.cylinder(0.05, 0.1, 0.21, ink, 0, 0.2, 0, instrument, 16);
  lensCrown.rotation.z = -0.15;
  const projection = kit.mesh(new THREE.ConeGeometry(1.1, 1.18, 48, 1, true), kit.mat('#64dcd2', { transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, emissive: '#30a49e', emissiveIntensity: 0.75 }), 0, -0.6, 0, instrument);
  projection.visible = false;
  projection.castShadow = false;
  group.add(instrument);
  const sourceMaterial = kit.mat('#a8ffdf', { emissive: '#49debc', emissiveIntensity: 1.5 });
  const sourceMarkers = [-1, 1].map((side) => {
    const marker = kit.ring(0.095, 0.012, sourceMaterial, side * 1.3, -0.015, side * -0.65);
    marker.visible = false;
    return marker;
  });
  // Fixed-capacity wake ribbon. All geometry/arrays are allocated once; birth
  // times fade old foam even after the craft has stopped moving.
  const wakeCapacity = 64;
  const wakeCenters = new Float32Array(wakeCapacity * 3);
  const wakeBirths = new Float32Array(wakeCapacity);
  const wakeWidths = new Float32Array(wakeCapacity);
  const wakePositions = new Float32Array(wakeCapacity * 6);
  const wakeTimes = new Float32Array(wakeCapacity * 2);
  const wakeSides = new Float32Array(wakeCapacity * 2);
  const wakeIndices = [];
  for (let i = 0; i < wakeCapacity; i++) {
    wakeSides[i * 2] = -1; wakeSides[i * 2 + 1] = 1;
    if (i < wakeCapacity - 1) wakeIndices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const wakeGeometry = new THREE.BufferGeometry();
  wakeGeometry.setAttribute('position', new THREE.BufferAttribute(wakePositions, 3).setUsage(THREE.DynamicDrawUsage));
  wakeGeometry.setAttribute('aBirth', new THREE.BufferAttribute(wakeTimes, 1).setUsage(THREE.DynamicDrawUsage));
  wakeGeometry.setAttribute('aSide', new THREE.BufferAttribute(wakeSides, 1));
  wakeGeometry.setIndex(wakeIndices); wakeGeometry.setDrawRange(0, 0);
  const wakeMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aBirth; attribute float aSide; varying float vBirth; varying float vSide;
      void main(){vBirth=aBirth;vSide=aSide;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float uTime; varying float vBirth; varying float vSide;
      void main(){float age=clamp((uTime-vBirth)/3.2,0.0,1.0);float edge=1.0-smoothstep(0.15,1.0,abs(vSide));
        float alpha=pow(1.0-age,2.0)*edge*0.63;gl_FragColor=vec4(vec3(0.15,0.72,0.62),alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const wake = kit.mesh(wakeGeometry, wakeMaterial);
  wake.castShadow = false; wake.receiveShadow = false; wake.frustumCulled = false; wake.visible = false;
  let wakeCount = 0;
  let fieldEnabled = false;
  let bank = 0;
  let sailOffset = 0.1;
  let lastWakeTime = 0;
  const setField = (enabled, spacing = 0.5) => {
    fieldEnabled = Boolean(enabled);
    const normalized = Number.isFinite(spacing) ? THREE.MathUtils.clamp(spacing, 0, 1) : 0.5;
    water.uniforms.uField.value = fieldEnabled ? 1 : 0;
    water.uniforms.uSpacing.value = normalized;
    projection.visible = fieldEnabled;
    lensDisk.material.opacity = fieldEnabled ? 0.58 : 0.36;
    const separation = 0.55 + normalized * 2;
    sourceMarkers.forEach((marker, i) => {
      const side = i === 0 ? -1 : 1;
      marker.position.set(side * separation * 0.894427191, -0.015, side * separation * -0.4472135955);
      marker.visible = fieldEnabled;
    });
  };
  const update = (dt, time, state = {}) => {
    const step = Number.isFinite(dt) ? THREE.MathUtils.clamp(dt, 0, 0.1) : 0;
    const now = Number.isFinite(time) ? time : 0;
    const speed = Number.isFinite(state.speed) ? THREE.MathUtils.clamp(Math.abs(state.speed), 0, 14) : 0;
    const turn = Number.isFinite(state.turn) ? THREE.MathUtils.clamp(state.turn, -1, 1) : 0;
    const response = 1 - Math.exp(-step * 5);
    bank = THREE.MathUtils.lerp(bank, -turn * Math.min(speed / 3, 1) * 0.14, response);
    sailOffset = THREE.MathUtils.lerp(sailOffset, 0.1 + turn * 0.22 + Math.min(speed / 14, 1) * 0.1, response);
    boatBody.rotation.z = bank;
    sail.rotation.y = Math.PI / 2 + sailOffset;
    jib.rotation.y = -Math.PI / 2 - sailOffset * 0.7;
    helm.rotation.z = THREE.MathUtils.lerp(helm.rotation.z, turn * 0.3, response);
    wakeMaterial.uniforms.uTime.value = now;
    if (step === 0) return;
    if (now < lastWakeTime) wakeCount = 0;
    lastWakeTime = now;
    let expired = 0;
    while (expired < wakeCount && now - wakeBirths[expired] > 3.2) expired++;
    if (expired) {
      wakeCenters.copyWithin(0, expired * 3); wakeBirths.copyWithin(0, expired); wakeWidths.copyWithin(0, expired);
      wakeCount -= expired;
    }
    const yaw = traveler.rotation.y;
    const x = traveler.position.x - Math.sin(yaw) * 0.83;
    const z = traveler.position.z - Math.cos(yaw) * 0.83;
    const last = Math.max(0, wakeCount - 1) * 3;
    const distance = wakeCount ? Math.hypot(x - wakeCenters[last], z - wakeCenters[last + 2]) : 0;
    if (distance > 2.2) wakeCount = 0;
    if (state.moving && speed > 0.025 && (!wakeCount || distance > 0.055)) {
      if (wakeCount === wakeCapacity) {
        wakeCenters.copyWithin(0, 3); wakeBirths.copyWithin(0, 1); wakeWidths.copyWithin(0, 1);
        wakeCount--;
      }
      const index = wakeCount++;
      wakeCenters[index * 3] = x; wakeCenters[index * 3 + 1] = 0.012; wakeCenters[index * 3 + 2] = z;
      wakeBirths[index] = now; wakeWidths[index] = 0.042 + speed * 0.007;
    }
    for (let i = 0; i < wakeCount; i++) {
      const previous = Math.max(0, i - 1) * 3; const next = Math.min(wakeCount - 1, i + 1) * 3;
      let dx = wakeCenters[next] - wakeCenters[previous]; let dz = wakeCenters[next + 2] - wakeCenters[previous + 2];
      const length = Math.hypot(dx, dz);
      if (length > 0.0001) { dx /= length; dz /= length; } else { dx = Math.sin(yaw); dz = Math.cos(yaw); }
      const width = wakeWidths[i] * (1 + Math.min((now - wakeBirths[i]) / 3.2, 1) * 1.4);
      for (let edge = 0; edge < 2; edge++) {
        const side = edge === 0 ? -1 : 1; const vertex = (i * 2 + edge) * 3;
        wakePositions[vertex] = wakeCenters[i * 3] - dz * width * side;
        wakePositions[vertex + 1] = 0.012;
        wakePositions[vertex + 2] = wakeCenters[i * 3 + 2] + dx * width * side;
        wakeTimes[i * 2 + edge] = wakeBirths[i];
      }
    }
    wakeGeometry.attributes.position.needsUpdate = true;
    wakeGeometry.attributes.aBirth.needsUpdate = true;
    wakeGeometry.setDrawRange(0, Math.max(0, (wakeCount - 1) * 6));
    wake.visible = wakeCount > 1;
  };
  const travelPoints = order.map((id) => {
    const p = positions[id];
    return new THREE.Vector3(p[0] * 0.64, 0, p[2] * 0.64);
  });
  const routeCurve = new THREE.CatmullRomCurve3(travelPoints, true, 'centripetal');
  const route = {
    order,
    point(phase) {
      const wrapped = ((phase % order.length) + order.length) % order.length;
      return routeCurve.getPoint(wrapped / order.length);
    },
  };
  const routeGeometry = kit.geo(new THREE.BufferGeometry().setFromPoints(routeCurve.getPoints(180)));
  const routeMaterial = new THREE.LineDashedMaterial({ color: '#e2e0c0', dashSize: 0.24, gapSize: 0.16, transparent: true, opacity: 0.72 });
  const nauticalRoute = new THREE.Line(routeGeometry, routeMaterial);
  nauticalRoute.position.y = -0.025;
  nauticalRoute.computeLineDistances();
  group.add(nauticalRoute);
  const coast = createCoastalDetail({ stops, route, bearing });
  group.add(coast.group);
  return {
    kit, stops, traveler, route, setField, update, instrumentHit: instrument, fitPoints,
    approach: { anchor: portalPosition.clone().setY(2.35), bearing },
    background: '#081b36', fog: ['#081b36', 29, 61], camera: [11.5, 11.4, 14.5], target: [0, 0.1, 0],
    travelPoint(id) { return route.point(order.indexOf(id)); },
    animate(time) {
      coast.update(time);
      water.uniforms.uTime.value = time;
      beacon.rotation.y = time * 0.23;
      observatoryOrbit.rotation.y = time * 0.12;
      equator.rotation.y = 0.5 + time * 0.15;
      instrument.position.y = 1.28 + Math.sin(time * 0.55) * 0.04;
      boatBody.rotation.x = Math.sin(time * 1.2) * 0.021;
      traveler.position.y = Math.sin(time * 1.6) * 0.022;
    },
    dispose() { coast.dispose(); portal.dispose(); routeMaterial.dispose(); surfaceTextures.forEach((texture) => texture.dispose()); },
  };
}

function buildOrbital(group) {
  const kit = modelKit(group);
  const ceramicStudy = createRealmSurface('ceramic', 89);
  const ceramic = kit.mat('#d8dbe7', { map: ceramicStudy.map, bumpMap: ceramicStudy.bumpMap,
    roughnessMap: ceramicStudy.roughnessMap, bumpScale: 0.008, metalness: 0.16, roughness: 1 });
  const graphite = kit.mat('#283349', { metalness: 0.65, roughness: 0.35 });
  const trim = kit.mat('#8b91af', { metalness: 0.65 });
  const glow = kit.mat('#b2aaff', { emissive: '#8772ec', emissiveIntensity: 0.8 });
  const amber = kit.mat('#e6bf85', { emissive: '#98734b', emissiveIntensity: 0.25 });
  const glass = kit.mat('#77b6ce', { metalness: 0.7, roughness: 0.12 });
  const stops = {};
  const order = ['work', 'research', 'journal', 'journey', 'news'];
  const bearing = Math.atan2(13, 17.33);
  const right = new THREE.Vector3(Math.cos(bearing), 0, -Math.sin(bearing));
  const near = new THREE.Vector3(Math.sin(bearing), 0, Math.cos(bearing));
  const elevations = { work: 1.05, research: 2, journal: 0.5, journey: 0, news: 0.4 };
  const positions = Object.fromEntries(order.map((id, i) => {
    const angle = -Math.PI / 2 + i * TAU / order.length;
    const p = right.clone().multiplyScalar(Math.cos(angle) * 6.1).addScaledVector(near, Math.sin(angle) * 6.1);
    return [id, [p.x, elevations[id], p.z]];
  }));
  const travelPoints = order.map((id) => {
    const p = positions[id];
    return new THREE.Vector3(p[0] * 0.8, p[1] + 0.72, p[2] * 0.8);
  });
  const routeCurve = new THREE.CatmullRomCurve3(travelPoints, true, 'centripetal');
  const route = {
    order,
    point(phase) {
      const wrapped = ((phase % order.length) + order.length) % order.length;
      return routeCurve.getPoint(wrapped / order.length);
    },
  };
  // Closed, gently climbing rails follow the same loop as the capsule. They
  // do not connect opposing stations through the middle of the constellation.
  const railCurve = new THREE.CatmullRomCurve3(travelPoints.map((p) => p.clone().add(new THREE.Vector3(0, -1.12, 0))), true, 'centripetal');
  const rail = kit.mesh(new THREE.TubeGeometry(railCurve, 160, 0.027, 8, true), trim);
  rail.castShadow = false;
  const guide = kit.mesh(new THREE.TubeGeometry(railCurve, 160, 0.009, 6, true), glow, 0, 0.05, 0);
  guide.castShadow = false;
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
  let landmarkStart = group.children.length;
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
  bindLandmarkTargets(stops.work, group.children.slice(landmarkStart));
  const r = positions.research;
  landmarkStart = group.children.length;
  kit.cylinder(0.13, 0.32, 0.8, graphite, r[0], r[1] + 0.3, r[2]);
  const instrument = new THREE.Group();
  instrument.position.set(r[0], r[1] + 1.02, r[2]);
  const outer = kit.ring(0.73, 0.034, ceramic, 0, 0, 0, instrument);
  outer.rotation.set(0.6, 0, 0.35);
  const middle = kit.ring(0.59, 0.026, glow, 0, 0, 0, instrument);
  middle.rotation.set(0.1, 0.6, 1.2);
  kit.sphere(0.24, glass, 0, 0, 0, instrument);
  group.add(instrument);
  bindLandmarkTargets(stops.research, group.children.slice(landmarkStart));
  const j = positions.journal;
  landmarkStart = group.children.length;
  kit.cylinder(0.66, 0.66, 0.08, graphite, j[0], j[1] + 0.08, j[2]);
  for (let i = 0; i < 5; i++) {
    const angle = i / 5 * TAU;
    const tablet = kit.box(0.38, 0.6, 0.045, ceramic, j[0] + Math.cos(angle) * 0.72, j[1] + 0.55, j[2] + Math.sin(angle) * 0.72);
    tablet.rotation.y = Math.PI / 2 - angle;
    kit.sphere(0.027, glow, j[0] + Math.cos(angle) * 0.74, j[1] + 0.91, j[2] + Math.sin(angle) * 0.74);
  }
  bindLandmarkTargets(stops.journal, group.children.slice(landmarkStart));
  const h = positions.journey;
  landmarkStart = group.children.length;
  const dock = kit.ring(0.87, 0.12, ceramic, h[0], h[1] + 0.85, h[2]);
  dock.rotation.x = 0;
  kit.box(1.9, 0.1, 0.58, graphite, h[0], h[1] + 0.05, h[2]);
  bindLandmarkTargets(stops.journey, group.children.slice(landmarkStart));
  const n = positions.news;
  landmarkStart = group.children.length;
  kit.cylinder(0.05, 0.1, 1.2, trim, n[0], n[1] + 0.55, n[2]);
  const dish = kit.mesh(new THREE.SphereGeometry(0.65, 24, 14, 0, TAU, 0, Math.PI * 0.42), ceramic, n[0], n[1] + 1.3, n[2]);
  dish.rotation.set(0.45, 0, -0.4);
  kit.beam([n[0], n[1] + 1.2, n[2]], [n[0] + 0.25, n[1] + 1.86, n[2] + 0.3], 0.015, amber);
  bindLandmarkTargets(stops.news, group.children.slice(landmarkStart));
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
    kit, stops, traveler, route, background: '#090f23', fog: ['#090f23', 37, 79], camera: [13, 12.5, 17.33], target: [0, 0.5, 0],
    travelPoint(id) { return route.point(order.indexOf(id)); },
    animate(time) {
      instrument.rotation.y = time * 0.17;
      middle.rotation.z = time * 0.2;
      stars.rotation.y = time * 0.002;
      traveler.children[0].rotation.z = Math.sin(time * 1.1) * 0.02;
    },
    dispose() { ceramicStudy.dispose(); starsMaterial.dispose(); },
  };
}

function buildWoodland(group) {
  const kit = modelKit(group);
  const mossStudy = createRealmSurface('moss', 53);
  const timberStudy = createRealmSurface('timber', 41);
  const mossMaps = { map: mossStudy.map, bumpMap: mossStudy.bumpMap, roughnessMap: mossStudy.roughnessMap, roughness: 1, metalness: 0 };
  const earth = kit.mat('#163b35', { ...mossMaps, bumpScale: 0.03 });
  const moss = kit.mat('#4f7660', { ...mossMaps, bumpScale: 0.025 });
  const path = kit.mat('#9ba98a');
  const timber = kit.mat('#a38766', { map: timberStudy.map, bumpMap: timberStudy.bumpMap,
    roughnessMap: timberStudy.roughnessMap, bumpScale: 0.018, metalness: 0, roughness: 1 });
  const dark = kit.mat('#29443e');
  const roof = kit.mat('#799282', { metalness: 0.25 });
  const pale = kit.mat('#e8dfc7');
  const foliage = kit.mat('#315c4b');
  const lightFoliage = kit.mat('#476e51');
  const glow = kit.mat('#deefac', { emissive: '#c1d780', emissiveIntensity: 0.75 });
  const glass = kit.mat('#a4d2bc', { transparent: true, opacity: 0.18, roughness: 0.08, metalness: 0.15, depthWrite: false, side: THREE.DoubleSide });
  const stops = {};
  const order = ['work', 'research', 'journal', 'journey', 'news'];
  const bearing = Math.atan2(13, 17.33);
  const right = new THREE.Vector3(Math.cos(bearing), 0, -Math.sin(bearing));
  const near = new THREE.Vector3(Math.sin(bearing), 0, Math.cos(bearing));
  const positions = Object.fromEntries(order.map((id, i) => {
    const angle = -Math.PI / 2 + i * TAU / order.length;
    const p = right.clone().multiplyScalar(Math.cos(angle) * 6.1).addScaledVector(near, Math.sin(angle) * 6.1);
    return [id, [p.x, 0.16, p.z]];
  }));
  // Clearings sit on continuous terrain, with distant rolling ground instead
  // of a visible circular plinth. The authored paths remain on the flat center.
  const terrain = new THREE.PlaneGeometry(120, 120, 96, 96);
  terrain.rotateX(-Math.PI / 2);
  const terrainVertices = terrain.attributes.position;
  for (let i = 0; i < terrainVertices.count; i++) {
    const x = terrainVertices.getX(i); const z = terrainVertices.getZ(i);
    const outer = THREE.MathUtils.smoothstep(Math.hypot(x, z), 10.5, 22);
    const relief = 0.5 + Math.sin(x * 0.17 + z * 0.08) * 0.37 + Math.cos(z * 0.21 - x * 0.05) * 0.32;
    terrainVertices.setY(i, -0.02 + outer * relief * 2.1);
    terrain.attributes.uv.setXY(i, x * 0.15, z * 0.15);
  }
  terrain.computeVertexNormals(); terrain.computeBoundingSphere();
  const land = kit.mesh(terrain, earth); land.name = 'continuous-woodland-terrain'; land.castShadow = false;
  Object.entries(positions).forEach(([id, p]) => {
    const clearing = kit.cylinder(id === 'journey' ? 1.45 : 1.65, 1.55, 0.05, moss, p[0], 0.02, p[2]);
    clearing.scale.z = 0.85;
    const rim = kit.ring(1.5, 0.012, path, p[0], 0.07, p[2]);
    rim.scale.z = 0.85;
    attachStop(kit, stops, id, p, id === 'news' ? 3.8 : 2.5, glow);
  });
  const travelPoints = order.map((id) => {
    const p = positions[id];
    return new THREE.Vector3(p[0] * 0.82, 1.18, p[2] * 0.82);
  });
  const routeCurve = new THREE.CatmullRomCurve3(travelPoints, true, 'centripetal');
  const route = {
    order,
    point(phase) {
      const wrapped = ((phase % order.length) + order.length) % order.length;
      return routeCurve.getPoint(wrapped / order.length);
    },
  };
  const trailCurve = new THREE.CatmullRomCurve3(travelPoints.map((p) => new THREE.Vector3(p.x, 0.07, p.z)), true, 'centripetal');
  const trail = kit.mesh(new THREE.TubeGeometry(trailCurve, 160, 0.075, 6, true), path);
  trail.scale.y = 0.18;
  trail.position.y = 0.055;
  trail.castShadow = false;
  const trailSamples = trailCurve.getPoints(80);
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
    if (trailSamples.some((p) => Math.hypot(p.x - x, p.z - z) < 1.12)) continue;
    // A clearing around a hut does not prevent a taller tree farther forward
    // from hiding it. Keep slim sightlines open along the fixed camera bearing.
    const obscuresLandmark = Object.values(positions).some((p) => {
      const dx = x - p[0]; const dz = z - p[2];
      const forward = dx * near.x + dz * near.z;
      const lateral = Math.abs(dx * right.x + dz * right.z);
      return forward > -0.6 && forward < 6.8 && lateral < 1.55;
    });
    if (obscuresLandmark) continue;
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
  let landmarkStart = group.children.length;
  kit.box(1.55, 0.93, 1.1, timber, w[0], 0.67, w[2]);
  const hutRoof = kit.box(1.85, 0.1, 1.5, roof, w[0], 1.21, w[2]);
  hutRoof.rotation.z = -0.1;
  kit.box(0.32, 0.66, 0.035, dark, w[0] + 0.35, 0.53, w[2] + 0.565);
  kit.box(0.53, 0.32, 0.035, glow, w[0] - 0.35, 0.79, w[2] + 0.565);
  kit.box(0.75, 0.07, 0.38, pale, w[0] - 0.6, 0.67, w[2] + 0.97);
  [-0.25, 0.25].forEach((x) => kit.box(0.05, 0.55, 0.24, dark, w[0] - 0.6 + x, 0.39, w[2] + 0.97));
  bindLandmarkTargets(stops.work, group.children.slice(landmarkStart));
  // Glasshouse: slim timber mullions, actual transparent panels, and seedlings.
  const r = positions.research;
  landmarkStart = group.children.length;
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
  bindLandmarkTargets(stops.research, group.children.slice(landmarkStart));
  const j = positions.journal;
  landmarkStart = group.children.length;
  kit.box(1.25, 0.12, 0.38, timber, j[0], 0.55, j[2]);
  [-0.44, 0.44].forEach((x) => kit.box(0.09, 0.38, 0.32, dark, j[0] + x, 0.3, j[2]));
  kit.box(1.25, 0.43, 0.07, timber, j[0], 0.83, j[2] - 0.18);
  kit.box(0.31, 0.03, 0.24, pale, j[0] + 0.18, 0.635, j[2]);
  kit.cylinder(0.028, 0.035, 1.48, timber, j[0] - 0.77, 0.79, j[2] + 0.45);
  kit.sphere(0.14, glow, j[0] - 0.77, 1.54, j[2] + 0.45);
  bindLandmarkTargets(stops.journal, group.children.slice(landmarkStart));
  const h = positions.journey;
  landmarkStart = group.children.length;
  const arch = kit.mesh(new THREE.TorusGeometry(0.88, 0.055, 8, 48, Math.PI), timber, h[0], 0.25, h[2]);
  arch.rotation.z = 0;
  kit.box(0.7, 0.035, 0.2, pale, h[0], 1.1, h[2]);
  [-0.5, 0, 0.5].forEach((x) => kit.cylinder(0.17, 0.18, 0.05, path, h[0] + x * 0.1, 0.1, h[2] + 0.3 + x, group, 12));
  bindLandmarkTargets(stops.journey, group.children.slice(landmarkStart));
  const n = positions.news;
  landmarkStart = group.children.length;
  [-0.48, 0.48].forEach((x) => [-0.48, 0.48].forEach((z) => kit.box(0.055, 2.05, 0.055, timber, n[0] + x, 1.1, n[2] + z)));
  kit.box(1.16, 0.12, 1.16, pale, n[0], 2.12, n[2]);
  [-0.55, 0.55].forEach((z) => kit.box(1.16, 0.045, 0.035, timber, n[0], 2.62, n[2] + z));
  [-0.55, 0.55].forEach((x) => kit.box(0.035, 0.045, 1.16, timber, n[0] + x, 2.62, n[2]));
  for (let i = 0; i < 8; i++) kit.box(0.33, 0.035, 0.08, timber, n[0], 0.25 + i * 0.25, n[2] + 0.57);
  [-0.2, 0.2].forEach((x) => kit.box(0.04, 2.12, 0.04, timber, n[0] + x, 1.15, n[2] + 0.57));
  bindLandmarkTargets(stops.news, group.children.slice(landmarkStart));
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
    kit, stops, traveler, route, background: '#0c2427', fog: ['#0c2427', 24, 48], camera: [13, 13.5, 17.33], target: [0, 0.3, 0],
    travelPoint(id) { return route.point(order.indexOf(id)); },
    animate(time) {
      wings.forEach((wing, i) => { wing.rotation.z = Math.sin(time * 15) * (i ? -0.2 : 0.2); });
      halo.scale.setScalar(0.9 + Math.sin(time * 2) * 0.08);
    },
    dispose() { mossStudy.dispose(); timberStudy.dispose(); },
  };
}

const BUILDERS = { sea: buildSea, orbital: buildOrbital, woodland: buildWoodland };

/** Build native scene objects without a renderer, DOM or a network request. */
export function buildRealmScene(id, group = new THREE.Group()) {
  if (!Object.hasOwn(BUILDERS, id)) throw new TypeError('Unknown world setting.');
  const world = BUILDERS[id](group);
  group.updateWorldMatrix(true, true);
  let ceiling = 0;
  group.traverse(object => {
    if (!object.isMesh || !object.visible) return;
    ceiling = Math.max(ceiling, new THREE.Box3().setFromObject(object).max.y);
  });
  // The portrait inspection camera sits lower than its plate. Whole-scene
  // source rays, rather than isolated housing bounds, establish this clearance.
  world.inspectionElevation = Math.max(7.5, ceiling + 2.65);
  return world;
}

// Reflect a camera across the flat mean water plane. Global clipping keeps
// submerged land out of the reflected image. The ripple shader perturbs its UVs.
// No scene is cloned, and the pass has a fixed, modest resolution ceiling.
function seaReflection(surface, renderer) {
  const material = surface.material;
  const target = new THREE.WebGLRenderTarget(512, 512, { depthBuffer: true, type: THREE.HalfFloatType });
  target.texture.colorSpace = THREE.LinearSRGBColorSpace;
  target.texture.generateMipmaps = false;
  const reflectedCamera = new THREE.PerspectiveCamera();
  const forward = new THREE.Vector3(); const aim = new THREE.Vector3();
  const bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  const clipping = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -surface.position.y + 0.015)];
  let size = 512;
  material.uniforms.uReflection.value = target.texture;
  return {
    render(scene, camera, width) {
      const requested = width < 700 ? 256 : 512;
      if (size !== requested) { size = requested; target.setSize(size, size); }
      const waterY = surface.position.y;
      if (camera.position.y <= waterY) { material.uniforms.uReflectionStrength.value = 0; return; }
      reflectedCamera.copy(camera, false);
      reflectedCamera.position.y = 2 * waterY - camera.position.y;
      camera.getWorldDirection(forward);
      aim.copy(camera.position).add(forward); aim.y = 2 * waterY - aim.y;
      reflectedCamera.up.copy(camera.up); reflectedCamera.up.y *= -1;
      reflectedCamera.lookAt(aim); reflectedCamera.updateMatrixWorld();
      material.uniforms.uReflectionMatrix.value.copy(bias).multiply(reflectedCamera.projectionMatrix).multiply(reflectedCamera.matrixWorldInverse);
      const previousTarget = renderer.getRenderTarget();
      const previousClipping = renderer.clippingPlanes;
      const previousShadow = renderer.shadowMap.autoUpdate;
      const wasVisible = surface.visible;
      surface.visible = false;
      try {
        renderer.clippingPlanes = clipping;
        // Shadows are generated by the main pass; a reflection need not rebuild them.
        renderer.shadowMap.autoUpdate = false;
        renderer.setRenderTarget(target); renderer.clear(); renderer.render(scene, reflectedCamera);
        material.uniforms.uReflectionStrength.value = 1;
      } finally {
        surface.visible = wasVisible;
        renderer.clippingPlanes = previousClipping;
        renderer.shadowMap.autoUpdate = previousShadow;
        renderer.setRenderTarget(previousTarget);
      }
    },
    dispose() { material.uniforms.uReflection.value = null; target.dispose(); },
  };
}

/**
 * Owns its canvas, projected HTML buttons, input listeners, and WebGL resources.
 * select() mirrors external content selection silently. Actual world interactions
 * invoke onVisit immediately; travel is visual and never gates access to content.
 */
export function createWorld({ mount, themeId = 'sea', destinations = [], onVisit = () => {}, onStatus = () => {}, onExit = () => {}, onFieldChange = () => {}, onViewChange = () => {}, onVoyageState = () => {}, onExplorationState = () => {}, onInspectionChange = () => {}, onInspectionImage = () => {} } = {}) {
  if (!mount) throw new TypeError('createWorld requires a mount element.');
  const noop = () => {};
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch {
    onStatus({ ready: false, message: 'The 3D view is unavailable here. Every destination is still available in the reading view.' });
    return { select: noop, navigate: noop, read: noop, interact: noop, setPlaying: noop, setSailingAxis: noop, setTheme: noop, setAppearance: noop, setMotion: noop, setField: noop, setView: noop, setInspection: noop, setInspectionStage: noop, destroy: noop };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
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
  let worldTheme = getTheme(themeId).id;
  let worldGroup;
  let playing = false;
  let beacons = null;
  let approachPoints = [];
  const exploration = createExploration({ order: destinations.map(stop => stop.id).filter(id => ['work', 'research', 'journal', 'journey', 'news'].includes(id)) });
  let lastExplorationState = '';
  let reflection = null;
  const atmospheres = new Map();
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
  let routePhase = 0;
  let width = 1;
  let height = 1;
  let lastArrowAt = -Infinity;
  let sceneView = 'atlas';
  let voyageMotion = null;
  let voyageCamera = null;
  let voyageCameraIssue = '';
  let sailingAxis = 0;
  let externalSailingAxis = 0;
  const sailingKeys = new Set();
  let portalApproach = false;
  let lastVoyageState = '';
  let fieldEnabled = false;
  let fieldSpacing = 0.45;
  let fieldDrag = null;
  let landmarkPress = null;
  let exposureMultiplier = 1;
  let keyLightMultiplier = 1;
  let themeExposure = 1;
  let themeKeyIntensity = 3;
  let inspection = null;
  let restoredPose = null;
  const instrumentRay = new THREE.Raycaster();
  const pointerPosition = new THREE.Vector2();
  const labelPosition = new THREE.Vector3();
  const atlasPosition = new THREE.Vector3();
  const atlasTarget = new THREE.Vector3();
  const cameraAim = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const desiredTarget = new THREE.Vector3();
  const lastTravelerPosition = new THREE.Vector3();
  let lastHeading = 0;
  const canDraw = () => !destroyed && !contextLost && inView && !document.hidden && width > 1 && height > 1;
  const moving = () => motionRequested && !reducedMotion.matches;
  const controlsTravel = () => !fieldEnabled && (playing || (worldTheme === 'sea' && sceneView === 'voyage'));

  function explorationStatus(dt = 0) {
    if (!world) return;
    const distances = Object.fromEntries(approachPoints.map(({ id, position }) => [id, world.traveler.position.distanceTo(position)]));
    const state = exploration.update({ phase: routePhase, moving: moving(), distances });
    if (beacons) {
      beacons.group.visible = playing && !inspection && !fieldEnabled;
      beacons.update(state, dt, { static: !moving() });
    }
    const available = playing && canDraw() && !inspection && !fieldEnabled;
    // Proximity is sampled each frame, but DOM/status work is only needed at a
    // zone boundary, chart event or lifecycle change. No per-frame live region.
    const key = `${playing}:${state.nearId}:${state.revision}:${available}`;
    if (key !== lastExplorationState) {
      lastExplorationState = key;
      onExplorationState({ ...state, playing, available, theme: worldTheme });
    }
  }

  function clearSailingInput() {
    sailingAxis = 0;
    externalSailingAxis = 0;
    sailingKeys.clear();
  }

  function heldKeyAxis() {
    const forward = ['arrowright', 'arrowdown', 'd'].some(key => sailingKeys.has(key));
    const backward = ['arrowleft', 'arrowup', 'a'].some(key => sailingKeys.has(key));
    return Number(forward) - Number(backward);
  }

  function voyageStatus() {
    const speed = voyageMotion?.snapshot().speed || 0;
    const sailing = moving() && Math.abs(speed) > 0.015;
    const acceptingInput = canDraw() && !inspection && controlsTravel();
    const state = `${selectedId}:${sailing ? 'sailing' : 'anchored'}:${sailingAxis}:${acceptingInput}`;
    if (state === lastVoyageState) return;
    lastVoyageState = state;
    onVoyageState({ destination: selectedId, sailing, axis: sailingAxis, acceptingInput });
  }

  function inspectionPose() {
    // Leave the right 40% to the reader. On a phone the apparatus occupies the
    // upper portion, with the native reader below; no rolled/orbiting horizon.
    const pose = inspectionCameraPose({ anchor: inspection.anchor, bearing: inspection.bearing, width, height, fov: camera.fov });
    desiredTarget.copy(pose.target);
    desiredPosition.copy(pose.position);
  }

  function applyInspectionCamera(amount, closing = false) {
    if (!inspection) return;
    inspectionPose();
    if (closing) {
      camera.position.copy(inspection.exitPosition).lerp(inspection.saved.cameraPosition, amount);
      cameraAim.copy(inspection.exitAim).lerp(inspection.saved.cameraAim, amount);
      camera.fov = THREE.MathUtils.lerp(36, inspection.saved.fov, amount);
      camera.updateProjectionMatrix();
    } else {
      camera.position.copy(inspection.saved.cameraPosition).lerp(desiredPosition, amount);
      cameraAim.copy(inspection.saved.cameraAim).lerp(desiredTarget, amount);
    }
    camera.lookAt(cameraAim);
    camera.updateMatrixWorld();
  }

  function settleInspectionOpening() {
    if (!inspection || inspection.phase !== 'opening') return;
    inspection.progress = 1;
    inspection.open = 1;
    inspection.phase = 'open';
    inspection.rig.update(0, 1, true);
    applyInspectionCamera(1);
    if (!destroyed) onInspectionChange({ phase: 'open' });
  }

  function finishInspection(notify = true) {
    if (!inspection) return;
    const saved = inspection.saved;
    inspection.rig.dispose();
    inspection = null;
    camera.position.copy(saved.cameraPosition);
    cameraAim.copy(saved.cameraAim);
    atlasPosition.copy(saved.atlasPosition);
    atlasTarget.copy(saved.atlasTarget);
    camera.lookAt(cameraAim);
    camera.updateMatrixWorld();
    routePhase = saved.routePhase;
    transition = saved.transition;
    world.traveler.position.copy(saved.travelerPosition);
    world.traveler.quaternion.copy(saved.travelerQuaternion);
    portalApproach = saved.portalApproach;
    if (voyageMotion && saved.voyage) voyageMotion.restore(saved.voyage);
    camera.fov = saved.fov; camera.updateProjectionMatrix();
    lastTravelerPosition.copy(saved.lastTravelerPosition);
    lastHeading = saved.lastHeading;
    // The host restores its inline layout after 'closed'. That resize should
    // not snap a voyage camera which was partway through a selected transition.
    restoredPose = saved;
    // Projected buttons were hidden during the passage. Restore their actual
    // exploration visibility before the host tests the invoking focus target;
    // projecting the saved pose in a still-fullscreen aspect would be wrong.
    labels.forEach(({ element, id }) => { element.hidden = saved.labelVisibility.get(id) ?? true; });
    renderer.domElement.style.touchAction = fieldEnabled ? 'pan-y' : 'auto';
    renderer.domElement.style.cursor = fieldEnabled ? 'ew-resize' : 'default';
    renderer.shadowMap.needsUpdate = true;
    explorationStatus();
    invalidate();
    if (notify && !destroyed) {
      onInspectionChange({ phase: 'closed' });
      // A synchronous host layout restoration can be fitted before the next
      // paint, avoiding a fullscreen canvas squeezed into its inline slot.
      if (!contextLost) { resize(); updateLabels(); }
    }
  }

  function setInspection({ active = false, imageUrl, stage = 0, collection = selectedId } = {}) {
    if (destroyed || contextLost || !world) return;
    if (!active) {
      if (!inspection || inspection.phase === 'closing') return;
      if (!moving() || !canDraw()) { finishInspection(); return; }
      inspection.phase = 'closing';
      inspection.progress = 0;
      inspection.exitPosition = camera.position.clone();
      inspection.exitAim = cameraAim.clone();
      inspection.exitOpen = inspection.open;
      onInspectionChange({ phase: 'closing' });
      invalidate();
      return;
    }
    if (inspection) {
      if (inspection.phase === 'closing') finishInspection();
      else { setInspectionStage({ imageUrl, stage }); return; }
    }
    if (!Number.isInteger(stage) || stage < 0 || stage > 2) throw new RangeError('Figure passage stage must be 0, 1 or 2.');
    clearSailingInput();
    cancelFieldDrag();
    restoredPose = null;
    const anchor = inspectionSceneAnchor({ world, collection: world.stops[collection] ? collection : selectedId });
    const bearing = Math.atan2(world.camera[0], world.camera[2]);
    const saved = {
      cameraPosition: camera.position.clone(), cameraAim: cameraAim.clone(),
      atlasPosition: atlasPosition.clone(), atlasTarget: atlasTarget.clone(),
      routePhase, transition: transition ? { ...transition } : null,
      travelerPosition: world.traveler.position.clone(), travelerQuaternion: world.traveler.quaternion.clone(),
      lastTravelerPosition: lastTravelerPosition.clone(), lastHeading, width, height,
      labelVisibility: new Map(labels.map(({ id, element }) => [id, element.hidden])),
      fov: camera.fov, portalApproach, voyage: voyageMotion?.snapshot(),
    };
    camera.fov = 36; camera.updateProjectionMatrix();
    const rig = createFigurePassage({ anchor, bearing, theme: worldTheme, onInvalidate: invalidate, onImage: state => {
      if (!destroyed && !contextLost && inspection?.rig === rig) onInspectionImage({ ...state, error: Boolean(state.error) });
    } });
    inspection = { phase: 'opening', progress: 0, open: 0, rig, saved, anchor, bearing, collection, stage, imageUrl };
    explorationStatus();
    scene.add(rig.group);
    renderer.domElement.style.touchAction = 'auto';
    renderer.domElement.style.cursor = 'default';
    labels.forEach(({ element }) => { element.hidden = true; });
    rig.setStage(stage, imageUrl, true);
    renderer.shadowMap.needsUpdate = true;
    onInspectionChange({ phase: 'opening' });
    if (!moving() || !canDraw()) settleInspectionOpening();
    invalidate();
  }

  function setInspectionStage({ imageUrl, stage = 0 } = {}) {
    if (destroyed || contextLost || !inspection || inspection.phase === 'closing') return;
    inspection.imageUrl = imageUrl;
    inspection.stage = stage;
    inspection.rig.setStage(stage, imageUrl, !moving());
    if (!moving()) inspection.rig.update(0, inspection.open, true);
    invalidate();
  }

  function placeTraveler(phase, direction = 1) {
    const position = world.route.point(phase);
    const tangent = world.route.point(phase + direction * 0.001).sub(position);
    world.traveler.position.copy(position);
    if (tangent.lengthSq() > 0.00001) world.traveler.rotation.y = Math.atan2(tangent.x, tangent.z);
  }

  function updateCamera(dt, immediate = false) {
    const fov = sceneView === 'voyage' && !portalApproach && !fieldEnabled ? 48 : 36;
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    if (sceneView === 'voyage' && portalApproach && world.approach && !fieldEnabled) {
      const pose = portalCameraPose({ ...world.approach, aspect: camera.aspect, fov: camera.fov });
      desiredPosition.copy(pose.position); desiredTarget.copy(pose.target);
    } else if (sceneView === 'voyage' && worldTheme === 'sea' && !fieldEnabled) {
      const pose = voyageCamera.pose({ phase: routePhase, position: world.traveler.position, aspect: camera.aspect, fov: camera.fov });
      desiredPosition.copy(pose.position); desiredTarget.copy(pose.target);
    } else if (sceneView === 'voyage') {
      // A fixed bearing keeps reversing on the loop from flipping the camera.
      // Frame the current boat and its destination together; the field lens is
      // the focal point while inspecting the illustrative study.
      desiredTarget.copy(world.traveler.position);
      desiredTarget.lerp(fieldEnabled ? atlasTarget : world.stops[selectedId].position, fieldEnabled ? 0.58 : 0.38);
      desiredTarget.y = fieldEnabled ? 1.1 : 1.3;
      const phoneScale = Math.max(1, Math.sqrt(1.25 / camera.aspect));
      desiredPosition.set(...world.camera).sub(atlasTarget).multiplyScalar(0.43 * phoneScale);
      desiredPosition.y *= 0.77;
      desiredPosition.add(desiredTarget);
    } else {
      desiredPosition.copy(atlasPosition);
      desiredTarget.copy(atlasTarget);
    }
    const blend = immediate ? 1 : 1 - Math.exp(-dt * 4);
    camera.position.lerp(desiredPosition, blend);
    // Track the craft immediately; a lagging aim can push it off a tall screen.
    if (worldTheme === 'sea' && sceneView === 'voyage' && !portalApproach && !fieldEnabled) cameraAim.copy(desiredTarget);
    else cameraAim.lerp(desiredTarget, blend);
    camera.lookAt(cameraAim);
    camera.updateMatrixWorld();
  }

  function updateLabels() {
    if (inspection || sceneView === 'voyage') {
      if (!inspection && labels.some(({ element }) => element === document.activeElement)) mount.focus({ preventScroll: true });
      labels.forEach(({ element }) => { element.hidden = true; });
      return;
    }
    labels.forEach(({ element, id, boxWidth, boxHeight }) => {
      labelPosition.copy(world.stops[id].label).project(camera);
      const x = (labelPosition.x * 0.5 + 0.5) * width;
      const y = (-labelPosition.y * 0.5 + 0.5) * height;
      const visible = labelPosition.z > -1 && labelPosition.z < 1 && x >= boxWidth / 2 && x <= width - boxWidth / 2 && y >= 76 + boxHeight / 2 && y <= height - 88 - boxHeight / 2;
      const pinned = sceneView === 'voyage' && id === selectedId && !visible;
      if (!visible && !pinned && document.activeElement === element) mount.focus({ preventScroll: true });
      element.hidden = !visible && !pinned;
      element.classList.toggle('is-edge', pinned);
      element.dataset.bearing = y < 76 ? '↑' : y > height - 88 ? '↓' : x < width / 2 ? '←' : '→';
      element.title = pinned ? 'Selected stop outside this camera view' : '';
      element.style.left = `${pinned ? Math.max(boxWidth / 2 + 16, Math.min(width - boxWidth / 2 - 16, x)) : x}px`;
      element.style.top = `${pinned ? Math.max(76 + boxHeight / 2, Math.min(height - 88 - boxHeight / 2, y)) : y}px`;
      element.classList.toggle('is-active', id === selectedId);
      element.setAttribute('aria-pressed', String(id === selectedId));
    });
  }

  function draw(timestamp) {
    frame = 0;
    if (!canDraw()) { previousTimestamp = 0; return; }
    const dt = previousTimestamp ? Math.min((timestamp - previousTimestamp) / 1000, 0.06) : 0;
    previousTimestamp = timestamp;
    let passageMoving = false;
    if (inspection) {
      if (moving()) {
        if (inspection.phase === 'opening') {
          inspection.progress = Math.min(1, inspection.progress + dt / 0.95);
          const t = inspection.progress;
          const ease = t * t * (3 - 2 * t);
          inspection.open = ease;
          applyInspectionCamera(ease);
          if (t === 1) {
            inspection.phase = 'open';
            onInspectionChange({ phase: 'open' });
          } else passageMoving = true;
        } else if (inspection.phase === 'closing') {
          inspection.progress = Math.min(1, inspection.progress + dt / 0.7);
          const t = inspection.progress;
          const ease = t * t * (3 - 2 * t);
          inspection.open = inspection.exitOpen * (1 - ease);
          applyInspectionCamera(ease, true);
          if (t === 1) finishInspection();
          else passageMoving = true;
        }
      }
      if (inspection) passageMoving = inspection.rig.update(moving() ? dt : 0, inspection.open) || passageMoving;
    } else if (moving()) {
      elapsed += dt;
      if (controlsTravel() && !portalApproach && voyageMotion
        && (sailingAxis || Math.abs(voyageMotion.snapshot().speed) > 0)) {
        transition = null;
        const state = voyageMotion.step(dt, sailingAxis);
        routePhase = state.phase;
        world.traveler.position.copy(world.route.point(routePhase));
        world.traveler.rotation.y = state.heading;
        const nearest = world.route.order[((Math.round(routePhase) % world.route.order.length) + world.route.order.length) % world.route.order.length];
        if (nearest !== selectedId) {
          selectedId = nearest;
          onVisit(nearest, { openReader: false, trigger: 'steering' });
        }
      } else if (transition) {
        transition.progress = Math.min(transition.progress + dt / transition.duration, 1);
        const t = transition.progress;
        const ease = t * t * (3 - 2 * t);
        routePhase = transition.from + (transition.to - transition.from) * ease;
        placeTraveler(routePhase, Math.sign(transition.to - transition.from) || 1);
        voyageMotion?.reset(routePhase, world.traveler.rotation.y);
        if (t === 1) transition = null;
      }
      world.animate(elapsed);
      const sailed = Math.hypot(lastTravelerPosition.x - world.traveler.position.x, lastTravelerPosition.z - world.traveler.position.z);
      const speed = dt ? Math.min(14, sailed / dt) : 0;
      const heading = world.traveler.rotation.y;
      const turn = Math.atan2(Math.sin(heading - lastHeading), Math.cos(heading - lastHeading));
      world.update?.(dt, elapsed, { moving: speed > 0.025, speed, turn: Math.max(-1, Math.min(1, dt ? turn / dt * 0.25 : 0)) });
      lastTravelerPosition.copy(world.traveler.position);
      lastHeading = heading;
      updateCamera(dt);
      voyageStatus();
    }
    explorationStatus(!inspection && moving() ? dt : 0);
    reflection?.render(scene, camera, width);
    renderer.render(scene, camera);
    updateLabels();
    invalidated = false;
    if (moving() && (!inspection || passageMoving)) {
      // A lifecycle callback can invalidate while this draw is executing;
      // keep one RAF chain rather than scheduling a second perpetual loop.
      if (!frame) frame = requestAnimationFrame(draw);
    } else if (!frame) previousTimestamp = 0;
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
    if (destroyed || contextLost) return;
    width = Math.round(mount.clientWidth);
    height = Math.round(mount.clientHeight);
    if (!width || !height || !world) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (inspection) {
      // Fullscreen and orientation changes reframe the apparatus, never the
      // exploration snapshot or the underlying boat route.
      applyInspectionCamera(inspection.phase === 'closing' ? inspection.progress * inspection.progress * (3 - 2 * inspection.progress) : inspection.open,
        inspection.phase === 'closing');
      invalidate();
      return;
    }
    if (restoredPose && width === restoredPose.width && height === restoredPose.height) {
      camera.position.copy(restoredPose.cameraPosition);
      cameraAim.copy(restoredPose.cameraAim);
      atlasPosition.copy(restoredPose.atlasPosition);
      atlasTarget.copy(restoredPose.atlasTarget);
      camera.lookAt(cameraAim);
      camera.updateMatrixWorld();
      restoredPose = null;
      invalidate();
      return;
    }
    restoredPose = null;
    // Hidden voyage labels still have to participate in the atlas fit.
    labels.forEach(label => {
      label.element.hidden = false;
      label.boxWidth = label.element.offsetWidth;
      label.boxHeight = label.element.offsetHeight;
    });
    const pose = atlasCameraPose({ world, width, height, fov: 36,
      labels: labels.map(({ id, boxWidth, boxHeight }) => ({ id, width: boxWidth, height: boxHeight })) });
    atlasPosition.copy(pose.position);
    atlasTarget.copy(pose.target);
    cameraAim.copy(atlasTarget);
    if (sceneView === 'voyage' && !portalApproach && !fieldEnabled && (camera.aspect < 0.36 || !voyageCamera)) {
      sceneView = 'atlas';
      clearSailingInput();
      onViewChange({ view: sceneView });
    }
    updateCamera(0, true);
    invalidate();
  }

  function select(id, direction = 0) {
    if (destroyed || inspection || !world?.stops[id]) return;
    if (selectedId === id && transition) return;
    selectedId = id;
    restoredPose = null;
    clearSailingInput();
    voyageMotion?.reset(routePhase, world.traveler.rotation.y);
    const target = targetPhase(routePhase, world.route.order.indexOf(id), world.route.order.length, direction);
    if (target === null) return;
    if (moving() && canDraw() && Math.abs(target - routePhase) > 0.00001) {
      transition = { from: routePhase, to: target, progress: 0, duration: Math.min(2.8, 1.15 * Math.max(1, Math.abs(target - routePhase))) };
    } else {
      routePhase = target; placeTraveler(routePhase, direction || 1); transition = null;
      voyageMotion?.reset(routePhase, world.traveler.rotation.y);
      lastTravelerPosition.copy(world.traveler.position); lastHeading = world.traveler.rotation.y;
      renderer.shadowMap.needsUpdate = true;
      updateCamera(0, true);
    }
    invalidate();
    voyageStatus();
    explorationStatus();
  }

  function navigate(direction = 1) {
    if (inspection || !world) return;
    const order = world.route.order.filter(id => labels.some(label => label.id === id));
    const next = cyclicDestination(order, selectedId, direction < 0 ? 'ArrowLeft' : 'ArrowRight');
    if (next) activate(next, false, direction, 'route');
  }

  function read() { if (!inspection) activate(selectedId, true, 0, 'keyboard'); }

  function interact(invoker = mount) {
    if (!playing || inspection || !canDraw() || fieldEnabled) return null;
    explorationStatus();
    const result = exploration.interact();
    if (!result.id) return result;
    clearSailingInput();
    transition = null;
    voyageMotion?.reset(routePhase, world.traveler.rotation.y);
    selectedId = result.id;
    explorationStatus();
    voyageStatus();
    invalidate();
    onVisit(result.id, { openReader: true, trigger: 'discovery', invoker });
    return result;
  }

  function setPlaying(enabled) {
    if (destroyed || contextLost || inspection || !world) return;
    playing = Boolean(enabled);
    clearSailingInput();
    voyageMotion?.reset(routePhase, world.traveler.rotation.y);
    transition = null;
    if (playing) {
      setField(false, fieldSpacing);
      setView(worldTheme === 'sea' ? 'voyage' : 'atlas');
    }
    explorationStatus();
    voyageStatus();
    invalidate();
  }

  function applySailingAxis(axis = 0) {
    if (destroyed || contextLost || inspection || !controlsTravel()) return;
    if (!canDraw()) { clearSailingInput(); voyageStatus(); return; }
    const next = Math.sign(Number.isFinite(axis) ? axis : 0);
    if (!next) { sailingAxis = 0; voyageStatus(); return; }
    if (!moving()) { navigate(next); return; }
    restoredPose = null;
    sailingAxis = next;
    const leavingPortal = portalApproach;
    portalApproach = false;
    transition = null;
    if (leavingPortal) updateCamera(0, true);
    voyageStatus(); invalidate();
  }

  function setSailingAxis(axis = 0) {
    if (destroyed || contextLost || inspection || !controlsTravel()) return;
    externalSailingAxis = Math.sign(Number.isFinite(axis) ? axis : 0);
    applySailingAxis(externalSailingAxis + heldKeyAxis());
  }

  function activate(id, openReader = false, direction = 0, trigger = 'route', invoker = document.activeElement) {
    if (inspection) return;
    const reading = openReader || (playing && trigger === 'pointer');
    if (playing && reading) {
      // Reading remote work does not move or chart the player. Stop drift so
      // an ordinary reading dialog cannot change collections underneath them.
      if (!world?.stops[id]) return;
      selectedId = id;
      clearSailingInput();
      transition = null;
      voyageMotion?.reset(routePhase, world.traveler.rotation.y);
      voyageStatus();
      explorationStatus();
    }
    // Reading the selected work must preserve the current voyage for Return.
    else if (!reading || id !== selectedId) select(id, direction);
    onVisit(id, { openReader: reading, trigger, invoker });
  }

  function announce() {
    onStatus({ ready: true, message: voyageCameraIssue
      ? `Atlas view remains available. ${voyageCameraIssue}`
      : `Select a landmark to read. Sailing view uses held arrows or A / D; Atlas arrows visit neighboring stops. Enter reads; Escape releases the helm.${world.setField ? ' F reveals the field; V changes the view.' : ''}` });
  }

  function setTheme(id) {
    if (destroyed || contextLost) return;
    const carriedInspection = inspection && inspection.phase !== 'closing'
      ? { active: true, imageUrl: inspection.imageUrl, stage: inspection.stage, collection: inspection.collection }
      : null;
    if (inspection) finishInspection(!carriedInspection);
    suspend();
    clearSailingInput();
    portalApproach = false;
    cancelFieldDrag();
    transition = null;
    sceneView = 'atlas';
    fieldEnabled = false;
    fieldSpacing = 0.45;
    elapsed = 0;
    labels.forEach(({ element }) => element.remove());
    labels = [];
    reflection?.dispose(); reflection = null;
    voyageCamera?.dispose(); voyageCamera = null;
    beacons?.dispose(); beacons = null;
    voyageCameraIssue = '';
    if (world) { world.dispose?.(); world.kit.dispose(); scene.remove(worldGroup); }
    const theme = getTheme(id);
    worldTheme = theme.id;
    worldGroup = new THREE.Group();
    world = buildRealmScene(theme.id, worldGroup);
    voyageMotion = createVoyageMotion({ route: world.route });
    approachPoints = destinations.filter(stop => world.route.order.includes(stop.id)).map(stop => ({ id: stop.id, position: world.route.point(world.route.order.indexOf(stop.id)).clone() }));
    if (approachPoints.length >= 3 && approachPoints.length <= 8) {
      beacons = createExplorationBeacons({ anchors: approachPoints.map(({ id, position }) => ({ id, position: position.clone().add(new THREE.Vector3(0, 0.04, 0)) })), themeId: theme.id });
      scene.add(beacons.group);
    }
    if (theme.id === 'sea') {
      try { voyageCamera = createVoyageCamera({ world, group: worldGroup }); }
      catch (error) { if (!(error instanceof RangeError)) throw error; voyageCameraIssue = error.message; }
    }
    scene.add(worldGroup);
    // Every setting owns an original panorama and a reusable PMREM. Theme
    // switching reuses the small cache; final teardown releases both resources.
    if (!atmospheres.has(theme.id)) {
      const atmosphere = createRealmAtmosphere(theme.id);
      const generator = new THREE.PMREMGenerator(renderer);
      try {
        atmospheres.set(theme.id, { atmosphere, environment: generator.fromEquirectangular(atmosphere.texture) });
      } catch (error) {
        atmosphere.dispose();
        throw error;
      } finally { generator.dispose(); }
    }
    const { atmosphere, environment } = atmospheres.get(theme.id);
    scene.background = atmosphere.texture;
    scene.backgroundIntensity = atmosphere.backgroundIntensity;
    scene.environment = environment.texture;
    scene.environmentIntensity = atmosphere.environmentIntensity;
    scene.fog = new THREE.Fog(atmosphere.fog.color, atmosphere.fog.near, atmosphere.fog.far);
    const { hemisphere: ambient, key, fill } = atmosphere.lighting;
    themeExposure = atmosphere.exposure;
    renderer.toneMappingExposure = themeExposure * exposureMultiplier;
    hemisphere.color.set(ambient[0]); hemisphere.groundColor.set(ambient[1]); hemisphere.intensity = ambient[2];
    keyLight.color.set(key.color); keyLight.position.set(...key.position);
    themeKeyIntensity = key.intensity;
    keyLight.intensity = themeKeyIntensity * keyLightMultiplier;
    // The sky-aligned moon is farther away than the old daylight lamp. Keep
    // the authored landmarks inside its actual shadow-camera depth range.
    keyLight.shadow.camera.far = 100; keyLight.shadow.camera.updateProjectionMatrix();
    fillLight.color.set(fill.color); fillLight.position.set(...fill.position); fillLight.intensity = fill.intensity;
    if (theme.id === 'sea') {
      worldGroup.traverse(object => {
        if (!object.isMesh || !object.material.uniforms?.uReflection) return;
        object.material.uniforms.uKeyDirection.value.copy(keyLight.position).normalize();
        object.material.uniforms.uKeyColor.value.copy(keyLight.color);
        object.material.uniforms.uHazeColor.value.copy(scene.fog.color);
        reflection = seaReflection(object, renderer);
      });
    }
    destinations.filter((stop) => world.stops[stop.id]).forEach((stop) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'world-label';
      element.textContent = stop.label;
      element.dataset.destination = stop.id;
      element.setAttribute('aria-label', `Visit ${stop.label}`);
      element.addEventListener('click', event => {
        // Native keyboard activation reads; a pointer visit lets the host
        // choose whether to read immediately or continue in the map.
        const openReader = event.detail === 0;
        // Focus the map before dispatch, so a configured dialog can own focus
        // without this handler stealing it back after showModal().
        if (!openReader) mount.focus({ preventScroll: true });
        activate(stop.id, openReader, 0, openReader ? 'keyboard' : 'pointer', element);
      });
      mount.append(element);
      labels.push({ element, id: stop.id });
    });
    if (!world.stops[selectedId]) selectedId = destinations[0]?.id || 'work';
    routePhase = world.route.order.indexOf(selectedId);
    placeTraveler(routePhase);
    voyageMotion?.reset(routePhase, world.traveler.rotation.y);
    world.animate(0);
    world.setField?.(fieldEnabled, fieldSpacing);
    lastTravelerPosition.copy(world.traveler.position);
    lastHeading = world.traveler.rotation.y;
    // The first reflection of a new theme also needs that theme's shadow map,
    // including on a coarse-pointer or manually paused initial render.
    renderer.shadowMap.needsUpdate = true;
    resize();
    announce();
    voyageStatus();
    explorationStatus();
    if (carriedInspection) setInspection(carriedInspection);
  }

  function setAppearance({ exposure = exposureMultiplier, keyLightMultiplier: key = keyLightMultiplier } = {}) {
    if (destroyed || contextLost) return;
    if (!Number.isFinite(exposure) || exposure < 0.5 || exposure > 1.6 || !Number.isFinite(key) || key < 0.2 || key > 1.6) throw new RangeError('World appearance is outside its supported range.');
    exposureMultiplier = exposure;
    keyLightMultiplier = key;
    renderer.toneMappingExposure = themeExposure * exposureMultiplier;
    keyLight.intensity = themeKeyIntensity * keyLightMultiplier;
    renderer.shadowMap.needsUpdate = true;
    // One requested frame refreshes the sea reflection too, even while paused.
    invalidate();
  }

  function setMotion(enabled) {
    if (destroyed) return;
    motionRequested = Boolean(enabled);
    if (!motionRequested) clearSailingInput();
    suspend();
    if (!moving()) {
      // Static interaction must not leave the host locked in a half-closed
      // fullscreen passage. Opening resolves to its deliberate reading pose.
      if (inspection?.phase === 'closing') finishInspection();
      else settleInspectionOpening();
    }
    // Pause freezes ambient geometry and an in-flight traveler at their current pose.
    voyageStatus();
    explorationStatus();
    invalidate();
  }

  function setField(enabled, spacing = fieldSpacing) {
    if (destroyed || contextLost || inspection || !world?.setField) return;
    fieldEnabled = !playing && Boolean(enabled);
    restoredPose = null;
    clearSailingInput();
    voyageMotion?.reset(routePhase, world.traveler.rotation.y);
    portalApproach = false;
    if (!fieldEnabled) cancelFieldDrag();
    if (Number.isFinite(spacing)) fieldSpacing = Math.max(0, Math.min(1, spacing));
    world.setField(fieldEnabled, fieldSpacing);
    renderer.domElement.style.touchAction = fieldEnabled ? 'pan-y' : 'auto';
    renderer.domElement.style.cursor = fieldEnabled ? 'ew-resize' : 'default';
    onFieldChange({ enabled: fieldEnabled, spacing: fieldSpacing });
    // Mode changes cut to their checked pose; sailing keeps its smooth follow.
    updateCamera(0, true);
    invalidate();
  }

  function setView(view, { portal = false } = {}) {
    if (destroyed || contextLost || inspection || !world) return;
    sceneView = view === 'voyage' ? 'voyage' : 'atlas';
    restoredPose = null;
    if (sceneView === 'voyage' && !portal && (camera.aspect < 0.36 || !voyageCamera)) sceneView = 'atlas';
    clearSailingInput();
    voyageMotion?.reset(routePhase, world.traveler.rotation.y);
    portalApproach = sceneView === 'voyage' && Boolean(portal);
    onViewChange({ view: sceneView });
    voyageStatus();
    explorationStatus();
    updateCamera(0, true);
    invalidate();
  }

  function handleKey(event) {
    if (destroyed || contextLost || inspection || !canDraw() || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const focusedLabel = event.target.closest?.('.world-label');
    const inPlayFrame = playing && mount.parentElement.contains(document.activeElement)
      && !event.target.closest?.('input, select, textarea, [contenteditable="true"]');
    if (!inPlayFrame && (!mount.contains(document.activeElement) || (event.target !== mount && !focusedLabel))) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      clearSailingInput();
      mount.blur();
      onExit();
      return;
    }
    if (event.key === 'Enter' && event.target === mount) {
      event.preventDefault();
      if (!event.repeat) activate(selectedId, true, 0, 'keyboard');
      return;
    }
    if (playing && (['e', 'E'].includes(event.key) || event.key === ' ' && event.target === mount)) {
      event.preventDefault();
      if (!event.repeat) interact(event.target);
      return;
    }
    const sailKey = ['ArrowRight', 'ArrowDown', 'd', 'D'].includes(event.key) ? 1
      : ['ArrowLeft', 'ArrowUp', 'a', 'A'].includes(event.key) ? -1 : 0;
    if (controlsTravel() && sailKey) {
      event.preventDefault();
      if (!moving()) { if (!event.repeat) navigate(sailKey); return; }
      const key = event.key.toLowerCase();
      if (event.repeat && !sailingKeys.has(key)) return;
      sailingKeys.add(key);
      applySailingAxis(externalSailingAxis + heldKeyAxis());
      return;
    }
    const shortcut = event.key.toLowerCase();
    if (world.setField && (shortcut === 'f' || shortcut === 'v')) {
      event.preventDefault();
      // Field mode has its own controls outside the play session. Keeping it
      // off here prevents an invisible shortcut stranding the player.
      if (playing && shortcut === 'f') return;
      if (!event.repeat) {
        if (shortcut === 'f') setField(!fieldEnabled);
        else setView(sceneView === 'atlas' ? 'voyage' : 'atlas');
      }
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const now = performance.now();
    if (event.repeat && now - lastArrowAt < 180) return;
    lastArrowAt = now;
    const originId = focusedLabel?.dataset.destination || selectedId;
    const order = world.route.order.filter(id => labels.some(label => label.id === id));
    const next = cyclicDestination(order, originId, event.key);
    if (next) {
      activate(next, false, cycleDirection(event.key));
      if (focusedLabel) {
        const nextLabel = labels.find(label => label.id === next)?.element;
        (nextLabel && !nextLabel.hidden ? nextLabel : mount).focus({ preventScroll: true });
      }
    }
  }

  function handleKeyRelease(event) {
    if (!sailingKeys.delete(event.key.toLowerCase())) return;
    applySailingAxis(externalSailingAxis + heldKeyAxis());
  }

  function handleBackgroundPointer(event) {
    if (destroyed || contextLost || inspection || event.target !== renderer.domElement || event.button !== 0 || event.isPrimary === false) return;
    cancelFieldDrag();
    mount.focus({ preventScroll: true });
    if (!playing && hitsInstrument(event)) {
      setField(!fieldEnabled);
      event.preventDefault();
    } else {
      const hit = hitsLandmark(event);
      if (hit) {
        // A tap opens the same semantic destination as its HTML button. Wait
        // for release so scrolling or dragging over a landmark does not read it.
        landmarkPress = { id: event.pointerId, destination: hit.id, x: event.clientX, y: event.clientY, moved: false };
        renderer.domElement.setPointerCapture(event.pointerId);
        return;
      }
    }
    if (fieldEnabled) {
      fieldDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, spacing: fieldSpacing };
      renderer.domElement.setPointerCapture(event.pointerId);
    }
  }

  function rayFromPointer(event) {
    const rect = mount.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    pointerPosition.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    camera.updateWorldMatrix(true, false);
    instrumentRay.setFromCamera(pointerPosition, camera);
    return true;
  }

  function hitsLandmark(event) {
    if (!world?.stops || !rayFromPointer(event)) return null;
    return pickLandmark(instrumentRay, world.stops, labels.map(label => label.id));
  }

  function hitsInstrument(event) {
    if (!world?.instrumentHit || !rayFromPointer(event)) return false;
    world.instrumentHit.updateWorldMatrix(true, true);
    return instrumentRay.intersectObject(world.instrumentHit, true).some(hit => {
      // Raycaster also intersects hidden meshes; a dormant projection is not
      // an invisible button over otherwise empty water.
      for (let object = hit.object; object; object = object.parent) if (!object.visible) return false;
      return true;
    });
  }

  function handleFieldPointerMove(event) {
    if (destroyed || contextLost || inspection || event.target !== renderer.domElement) return;
    if (landmarkPress && event.pointerId === landmarkPress.id) {
      if (Math.hypot(event.clientX - landmarkPress.x, event.clientY - landmarkPress.y) > 6) landmarkPress.moved = true;
      return;
    }
    if (fieldDrag && event.pointerId === fieldDrag.id && fieldEnabled) {
      const dx = event.clientX - fieldDrag.x;
      if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(event.clientY - fieldDrag.y)) {
        event.preventDefault();
        setField(true, fieldDrag.spacing + dx / width * 1.25);
      }
    } else if (event.pointerType === 'mouse') {
      renderer.domElement.style.cursor = !playing && hitsInstrument(event) || hitsLandmark(event) ? 'pointer' : fieldEnabled ? 'ew-resize' : 'default';
    }
  }

  function handleCanvasPointerUp(event) {
    const press = landmarkPress;
    cancelFieldDrag();
    if (destroyed || contextLost || inspection || !press || press.id !== event.pointerId || press.moved
      || Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) return;
    const hit = hitsLandmark(event);
    if (!hit || hit.id !== press.destination) return;
    event.preventDefault();
    const label = labels.find(({ id, element }) => id === hit.id && !element.hidden)?.element;
    activate(hit.id, true, 0, 'pointer', label || mount);
  }

  function cancelFieldDrag() {
    const ids = new Set([fieldDrag?.id, landmarkPress?.id].filter(id => id !== undefined));
    fieldDrag = null;
    landmarkPress = null;
    for (const id of ids) if (renderer.domElement.hasPointerCapture(id)) renderer.domElement.releasePointerCapture(id);
  }

  function handleVisibility() {
    if (document.hidden) { suspend(); cancelFieldDrag(); clearSailingInput(); voyageStatus(); }
    else if (invalidated || moving()) invalidate();
  }
  function handleReducedMotion() {
    suspend();
    clearSailingInput(); voyageStatus();
    if (!moving()) {
      if (inspection?.phase === 'closing') finishInspection();
      else settleInspectionOpening();
    }
    invalidate();
  }
  function handleContextLost(event) {
    event.preventDefault();
    contextLost = true;
    const passagePhase = inspection?.phase;
    if (inspection) finishInspection(false);
    cancelFieldDrag();
    clearSailingInput(); voyageStatus();
    suspend();
    renderer.domElement.hidden = true;
    renderer.domElement.style.display = 'none';
    labels.forEach(({ element }) => { element.hidden = true; });
    // Loss of graphics does not discard a readable paper. An already-closing
    // passage can return normally; an open reader switches to its HTML plate.
    if (passagePhase) onInspectionChange({ phase: passagePhase === 'closing' ? 'closed' : 'unavailable' });
    onStatus({ ready: false, message: 'The 3D view stopped because its graphics context was lost. The reading view still contains every destination. Reload to retry the world.' });
  }
  function handleWindowBlur() { previousTimestamp = 0; cancelFieldDrag(); clearSailingInput(); voyageStatus(); }
  document.addEventListener('keydown', handleKey);
  mount.addEventListener('pointerdown', handleBackgroundPointer);
  mount.addEventListener('pointermove', handleFieldPointerMove);
  renderer.domElement.addEventListener('pointerup', handleCanvasPointerUp);
  renderer.domElement.addEventListener('pointercancel', cancelFieldDrag);
  renderer.domElement.addEventListener('lostpointercapture', cancelFieldDrag);
  mount.addEventListener('blur', handleWindowBlur);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('keyup', handleKeyRelease);
  document.addEventListener('visibilitychange', handleVisibility);
  reducedMotion.addEventListener('change', handleReducedMotion);
  renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (!inView) { suspend(); cancelFieldDrag(); clearSailingInput(); voyageStatus(); }
    else if (invalidated || moving()) invalidate();
  }, { threshold: 0.01 });
  intersectionObserver.observe(mount);
  setTheme(themeId);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (inspection) finishInspection(false);
    cancelFieldDrag();
    clearSailingInput();
    suspend();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('keydown', handleKey);
    mount.removeEventListener('pointerdown', handleBackgroundPointer);
    mount.removeEventListener('pointermove', handleFieldPointerMove);
    renderer.domElement.removeEventListener('pointerup', handleCanvasPointerUp);
    renderer.domElement.removeEventListener('pointercancel', cancelFieldDrag);
    renderer.domElement.removeEventListener('lostpointercapture', cancelFieldDrag);
    mount.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('keyup', handleKeyRelease);
    document.removeEventListener('visibilitychange', handleVisibility);
    reducedMotion.removeEventListener('change', handleReducedMotion);
    renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
    labels.forEach(({ element }) => element.remove());
    world?.dispose?.();
    world?.kit.dispose();
    voyageCamera?.dispose();
    beacons?.dispose();
    reflection?.dispose();
    atmospheres.forEach(({ atmosphere, environment }) => { environment.dispose(); atmosphere.dispose(); });
    atmospheres.clear();
    keyLight.shadow.map?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    scene.clear();
  }

  return { select, navigate, read, interact, setPlaying, setSailingAxis, setTheme, setAppearance, setMotion, setField, setView, setInspection, setInspectionStage, destroy };
}
