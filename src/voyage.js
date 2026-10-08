import * as THREE from 'three';

// Controlled movement along the authored closed route. This is a sailing-like
// navigation mode, not free boat physics, obstacle avoidance or auto-travel.
const MAX_SPEED = 0.34;
const MAX_DT = 0.1;
const INPUT_RATE = 4.8;
const BRAKE_RATE = 6.8;
const HEADING_RATE = 2.2;
const STOP_EPSILON = 0.00004;
const TANGENT_STEP = 0.001;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

function finite(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${label} must be a finite number.`);
  return value;
}

function sample(route, phase) {
  const point = route.point(phase);
  if (!point || ![point.x, point.y, point.z].every(value => typeof value === 'number' && Number.isFinite(value))) {
    throw new TypeError('Voyage route.point must return a finite 3D point.');
  }
  // Copy immediately: a host sampler may reuse one scratch vector on each call.
  return new THREE.Vector3(point.x, point.y, point.z);
}

function tangentHeading(route, phase, direction, fallback = 0) {
  const before = sample(route, phase - TANGENT_STEP * direction);
  const after = sample(route, phase + TANGENT_STEP * direction);
  const x = after.x - before.x; const z = after.z - before.z;
  return x * x + z * z > 1e-12 ? Math.atan2(x, z) : fallback;
}

/** Phase is deliberately unwrapped; the host's route.point handles its seam. */
export function createVoyageMotion({ route, phase = 0 }) {
  if (!route || typeof route.point !== 'function') throw new TypeError('Voyage motion requires a route.point sampler.');
  finite(phase, 'Voyage phase');
  let currentPhase = phase;
  let speed = 0;
  let heading = tangentHeading(route, phase, 1);
  const snapshot = () => ({ phase: currentPhase, speed, heading });

  return {
    step(dt, axis = 0) {
      finite(dt, 'Voyage time step'); finite(axis, 'Voyage input axis');
      if (dt < 0) throw new RangeError('Voyage time step cannot be negative.');
      const seconds = Math.min(MAX_DT, dt);
      if (seconds === 0) return snapshot();
      const input = clamp(axis, -1, 1);
      const target = input * MAX_SPEED;
      const rate = input === 0 ? BRAKE_RATE : INPUT_RATE;
      const decay = Math.exp(-rate * seconds);
      // Integrate both velocity and distance exactly for a constant axis. This
      // keeps ordinary frame partitioning from changing acceleration distance.
      const distance = target * seconds + (speed - target) * (1 - decay) / rate;
      const nextPhase = currentPhase + distance;
      let nextSpeed = target + (speed - target) * decay;
      if (input === 0 && Math.abs(nextSpeed) < STOP_EPSILON) nextSpeed = 0;
      const direction = Math.abs(nextSpeed) > STOP_EPSILON ? Math.sign(nextSpeed) : 0;
      const desiredHeading = direction ? tangentHeading(route, nextPhase, direction, heading) : heading;
      const difference = Math.atan2(Math.sin(desiredHeading - heading), Math.cos(desiredHeading - heading));
      const nextHeading = heading + clamp(difference, -HEADING_RATE * seconds, HEADING_RATE * seconds);
      // Commit only after curve sampling succeeds, so a malformed host route
      // cannot partially alter a snapshot that should still be restorable.
      currentPhase = nextPhase; speed = nextSpeed; heading = nextHeading;
      return snapshot();
    },
    reset(nextPhase = 0, nextHeading) {
      finite(nextPhase, 'Voyage phase');
      if (nextHeading !== undefined) { finite(nextHeading, 'Voyage heading'); sample(route, nextPhase); }
      const alignedHeading = nextHeading === undefined ? tangentHeading(route, nextPhase, 1) : nextHeading;
      currentPhase = nextPhase; speed = 0; heading = alignedHeading;
      return snapshot();
    },
    snapshot,
    restore(saved) {
      if (!saved || typeof saved !== 'object') throw new TypeError('Voyage restore requires a motion snapshot.');
      finite(saved.phase, 'Saved voyage phase'); finite(saved.speed, 'Saved voyage speed'); finite(saved.heading, 'Saved voyage heading');
      if (Math.abs(saved.speed) > MAX_SPEED) throw new RangeError('Saved voyage speed exceeds the controlled route limit.');
      sample(route, saved.phase);
      currentPhase = saved.phase; speed = saved.speed; heading = saved.heading;
      return snapshot();
    },
  };
}

/** A shallow third-person pose; the host owns smoothing, FOV and scene labels. */
export function voyageCameraPose({ position, heading, aspect = 1, fov = 44, rightOffset = 0.55 }) {
  if (!position || ![position.x, position.y, position.z].every(value => typeof value === 'number' && Number.isFinite(value))) {
    throw new TypeError('Voyage camera needs a finite traveler position.');
  }
  finite(heading, 'Voyage camera heading'); finite(aspect, 'Voyage camera aspect');
  finite(fov, 'Voyage camera field of view'); finite(rightOffset, 'Voyage camera lateral offset');
  if (aspect <= 0) throw new RangeError('Voyage camera aspect must be positive.');
  if (fov < 20 || fov > 75) throw new RangeError('Voyage camera field of view must be between 20 and 75 degrees.');
  const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
  const right = new THREE.Vector3(Math.cos(heading), 0, -Math.sin(heading));
  const portrait = clamp(Math.sqrt(0.85 / aspect), 1, 1.8);
  const lens = clamp(Math.tan(22 * Math.PI / 180) / Math.tan(fov * Math.PI / 360), 0.8, 1.55);
  const distance = 5.5 * portrait * lens;
  const side = clamp(rightOffset, -1.5, 1.5) * clamp(aspect / 0.85, 0.25, 1);
  const camera = new THREE.Vector3(position.x, position.y, position.z).addScaledVector(forward, -distance).addScaledVector(right, side);
  camera.y = Math.max(1.5, position.y + 1.8 + (portrait - 1) * 0.2);
  const target = new THREE.Vector3(position.x, position.y, position.z).addScaledVector(forward, 3.5 * portrait);
  target.y = Math.max(1.1, position.y + 1.1);
  return { position: camera, target };
}
