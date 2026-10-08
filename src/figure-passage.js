import * as THREE from 'three';

// Original theme-specific reading apparatuses. The scientific plate stays a
// supplied image; its surrounding mechanisms are illustrative instruments.
const TAU = Math.PI * 2;
const smooth = value => value * value * (3 - 2 * value);

export function createFigurePassage({ anchor, bearing = 0, theme = 'sea', onInvalidate = () => {}, onImage = () => {} }) {
  if (!['sea', 'orbital', 'woodland'].includes(theme)) throw new TypeError('Figure passage theme must be sea, orbital or woodland.');
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

  const kit = { group, material, mesh, box, torus, annulus };
  const shell = theme === 'orbital' ? orbitalInstrument(kit)
    : theme === 'woodland' ? woodlandInstrument(kit) : seaInstrument(kit);

  // The carrier is shared, not the surrounding apparatus: the same supplied
  // image keeps its aspect ratio, sRGB colors and native flat-reader source.
  const plate = new THREE.Group();
  plate.position.z = -0.32;
  plate.scale.setScalar(1.11);
  group.add(plate);
  box(4.74, 2.86, 0.06, shell.backing, 0, 0, -0.035, plate);
  const imageMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, fog: false });
  materials.add(imageMaterial);
  const image = mesh(new THREE.PlaneGeometry(4.6, 2.76), imageMaterial, plate);
  image.position.z = 0.012;
  image.castShadow = false;
  image.visible = false;
  for (const side of [-1, 1]) {
    box(0.035, 2.96, 0.09, shell.trim, side * 2.4, 0, 0.035, plate);
    box(4.83, 0.022, 0.09, shell.trim, 0, side * 1.47, 0.035, plate);
    const clamp = box(0.17, 0.12, 0.16, shell.clamp, side * 2.4, -1.44, 0.06, plate);
    clamp.rotation.z = side * -0.08;
  }

  function apply(open = 1) {
    const opening = smooth(THREE.MathUtils.clamp(open, 0, 1));
    // Resolve the image ahead of every shutter, leaf and rail. The apparatus
    // must not project its glass, shadows or markings onto the reading plate.
    plate.position.z = -0.86 + opening * 1.74 + stagePosition * 0.035;
    shell.apply(opening, stage, stagePosition);
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

function seaInstrument({ group, material, mesh, box, torus, annulus }) {
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

  return {
    backing: dark, trim: brass, clamp: ivory,
    apply(opening, stage, stagePosition) {
      for (const { pivot, angle } of petals) pivot.rotation.z = angle - Math.PI / 2 + opening * 1.03;
      opticalLayers.forEach((layer, i) => {
        const spread = 0.17 + stagePosition * 0.16;
        layer.position.z = -0.27 + (i - 1) * spread;
        layer.rotation.y = (i - 1) * stagePosition * 0.045;
        layer.rotation.x = (i - 1) * stagePosition * -0.022;
      });
      stageInstruments.forEach((assembly, i) => { assembly.visible = i === stage; });
    },
  };
}

function orbitalInstrument({ group, material, mesh, box }) {
  const ceramic = material('#c3ced8', { roughness: 0.47, metalness: 0.34 });
  const steel = material('#34455c', { roughness: 0.29, metalness: 0.82 });
  const graphite = material('#111c2c', { roughness: 0.59, metalness: 0.56 });
  const light = material('#83e2ec', { roughness: 0.24, metalness: 0.39, emissive: '#5ba9c2', emissiveIntensity: 0.5 });

  // An open rectangular gantry, with two articulated shutter banks retracting
  // into separate side bays. Its construction deliberately has no optical ring.
  for (const side of [-1, 1]) {
    box(0.24, 6.28, 0.43, ceramic, side * 3.08, -0.24, -0.31);
    box(0.08, 5.87, 0.08, steel, side * 2.83, -0.24, -0.04);
    box(0.54, 0.17, 0.96, graphite, side * 3.08, -3.46, -0.25);
    const hinge = mesh(new THREE.CylinderGeometry(0.11, 0.11, 5.36, 12), steel);
    hinge.position.set(side * 2.88, -0.04, 0.13);
    for (const y of [-2.69, 2.45]) {
      const elbow = box(0.69, 0.17, 0.34, steel, side * 2.74, y, -0.12);
      elbow.rotation.z = side * (y > 0 ? -0.45 : 0.45);
      box(0.06, 0.17, 0.06, light, side * 3.08, y, -0.06);
    }
  }
  box(6.4, 0.22, 0.43, ceramic, 0, 2.9, -0.31);
  box(6.4, 0.27, 0.56, graphite, 0, -3.23, -0.31);
  box(5.42, 0.06, 0.06, light, 0, 2.71, -0.04);

  const shutters = [];
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group();
    group.add(hinge);
    const inward = -side;
    // Individual slats read as engineered shutters instead of a dark screen.
    for (let slat = 0; slat < 8; slat++) {
      const y = -2.02 + slat * 0.58;
      box(2.77, 0.51, 0.11, slat % 3 === 0 ? ceramic : steel,
        inward * 1.39, y, 0, hinge);
      box(2.58, 0.022, 0.015, graphite, inward * 1.39, y + 0.2, 0.07, hinge);
    }
    box(0.035, 4.61, 0.045, light, inward * 2.74, 0, 0.065, hinge);
    shutters.push({ hinge, side });
  }

  // The stage control moves a real scan carriage below the source image.
  // It illuminates its own rail; it never draws a fictional plot over the data.
  const carriage = new THREE.Group();
  carriage.position.y = -2.32;
  group.add(carriage);
  box(0.74, 0.28, 0.39, ceramic, 0, 0, 0, carriage);
  box(0.44, 0.07, 0.06, light, 0, 0.11, 0.23, carriage);
  for (const side of [-1, 1]) {
    const wheel = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12), graphite, carriage);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(side * 0.26, -0.16, 0.14);
  }
  box(4.82, 0.06, 0.12, steel, 0, -2.52, -0.01);
  for (const x of [-1.82, 0, 1.82]) box(0.11, 0.11, 0.06, light, x, -2.72, 0.04);

  return {
    backing: graphite, trim: ceramic, clamp: steel,
    apply(opening, _stage, stagePosition) {
      for (const { hinge, side } of shutters) {
        hinge.position.set(side * (2.88 + opening * 1.1), -0.04, 0.13 - opening * 0.17);
        hinge.rotation.y = -side * opening * 1.05;
      }
      carriage.position.x = -1.82 + stagePosition * 1.82;
      carriage.position.z = 0.11 + opening * 0.22;
    },
  };
}

function woodlandInstrument({ group, material, mesh, box }) {
  const wood = material('#8c6545', { roughness: 0.86, metalness: 0.01 });
  const darkWood = material('#352e24', { roughness: 0.91, metalness: 0 });
  const bronze = material('#a18c63', { roughness: 0.44, metalness: 0.62 });
  const linen = material('#e2d7bc', { roughness: 0.91, metalness: 0 });
  const glass = material('#b2c6ad', { transparent: true, opacity: 0.12,
    roughness: 0.13, metalness: 0, side: THREE.DoubleSide, depthWrite: false });

  // A freestanding collection cabinet: broad timber posts, inset translucent
  // doors and physical specimen drawers. It unfolds rather than retracts.
  for (const side of [-1, 1]) {
    box(0.26, 6.76, 0.49, wood, side * 2.94, -0.65, -0.26);
    box(0.11, 5.28, 0.64, darkWood, side * 2.74, 0.09, -0.71);
    box(0.6, 0.13, 0.71, darkWood, side * 2.94, -4.1, -0.18);
    for (const y of [-2.43, 2.49]) {
      const hinge = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.32, 12), bronze);
      hinge.position.set(side * 2.89, y, 0.17);
    }
  }
  box(6.18, 0.27, 0.57, wood, 0, 2.88, -0.27);
  box(5.74, 0.075, 0.52, bronze, 0, 2.67, -0.25);
  box(5.72, 0.16, 0.76, wood, 0, -2.02, -0.32);
  box(5.72, 0.12, 0.69, darkWood, 0, -3.52, -0.32);

  const doors = [];
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(side * 2.89, 0.18, 0.17);
    group.add(hinge);
    const inward = -side;
    for (const edge of [0.06, 2.81]) box(0.095, 5.18, 0.095, wood, inward * edge, 0, 0, hinge);
    for (const y of [-2.54, 2.54]) box(2.84, 0.1, 0.095, wood, inward * 1.43, y, 0, hinge);
    box(2.68, 4.94, 0.022, glass, inward * 1.43, 0, 0, hinge);
    box(0.085, 0.34, 0.085, bronze, inward * 2.67, -0.57, 0.07, hinge);
    // Separate corner straps and bolts make the cabinet's joinery legible.
    for (const y of [-2.46, 2.46]) {
      box(0.35, 0.033, 0.019, bronze, inward * 0.23, y, 0.063, hinge);
      box(0.033, 0.32, 0.019, bronze, inward * 0.07, y - Math.sign(y) * 0.11, 0.063, hinge);
    }
    doors.push({ hinge, side });
  }

  const trays = [];
  for (let i = 0; i < 3; i++) {
    const drawer = new THREE.Group();
    drawer.position.y = -2.26 - i * 0.4;
    group.add(drawer);
    box(5.48, 0.21, 0.055, wood, 0, 0, 0.07, drawer);
    box(5.29, 0.035, 0.79, darkWood, 0, -0.09, -0.3, drawer);
    box(0.43, 0.038, 0.085, bronze, 0, 0, 0.14, drawer);
    box(0.26, 0.07, 0.007, linen, -2.15, 0, 0.103, drawer);
    trays.push(drawer);
  }
  return {
    backing: darkWood, trim: bronze, clamp: linen,
    apply(opening, _stage, stagePosition) {
      // Swing beyond a right angle so the panes remain outside the plate's
      // sightline when the desktop reader offsets the camera to one side.
      for (const { hinge, side } of doors) hinge.rotation.y = side * opening * 2.1;
      trays.forEach((drawer, index) => {
        // Crossfade the physical extension while keeping each drawer stable.
        const active = Math.max(0, 1 - Math.abs(stagePosition - index));
        drawer.position.z = -0.35 + opening * active * 0.76;
      });
    },
  };
}
