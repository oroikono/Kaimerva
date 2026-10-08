import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createVoyageMotion, voyageCameraPose } from '../src/voyage.js';

const route = {
  point(phase) {
    const angle = ((phase % 5) / 5) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * 5, 0, Math.sin(angle) * 5);
  },
};
const difference = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const near = (a, b, tolerance = 1e-12) => assert.ok(Math.abs(a - b) < tolerance, `${a} and ${b} differ`);

test('movement starts only with input, accelerates within its route limit and brakes to rest after release', () => {
  const motion = createVoyageMotion({ route });
  const rest = motion.snapshot();
  for (let i = 0; i < 120; i++) assert.deepEqual(motion.step(1 / 60, 0), rest);
  const first = motion.step(1 / 60, 1);
  assert.ok(first.speed > 0 && first.speed < 0.1, 'a press accelerates instead of jumping to cruise speed');
  assert.ok(first.phase > 0);
  for (let i = 0; i < 120; i++) motion.step(1 / 60, 1);
  const cruise = motion.snapshot();
  assert.ok(cruise.speed > 0.33 && cruise.speed <= 0.34);
  let previous = cruise;
  for (let i = 0; i < 160; i++) {
    const next = motion.step(1 / 60, 0);
    assert.ok(next.speed <= previous.speed && next.speed >= 0);
    assert.ok(next.phase >= previous.phase);
    previous = next;
  }
  assert.equal(previous.speed, 0, 'neutral input ends residual motion completely');
  assert.ok(previous.phase > cruise.phase, 'the boat briefly coasts while braking');
  assert.deepEqual(motion.step(0.1, 0), previous);
});

test('constant-axis distance and speed are frame-partition consistent while long frames are bounded', () => {
  const simulate = (dt, count) => {
    const motion = createVoyageMotion({ route, phase: 0.4 });
    for (let i = 0; i < count; i++) motion.step(dt, 0.72);
    return motion.snapshot();
  };
  const coarse = simulate(0.1, 20);
  for (const fine of [simulate(0.02, 100), simulate(1 / 60, 120)]) {
    near(coarse.phase, fine.phase); near(coarse.speed, fine.speed);
    near(difference(coarse.heading, fine.heading), 0, 1e-10);
  }
  const stalled = createVoyageMotion({ route }); const bounded = createVoyageMotion({ route });
  assert.deepEqual(stalled.step(10, 1), bounded.step(0.1, 1), 'a hidden-tab stall cannot jump far down the route');
  const clamped = createVoyageMotion({ route }); const full = createVoyageMotion({ route });
  assert.deepEqual(clamped.step(0.02, 99), full.step(0.02, 1));
  assert.deepEqual(clamped.step(0.02, -99), full.step(0.02, -1));
});

test('reverse input first brakes existing motion and turns at a bounded rate along the actual route tangent', () => {
  const motion = createVoyageMotion({ route });
  for (let i = 0; i < 100; i++) motion.step(0.02, 1);
  const before = motion.snapshot();
  const firstReverse = motion.step(0.02, -1);
  assert.ok(firstReverse.speed > 0 && firstReverse.speed < before.speed, 'reverse input must brake the still-forward boat');
  assert.ok(firstReverse.phase > before.phase);
  let previous = firstReverse;
  for (let i = 0; i < 140; i++) {
    const next = motion.step(0.02, -1);
    assert.ok(Math.abs(difference(next.heading, previous.heading)) <= 2.2 * 0.02 + 1e-12, 'reversal never snaps the heading by 180 degrees');
    previous = next;
  }
  assert.ok(previous.speed < -0.33 && previous.speed >= -0.34);
  const tangent = route.point(previous.phase - 0.001).sub(route.point(previous.phase + 0.001));
  near(difference(previous.heading, Math.atan2(tangent.x, tangent.z)), 0, 1e-10);
});

test('the signed phase stays unwrapped while sampled position and heading cross the closed-route seam continuously', () => {
  for (const direction of [-1, 1]) {
    const motion = createVoyageMotion({ route, phase: direction > 0 ? 4.99 : 0.01 });
    let previous = motion.snapshot();
    for (let i = 0; i < 80; i++) {
      const next = motion.step(0.02, direction);
      assert.ok(route.point(next.phase).distanceTo(route.point(previous.phase)) <= 0.044);
      assert.ok(Math.abs(difference(next.heading, previous.heading)) <= 0.044 + 1e-12);
      previous = next;
    }
    assert.ok(direction > 0 ? previous.phase > 5 : previous.phase < 0, 'store the traveled phase, not its modulo');
  }
});

test('pause preserves the exact state and snapshots/reset/restore resume the same motion', () => {
  let calls = 0;
  const sampled = { point: phase => { calls++; return route.point(phase); } };
  const motion = createVoyageMotion({ route: sampled, phase: -0.3 });
  for (let i = 0; i < 25; i++) motion.step(0.02, -1);
  const saved = motion.snapshot(); const callsBeforePause = calls;
  assert.deepEqual(motion.step(0, 1), saved);
  assert.equal(calls, callsBeforePause, 'paused steps do not sample or retarget the route');
  const external = motion.snapshot(); external.phase = 900;
  assert.deepEqual(motion.snapshot(), saved, 'snapshot mutation cannot change live motion');
  assert.deepEqual(motion.reset(2.5, 1.23), { phase: 2.5, speed: 0, heading: 1.23 });
  assert.deepEqual(motion.restore(saved), saved);
  const duplicate = createVoyageMotion({ route }); duplicate.restore(saved);
  assert.deepEqual(motion.step(0.02, -1), duplicate.step(0.02, -1));
  const reset = motion.reset(2.5);
  assert.equal(reset.speed, 0);
  const tangent = route.point(2.501).sub(route.point(2.499));
  near(difference(reset.heading, Math.atan2(tangent.x, tangent.z)), 0);
});

test('a shared sampler vector works while malformed inputs and curve failures cannot partially alter state', () => {
  const scratch = new THREE.Vector3();
  const motion = createVoyageMotion({ route: { point: phase => scratch.copy(route.point(phase)) } });
  near(motion.snapshot().heading, 0);
  motion.step(0.02, 1); const saved = motion.snapshot();
  for (const [dt, axis] of [[NaN, 0], [Infinity, 1], [-1, 0], [0.1, NaN], [0.1, '1']]) {
    assert.throws(() => motion.step(dt, axis)); assert.deepEqual(motion.snapshot(), saved);
  }
  for (const bad of [{}, { ...saved, phase: '1' }, { ...saved, speed: 0.5 }, { ...saved, heading: Infinity }]) {
    assert.throws(() => motion.restore(bad)); assert.deepEqual(motion.snapshot(), saved);
  }
  assert.throws(() => motion.reset(NaN)); assert.throws(() => motion.reset(1, NaN));
  assert.deepEqual(motion.snapshot(), saved);
  let invalid = false;
  const failing = createVoyageMotion({ route: { point: phase => invalid ? new THREE.Vector3(NaN, 0, 0) : route.point(phase) } });
  const valid = failing.snapshot(); invalid = true;
  assert.throws(() => failing.step(0.02, 1), /finite 3D point/);
  assert.deepEqual(failing.snapshot(), valid);
  assert.throws(() => createVoyageMotion({ route: {} }), TypeError);
});

test('third-person camera faces forward with a visible horizon and conservatively fits a small craft on portrait screens', () => {
  const traveler = new THREE.Vector3(5, 0, -3); const original = traveler.clone();
  for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
    for (const aspect of [16 / 9, 1, 0.55, 0.3]) {
      const pose = voyageCameraPose({ position: traveler, heading, aspect });
      assert.ok(pose.position.toArray().every(Number.isFinite) && pose.target.toArray().every(Number.isFinite));
      assert.ok(pose.position.y >= 1.5 && pose.target.y >= 1.1);
      assert.ok(pose.position.clone().sub(traveler).dot(forward) < -5);
      assert.ok(pose.target.clone().sub(traveler).dot(forward) >= 3.5 - 1e-12);
      const camera = new THREE.PerspectiveCamera(44, aspect, 0.1, 130);
      camera.position.copy(pose.position); camera.lookAt(pose.target); camera.updateMatrixWorld(true);
      const direction = camera.getWorldDirection(new THREE.Vector3());
      const tilt = Math.asin(direction.y);
      assert.ok(tilt + 22 * Math.PI / 180 > 0.22, 'upper view extends above the sea moon elevation');
      // A declared conservative craft box: width .8, length 1.9, height1.85.
      // This establishes framing, not visibility through actual scenery.
      for (const x of [-0.4, 0.4]) for (const z of [-0.95, 0.95]) for (const y of [0, 1.85]) {
        const corner = new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), heading).add(traveler).project(camera);
        assert.ok(Math.abs(corner.x) < 1 && Math.abs(corner.y) < 1 && Math.abs(corner.z) < 1);
      }
    }
  }
  assert.deepEqual(traveler, original, 'camera framing never moves the traveler');
});

test('camera settings remain finite at supported extremes and reject unusable inputs', () => {
  for (const aspect of [0.01, 8]) for (const fov of [20, 75]) {
    const pose = voyageCameraPose({ position: new THREE.Vector3(0, -0.5, 0), heading: -20, aspect, fov, rightOffset: 100 });
    assert.ok(pose.position.toArray().every(Number.isFinite));
    assert.ok(pose.target.toArray().every(Number.isFinite));
    assert.ok(pose.position.y >= 1.5);
  }
  for (const options of [{ aspect: 0 }, { aspect: Infinity }, { fov: 0 }, { fov: 90 }, { heading: NaN }, { rightOffset: Infinity }]) {
    assert.throws(() => voyageCameraPose({ position: new THREE.Vector3(), heading: 0, ...options }));
  }
});
