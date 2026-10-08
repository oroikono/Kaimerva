import * as THREE from 'three';

// Original native geometry inspired by this project's own approved portal icon.
// The opening remains empty: there is no image plane, downloaded model or skybox.
const TAU = Math.PI * 2;

function hash(x, y, seed) {
  let value = Math.imul(x + seed * 79, 374761393) ^ Math.imul(y + seed * 131, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function noise(x, y, seed) {
  const ix = Math.floor(x); const iy = Math.floor(y);
  const smooth = value => value * value * (3 - 2 * value);
  const tx = smooth(x - ix); const ty = smooth(y - iy);
  const a = THREE.MathUtils.lerp(hash(ix, iy, seed), hash(ix + 1, iy, seed), tx);
  const b = THREE.MathUtils.lerp(hash(ix, iy + 1, seed), hash(ix + 1, iy + 1, seed), tx);
  return THREE.MathUtils.lerp(a, b, ty);
}

/** A static coastal gateway. Local +Z faces the viewer; local Y is vertical. */
export function createRealmPortal({ position = new THREE.Vector3(), bearing = 0, scale = 1 } = {}) {
  if (!position?.isVector3 || ![position.x, position.y, position.z, bearing, scale].every(Number.isFinite)
    || scale <= 0) throw new TypeError('Realm portal requires a finite Vector3, bearing and positive scale.');
  const group = new THREE.Group();
  group.name = 'coastal-realm-gateway';
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  let disposed = false;

  const texture = (bytes, colorSpace) => {
    const result = new THREE.DataTexture(bytes, 128, 128, THREE.RGBAFormat);
    result.colorSpace = colorSpace;
    result.wrapS = result.wrapT = THREE.RepeatWrapping;
    result.magFilter = THREE.LinearFilter;
    result.minFilter = THREE.LinearMipmapLinearFilter;
    result.generateMipmaps = true;
    result.anisotropy = 2;
    result.needsUpdate = true;
    textures.add(result);
    return result;
  };
  const colorBytes = new Uint8Array(128 * 128 * 4);
  const reliefBytes = new Uint8Array(colorBytes.length);
  const roughnessBytes = new Uint8Array(colorBytes.length);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const grain = hash(x, y, 73);
    const broad = noise(x / 23, y / 31, 11);
    const middle = noise(x / 7, y / 9, 17);
    const vein = Math.abs(Math.sin(x * 0.11 + Math.sin(y * 0.042) * 2.8 + broad * 1.3));
    const pore = grain < 0.06 ? 0.15 : 0;
    const tone = 0.77 + broad * 0.12 + middle * 0.08 + grain * 0.035 - pore - (vein < 0.025 ? 0.045 : 0);
    const relief = 0.41 + middle * 0.25 + grain * 0.19 - pore;
    const roughness = 0.71 + broad * 0.2 + grain * 0.08;
    const offset = (y * 128 + x) * 4;
    colorBytes[offset] = Math.round(244 * tone);
    colorBytes[offset + 1] = Math.round(240 * tone);
    colorBytes[offset + 2] = Math.round(229 * tone);
    colorBytes[offset + 3] = 255;
    reliefBytes.fill(Math.round(relief * 255), offset, offset + 3);
    reliefBytes[offset + 3] = 255;
    roughnessBytes.fill(Math.round(roughness * 255), offset, offset + 3);
    roughnessBytes[offset + 3] = 255;
  }
  const stoneMap = texture(colorBytes, THREE.SRGBColorSpace);
  const stoneRelief = texture(reliefBytes, THREE.NoColorSpace);
  const stoneRoughness = texture(roughnessBytes, THREE.NoColorSpace);
  const material = (color, options = {}) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0, ...options });
    materials.add(value);
    return value;
  };
  const stone = material('#e2dfd6', { map: stoneMap, bumpMap: stoneRelief, bumpScale: 0.023, roughnessMap: stoneRoughness });
  const shadedStone = material('#b9b6ac', { map: stoneMap, bumpMap: stoneRelief, bumpScale: 0.02, roughnessMap: stoneRoughness });
  const recess = material('#333f46', { roughness: 0.98 });
  const wetRock = new THREE.MeshPhysicalMaterial({ color: '#263b43', map: stoneMap, bumpMap: stoneRelief, bumpScale: 0.026,
    roughness: 0.34, roughnessMap: stoneRoughness, metalness: 0.02, clearcoat: 0.34, clearcoatRoughness: 0.23 });
  materials.add(wetRock);
  const bronze = material('#aa8650', { metalness: 0.84, roughness: 0.43, bumpMap: stoneRelief, bumpScale: 0.008 });
  const violet = material('#423f6c', { emissive: '#8f88e7', emissiveIntensity: 1.8, roughness: 0.45 });
  const cyan = material('#3c6670', { emissive: '#9cd9e5', emissiveIntensity: 1.2, roughness: 0.45 });

  const mesh = (geometry, surface, name, parent = group) => {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, surface);
    object.name = name;
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const polygon = points => {
    const shape = new THREE.Shape();
    shape.moveTo(...points[0]);
    points.slice(1).forEach(point => shape.lineTo(...point));
    shape.closePath();
    return shape;
  };
  const extrusion = (points, depth, seed, bevel = 0.035, wear = 0.009) => {
    const geometry = new THREE.ExtrudeGeometry(polygon(points), {
      depth, steps: 1, bevelEnabled: true, bevelSegments: 2,
      bevelSize: bevel, bevelThickness: bevel, curveSegments: 8,
    });
    geometry.translate(0, 0, -depth / 2);
    const vertices = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i); const y = vertices.getY(i); const z = vertices.getZ(i);
      const chipped = noise(x * 6 + z * 2, y * 7, seed) - 0.5;
      vertices.setXYZ(i, x + chipped * wear, y + (noise(x * 9, y * 4 + z, seed + 19) - 0.5) * wear,
        z + (noise(x * 5, y * 5, seed + 41) - 0.5) * wear);
      // Offset the locally generated texture per piece without sharing UV state.
      uv.setXY(i, uv.getX(i) * 1.2 + seed * 0.137, uv.getY(i) * 1.2 + seed * 0.079);
    }
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  };
  const boxStone = (width, height, depth, surface, x, y, z, seed, name) => {
    const geometry = extrusion([[-width / 2, -height / 2], [width / 2, -height / 2],
      [width / 2, height / 2], [-width / 2, height / 2]], depth, seed);
    const object = mesh(geometry, surface, name);
    object.position.set(x, y, z);
    return object;
  };

  // Three genuinely thick, chipped steps give the masonry a ground contact.
  const step = (width, depth, height, y, seed, name) => {
    const points = [
      [-width * 0.49, -depth * 0.5], [-width * 0.15, -depth * 0.48], [width * 0.46, -depth * 0.5],
      [width * 0.5, -depth * 0.28], [width * 0.49, depth * 0.43], [width * 0.25, depth * 0.49],
      [-width * 0.44, depth * 0.5], [-width * 0.51, depth * 0.22],
    ];
    const geometry = extrusion(points, height, seed, 0.035, 0.024);
    geometry.rotateX(-Math.PI / 2);
    const object = mesh(geometry, wetRock, name);
    object.position.y = y;
    return object;
  };
  step(4.56, 2.2, 0.18, 0.02, 131, 'wet-rock-lower-step');
  step(4.1, 1.83, 0.15, 0.19, 137, 'wet-rock-middle-step');
  step(3.71, 1.45, 0.13, 0.335, 143, 'wet-rock-threshold');
  for (const side of [-1, 1]) {
    boxStone(1.02, 0.43, 1.01, shadedStone, side * 1.48, 0.58, 0, side < 0 ? 151 : 157, `pier-foot-${side}`);
    for (let course = 0; course < 4; course++) {
      const bottom = 0.805 + course * 0.726;
      const lean = course * -0.006;
      const inner = 1.105 + lean;
      const outer = 1.835 + lean;
      const x0 = side < 0 ? -outer : inner;
      const x1 = side < 0 ? -inner : outer;
      const inset = (course % 2 ? -1 : 1) * 0.01;
      const points = [[x0 + inset, bottom], [x1, bottom + 0.012], [x1 - inset, bottom + 0.711], [x0, bottom + 0.716]];
      mesh(extrusion(points, 0.79, 173 + course * 11 + side * 3), course === 0 ? shadedStone : stone, `pier-${side}-course-${course}`);
    }
  }

  // Independent curved voussoirs preserve the pointed opening and masonry seams.
  const outerCurve = new THREE.CubicBezierCurve(new THREE.Vector2(1.82, 3.7), new THREE.Vector2(1.05, 4.13),
    new THREE.Vector2(0.37, 4.96), new THREE.Vector2(0, 5.65));
  const innerCurve = new THREE.CubicBezierCurve(new THREE.Vector2(1.087, 3.7), new THREE.Vector2(0.84, 4.09),
    new THREE.Vector2(0.18, 4.57), new THREE.Vector2(0, 5.03));
  for (const side of [-1, 1]) {
    for (let course = 0; course < 4; course++) {
      const from = course / 4 + 0.003;
      const to = (course + 1) / 4 - 0.003;
      const points = [];
      for (let i = 0; i <= 5; i++) {
        const p = outerCurve.getPoint(THREE.MathUtils.lerp(from, to, i / 5));
        points.push([p.x * side, p.y]);
      }
      for (let i = 5; i >= 0; i--) {
        const p = innerCurve.getPoint(THREE.MathUtils.lerp(from, to, i / 5));
        points.push([p.x * side, p.y]);
      }
      mesh(extrusion(points, 0.79, 239 + course * 7 + side * 3, 0.025), stone, `arch-${side}-voussoir-${course}`);
    }
  }

  const diamond = (halfWidth, halfHeight, centerY) => [[0, centerY + halfHeight], [halfWidth, centerY],
    [0, centerY - halfHeight], [-halfWidth, centerY]];
  const keyBacking = mesh(extrusion(diamond(0.43, 0.61, 4.99), 0.105, 307, 0.025, 0.004), shadedStone, 'stone-keystone-backing');
  keyBacking.position.z = 0.42;
  const keyRecess = mesh(extrusion(diamond(0.285, 0.405, 5.04), 0.035, 311, 0.012, 0.002), recess, 'keystone-recess');
  keyRecess.position.z = 0.497;
  const keyMetal = mesh(extrusion(diamond(0.237, 0.355, 5.04), 0.028, 313, 0.018, 0.003), bronze, 'aged-gold-inset');
  keyMetal.position.z = 0.53;

  const tube = (points, radius, surface, name, segments = 12) => {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    return mesh(new THREE.TubeGeometry(curve, segments, radius, 5, false), surface, name);
  };
  // Fine geometric fracture threads follow the weathered face.
  for (const [index, side] of [-1, 1].entries()) {
    const x = side * 1.49;
    tube([[x - 0.29, 1.52, 0.441], [x - 0.12, 1.46, 0.446], [x + 0.015, 1.21, 0.445],
      [x + 0.18, 1.13, 0.441], [x + 0.28, 0.89, 0.438]], 0.008, recess, `lower-weather-fissure-${side}`);
    tube([[x - 0.21, 3.16, 0.442], [x - 0.07, 3.08, 0.445], [x + 0.015, 2.91, 0.444],
      [x + 0.17, 2.85, 0.44]], 0.006, recess, `upper-weather-fissure-${side}`, 10);
    const luminousPoints = [[side * 1.021, 0.81, 0.13], [side * 1.021, 2.3, 0.13], [side * 1.021, 3.7, 0.13]];
    for (let i = 1; i <= 16; i++) {
      const p = innerCurve.getPoint(i / 16);
      luminousPoints.push([side * Math.max(0, p.x - 0.066), p.y, 0.13]);
    }
    const channel = tube(luminousPoints, 0.017, violet, `recessed-inner-light-${index}`, 48);
    channel.castShadow = false;
  }
  const thresholdLight = tube([[-1.025, 0.415, 0.145], [0, 0.415, 0.145], [1.025, 0.415, 0.145]],
    0.016, cyan, 'recessed-threshold-light', 8);
  thresholdLight.castShadow = false;

  // A few low irregular rocks meet the surrounding water without billboard mist.
  for (let i = 0; i < 9; i++) {
    const angle = i / 9 * TAU;
    const radius = 0.15 + hash(i, 1, 367) * 0.09;
    const geometry = new THREE.DodecahedronGeometry(radius, 0);
    const vertices = geometry.attributes.position;
    for (let vertex = 0; vertex < vertices.count; vertex++) {
      const x = vertices.getX(vertex); const y = vertices.getY(vertex); const z = vertices.getZ(vertex);
      const relief = 0.9 + noise(x * 19, z * 17 + y, 373 + i) * 0.16;
      vertices.setXYZ(vertex, x * relief, y * relief, z * relief);
    }
    geometry.computeVertexNormals();
    const rock = mesh(geometry, wetRock, `waterline-rock-${i}`);
    rock.position.set(Math.cos(angle) * 2.14, -0.008, Math.sin(angle) * 1.04);
    rock.scale.set(1.5, 0.49, 0.86);
    rock.rotation.y = angle + hash(i, 3, 379);
  }
  const innerLight = new THREE.PointLight('#aca4ff', 2.8, 6.2, 2);
  innerLight.name = 'gateway-inner-spill';
  innerLight.position.set(0, 3.55, 0.45);
  const floorLight = new THREE.PointLight('#92cbdc', 1.4, 3.5, 2);
  floorLight.name = 'gateway-threshold-spill';
  floorLight.position.set(0, 0.69, 0.49);
  // Lights are intentionally shadow-free; the host's primary light supplies contact shadows.
  group.add(innerLight, floorLight);
  group.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(group);
  group.userData.portalLocalExtent = { width: bounds.max.x - bounds.min.x, height: bounds.max.y - bounds.min.y,
    depth: bounds.max.z - bounds.min.z };
  group.position.copy(position);
  group.rotation.y = bearing;
  group.scale.setScalar(scale);
  group.updateWorldMatrix(true, true);

  return {
    group,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      group.clear();
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(surface => surface.dispose());
      textures.forEach(value => value.dispose());
      geometries.clear();
      materials.clear();
      textures.clear();
    },
  };
}
