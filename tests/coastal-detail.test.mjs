import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCoastalDetail } from '../src/coastal-detail.js';
import { buildRealmScene } from '../src/world.js';

function fixture() {
  const host = new THREE.Group();
  const world = buildRealmScene('sea', host);
  const args = { stops: world.stops, route: world.route, bearing: world.approach.bearing };
  const detail = createCoastalDetail(args);
  host.add(detail.group); host.updateMatrixWorld(true);
  return { host, world, args, detail, dispose() { detail.dispose(); world.dispose(); world.kit.dispose(); } };
}

function parts(group) {
  const result = [];
  group.updateWorldMatrix(true, true);
  group.traverse(object => {
    if (!object.isMesh) return;
    for (let i = 0; i < (object.isInstancedMesh ? object.count : 1); i++) {
      const matrix = object.matrixWorld.clone();
      if (object.isInstancedMesh) {
        const instance = new THREE.Matrix4(); object.getMatrixAt(i, instance); matrix.multiply(instance);
      }
      const position = object.geometry.attributes.position;
      const vertices = Array.from({ length: position.count }, (_, index) =>
        new THREE.Vector3().fromBufferAttribute(position, index).applyMatrix4(matrix));
      result.push({ object, vertices });
    }
  });
  return result;
}

const cross = (a, b, c) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
function hullXZ(vertices) {
  const sorted = vertices.map(({ x, z }) => ({ x, z })).sort((a, b) => a.x - b.x || a.z - b.z);
  const unique = sorted.filter((v, i) => !i || v.x !== sorted[i - 1].x || v.z !== sorted[i - 1].z);
  const chain = points => {
    const value = [];
    for (const p of points) {
      while (value.length > 1 && cross(value.at(-2), value.at(-1), p) <= 0) value.pop();
      value.push(p);
    }
    value.pop(); return value;
  };
  return [...chain(unique), ...chain([...unique].reverse())];
}

function distanceToFootprint(p, polygon) {
  let minimum = Infinity; let inside = true;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]; const b = polygon[(i + 1) % polygon.length];
    inside &&= cross(a, b, p) >= -1e-10;
    const dx = b.x - a.x; const dz = b.z - a.z;
    const along = THREE.MathUtils.clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz), 0, 1);
    minimum = Math.min(minimum, Math.hypot(p.x - a.x - along * dx, p.z - a.z - along * dz));
  }
  return inside ? 0 : minimum;
}

test('coastal dressing uses finite native geometry within effective instance budgets', t => {
  const value = fixture();
  try {
    const geometryParts = parts(value.detail.group);
    const meshes = new Set(geometryParts.map(p => p.object));
    const vertices = geometryParts.reduce((sum, p) => sum + p.vertices.length, 0);
    assert.ok(meshes.size <= 70 && vertices <= 20000, 'budget includes every rendered instance, not only its shared source mesh');
    assert.ok(geometryParts.every(p => p.vertices.every(v => v.toArray().every(Number.isFinite))));
    for (const mesh of meshes) {
      for (const attribute of Object.values(mesh.geometry.attributes)) assert.ok(attribute.array.every(Number.isFinite));
      if (mesh.isInstancedMesh) assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));
    }
    const bounds = new THREE.Box3().setFromObject(value.detail.group);
    assert.ok(bounds.min.y < -0.3, 'ledges and posts penetrate below mean sea level');
    assert.ok(bounds.max.y < 3, 'dressing does not replace the existing landmark silhouettes');
    const lights = []; value.detail.group.traverse(o => { if (o.isPointLight) lights.push(o); });
    assert.equal(lights.length, 2);
    assert.ok(lights.every(light => !light.castShadow && light.distance <= 3));
    assert.equal(value.detail.group.getObjectByName('layered-cypress-foliage').geometry.type, 'ConeGeometry');
    const detailMeshes = new Set(meshes);
    for (const stop of Object.values(value.world.stops)) for (const root of stop.hitObjects) {
      root.traverse(object => assert.ok(!detailMeshes.has(object), 'scenery must not enlarge semantic landmark hit targets'));
    }
    t.diagnostic(`meshes=${meshes.size}, effective vertices=${vertices}, physical parts=${geometryParts.length}, bounds min=${bounds.min.toArray()} max=${bounds.max.toArray()}`);
  } finally { value.dispose(); }
});

test('every actual instanced footprint clears the closed route and whole vessel radius', t => {
  const value = fixture();
  try {
    const polygons = parts(value.detail.group).map(part => hullXZ(part.vertices));
    let vesselRadius = 0;
    for (const turn of [-1, 0, 1]) {
      for (let i = 0; i < 80; i++) value.world.update(0.1, i * 0.1, { turn, speed: 14, moving: false });
      for (const time of [-Math.PI / 2 / 1.2, 0, Math.PI / 2 / 1.2]) {
        value.world.animate(time);
        const inverse = value.world.traveler.matrixWorld.clone().invert();
        value.world.traveler.updateWorldMatrix(true, true);
        inverse.copy(value.world.traveler.matrixWorld).invert();
        for (const part of parts(value.world.traveler)) for (const point of part.vertices) {
          point.applyMatrix4(inverse); vesselRadius = Math.max(vesselRadius, Math.hypot(point.x, point.z));
        }
      }
    }
    let minimum = Infinity;
    for (let sample = 0; sample < 2048; sample++) {
      const center = value.world.route.point(sample / 2048 * value.world.route.order.length);
      for (const polygon of polygons) minimum = Math.min(minimum, distanceToFootprint(center, polygon));
    }
    assert.ok(minimum - vesselRadius > 0.35, 'native scenery leaves room for the whole banked/pitched craft at any heading');
    assert.ok(value.detail.group.userData.minimumRouteCenterClearance > 1.05);
    t.diagnostic(`2048 closed-route samples: closest physical footprint=${minimum.toFixed(6)}, conservative vessel radius=${vesselRadius.toFixed(6)}, remaining clearance=${(minimum - vesselRadius).toFixed(6)}`);
    // Finite route sampling and analytic geometry; no free-sailing collision
    // simulation, water shader rendering or device-performance claim.
  } finally { value.dispose(); }
});

test('shore pools expose real water over depressed rock beds and update without cumulative drift', () => {
  const value = fixture();
  try {
    const waters = []; value.detail.group.traverse(object => { if (object.name === 'still-shore-pool-water') waters.push(object); });
    assert.equal(waters.length, 3);
    const ray = new THREE.Raycaster();
    for (const water of waters) {
      const center = water.getWorldPosition(new THREE.Vector3());
      ray.set(new THREE.Vector3(center.x, 5, center.z), new THREE.Vector3(0, -1, 0));
      const hits = ray.intersectObject(value.host, true);
      assert.equal(hits[0]?.object.name, 'still-shore-pool-water', 'water is above its own ledge and the existing island');
      const bed = hits.find(hit => hit.object.name === 'weathered-limestone-ledge');
      assert.ok(bed && center.y - bed.point.y > 0.03 && center.y - bed.point.y < 0.15);
    }
    const geometryArrays = parts(value.detail.group).map(p => p.object.geometry.attributes.position.array.slice());
    value.detail.update(100);
    const first = waters.map(water => water.position.y);
    value.detail.update(100);
    assert.deepEqual(waters.map(water => water.position.y), first, 'paused time produces an identical shoreline pose');
    value.detail.update(NaN);
    assert.ok(waters.every(water => Number.isFinite(water.position.y)));
    parts(value.detail.group).forEach((part, index) => assert.deepEqual(part.object.geometry.attributes.position.array, geometryArrays[index]));
  } finally { value.dispose(); }
});

test('owned instance buffers, geometries, materials and procedural maps dispose once', t => {
  const value = fixture();
  const resources = new Map(); const maps = new Set();
  const watch = resource => {
    if (!resource || resources.has(resource)) return;
    resources.set(resource, 0);
    resource.addEventListener('dispose', () => resources.set(resource, resources.get(resource) + 1));
  };
  value.detail.group.traverse(object => {
    if (!object.isMesh) return;
    if (object.isInstancedMesh) watch(object);
    watch(object.geometry); watch(object.material);
    for (const item of Object.values(object.material)) if (item?.isTexture) { maps.add(item); watch(item); }
  });
  try {
    assert.equal(maps.size, 6);
    assert.ok([...maps].every(map => map.isDataTexture && map.image.width === 128 && map.image.height === 128));
    const peer = new THREE.Group(); value.host.add(peer);
    value.detail.dispose(); value.detail.dispose(); value.detail.update(4);
    assert.ok([...resources.values()].every(count => count === 1));
    assert.equal(value.detail.group.parent, null); assert.equal(value.detail.group.children.length, 0);
    assert.ok(value.host.children.includes(peer) && value.host.children.includes(value.world.traveler));
    t.diagnostic(`${resources.size} owned resources including six original map textures disposed exactly once`);
  } finally { value.dispose(); }
});

test('invalid or corridor-crossing inputs are rejected', () => {
  for (const args of [{}, { bearing: NaN }, { stops: {}, route: { order: ['a', 'b', 'c'], point: () => new THREE.Vector3() } }]) {
    assert.throws(() => createCoastalDetail(args), TypeError);
  }
  const value = fixture();
  try {
    assert.throws(() => createCoastalDetail({ ...value.args, bearing: Infinity }), TypeError);
    const badRoute = { order: value.world.route.order, point: phase => value.world.route.point(phase).multiplyScalar(1.7) };
    assert.throws(() => createCoastalDetail({ ...value.args, route: badRoute }), RangeError);
  } finally { value.dispose(); }
});
