import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createExplorationBeacons } from '../src/exploration-beacons.js';
import { buildRealmScene } from '../src/world.js';
import { createVoyageCamera } from '../src/voyage-clearance.js';

const anchors = () => Array.from({ length: 5 }, (_, index) => ({
  id: `harbor-${index}`,
  position: new THREE.Vector3(Math.sin(index * Math.PI * 2 / 5) * 4, 0.04,
    Math.cos(index * Math.PI * 2 / 5) * 4),
}));
const nodeFor = (beacons, id) => beacons.group.children.find(child => child.userData.destination === id);
const ringFor = node => node.children.find(child => child.geometry.type === 'TorusGeometry');
const lineFor = beacons => beacons.group.children.find(child => child.isLineSegments);
const close = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('all themes copy their anchor bases and stay within a bounded, nonphysical marker budget', () => {
  for (const themeId of ['sea', 'orbital', 'woodland']) {
    const supplied = anchors();
    const original = supplied.map(anchor => anchor.position.clone());
    const beacons = createExplorationBeacons({ anchors: supplied, themeId });
    const meshes = [];
    beacons.group.traverse(object => {
      assert.equal(object.userData.kaimervaNonPhysical, true);
      if (object.isMesh || object.isLineSegments) {
        assert.equal(object.castShadow, false);
        assert.equal(object.receiveShadow, false);
        assert.equal(object.material.transparent, true);
        assert.equal(object.material.depthWrite, false);
        assert.ok(object.material.opacity < 0.5);
      }
      if (object.isMesh) meshes.push(object);
    });
    assert.equal(meshes.length, 15);
    const full = new Set(supplied.map(anchor => anchor.id));
    beacons.update({ nearId: supplied[0].id, discovered: full, complete: true }, 0.25);
    for (const mesh of meshes) assert.ok(mesh.material.opacity < 0.5);
    for (let index = 0; index < supplied.length; index += 1) {
      assert.deepEqual(nodeFor(beacons, supplied[index].id).position.toArray(), original[index].toArray());
    }
    supplied[0].position.set(99, 99, 99);
    assert.deepEqual(nodeFor(beacons, supplied[0].id).position.toArray(), original[0].toArray());
    beacons.group.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(original[0].clone().add(new THREE.Vector3(0, 5, 0)), new THREE.Vector3(0, -1, 0));
    assert.deepEqual(ray.intersectObject(beacons.group, true), []);
    beacons.dispose();
  }
  const eight = Array.from({ length: 8 }, (_, index) => ({ id: String(index), position: new THREE.Vector3(index, 0, 0) }));
  const maximum = createExplorationBeacons({ anchors: eight });
  let count = 0; maximum.group.traverse(object => { if (object.isMesh) count += 1; });
  assert.equal(count, 24);
  maximum.dispose();
});

test('nearby markers brighten, charting persists after departure, and only a complete known route closes', () => {
  const points = anchors();
  const beacons = createExplorationBeacons({ anchors: points });
  const first = nodeFor(beacons, points[0].id);
  const material = ringFor(first).material;
  const quiet = material.color.clone();
  const quietOpacity = material.opacity;
  beacons.update({ nearId: points[0].id });
  assert.ok(material.opacity > quietOpacity);
  assert.ok(material.color.r + material.color.g + material.color.b > quiet.r + quiet.g + quiet.b);
  beacons.update({ discovered: [points[0].id, points[1].id] }, 0, { static: true });
  const settled = material.color.clone();
  const settledOpacity = material.opacity;
  assert.equal(lineFor(beacons).geometry.drawRange.count, 2);
  beacons.update({ nearId: points[3].id, discovered: new Set([points[1].id, points[0].id]) }, 0.1);
  assert.deepEqual(material.color.toArray(), settled.toArray());
  assert.equal(material.opacity, settledOpacity);
  beacons.update({ discovered: [points[0].id], complete: true }, 0, { static: true });
  assert.equal(lineFor(beacons).geometry.drawRange.count, 0);
  const all = points.map(point => point.id);
  beacons.update({ discovered: all, complete: false }, 0, { static: true });
  assert.equal(lineFor(beacons).geometry.drawRange.count, (points.length - 1) * 2);
  beacons.update({ discovered: all, complete: true }, 0, { static: true });
  const line = lineFor(beacons);
  assert.equal(line.geometry.drawRange.count, points.length * 2);
  const positions = line.geometry.attributes.position;
  const firstClosingVertex = points.length * 2 - 2;
  close(positions.getX(firstClosingVertex), points.at(-1).position.x, 1e-6);
  close(positions.getZ(firstClosingVertex + 1), points[0].position.z, 1e-6);
  beacons.dispose();
});

test('discovery pulse depends on elapsed time, settles without drift and snaps under static updates', () => {
  const points = anchors();
  const oneStep = createExplorationBeacons({ anchors: points });
  const partitioned = createExplorationBeacons({ anchors: points });
  const state = { discovered: [points[0].id] };
  oneStep.update(state);
  partitioned.update(state);
  assert.equal(oneStep.update(state, 0.4), true);
  for (let index = 0; index < 8; index += 1) partitioned.update(state, 0.05);
  const firstRing = ringFor(nodeFor(oneStep, points[0].id));
  const otherRing = ringFor(nodeFor(partitioned, points[0].id));
  close(firstRing.scale.x, otherRing.scale.x);
  close(firstRing.material.opacity, otherRing.material.opacity);
  firstRing.material.color.toArray().forEach((value, index) => close(value, otherRing.material.color.toArray()[index]));
  const frozen = firstRing.scale.x;
  oneStep.update(state, 0);
  close(firstRing.scale.x, frozen);
  assert.equal(oneStep.update(state, 0, { static: true }), false);
  assert.equal(firstRing.scale.x, 1);
  const settledColor = firstRing.material.color.clone();
  assert.equal(oneStep.update(state, 100), false);
  assert.equal(firstRing.scale.x, 1);
  assert.deepEqual(firstRing.material.color.toArray(), settledColor.toArray());
  assert.equal(partitioned.update(state, 1), false);
  assert.equal(otherRing.scale.x, 1);
  assert.equal(partitioned.update(state, 1), false);
  assert.equal(otherRing.scale.x, 1);
  oneStep.dispose(); partitioned.dispose();
});

test('each owned geometry/material is disposed exactly once and the group detaches', () => {
  const beacons = createExplorationBeacons({ anchors: anchors() });
  const scene = new THREE.Scene(); scene.add(beacons.group);
  const resources = new Set();
  beacons.group.traverse(object => { if (object.geometry) resources.add(object.geometry); if (object.material) resources.add(object.material); });
  const counts = new Map([...resources].map(resource => [resource, 0]));
  resources.forEach(resource => resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource) + 1)));
  beacons.dispose(); beacons.dispose();
  assert.equal(beacons.group.parent, null);
  assert.equal(beacons.group.children.length, 0);
  resources.forEach(resource => assert.equal(counts.get(resource), 1));
  assert.equal(beacons.update({ discovered: [] }, 1), false);
});

test('invalid anchors and delta time fail before they can mutate live marker state', () => {
  const points = anchors();
  assert.throws(() => createExplorationBeacons({ anchors: [] }), RangeError);
  assert.throws(() => createExplorationBeacons({ anchors: [...points, points[0]] }), TypeError);
  assert.throws(() => createExplorationBeacons({ anchors: points, themeId: 'other' }), RangeError);
  const invalid = anchors(); invalid[0].position.x = Infinity;
  assert.throws(() => createExplorationBeacons({ anchors: invalid }), TypeError);
  const beacons = createExplorationBeacons({ anchors: points });
  const ring = ringFor(nodeFor(beacons, points[0].id));
  const before = ring.material.color.clone();
  for (const dt of [-1, Infinity, NaN]) assert.throws(() => beacons.update({ discovered: [points[0].id] }, dt), RangeError);
  assert.throws(() => beacons.update({ discovered: 'harbor-0' }), TypeError);
  assert.deepEqual(ring.material.color.toArray(), before.toArray());
  beacons.update({ nearId: 'unknown', discovered: ['unknown'] }, 0, { static: true });
  assert.equal(lineFor(beacons).visible, false);
  assert.deepEqual(ring.material.color.toArray(), before.toArray());
  beacons.dispose();
});

test('nearby glyphs and light shafts have discernible native projected size in the actual sea camera', t => {
  // Native matrix projection is a geometry/framing check, not rendered evidence.
  const realmGroup = new THREE.Group();
  const world = buildRealmScene('sea', realmGroup);
  t.after(() => { world.dispose?.(); world.kit.dispose(); });
  world.setField(false, 0.45);
  world.animate(0);
  realmGroup.updateMatrixWorld(true);
  const follow = createVoyageCamera({ world, group: realmGroup });
  t.after(() => follow.dispose());
  const points = world.route.order.map((id, index) => ({
    id, position: world.route.point(index).add(new THREE.Vector3(0, 0.04, 0)),
  }));
  const beacons = createExplorationBeacons({ anchors: points });
  t.after(() => beacons.dispose());
  beacons.group.updateMatrixWorld(true);
  const clip = new THREE.Vector3();
  const projectedBounds = (mesh, camera) => {
    const vertices = mesh.geometry.attributes.position;
    let left = Infinity; let right = -Infinity; let bottom = Infinity; let top = -Infinity;
    for (let index = 0; index < vertices.count; index += 1) {
      clip.fromBufferAttribute(vertices, index).applyMatrix4(mesh.matrixWorld).project(camera);
      assert.ok(clip.toArray().every(Number.isFinite));
      assert.ok(clip.z > -1 && clip.z < 1, 'nearby navigation light is inside camera depth');
      left = Math.min(left, clip.x); right = Math.max(right, clip.x);
      bottom = Math.min(bottom, clip.y); top = Math.max(top, clip.y);
    }
    assert.ok(left >= -1 && right <= 1 && bottom >= -1 && top <= 1,
      'nearby navigation glyph/shaft fits in the native camera viewport');
    return top - bottom;
  };
  for (const [width, height] of [[1280, 720], [390, 700]]) {
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 130);
    let minimumGlyph = Infinity; let minimumShaft = Infinity;
    for (let index = 0; index < points.length; index += 1) {
      const node = nodeFor(beacons, points[index].id);
      const glyph = node.children.find(child => !['TorusGeometry', 'CylinderGeometry'].includes(child.geometry.type));
      const shaft = node.children.find(child => child.geometry.type === 'CylinderGeometry');
      for (const offset of [-0.25, -0.125, 0, 0.125, 0.25]) {
        const phase = index + offset;
        const boat = world.route.point(phase);
        assert.ok(boat.distanceTo(points[index].position) < 1.4,
          'projection sample is inside the game proximity distance');
        const pose = follow.pose({ phase, position: boat, aspect: width / height, fov: 48 });
        camera.position.copy(pose.position);
        camera.lookAt(pose.target);
        camera.updateMatrixWorld(true);
        const glyphHeight = projectedBounds(glyph, camera) * height / 2;
        const shaftHeight = projectedBounds(shaft, camera) * height / 2;
        minimumGlyph = Math.min(minimumGlyph, glyphHeight);
        minimumShaft = Math.min(minimumShaft, shaftHeight);
        assert.ok(glyphHeight > 12, `nearby glyph is only ${glyphHeight.toFixed(2)}px tall`);
        assert.ok(shaftHeight > 12, `nearby shaft is only ${shaftHeight.toFixed(2)}px tall`);
      }
    }
    t.diagnostic(`${width}×${height}: minimum native glyph height ${minimumGlyph.toFixed(1)}px; shaft ${minimumShaft.toFixed(1)}px.`);
  }
});
