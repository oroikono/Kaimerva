import * as THREE from 'three';

// Original optical apparatus. The scientific plate stays a supplied image;
// these surrounding mechanisms are an illustrative reading instrument.
const TAU = Math.PI * 2;
const smooth = value => value * value * (3 - 2 * value);

export function createFigurePassage({ anchor, bearing = 0, onInvalidate = () => {}, onImage = () => {} }) {
  const group = new THREE.Group();
  group.position.copy(anchor);
  group.rotation.y = bearing;
  const geometries = new Set();
  const materials = new Set();
  let imageTexture = null;
  let loadGeneration = 0;
  let disposed = false;
  let stage = 0;
  let stagePosition = 0;
  const material = (color, options = {}) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.05, ...options });
    materials.add(value);
    return value;
  };
  const mesh = (geometry, mat, parent = group) => {
    geometries.add(geometry);
    const value = new THREE.Mesh(geometry, mat);
    value.castShadow = true;
    value.receiveShadow = true;
    parent.add(value);
    return value;
  };
  const box = (w, h, d, mat, x, y, z, parent = group) => {
    const value = mesh(new THREE.BoxGeometry(w, h, d), mat, parent);
    value.position.set(x, y, z);
    return value;
  };
  const torus = (radius, tube, mat, z = 0, parent = group) => {
    const value = mesh(new THREE.TorusGeometry(radius, tube, 8, 96), mat, parent);
    value.position.z = z;
    return value;
  };
  const annulus = (outer, inner, depth, mat, z) => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outer, 0, TAU, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, inner, 0, TAU, true);
    shape.holes.push(hole);
    const value = mesh(new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.035,
      bevelThickness: 0.035, curveSegments: 72, steps: 1,
    }), mat);
    value.position.z = z;
    return value;
  };

  const limestone = material('#ccbea0', { roughness: 0.91, metalness: 0 });
  const brass = material('#a88252', { roughness: 0.31, metalness: 0.78 });
  const dark = material('#183744', { roughness: 0.36, metalness: 0.62 });
  const bladeMaterial = material('#3c5358', { roughness: 0.33, metalness: 0.71 });
  const glass = material('#a2c9c4', { transparent: true, opacity: 0.13, roughness: 0.14,
    metalness: 0.12, side: THREE.DoubleSide, depthWrite: false });
  const teal = material('#81b6ae', { roughness: 0.27, metalness: 0.34 });
  const ivory = material('#e7dec6', { roughness: 0.7, metalness: 0.02 });

  // A cut stone housing with an inset machined brass ring and individually
  // hinged iris leaves. It is a mechanism, rather than an orbit of icons.
  annulus(3.52, 2.71, 0.19, limestone, 0.17);
  annulus(3.23, 2.86, 0.08, dark, 0.39);
  torus(2.75, 0.033, brass, 0.39);
  torus(3.44, 0.026, brass, 0.43);
  torus(3.08, 0.012, brass, 0.5);
  for (let i = 0; i < 60; i++) {
    const angle = i / 60 * TAU;
    const value = box(i % 5 === 0 ? 0.021 : 0.011, i % 5 === 0 ? 0.12 : 0.054, 0.012,
      i % 5 === 0 ? ivory : brass, Math.cos(angle) * 3.28, Math.sin(angle) * 3.28, 0.48);
    value.rotation.z = angle - Math.PI / 2;
  }
  const petals = [];
  const blade = new THREE.Shape();
  blade.moveTo(0.12, 0.13);
  blade.lineTo(-0.41, -0.14);
  blade.quadraticCurveTo(-1.19, -0.7, -1.02, -1.91);
  blade.lineTo(-0.2, -2.24);
  blade.quadraticCurveTo(0.75, -1.46, 0.8, -0.44);
  blade.closePath();
  const bladeGeometry = new THREE.ExtrudeGeometry(blade, {
    depth: 0.028, bevelEnabled: true, bevelSize: 0.012,
    bevelThickness: 0.012, bevelSegments: 1, curveSegments: 12,
  });
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * TAU;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(angle) * 2.98, Math.sin(angle) * 2.98, 0.11 + i * 0.006);
    pivot.rotation.z = angle - Math.PI / 2;
    mesh(bladeGeometry, bladeMaterial, pivot);
    const pin = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.045, 16), brass, pivot);
    pin.rotation.x = Math.PI / 2;
    pin.position.z = 0.065;
    group.add(pivot);
    petals.push({ pivot, angle });
  }

  // A single image on a real suspended plate. Small chamfered rails leave the
  // plate's source colors intact instead of redrawing a paper as fake data.
  const plate = new THREE.Group();
  plate.position.z = -0.32;
  // Let the work lead the composition; scale the carrier and every clamp with
  // the image so the surrounding instrument remains a reading support.
  plate.scale.setScalar(1.11);
  group.add(plate);
  box(4.74, 2.86, 0.06, dark, 0, 0, -0.035, plate);
  const imageMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
  materials.add(imageMaterial);
  const image = mesh(new THREE.PlaneGeometry(4.6, 2.76), imageMaterial, plate);
  image.position.z = 0.012;
  image.castShadow = false;
  image.visible = false;
  for (const side of [-1, 1]) {
    box(0.035, 2.96, 0.09, brass, side * 2.4, 0, 0.035, plate);
    box(4.83, 0.022, 0.09, brass, 0, side * 1.47, 0.035, plate);
    const clamp = box(0.17, 0.12, 0.16, ivory, side * 2.4, -1.44, 0.06, plate);
    clamp.rotation.z = side * -0.08;
  }

  const opticalLayers = [];
  for (let layer = 0; layer < 3; layer++) {
    const assembly = new THREE.Group();
    const ring = torus(2.64 - layer * 0.09, layer === 1 ? 0.017 : 0.01,
      layer === 1 ? teal : brass, 0, assembly);
    ring.castShadow = false;
    const coating = mesh(new THREE.RingGeometry(2.43 - layer * 0.09, 2.55 - layer * 0.09, 96), glass, assembly);
    coating.castShadow = false;
    group.add(assembly);
    opticalLayers.push(assembly);
  }
  const stageInstruments = [];
  for (let i = 0; i < 3; i++) {
    const assembly = new THREE.Group();
    const y = -1.92;
    if (i === 0) {
      for (const side of [-1, 1]) {
        const pod = mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.34, 24), brass, assembly);
        pod.rotation.x = Math.PI / 2;
        pod.position.set(side * 1.42, y, 0.25);
        const lens = mesh(new THREE.SphereGeometry(0.12, 20, 12), teal, assembly);
        lens.scale.z = 0.35;
        lens.position.set(side * 1.42, y, 0.45);
        box(0.78, 0.027, 0.04, brass, side * 0.72, y, 0.2, assembly);
      }
    } else if (i === 1) {
      for (let sweep = 0; sweep < 5; sweep++) {
        const arc = mesh(new THREE.TorusGeometry(0.4 + sweep * 0.19, 0.017, 6, 40, Math.PI),
          sweep % 2 ? teal : brass, assembly);
        arc.rotation.z = -Math.PI / 2;
        arc.position.set(-0.45 + sweep * 0.17, y, 0.06 + sweep * 0.11);
      }
    } else {
      for (let node = 0; node < 9; node++) {
        const x = -1.28 + node * 0.32;
        const value = mesh(new THREE.SphereGeometry(node % 2 ? 0.035 : 0.065, 12, 8),
          node % 2 ? brass : teal, assembly);
        value.position.set(x, y + Math.sin(node * Math.PI / 2) * 0.11, 0.32);
      }
      box(2.94, 0.016, 0.016, brass, 0, y, 0.12, assembly);
    }
    group.add(assembly);
    stageInstruments.push(assembly);
  }
  // Ground the instrument in the observatory instead of leaving a screen in
  // empty space. Low support arms remain peripheral to the scientific plate.
  for (const side of [-1, 1]) {
    const arm = box(0.11, 1.8, 0.13, dark, side * 1.65, -3.48, -0.06);
    arm.rotation.z = side * 0.16;
    box(0.53, 0.1, 0.52, limestone, side * 1.78, -4.37, -0.06);
  }
  const seam = torus(2.62, 0.012, ivory, -0.4);
  seam.castShadow = false;

  function apply(open = 1) {
    const opening = smooth(THREE.MathUtils.clamp(open, 0, 1));
    for (const { pivot, angle } of petals) pivot.rotation.z = angle - Math.PI / 2 + opening * 1.03;
    // The carrier clears the hinged leaves as it resolves: the source figure
    // must never be occluded by the decorative iris in the reading position.
    plate.position.z = -0.86 + opening * 1.51 + stagePosition * 0.07;
    opticalLayers.forEach((layer, i) => {
      const spread = 0.17 + stagePosition * 0.16;
      layer.position.z = -0.27 + (i - 1) * spread;
      layer.rotation.y = (i - 1) * stagePosition * 0.045;
      layer.rotation.x = (i - 1) * stagePosition * -0.022;
    });
    stageInstruments.forEach((assembly, i) => { assembly.visible = i === stage; });
  }
  apply(0);

  function setStage(nextStage, imageUrl, immediate = false) {
    if (disposed) return;
    if (!Number.isInteger(nextStage) || nextStage < 0 || nextStage > 2) throw new RangeError('Figure passage stage must be 0, 1 or 2.');
    stage = nextStage;
    if (immediate) stagePosition = stage;
    const generation = ++loadGeneration;
    image.visible = false;
    if (imageTexture) { imageMaterial.map = null; imageTexture.dispose(); imageTexture = null; }
    onImage({ ready: false, stage });
    if (!imageUrl) { onInvalidate(); return; }
    let url;
    try {
      url = new URL(imageUrl, window.location.href);
      if (url.origin !== window.location.origin || !['http:', 'https:'].includes(url.protocol)) throw new TypeError('Figure texture must be a local site image.');
    } catch {
      onImage({ ready: false, stage, error: true });
      onInvalidate();
      return;
    }
    new THREE.TextureLoader().load(url.href, texture => {
      if (disposed || generation !== loadGeneration) { texture.dispose(); return; }
      imageTexture = texture;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      imageMaterial.map = texture;
      imageMaterial.needsUpdate = true;
      const ratio = texture.image.width / texture.image.height;
      image.scale.set(ratio >= 5 / 3 ? 1 : ratio / (5 / 3), ratio >= 5 / 3 ? (5 / 3) / ratio : 1, 1);
      image.visible = true;
      onImage({ ready: true, stage });
      onInvalidate();
    }, undefined, () => {
      if (disposed || generation !== loadGeneration) return;
      onImage({ ready: false, stage, error: true });
      onInvalidate();
    });
    onInvalidate();
  }

  return {
    group,
    setStage,
    update(dt, open, immediate = false) {
      if (disposed) return false;
      if (immediate) stagePosition = stage;
      else stagePosition = THREE.MathUtils.damp(stagePosition, stage, 7, dt);
      if (Math.abs(stagePosition - stage) < 0.001) stagePosition = stage;
      apply(open);
      return stagePosition !== stage;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      loadGeneration++;
      imageMaterial.map = null;
      imageTexture?.dispose();
      imageTexture = null;
      geometries.forEach(value => value.dispose());
      materials.forEach(value => value.dispose());
      group.removeFromParent();
      group.clear();
    },
  };
}
