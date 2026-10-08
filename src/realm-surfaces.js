import * as THREE from 'three';

// Project-authored material studies. These small periodic fields are computed
// directly into pixels; no photograph, texture service, canvas or DOM is used.
const SIZE = 128;
const TAU = Math.PI * 2;
const kinds = new Set(['stone', 'timber', 'ceramic', 'moss']);
const salts = { stone: 0x57a31cd1, timber: 0x3491a7f3, ceramic: 0x63ef128b, moss: 0x27db93a7 };
const clamp = (value, lower = 0, upper = 1) => Math.max(lower, Math.min(upper, value));
const fade = value => value * value * (3 - 2 * value);
const ramp = (lower, upper, value) => fade(clamp((value - lower) / (upper - lower)));
const wrap = (value, period) => ((value % period) + period) % period;

function hash(x, y, seed) {
  let value = Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x5f356495) ^ seed;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
}

// A periodic lattice keeps broad variations continuous across repeating UVs.
// Unequal axis frequencies give timber and moss a direction without stripes
// tied to a canvas coordinate system or seams at the texture boundary.
function noise(u, v, columns, rows, seed) {
  const x = u * columns;
  const y = v * rows;
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const fx = fade(x - cellX);
  const fy = fade(y - cellY);
  const sample = (dx, dy) => hash(wrap(cellX + dx, columns), wrap(cellY + dy, rows), seed);
  const top = sample(0, 0) * (1 - fx) + sample(1, 0) * fx;
  const bottom = sample(0, 1) * (1 - fx) + sample(1, 1) * fx;
  return top * (1 - fy) + bottom * fy;
}

function surfacePixel(kind, u, v, x, y, seed) {
  const broad = noise(u, v, 4, 4, seed);
  const middle = noise(u, v, 16, 16, seed ^ 0x296de17b);
  const fine = noise(u, v, 64, 64, seed ^ 0x519dc73f);
  const grain = hash(x, y, seed ^ 0x7a93ef41);
  const pores = ramp(0.81, 0.94, fine);

  if (kind === 'stone') {
    const warpedU = u + Math.sin(v * TAU) * 0.07;
    const mineral = noise(warpedU, v, 8, 8, seed ^ 0x4382ab17);
    const vein = 1 - ramp(0.016, 0.074, Math.abs(mineral - 0.5));
    return {
      tone: clamp(0.78 + broad * 0.13 + grain * 0.045 + vein * 0.045 - pores * 0.11, 0.7, 0.99),
      height: clamp(0.42 + middle * 0.18 + grain * 0.08 + vein * 0.055 - pores * 0.21, 0.12, 0.78),
      roughness: clamp(0.7 + middle * 0.16 + pores * 0.1 - vein * 0.05, 0.65, 0.96),
    };
  }
  if (kind === 'timber') {
    const warp = Math.sin(v * TAU) * 0.31 + Math.sin(v * TAU * 3) * 0.05 + broad * 0.24;
    const growth = 0.5 + Math.sin(TAU * (u * 9 + warp)) * 0.5;
    const fibers = noise(u, v, 48, 6, seed ^ 0x148deb63);
    const grooves = ramp(0.72, 0.91, fibers);
    return {
      tone: clamp(0.74 + broad * 0.15 + growth * 0.04 + grain * 0.035 - grooves * 0.13, 0.64, 0.97),
      height: clamp(0.35 + growth * 0.23 + fibers * 0.15 + fine * 0.04 - grooves * 0.22, 0.13, 0.8),
      roughness: clamp(0.49 + broad * 0.23 + grooves * 0.14 + grain * 0.025 - growth * 0.045, 0.44, 0.86),
    };
  }
  if (kind === 'ceramic') {
    const scratchLine = 1 - ramp(0.025, 0.13, Math.abs(Math.sin(TAU * (u * 9 + v * 4 + broad * 0.2))));
    const wear = scratchLine * ramp(0.64, 0.87, middle);
    return {
      tone: clamp(0.92 + broad * 0.05 + grain * 0.01 - wear * 0.09 - pores * 0.07, 0.78, 0.99),
      height: clamp(0.48 + fine * 0.035 - wear * 0.11 - pores * 0.1, 0.26, 0.55),
      roughness: clamp(0.28 + broad * 0.16 + wear * 0.2 + pores * 0.08, 0.28, 0.66),
    };
  }

  const fibers = Math.pow(0.5 + Math.sin(TAU * (u * 29 + Math.sin(v * TAU * 3) * 0.42 + middle * 0.32)) * 0.5, 5);
  const tuft = noise(u, v, 12, 28, seed ^ 0x3469bca3);
  const moisture = ramp(0.63, 0.91, broad);
  return {
    tone: clamp(0.68 + broad * 0.12 + fibers * 0.08 + grain * 0.025 - moisture * 0.05, 0.62, 0.93),
    height: clamp(0.27 + broad * 0.15 + fibers * 0.22 + tuft * 0.13, 0.2, 0.8),
    roughness: clamp(0.84 + middle * 0.1 + fibers * 0.05 - moisture * 0.08, 0.76, 0.99),
  };
}

function grayPixel(data, offset, value) {
  const byte = Math.round(clamp(value) * 255);
  data[offset] = data[offset + 1] = data[offset + 2] = byte;
  data[offset + 3] = 255;
}

function texture(data, colorSpace) {
  const value = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat, THREE.UnsignedByteType);
  value.colorSpace = colorSpace;
  value.wrapS = value.wrapT = THREE.RepeatWrapping;
  value.minFilter = THREE.LinearMipmapLinearFilter;
  value.magFilter = THREE.LinearFilter;
  value.generateMipmaps = true;
  value.needsUpdate = true;
  return value;
}

/**
 * A bounded PBR study for stone, timber, ceramic or moss. Gray sRGB albedo
 * modulates the host's own material color; height and roughness stay linear.
 * MeshStandardMaterial multiplies roughnessMap by its roughness scalar.
 * The host owns UV scale/bumpScale and disposes this study after shared users.
 */
export function createRealmSurface(kind, seed = 73) {
  if (!kinds.has(kind)) throw new TypeError('Realm surface must be stone, timber, ceramic or moss.');
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Realm surface seed must be an unsigned 32-bit integer.');
  const data = Array.from({ length: 3 }, () => new Uint8Array(SIZE * SIZE * 4));
  const mixedSeed = (seed ^ salts[kind]) >>> 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const pixel = surfacePixel(kind, (x + 0.5) / SIZE, (y + 0.5) / SIZE, x, y, mixedSeed);
      const offset = (y * SIZE + x) * 4;
      grayPixel(data[0], offset, pixel.tone);
      grayPixel(data[1], offset, pixel.height);
      grayPixel(data[2], offset, pixel.roughness);
    }
  }
  const map = texture(data[0], THREE.SRGBColorSpace);
  const bumpMap = texture(data[1], THREE.NoColorSpace);
  const roughnessMap = texture(data[2], THREE.NoColorSpace);
  let disposed = false;
  return {
    map, bumpMap, roughnessMap,
    dispose() {
      if (disposed) return;
      disposed = true;
      map.dispose(); bumpMap.dispose(); roughnessMap.dispose();
    },
  };
}
