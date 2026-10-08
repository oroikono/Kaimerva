import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { atlasCameraPose, buildRealmScene, pickLandmark, portalCameraPose } from '../src/world.js';

// Native scene geometry and perspective projection only. Label dimensions are
// conservative analytic inputs, not DOM measurements or a rendered screenshot.
const VIEWPORTS = [[1280, 660], [800, 430], [390, 430], [320, 430]];
const point = new THREE.Vector3();

function scene(id = 'sea') {
  const group = new THREE.Group();
  const world = buildRealmScene(id, group);
  group.updateMatrixWorld(true);
  return { group, world, dispose() { world.dispose(); world.kit.dispose(); } };
}

function meshVertices(group, localTo = null) {
  group.updateWorldMatrix(true, true);
  const inverse = localTo?.matrixWorld.clone().invert();
  const vertices = [];
  group.traverse(object => {
    if (!object.isMesh) return;
    const position = object.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld);
      if (inverse) point.applyMatrix4(inverse);
      vertices.push(point.clone());
    }
  });
  return vertices;
}

function cameraFor(pose, width, height) {
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 130);
  camera.position.copy(pose.position);
  camera.lookAt(pose.target);
  camera.updateMatrixWorld();
  return camera;
}

function screenPoint(vertex, camera, width, height) {
  const projected = vertex.clone().project(camera);
  return { x: (projected.x + 1) * width / 2, y: (1 - projected.y) * height / 2, z: projected.z };
}

function checkScreenBounds(vertices, camera, width, height, padding = 0) {
  const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  for (const vertex of vertices) {
    const { x, y, z } = screenPoint(vertex, camera, width, height);
    assert.ok(z >= -1 && z <= 1, 'gateway vertex lies between the actual near and far planes');
    assert.ok(x >= padding && x <= width - padding, `gateway clipped horizontally at ${width}x${height}: ${x}`);
    assert.ok(y >= 76 && y <= height - 88, `gateway enters reserved controls at ${width}x${height}: ${y}`);
    bounds.minX = Math.min(bounds.minX, x); bounds.maxX = Math.max(bounds.maxX, x);
    bounds.minY = Math.min(bounds.minY, y); bounds.maxY = Math.max(bounds.maxY, y);
  }
  return bounds;
}

const cross = (a, b, c) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);

function hullXZ(vertices) {
  const sorted = vertices.map(({ x, z }) => ({ x, z })).sort((a, b) => a.x - b.x || a.z - b.z);
  const unique = sorted.filter((p, i) => !i || p.x !== sorted[i - 1].x || p.z !== sorted[i - 1].z);
  const chain = values => {
    const result = [];
    for (const p of values) {
      while (result.length > 1 && cross(result.at(-2), result.at(-1), p) <= 0) result.pop();
      result.push(p);
    }
    result.pop();
    return result;
  };
  return [...chain(unique), ...chain([...unique].reverse())];
}

function pointSegmentDistance(p, a, b) {
  const dx = b.x - a.x; const dz = b.z - a.z;
  const t = THREE.MathUtils.clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz), 0, 1);
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}

function polygonsOverlap(a, b) {
  // A separating axis test on independently derived convex mesh footprints.
  for (const polygon of [a, b]) for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i]; const q = polygon[(i + 1) % polygon.length];
    const normalX = p.z - q.z; const normalZ = q.x - p.x;
    const project = values => values.map(v => v.x * normalX + v.z * normalZ);
    const pa = project(a); const pb = project(b);
    if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
  }
  return true;
}

function polygonDistance(a, b) {
  if (polygonsOverlap(a, b)) return 0;
  let minimum = Infinity;
  for (const [vertices, edges] of [[a, b], [b, a]]) for (const p of vertices) {
    for (let i = 0; i < edges.length; i++) minimum = Math.min(minimum,
      pointSegmentDistance(p, edges[i], edges[(i + 1) % edges.length]));
  }
  return minimum;
}

test('actual sea gateway meshes fit lower approach and atlas at desktop and phone sizes', t => {
  const realm = scene();
  try {
    const gateway = realm.group.getObjectByName('coastal-realm-gateway');
    assert.ok(gateway);
    const vertices = meshVertices(gateway);
    assert.ok(vertices.length > 7000 && vertices.length < 12000);
    const gateBounds = new THREE.Box3().setFromObject(gateway);
    t.diagnostic(`gateway vertices=${vertices.length}; world bounds min=${gateBounds.min.toArray()} max=${gateBounds.max.toArray()}`);
    for (const [width, height] of VIEWPORTS) {
      const approach = portalCameraPose({ ...realm.world.approach, aspect: width / height });
      const lowerBounds = checkScreenBounds(vertices, cameraFor(approach, width, height), width, height);
      const labels = Object.keys(realm.world.stops).map(id => ({ id, width: 124, height: 38 }));
      const atlas = atlasCameraPose({ world: realm.world, width, height, labels });
      assert.equal(atlas.fits, true, 'bounded atlas fitter must find a fitting pose');
      const atlasCamera = cameraFor(atlas, width, height);
      const atlasBounds = checkScreenBounds(vertices, atlasCamera, width, height, Math.min(24, width * 0.06));
      for (const label of labels) {
        const p = screenPoint(realm.world.stops[label.id].label, atlasCamera, width, height);
        assert.ok(p.x - label.width / 2 >= Math.min(24, width * 0.06));
        assert.ok(p.x + label.width / 2 <= width - Math.min(24, width * 0.06));
        assert.ok(p.y - label.height / 2 >= 76 && p.y + label.height / 2 <= height - 88);
      }
      t.diagnostic(`${width}x${height}: approach Y ${lowerBounds.minY.toFixed(3)}..${lowerBounds.maxY.toFixed(3)}; atlas Y ${atlasBounds.minY.toFixed(3)}..${atlasBounds.maxY.toFixed(3)}`);
    }
  } finally { realm.dispose(); }
});

test('the complete sailing craft clears the actual gateway foundation throughout its closed route', t => {
  const realm = scene();
  try {
    const { world } = realm;
    const gateway = realm.group.getObjectByName('coastal-realm-gateway');
    const portalFootprint = hullXZ(meshVertices(gateway));
    assert.ok(gateway.getObjectByName('wet-rock-lower-step'), 'the footprint includes the widest real foundation');
    const vesselStates = [];
    // Include the real sail, jib, sailor and mast in both maximum banks and
    // maximum idle pitch, rather than subtracting a guessed boat radius.
    for (const turn of [-1, 0, 1]) {
      for (let i = 0; i < 80; i++) world.update(0.1, i * 0.1, { turn, speed: 14, moving: false });
      for (const time of [-Math.PI / 2 / 1.2, 0, Math.PI / 2 / 1.2]) {
        world.animate(time);
        vesselStates.push(...hullXZ(meshVertices(world.traveler, world.traveler)));
      }
    }
    const vesselFootprint = hullXZ(vesselStates);
    assert.ok(vesselFootprint.length >= 4);
    const period = world.route.order.length;
    assert.ok(world.route.point(0).distanceTo(world.route.point(period)) < 1e-10);
    assert.ok(world.route.point(-0.7).distanceTo(world.route.point(period - 0.7)) < 1e-10);
    let minimum = Infinity; let maximumRouteStep = 0;
    const samples = 4096;
    for (let sample = 0; sample < samples; sample++) {
      const phase = sample / samples * period;
      const center = world.route.point(phase);
      maximumRouteStep = Math.max(maximumRouteStep, center.distanceTo(world.route.point(phase + period / samples)));
      for (const direction of [-1, 1]) {
        const tangent = world.route.point(phase + direction * 0.001).sub(center);
        const yaw = Math.atan2(tangent.x, tangent.z);
        const cos = Math.cos(yaw); const sin = Math.sin(yaw);
        const posed = vesselFootprint.map(p => ({ x: center.x + p.x * cos + p.z * sin,
          z: center.z - p.x * sin + p.z * cos }));
        minimum = Math.min(minimum, polygonDistance(portalFootprint, posed));
      }
    }
    assert.ok(minimum > 0.2, `whole-vessel footprint reaches the gateway: clearance=${minimum}`);
    assert.ok(maximumRouteStep < 0.015, 'route sampling stays dense around the full closed curve');
    t.diagnostic(`4096 phases x 2 headings; conservative whole-vessel clearance=${minimum.toFixed(6)} world units; largest route step=${maximumRouteStep.toFixed(6)}; footprint vertices portal=${portalFootprint.length}, vessel=${vesselFootprint.length}`);
    // This bounded swept-footprint check is not continuous free-sailing physics
    // or a GPU water/wake test. Its union over vessel poses is conservative.
  } finally { realm.dispose(); }
});

test('Journey picks actual transformed gateway masonry while its doorway stays open', () => {
  const realm = scene();
  try {
    const gateway = realm.group.getObjectByName('coastal-realm-gateway');
    assert.ok(realm.world.stops.journey.hitObjects.includes(gateway));
    const direction = new THREE.Vector3(0, 0, -1).transformDirection(gateway.matrixWorld);
    const origin = (x, y) => new THREE.Vector3(x, y, 10).applyMatrix4(gateway.matrixWorld);
    const raycaster = new THREE.Raycaster(origin(0, 5.04), direction);
    const hit = pickLandmark(raycaster, realm.world.stops, ['journey']);
    assert.equal(hit?.id, 'journey');
    assert.equal(hit?.object.name, 'aged-gold-inset');
    for (const x of [-0.7, 0, 0.7]) for (const y of [1.2, 2.5, 3.5]) {
      raycaster.set(origin(x, y), direction);
      assert.equal(pickLandmark(raycaster, realm.world.stops, ['journey']), null,
        'broad-phase bounds must not turn the physical opening into a click proxy');
    }
  } finally { realm.dispose(); }
});

test('woodland has flat continuous central ground and varied distant terrain', t => {
  const realm = scene('woodland');
  try {
    const land = realm.group.getObjectByName('continuous-woodland-terrain');
    assert.ok(land?.isMesh);
    const vertices = meshVertices(land);
    const bounds = new THREE.Box3().setFromObject(land);
    const size = bounds.getSize(new THREE.Vector3());
    assert.ok(Math.abs(size.x - 120) < 0.001 && Math.abs(size.z - 120) < 0.001);
    assert.ok(vertices.every(v => [v.x, v.y, v.z].every(Number.isFinite)));
    const central = vertices.filter(v => Math.hypot(v.x, v.z) <= 10.5);
    assert.ok(central.length > 100);
    assert.ok(central.every(v => Math.abs(v.y + 0.02) < 1e-7));
    const far = vertices.filter(v => Math.hypot(v.x, v.z) >= 22);
    const heights = far.map(v => v.y);
    assert.ok(Math.max(...heights) - Math.min(...heights) > 1.5, 'distant ground is actual relief, not another flat plinth');
    const raycaster = new THREE.Raycaster();
    const samples = [...Object.values(realm.world.stops).map(stop => stop.position),
      ...Array.from({ length: 64 }, (_, i) => realm.world.route.point(i / 64 * realm.world.route.order.length))];
    for (const p of samples) {
      raycaster.set(new THREE.Vector3(p.x, 10, p.z), new THREE.Vector3(0, -1, 0));
      const hit = raycaster.intersectObject(land)[0];
      assert.ok(hit && Math.abs(hit.point.y + 0.02) < 1e-6, 'clearing and loop have continuous flat support');
    }
    t.diagnostic(`terrain extent=${size.toArray()}; flat-center vertices=${central.length}; far Y ${Math.min(...heights).toFixed(4)}..${Math.max(...heights).toFixed(4)}`);
  } finally { realm.dispose(); }
});

test('world disposal followed by kit disposal releases every observed map and mesh resource once', t => {
  for (const id of ['sea', 'orbital', 'woodland']) {
    const realm = scene(id);
    const resources = new Map();
    const maps = new Set();
    const watch = resource => {
      if (!resource || resources.has(resource)) return;
      resources.set(resource, 0);
      resource.addEventListener('dispose', () => resources.set(resource, resources.get(resource) + 1));
    };
    realm.group.traverse(object => {
      if (object.geometry) {
        for (const attribute of Object.values(object.geometry.attributes)) {
          assert.ok(attribute.array.every(Number.isFinite), `${id} uses finite native attributes`);
        }
        watch(object.geometry);
      }
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material) continue;
        watch(material);
        for (const value of Object.values(material)) if (value?.isTexture) { maps.add(value); watch(value); }
      }
    });
    const portal = realm.group.getObjectByName('coastal-realm-gateway');
    assert.equal(maps.size, { sea: 15, orbital: 3, woodland: 6 }[id]);
    realm.world.dispose();
    assert.ok([...maps].every(map => resources.get(map) === 1), `${id} maps released by their actual world owner`);
    if (portal) {
      assert.equal(portal.parent, null, 'gateway owner detaches its native group');
      assert.equal(portal.children.length, 0, 'gateway owner clears only its own geometry');
      assert.ok(realm.group.children.length > 0, 'the remaining host scene survives until kit disposal');
    }
    realm.world.kit.dispose();
    assert.ok([...resources.values()].every(count => count === 1), `${id} has neither leaked nor double-disposed observed resources`);
    assert.equal(realm.group.children.length, 0);
    t.diagnostic(`${id}: ${maps.size} maps and ${resources.size} observed resources released exactly once`);
  }
});
