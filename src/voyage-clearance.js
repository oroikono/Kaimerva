import * as THREE from 'three';

// A camera for this authored sea route, whose unobstructed radial corridor is
// covered by native scene sweeps. It follows the canonical
// course side while the vessel itself can turn around. Static native bounds are
// inspected once; no triangle queries or scene walks happen during a frame.
const SAMPLES = 512;
const SHORE_MARGIN = 0.35;
const INNER_MARGIN = 0.25;
const NOMINAL_RADIUS = 3.7;
const MIN_RADIUS = 3.3;

function finite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be finite.`);
  return value;
}

function routePoint(route, phase) {
  const value = route.point(phase);
  if (!value?.isVector3 || !value.toArray().every(Number.isFinite)) throw new TypeError('Voyage camera needs finite route points.');
  return value.clone();
}

function solid(object, traveler) {
  if (!object.isMesh) return false;
  for (let parent = object; parent; parent = parent.parent) if (!parent.visible || parent === traveler) return false;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  return materials.some(material => material?.visible !== false && !material?.isShaderMaterial
    && !(material?.transparent && material.opacity < 0.5));
}

function boundsRadius(box, center) {
  const dx = Math.max(box.min.x - center.x, 0, center.x - box.max.x);
  const dz = Math.max(box.min.z - center.z, 0, center.z - box.max.z);
  return Math.hypot(dx, dz);
}

/** Derive a conservative static water annulus from real meshes and instances. */
export function createVoyageCamera({ world, group } = {}) {
  const route = world?.route;
  if (!route || !Array.isArray(route.order) || route.order.length < 3 || route.order.length > 16
    || typeof route.point !== 'function' || !world.traveler?.isObject3D || !group?.isObject3D) {
    throw new TypeError('Voyage camera requires an authored closed route, traveler and native scene group.');
  }
  const period = route.order.length;
  const points = Array.from({ length: SAMPLES }, (_, index) => routePoint(route, index / SAMPLES * period));
  if (routePoint(route, 0).distanceTo(routePoint(route, period)) > 1e-5) throw new RangeError('Voyage camera route must close.');
  const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / SAMPLES);
  let minimumRouteRadius = Infinity;
  let area = 0;
  for (let index = 0; index < points.length; index++) {
    const point = points[index]; const next = points[(index + 1) % points.length];
    const x = point.x - center.x; const z = point.z - center.z;
    minimumRouteRadius = Math.min(minimumRouteRadius, Math.hypot(x, z));
    area += x * (next.z - center.z) - (next.x - center.x) * z;
  }
  // These guards catch a collapsed loop, not arbitrary self-intersections.
  // Hosts changing route geometry must repeat the native scene sweep tests.
  if (minimumRouteRadius < 3.2 || Math.abs(area) < 1) throw new RangeError('Voyage camera needs an authored open water loop with sufficient radius.');
  const side = Math.sign(area);
  let shoreRadius = Infinity;
  let interiorRadius = 0;
  let parts = 0;
  const scratch = new THREE.Matrix4();
  const boxCenter = new THREE.Vector3();
  group.updateWorldMatrix(true, true);
  group.traverse(object => {
    if (!solid(object, world.traveler)) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const count = object.isInstancedMesh ? object.count : 1;
    if (parts + count > 4096) throw new RangeError('Voyage camera scenery exceeds its bounded static geometry budget.');
    for (let index = 0; index < count; index++) {
      const matrix = object.matrixWorld.clone();
      if (object.isInstancedMesh) { object.getMatrixAt(index, scratch); matrix.multiply(scratch); }
      const box = object.geometry.boundingBox.clone().applyMatrix4(matrix);
      parts++;
      // Low ledges remain below the line to the middle of the craft. Their
      // broad rotated boxes would otherwise shrink the camera's water annulus
      // even when the actual camera and viewing segment pass above them.
      if (box.max.y < center.y + 0.67) continue;
      box.getCenter(boxCenter);
      if (Math.hypot(boxCenter.x - center.x, boxCenter.z - center.z) < minimumRouteRadius * 0.55) {
        for (const x of [box.min.x, box.max.x]) for (const z of [box.min.z, box.max.z]) {
          interiorRadius = Math.max(interiorRadius, Math.hypot(x - center.x, z - center.z));
        }
      } else shoreRadius = Math.min(shoreRadius, boundsRadius(box, center));
    }
  });
  const radius = Math.min(NOMINAL_RADIUS, shoreRadius - SHORE_MARGIN);
  // The 90–100-degree trailing angle gives the whole craft enough viewing
  // distance on tall phones. Its chord toward
  // the route must clear the central physical instrument as well as the shore.
  const angle = 100 * Math.PI / 180;
  const length = Math.sqrt(radius * radius + minimumRouteRadius * minimumRouteRadius
    - 2 * radius * minimumRouteRadius * Math.cos(angle));
  const chordRadius = radius * minimumRouteRadius * Math.sin(angle) / length;
  if (radius < MIN_RADIUS || chordRadius < interiorRadius + INNER_MARGIN) {
    throw new RangeError('Scenery narrows the sailing-camera annulus. Move the blocking geometry or use Atlas view.');
  }
  let disposed = false;
  const clearance = Object.freeze({ samples: SAMPLES, parts, radius, shoreRadius, interiorRadius,
    minimumRouteRadius, chordRadius });
  return {
    clearance,
    pose({ phase, position, aspect = 1, fov = 48 } = {}) {
      if (disposed) throw new Error('Voyage camera has been disposed.');
      finite(phase, 'Voyage camera phase'); finite(aspect, 'Voyage camera aspect'); finite(fov, 'Voyage camera field of view');
      if (aspect < 0.36 || fov < 40 || fov > 60) throw new RangeError('Voyage framing supports aspect ratios from 0.36 and fields of view 40–60 degrees.');
      const boat = position === undefined ? routePoint(route, phase) : position;
      if (!boat?.isVector3 || !boat.toArray().every(Number.isFinite)) throw new TypeError('Voyage camera traveler position must be finite.');
      const radial = Math.atan2(boat.x - center.x, boat.z - center.z);
      const extraAngle = THREE.MathUtils.clamp((0.55 - aspect) / 0.2, 0, 1) * 10;
      const azimuth = radial + side * (90 + extraAngle) * Math.PI / 180;
      const camera = new THREE.Vector3(center.x + Math.sin(azimuth) * radius,
        boat.y + 1.65, center.z + Math.cos(azimuth) * radius);
      const target = boat.clone(); target.y += 0.72;
      return { position: camera, target };
    },
    dispose() { disposed = true; },
  };
}
