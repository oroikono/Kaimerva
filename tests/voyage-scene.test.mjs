import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildRealmScene } from '../src/world.js';
import { createVoyageMotion } from '../src/voyage.js';
import { createVoyageCamera } from '../src/voyage-clearance.js';

const screens = [[1280, 720], [800, 600], [390, 700], [320, 820]];
const PHASES = 512;
const FOV = 48;
const hullSamples = [[0, 0.2, 0], [0.2, 0.26, 0.58], [-0.2, 0.26, -0.58],
  [0, 0.44, 0.73], [0, 0.46, -0.69], [0, 1.72, 0.08], [0.18, 1.15, 0.1]];

function materialList(object) { return Array.isArray(object.material) ? object.material : [object.material]; }
function sceneryMesh(object, traveler) {
  if (!object.isMesh) return false;
  for (let parent = object; parent; parent = parent.parent) if (!parent.visible || parent === traveler) return false;
  // Water and foam are displaced/faded in shaders. A native flat-plane hit is
  // not a rendered obstruction; the transparent lighthouse beam is light.
  return materialList(object).some(material => material?.visible !== false && !material?.isShaderMaterial
    && !(material?.transparent && material.opacity < 0.5)) && object.name !== 'still-shore-pool-water';
}

function fixture(t) {
  const group = new THREE.Group();
  const world = buildRealmScene('sea', group);
  assert.ok(group.getObjectByName('coastal-shore-detail'), 'test includes the integrated close-up shoreline');
  world.setField(false, 0.45);
  world.animate(0);
  group.updateMatrixWorld(true);
  t.after(() => { world.dispose?.(); world.kit.dispose(); });
  return { group, world };
}

function nativeSceneQuery(group, world) {
  const meshes = [];
  group.traverse(object => { if (sceneryMesh(object, world.traveler)) meshes.push(object); });
  const bounds = meshes.map(object => ({ object, box: new THREE.Box3().setFromObject(object) }));
  const ray = new THREE.Raycaster();
  const direction = new THREE.Vector3();
  const segmentBox = new THREE.Box3();
  const insideDirection = new THREE.Vector3(0.137, 0.719, 0.682).normalize();
  return {
    meshes,
    blocked(origin, target) {
      ray.set(origin, direction.copy(target).sub(origin).normalize());
      ray.near = 0;
      ray.far = origin.distanceTo(target) - 0.025;
      segmentBox.makeEmpty(); segmentBox.expandByPoint(origin); segmentBox.expandByPoint(target);
      const candidates = bounds.filter(({ box }) => box.intersectsBox(segmentBox) && ray.ray.intersectsBox(box));
      return ray.intersectObjects(candidates.map(({ object }) => object), false)[0];
    },
    contains(point) {
      for (const { object, box } of bounds) {
        if (!box.containsPoint(point)) continue;
        const materials = materialList(object); const previous = materials.map(material => material.side);
        try {
          materials.forEach(material => { material.side = THREE.DoubleSide; });
          ray.set(point, insideDirection); ray.near = 0; ray.far = 130;
          const distances = [];
          for (const hit of ray.intersectObject(object, false)) {
            if (!distances.length || Math.abs(hit.distance - distances.at(-1)) > 1e-6) distances.push(hit.distance);
          }
          if (distances.length % 2) return object;
        } finally { materials.forEach((material, index) => { material.side = previous[index]; }); }
      }
      return null;
    },
  };
}

function craftVertices(world, group) {
  group.updateMatrixWorld(true);
  const inverse = world.traveler.matrixWorld.clone().invert();
  const vertices = [];
  world.traveler.traverse(object => {
    if (!object.isMesh) return;
    const matrix = inverse.clone().multiply(object.matrixWorld);
    const position = object.geometry.attributes.position;
    for (let index = 0; index < position.count; index++) {
      vertices.push(new THREE.Vector3().fromBufferAttribute(position, index).applyMatrix4(matrix));
    }
  });
  return vertices;
}

test('the authored sea camera clears actual shore meshes and frames the whole native craft throughout its loop', { timeout: 60000 }, t => {
  const { group, world } = fixture(t);
  const follow = createVoyageCamera({ world, group });
  t.after(() => follow.dispose());
  const query = nativeSceneQuery(group, world);
  const variants = [craftVertices(world, group)];
  // Read the actual deformed craft after its bounded full-speed bank/sail
  // response. This is stronger than substituting a guessed craft box.
  for (const turn of [-1, 1]) {
    for (let frame = 0; frame < 100; frame++) world.update(0.1, frame / 10, { speed: 14, moving: false, turn });
    world.animate(Math.PI / 2 / 1.2 * turn);
    variants.push(craftVertices(world, group));
  }
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 130);
  const craftTransform = new THREE.Matrix4();
  const clip = new THREE.Vector3();
  const endpoint = new THREE.Vector3();
  let maximumX = 0; let minimumY = Infinity; let maximumY = -Infinity;
  let maximumPitch = 0; let rayCount = 0; let configurations = 0;
  for (let index = 0; index < PHASES; index++) {
    const phase = index / PHASES * world.route.order.length;
    const boat = world.route.point(phase);
    // The lowest bounded bob is the worst dock/shore clearance. Camera and
    // boat rise together, so the positive bob cannot worsen these segments.
    boat.y -= 0.022;
    const tangent = world.route.point(phase + 0.001).sub(world.route.point(phase - 0.001));
    const forwardHeading = Math.atan2(tangent.x, tangent.z);
    for (const [width, height] of screens) {
      const pose = follow.pose({ phase, position: boat, aspect: width / height, fov: FOV });
      const context = `phase ${phase.toFixed(5)}, screen ${width}×${height}`;
      const containing = query.contains(pose.position);
      if (containing) assert.fail(`camera is inside ${containing.name || containing.geometry.type} at ${context}`);
      const aimBlock = query.blocked(pose.position, pose.target);
      if (aimBlock) assert.fail(`aim is obscured by ${aimBlock.object.name || aimBlock.object.geometry.type} at ${context}`);
      rayCount++;
      camera.aspect = width / height; camera.updateProjectionMatrix();
      camera.position.copy(pose.position); camera.lookAt(pose.target); camera.updateMatrixWorld(true);
      const cameraDirection = camera.getWorldDirection(clip);
      const pitch = -Math.asin(cameraDirection.y) * 180 / Math.PI;
      maximumPitch = Math.max(maximumPitch, pitch);
      const moonElevation = Math.asin(0.2 / Math.hypot(-0.54, 0.2, -0.817)) * 180 / Math.PI;
      assert.ok(FOV / 2 - pitch > moonElevation, `the sea moon elevation is outside the shallow follow view at ${context}`);
      for (const direction of [-1, 1]) {
        const heading = forwardHeading + (direction < 0 ? Math.PI : 0);
        craftTransform.makeRotationY(heading); craftTransform.setPosition(boat);
        for (const sample of hullSamples) {
          endpoint.fromArray(sample).applyMatrix4(craftTransform);
          const obstruction = query.blocked(pose.position, endpoint);
          if (obstruction) assert.fail(
            `shore covers craft at ${context}, direction ${direction}, point ${sample}: ${obstruction.object.name || obstruction.object.geometry.type}, position ${obstruction.object.getWorldPosition(new THREE.Vector3()).toArray()}, hit ${obstruction.point.toArray()}, camera ${pose.position.toArray()}`);
          rayCount++;
        }
        for (const vertices of variants) {
          configurations++;
          for (const vertex of vertices) {
            clip.copy(vertex).applyMatrix4(craftTransform).project(camera);
            maximumX = Math.max(maximumX, Math.abs(clip.x));
            minimumY = Math.min(minimumY, clip.y); maximumY = Math.max(maximumY, clip.y);
            if (!(Math.abs(clip.x) < 0.97 && clip.y > -0.6 && clip.y < 0.9 && Math.abs(clip.z) < 1)) {
              assert.fail(`whole native craft must fit above the lower 20% HUD at ${context}, direction ${direction}: ${clip.toArray()}`);
            }
          }
        }
      }
    }
  }
  t.diagnostic(JSON.stringify({ phases: PHASES, configurations, rays: rayCount, meshes: query.meshes.length,
    clearance: follow.clearance, maximumX, minimumY, maximumY, maximumPitch }));
});

test('route seam, reverse input and paused snapshots retain a continuous camera without heading flips', t => {
  const { group, world } = fixture(t);
  const follow = createVoyageCamera({ world, group }); t.after(() => follow.dispose());
  const period = world.route.order.length;
  for (const aspect of screens.map(([width, height]) => width / height)) {
    const initial = follow.pose({ phase: 0, aspect }); const wrapped = follow.pose({ phase: period, aspect });
    assert.ok(initial.position.distanceTo(wrapped.position) < 1e-10);
    assert.ok(initial.target.distanceTo(wrapped.target) < 1e-10);
    const before = follow.pose({ phase: -0.00001, aspect }); const after = follow.pose({ phase: 0.00001, aspect });
    assert.ok(before.position.distanceTo(after.position) < 0.001);
    assert.ok(before.target.distanceTo(after.target) < 0.001);
    for (const direction of [-1, 1]) {
      const motion = createVoyageMotion({ route: world.route, phase: direction > 0 ? period - 0.01 : 0.01 });
      let saved = motion.snapshot(); let previous = follow.pose({ phase: saved.phase, aspect });
      for (let frame = 0; frame < 160; frame++) {
        saved = motion.step(0.02, direction);
        const next = follow.pose({ phase: saved.phase, aspect });
        assert.ok(next.position.distanceTo(previous.position) < 0.06, 'the camera remains continuous across wrap/reversal');
        assert.ok(next.target.distanceTo(previous.target) < 0.06);
        previous = next;
      }
      assert.deepEqual(motion.step(0, -direction), saved);
      assert.deepEqual(follow.pose({ phase: saved.phase, aspect }), previous, 'pause keeps the exact camera pose');
      const headingBefore = saved.heading;
      motion.reset(saved.phase, headingBefore + Math.PI);
      assert.deepEqual(follow.pose({ phase: saved.phase, aspect }), previous, 'turning the craft cannot spin the camera');
    }
  }
});

test('steady 4/s follow smoothing keeps the moving craft visible across a complete loop in both directions', { timeout: 60000 }, t => {
  const { group, world } = fixture(t);
  const follow = createVoyageCamera({ world, group }); t.after(() => follow.dispose());
  const query = nativeSceneQuery(group, world);
  const vertices = craftVertices(world, group);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 130);
  const craftTransform = new THREE.Matrix4(); const point = new THREE.Vector3();
  const dt = 0.04; const blend = 1 - Math.exp(-dt * 4);
  let frames = 0; let maximumX = 0; let minimumY = Infinity;
  for (const [width, height] of screens) for (const axis of [-1, 1]) {
    const motion = createVoyageMotion({ route: world.route, phase: 0 });
    const initial = follow.pose({ phase: 0, position: world.route.point(0).setY(-0.022), aspect: width / height, fov: FOV });
    const eye = initial.position.clone(); const aim = initial.target.clone();
    camera.aspect = width / height; camera.updateProjectionMatrix();
    for (let frame = 0; frame < 512; frame++) {
      const state = motion.step(dt, axis); const boat = world.route.point(state.phase).setY(-0.022);
      const wanted = follow.pose({ phase: state.phase, position: boat, aspect: width / height, fov: FOV });
      eye.lerp(wanted.position, blend); aim.copy(wanted.target);
      const context = `frame ${frame}, phase ${state.phase.toFixed(5)}, axis ${axis}, screen ${width}×${height}`;
      const inside = query.contains(eye); if (inside) assert.fail(`follow camera is inside ${inside.name || inside.geometry.type} at ${context}`);
      camera.position.copy(eye); camera.lookAt(aim); camera.updateMatrixWorld(true);
      craftTransform.makeRotationY(state.heading); craftTransform.setPosition(boat);
      for (const sample of hullSamples) {
        point.fromArray(sample).applyMatrix4(craftTransform);
        const block = query.blocked(eye, point);
        if (block) assert.fail(`moving craft is hidden by ${block.object.name || block.object.geometry.type} at ${context}, point ${sample}`);
      }
      for (const vertex of vertices) {
        point.copy(vertex).applyMatrix4(craftTransform).project(camera);
        maximumX = Math.max(maximumX, Math.abs(point.x)); minimumY = Math.min(minimumY, point.y);
        if (!(Math.abs(point.x) < 0.97 && point.y > -0.6 && point.y < 0.9 && Math.abs(point.z) < 1)) {
          assert.fail(`follow lag clips the moving craft at ${context}: ${point.toArray()}`);
        }
      }
      frames++;
    }
    assert.ok(Math.abs(motion.snapshot().phase) > world.route.order.length, 'sampled movement covers a complete loop');
  }
  t.diagnostic(JSON.stringify({ followFrames: frames, maximumX, minimumY }));
});

test('Journey harbor is outside the full craft radius for intermediate reversal headings', t => {
  const { group, world } = fixture(t);
  const harbor = world.stops.journey.hitObjects[0];
  assert.ok(harbor?.isGroup, 'include the original physical Journey steps, pier and moorings');
  const boxes = [];
  harbor.traverse(object => {
    if (!object.isMesh) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    boxes.push(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
  });
  let minimum = Infinity;
  for (let index = 0; index < PHASES; index++) {
    const boat = world.route.point(index / PHASES * world.route.order.length);
    for (const box of boxes) {
      const dx = Math.max(box.min.x - boat.x, 0, boat.x - box.max.x);
      const dz = Math.max(box.min.z - boat.z, 0, boat.z - box.max.z);
      minimum = Math.min(minimum, Math.hypot(dx, dz));
    }
  }
  assert.ok(minimum > 0.856, `a rotated conservative mesh box is within the full hull radius: ${minimum}`);
  t.diagnostic(JSON.stringify({ minimumHarborDistance: minimum, craftRadius: 0.856, clearance: minimum - 0.856 }));
});

test('the static camera budget fails closed for narrowed scenery and owns no borrowed scene resources', t => {
  const { group, world } = fixture(t);
  const follow = createVoyageCamera({ world, group });
  assert.equal(follow.clearance.samples, PHASES);
  assert.ok(follow.clearance.parts <= 4096);
  assert.ok(follow.clearance.radius >= 3.3 && follow.clearance.radius <= 3.7);
  assert.ok(follow.clearance.shoreRadius - follow.clearance.radius >= 0.35);
  assert.ok(follow.clearance.chordRadius - follow.clearance.interiorRadius >= 0.25);
  const disposeCalls = [];
  world.traveler.traverse(object => { if (object.isMesh) object.geometry.addEventListener('dispose', () => disposeCalls.push(object)); });
  // Construction is the only scene walk. Supplying the already-known traveler
  // position also avoids calling the route sampler during camera frames.
  const traverse = group.traverse; const point = world.route.point;
  group.traverse = () => { throw new Error('unexpected frame-time scene traversal'); };
  world.route.point = () => { throw new Error('unexpected frame-time route sampling'); };
  try {
    for (let index = 0; index < 200; index++) follow.pose({ phase: index, position: new THREE.Vector3(4, 0, 0), aspect: 0.55 });
  } finally { group.traverse = traverse; world.route.point = point; }
  follow.dispose(); follow.dispose();
  assert.equal(disposeCalls.length, 0, 'the camera borrows scenery and cannot dispose its GPU resources');
  assert.throws(() => follow.pose({ phase: 0 }), /disposed/);
  const blocker = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.8), new THREE.MeshStandardMaterial());
  blocker.position.set(3.5, 1, 0); group.add(blocker); group.updateMatrixWorld(true);
  try { assert.throws(() => createVoyageCamera({ world, group }), /narrows.*annulus/); }
  finally { group.remove(blocker); blocker.geometry.dispose(); blocker.material.dispose(); }
  for (const options of [{ phase: NaN }, { phase: 0, aspect: 0.3 }, { phase: 0, fov: 20 }, { phase: 0, position: new THREE.Vector3(Infinity, 0, 0) }]) {
    const live = createVoyageCamera({ world, group });
    try { assert.throws(() => live.pose(options)); } finally { live.dispose(); }
  }
});
