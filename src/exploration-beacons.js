import * as THREE from 'three';

const PULSE_SECONDS = 0.85;
const PALETTES = {
  sea: { quiet: '#476a81', near: '#a8e3e7', charted: '#f4d091' },
  orbital: { quiet: '#605b85', near: '#c6b8f3', charted: '#efd28e' },
  woodland: { quiet: '#476d63', near: '#bce4cf', charted: '#ebcd8f' },
};
const noRaycast = () => {};

function validateAnchors(anchors) {
  if (!Array.isArray(anchors) || anchors.length < 3 || anchors.length > 8) {
    throw new RangeError('Exploration beacons require 3–8 ordered route anchors.');
  }
  const ids = new Set();
  return anchors.map(anchor => {
    if (!anchor || typeof anchor.id !== 'string' || !anchor.id.trim() || ids.has(anchor.id)
      || !anchor.position?.isVector3 || !anchor.position.toArray().every(Number.isFinite)) {
      throw new TypeError('Each exploration anchor needs a unique ID and a finite Vector3 position.');
    }
    ids.add(anchor.id);
    return { id: anchor.id, position: anchor.position.clone() };
  });
}

function markNonPhysical(object) {
  object.userData.kaimervaNonPhysical = true;
  object.raycast = noRaycast;
  object.castShadow = false;
  object.receiveShadow = false;
  object.renderOrder = 2;
  return object;
}

/** Original navigation glyphs. Anchor positions are bases, copied without mutation.
 * update returns whether a bounded discovery pulse is still active. */
export function createExplorationBeacons({ anchors, themeId = 'sea' } = {}) {
  const points = validateAnchors(anchors);
  const palette = PALETTES[themeId];
  if (!palette) throw new RangeError('Exploration beacon theme must be sea, orbital, or woodland.');
  const group = new THREE.Group();
  group.name = 'exploration-beacons';
  markNonPhysical(group);
  const geometries = new Set();
  const materials = new Set();
  const own = geometry => { geometries.add(geometry); return geometry; };
  const ringGeometry = own(new THREE.TorusGeometry(0.48, 0.016, 6, 40));
  const shaftGeometry = own(new THREE.CylinderGeometry(0.013, 0.020, 1.28, 7));
  const glyphGeometry = own(themeId === 'orbital' ? new THREE.OctahedronGeometry(0.15)
    : themeId === 'woodland' ? new THREE.IcosahedronGeometry(0.15)
      : new THREE.SphereGeometry(0.14, 12, 8));
  const quiet = new THREE.Color(palette.quiet).multiplyScalar(0.7);
  const near = new THREE.Color(palette.near).multiplyScalar(2.2);
  const charted = new THREE.Color(palette.charted).multiplyScalar(2.35);
  const nodes = points.map(({ id, position }) => {
    const node = new THREE.Group();
    node.position.copy(position);
    node.userData.destination = id;
    markNonPhysical(node);
    const material = new THREE.MeshBasicMaterial({ color: quiet, transparent: true, opacity: 0.11,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: true });
    materials.add(material);
    const ring = markNonPhysical(new THREE.Mesh(ringGeometry, material));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.07;
    const shaft = markNonPhysical(new THREE.Mesh(shaftGeometry, material));
    shaft.position.y = 0.73;
    const glyph = markNonPhysical(new THREE.Mesh(glyphGeometry, material));
    glyph.position.y = 1.49;
    if (themeId === 'woodland') glyph.scale.set(0.65, 1.45, 0.65);
    else if (themeId === 'orbital') glyph.rotation.y = Math.PI / 4;
    node.add(ring, shaft, glyph);
    group.add(node);
    return { id, node, material, ring, glyph, glyphY: glyph.position.y,
      discovered: false, near: false, pulseAge: PULSE_SECONDS };
  });
  const ids = new Set(points.map(point => point.id));
  const linePositions = new Float32Array(points.length * 6);
  const lineGeometry = own(new THREE.BufferGeometry());
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setDrawRange(0, 0);
  const lineMaterial = new THREE.LineBasicMaterial({ color: charted, transparent: true, opacity: 0.26,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: true });
  materials.add(lineMaterial);
  const constellation = markNonPhysical(new THREE.LineSegments(lineGeometry, lineMaterial));
  constellation.visible = false;
  group.add(constellation);
  let discovered = new Set();
  let complete = false;
  let disposed = false;

  function rebuildConstellation() {
    let vertices = 0;
    const segment = (first, second) => {
      if (!discovered.has(first.id) || !discovered.has(second.id)) return;
      for (const point of [first, second]) {
        linePositions[vertices * 3] = point.position.x;
        linePositions[vertices * 3 + 1] = point.position.y + 0.07;
        linePositions[vertices * 3 + 2] = point.position.z;
        vertices += 1;
      }
    };
    for (let index = 0; index < points.length - 1; index += 1) segment(points[index], points[index + 1]);
    if (complete) segment(points[points.length - 1], points[0]);
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.setDrawRange(0, vertices);
    lineGeometry.computeBoundingSphere();
    constellation.visible = vertices > 0;
  }

  function update({ nearId = null, discovered: nextDiscovered = [], complete: nextComplete = false } = {},
    dt = 0, { static: staticFrame = false } = {}) {
    if (disposed) return false;
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Beacon delta time must be finite and nonnegative.');
    if (!(nextDiscovered instanceof Set) && !Array.isArray(nextDiscovered)) throw new TypeError('Discovered beacon IDs must be a Set or array.');
    const next = new Set([...nextDiscovered].filter(id => ids.has(id)));
    const finished = Boolean(nextComplete) && next.size === points.length;
    const discoveryChanged = next.size !== discovered.size || [...next].some(id => !discovered.has(id));
    if (discoveryChanged || finished !== complete) {
      discovered = next;
      complete = finished;
      rebuildConstellation();
    }
    let animating = false;
    for (const node of nodes) {
      const known = discovered.has(node.id);
      if (known && !node.discovered) node.pulseAge = staticFrame ? PULSE_SECONDS : 0;
      else if (!known || staticFrame) node.pulseAge = PULSE_SECONDS;
      node.discovered = known;
      node.near = nearId === node.id;
      node.pulseAge = Math.min(PULSE_SECONDS, node.pulseAge + dt);
      const fraction = node.pulseAge / PULSE_SECONDS;
      const pulse = known ? Math.sin(Math.PI * fraction) * (1 - fraction) : 0;
      animating ||= known && node.pulseAge < PULSE_SECONDS;
      node.material.color.copy(known ? charted : node.near ? near : quiet);
      node.material.color.multiplyScalar(1 + pulse * 0.25);
      // The camera's static geometry pass also treats opacity < .5 as scenery.
      node.material.opacity = (known ? 0.42 : node.near ? 0.36 : 0.11) + pulse * 0.035;
      node.ring.scale.setScalar(1 + pulse * 0.32);
      node.glyph.position.y = node.glyphY + pulse * 0.045;
    }
    return animating;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    group.removeFromParent();
    group.clear();
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    geometries.clear();
    materials.clear();
  }

  return { group, update, dispose };
}
