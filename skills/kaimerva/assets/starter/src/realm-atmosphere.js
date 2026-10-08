import * as THREE from 'three';

// Original, deterministic panorama construction. No photographed sky, HDR,
// downloaded texture or DOM canvas is required. This is an authored atmosphere,
// not a physical atmosphere simulation or a rendered-quality guarantee.
const WIDTH = 512;
const HEIGHT = 256;
const TAU = Math.PI * 2;
const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const smooth = value => value * value * (3 - 2 * value);
const mix = (a, b, weight) => a + (b - a) * weight;
const gaussian = (value, center, spread) => Math.exp(-(((value - center) / spread) ** 2));
const rgb = hex => new THREE.Color(hex).toArray();

function randomSequence(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function lattice(x, y, z, seed) {
  let value = (Math.imul(x, 104729) ^ Math.imul(y, 130363) ^ Math.imul(z, 155921) ^ seed) >>> 0;
  value ^= value >>> 15; value = Math.imul(value, 2246822519);
  value ^= value >>> 13; value = Math.imul(value, 3266489917);
  return (value >>> 0) / 4294967295;
}

function noise(x, y, z, seed) {
  const ix = Math.floor(x); const iy = Math.floor(y); const iz = Math.floor(z);
  const sx = smooth(x - ix); const sy = smooth(y - iy); const sz = smooth(z - iz);
  const slice = dz => mix(
    mix(lattice(ix, iy, iz + dz, seed), lattice(ix + 1, iy, iz + dz, seed), sx),
    mix(lattice(ix, iy + 1, iz + dz, seed), lattice(ix + 1, iy + 1, iz + dz, seed), sx), sy);
  return mix(slice(0), slice(1), sz);
}

function cloudNoise(x, y, z, seed) {
  let total = 0; let weight = 0.57; let scale = 1;
  for (let octave = 0; octave < 4; octave++) {
    total += noise(x * scale, y * scale, z * scale, seed + octave * 97) * weight;
    scale *= 2.13; weight *= 0.43;
  }
  return total;
}

const directions = {
  sea: new THREE.Vector3(-0.54, 0.2, -0.817).normalize(),
  woodland: new THREE.Vector3(-0.57, 0.43, -0.73).normalize(),
};

const palettes = {
  sea: { zenith: '#040814', horizon: '#536b92', ground: '#111d34', cloud: '#8095b8', veil: '#514c87' },
  orbital: { zenith: '#02040c', horizon: '#18243d', ground: '#080e1b', cloud: '#675684', veil: '#334d89' },
  woodland: { zenith: '#061017', horizon: '#59757a', ground: '#0c201f', cloud: '#72908b', veil: '#354c68' },
};

function canopyProfile(seed) {
  const random = randomSequence(seed);
  const trees = Array.from({ length: 92 }, () => ({
    angle: random() * TAU - Math.PI,
    height: 0.1 + random() * 0.26,
    width: 0.022 + random() * 0.07,
  }));
  return Array.from({ length: WIDTH }, (_, column) => {
    const angle = (column / (WIDTH - 1) - 0.5) * TAU;
    let height = 0;
    for (const tree of trees) {
      const distance = Math.abs(Math.atan2(Math.sin(angle - tree.angle), Math.cos(angle - tree.angle)));
      if (distance < tree.width) height = Math.max(height, tree.height * (1 - (distance / tree.width) ** 0.8));
    }
    return height;
  });
}

function addStars(pixels, theme, seed) {
  const random = randomSequence(seed);
  const count = theme === 'orbital' ? 420 : theme === 'sea' ? 185 : 120;
  const minimumElevation = theme === 'woodland' ? 0.47 : 0.14;
  for (let star = 0; star < count; star++) {
    const longitude = random() * TAU - Math.PI;
    const elevation = minimumElevation + random() * (0.95 - minimumElevation);
    const centerX = (longitude / TAU + 0.5) * (WIDTH - 1);
    const centerY = (Math.asin(elevation) / Math.PI + 0.5) * (HEIGHT - 1);
    const brightness = 0.05 + random() ** 5 * 0.75;
    const radius = brightness > 0.52 ? 1.24 : 0.65;
    const warm = random() > 0.87;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = Math.round(centerX) + dx; const y = Math.round(centerY) + dy;
      if (y < 0 || y >= HEIGHT) continue;
      const distance = Math.hypot(x - centerX, y - centerY);
      const amount = Math.exp(-((distance / radius) ** 2) * 2.4) * brightness;
      const wrapped = ((x % (WIDTH - 1)) + WIDTH - 1) % (WIDTH - 1);
      const offset = (y * WIDTH + wrapped) * 3;
      pixels[offset] += amount * (warm ? 1 : 0.76);
      pixels[offset + 1] += amount * (warm ? 0.86 : 0.89);
      pixels[offset + 2] += amount;
    }
  }
}

function buildTexture(theme) {
  const seed = theme === 'sea' ? 84293 : theme === 'orbital' ? 152719 : 237043;
  const colors = Object.fromEntries(Object.entries(palettes[theme]).map(([name, color]) => [name, rgb(color)]));
  const linear = new Float32Array(WIDTH * HEIGHT * 3);
  const canopy = theme === 'woodland' ? canopyProfile(seed) : null;
  const foliage = rgb('#0b2225'); const moonColor = rgb('#ebedff');
  const moon = directions[theme];
  const moonRadius = theme === 'woodland' ? 0.045 : 0.039;
  for (let row = 0; row < HEIGHT; row++) {
    const latitude = (row / (HEIGHT - 1) - 0.5) * Math.PI;
    const elevation = Math.sin(latitude); const horizontal = Math.cos(latitude);
    for (let column = 0; column < WIDTH; column++) {
      const longitude = (column / (WIDTH - 1) - 0.5) * TAU;
      const x = horizontal * Math.cos(longitude); const z = horizontal * Math.sin(longitude);
      const offset = (row * WIDTH + column) * 3;
      const horizonWeight = elevation >= 0 ? (1 - clamp(elevation)) ** 2.9 : Math.exp(elevation * 7.5);
      const base = elevation >= 0 ? colors.zenith : colors.ground;
      const vapor = cloudNoise(x * 4.2 + 7.3, elevation * 9.1 - 4, z * 4.2, seed);
      const fine = noise(x * 20, elevation * 33, z * 20, seed + 11);
      const cloudBand = gaussian(elevation, theme === 'orbital' ? 0.38 : 0.15, theme === 'orbital' ? 0.42 : 0.13);
      const clouds = clamp((vapor - 0.34) * 2.6) * cloudBand;
      // Sea cloud banks are stratified over a low mist layer. Space opens a
      // slanted galactic band. Forest silhouettes interrupt its horizon.
      const band = gaussian(elevation - x * 0.22 + z * 0.09, 0.42, 0.2);
      const veil = theme === 'orbital' ? band * clamp(vapor * 1.8 - 0.36) * 0.48
        : gaussian(elevation, 0.38, 0.18) * clamp(vapor - 0.43) * 0.7;
      const mist = theme === 'orbital' ? 0 : gaussian(elevation, 0.02, 0.075) * (0.14 + vapor * 0.2);
      for (let channel = 0; channel < 3; channel++) {
        let value = mix(base[channel], colors.horizon[channel], horizonWeight);
        value = mix(value, colors.cloud[channel], clouds * (theme === 'orbital' ? 0.32 : 0.52));
        value = mix(value, colors.veil[channel], veil);
        value = mix(value, colors.cloud[channel], mist);
        linear[offset + channel] = value;
      }

      if (moon && elevation > 0) {
        const angle = Math.acos(clamp(x * moon.x + elevation * moon.y + z * moon.z, -1, 1));
        const halo = Math.exp(-((angle / 0.17) ** 2)) * 0.095 + Math.exp(-((angle / 0.064) ** 2)) * 0.25;
        for (let channel = 0; channel < 3; channel++) linear[offset + channel] += halo * moonColor[channel];
        if (angle < moonRadius) {
          const limb = Math.sqrt(1 - (angle / moonRadius) ** 2);
          const mottling = noise(x * 124, elevation * 124, z * 124, seed + 37);
          const brightness = 0.72 + limb * 0.2 + mottling * 0.08;
          for (let channel = 0; channel < 3; channel++) linear[offset + channel] = moonColor[channel] * brightness;
        }
      }

      if (canopy && elevation > -0.03 && elevation < canopy[column]) {
        const edge = clamp((canopy[column] - elevation) * 60 + (fine - 0.5) * 1.4);
        const depth = 0.46 + fine * 0.31;
        for (let channel = 0; channel < 3; channel++) linear[offset + channel] = mix(linear[offset + channel], foliage[channel] * depth, edge);
      }
    }
  }
  addStars(linear, theme, seed + 8191);
  const bytes = new Uint8Array(WIDTH * HEIGHT * 4);
  const color = new THREE.Color();
  for (let pixel = 0; pixel < WIDTH * HEIGHT; pixel++) {
    color.setRGB(clamp(linear[pixel * 3]), clamp(linear[pixel * 3 + 1]), clamp(linear[pixel * 3 + 2]));
    color.convertLinearToSRGB();
    bytes[pixel * 4] = Math.round(color.r * 255); bytes[pixel * 4 + 1] = Math.round(color.g * 255);
    bytes[pixel * 4 + 2] = Math.round(color.b * 255); bytes[pixel * 4 + 3] = 255;
  }
  // The equirectangular seam is a duplicate meridian, including star glows.
  for (let row = 0; row < HEIGHT; row++) bytes.copyWithin((row * WIDTH + WIDTH - 1) * 4, row * WIDTH * 4, row * WIDTH * 4 + 4);
  const texture = new THREE.DataTexture(bytes, WIDTH, HEIGHT, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false; texture.needsUpdate = true;
  return texture;
}

/** A host may reuse a PMREM generated from this texture until the theme changes. */
export function createRealmAtmosphere(theme = 'sea') {
  if (!Object.hasOwn(palettes, theme)) throw new TypeError('Realm atmosphere theme must be sea, orbital or woodland.');
  const texture = buildTexture(theme);
  const celestial = directions[theme]?.clone().multiplyScalar(62).toArray();
  const settings = theme === 'sea' ? {
    backgroundIntensity: 0.94, environmentIntensity: 1.03, exposure: 1.09,
    fog: { color: '#253653', near: 26, far: 74 },
    lighting: {
      hemisphere: ['#99b9ef', '#2b2932', 1.15],
      key: { color: '#c2ceff', intensity: 4.6, position: celestial },
      fill: { color: '#ccb399', intensity: 1.65, position: [8, 11, 14] },
    },
  } : theme === 'orbital' ? {
    backgroundIntensity: 0.86, environmentIntensity: 1.16, exposure: 1.1,
    fog: { color: '#101a31', near: 34, far: 92 },
    lighting: {
      hemisphere: ['#99aedc', '#2b2439', 1.1],
      key: { color: '#c7d5ff', intensity: 4.8, position: [-22, 28, -34] },
      fill: { color: '#c4a7da', intensity: 1.85, position: [12, 8, 16] },
    },
  } : {
    backgroundIntensity: 0.93, environmentIntensity: 1.05, exposure: 1.08,
    fog: { color: '#294545', near: 20, far: 62 },
    lighting: {
      hemisphere: ['#a7c8d3', '#29352c', 1.18],
      key: { color: '#c7dcff', intensity: 4.1, position: celestial },
      fill: { color: '#c4b491', intensity: 1.55, position: [9, 8, 13] },
    },
  };
  let disposed = false;
  return {
    texture, ...settings,
    dispose() { if (!disposed) { disposed = true; texture.dispose(); } },
  };
}
