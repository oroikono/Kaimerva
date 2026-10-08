import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRealmAtmosphere } from '../src/realm-atmosphere.js';

const themes = ['sea', 'orbital', 'woodland'];
const pixel = (image, x, y) => Array.from(image.data.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 3));
const brightness = color => (color[0] + color[1] + color[2]) / 3;

test('procedural environments are deterministic bounded sRGB panoramas without a DOM or external asset', () => {
  assert.equal(typeof document, 'undefined');
  for (const theme of themes) {
    const first = createRealmAtmosphere(theme); const second = createRealmAtmosphere(theme);
    try {
      const image = first.texture.image;
      assert.ok(first.texture.isDataTexture);
      assert.equal(image.width, 512); assert.equal(image.height, 256);
      assert.ok(image.data instanceof Uint8Array);
      assert.equal(image.data.length, 512 * 256 * 4);
      assert.equal(first.texture.mapping, THREE.EquirectangularReflectionMapping);
      assert.equal(first.texture.colorSpace, THREE.SRGBColorSpace);
      assert.equal(first.texture.type, THREE.UnsignedByteType);
      assert.equal(first.texture.format, THREE.RGBAFormat);
      assert.equal(first.texture.flipY, false, 'row zero is the south pole used by equirectangular UVs');
      assert.equal(first.texture.wrapS, THREE.RepeatWrapping);
      assert.equal(first.texture.wrapT, THREE.ClampToEdgeWrapping);
      assert.equal(first.texture.minFilter, THREE.LinearFilter);
      assert.deepEqual(image.data, second.texture.image.data);
      assert.notEqual(image.data, second.texture.image.data, 'each atmosphere owns its buffer');
      for (let row = 0; row < image.height; row++) {
        assert.deepEqual(pixel(image, 0, row), pixel(image, image.width - 1, row), 'clouds and star glows meet at the panorama seam');
      }
      for (let column = 0; column < image.width; column++) {
        assert.deepEqual(pixel(image, column, 0), pixel(image, 0, 0), 'south-pole color has no longitude seam');
        assert.deepEqual(pixel(image, column, image.height - 1), pixel(image, 0, image.height - 1), 'north-pole color has no longitude seam');
      }
      for (let offset = 3; offset < image.data.length; offset += 4) assert.equal(image.data[offset], 255);
    } finally { first.dispose(); second.dispose(); }
  }
});

test('sea and forest moons align with their key lights above the negative-z backdrop', () => {
  for (const theme of ['sea', 'woodland']) {
    const atmosphere = createRealmAtmosphere(theme);
    try {
      const image = atmosphere.texture.image;
      const direction = new THREE.Vector3(...atmosphere.lighting.key.position).normalize();
      assert.ok(direction.y > 0 && direction.z < 0, 'moon lighting comes from the authored sky side');
      const x = Math.round((Math.atan2(direction.z, direction.x) / (Math.PI * 2) + 0.5) * (image.width - 1));
      const y = Math.round((Math.asin(direction.y) / Math.PI + 0.5) * (image.height - 1));
      assert.ok(Math.min(...pixel(image, x, y)) > 215, 'the light direction resolves to a visible pale moon disc');
      assert.ok(brightness(pixel(image, x, y)) - brightness(pixel(image, x + 8, y)) > 65, 'the disc contrasts with the surrounding atmospheric halo');
    } finally { atmosphere.dispose(); }
  }
});

test('night skies carry spatial detail and each theme has independently authored structure', () => {
  const atmospheres = themes.map(createRealmAtmosphere);
  try {
    const images = atmospheres.map(value => value.texture.image);
    for (const image of images) {
      const colors = new Set();
      for (let offset = 0; offset < image.data.length; offset += 4) colors.add(`${image.data[offset]},${image.data[offset + 1]},${image.data[offset + 2]}`);
      assert.ok(colors.size > 1000, 'a panorama has graded mist, clouds/stars or nebula rather than a flat background color');
      let differences = 0;
      for (let x = 0; x < image.width - 1; x++) {
        if (pixel(image, x, 145).some((value, index) => value !== pixel(image, x + 1, 145)[index])) differences++;
      }
      assert.ok(differences > 120, 'the upper horizon contains resolved spatial detail');
    }
    for (let left = 0; left < images.length; left++) for (let right = left + 1; right < images.length; right++) {
      assert.notDeepEqual(images[left].data, images[right].data);
    }
    const forestHorizon = Array.from({ length: images[2].width }, (_, x) => brightness(pixel(images[2], x, 134)));
    assert.ok(Math.max(...forestHorizon) - Math.min(...forestHorizon) > 50, 'forest canopy interrupts the mist horizon with darker silhouettes');
  } finally { atmospheres.forEach(value => value.dispose()); }
});

test('lighting/fog settings remain usable and disposal is idempotent for independently owned textures', () => {
  for (const theme of themes) {
    const first = createRealmAtmosphere(theme); const second = createRealmAtmosphere(theme);
    let disposals = 0;
    first.texture.addEventListener('dispose', () => { disposals++; });
    for (const value of [first.backgroundIntensity, first.environmentIntensity, first.exposure, first.fog.near, first.fog.far]) assert.ok(Number.isFinite(value) && value > 0);
    assert.ok(first.fog.far > first.fog.near);
    assert.ok(first.exposure < 1.5);
    assert.match(first.fog.color, /^#[a-f0-9]{6}$/i);
    assert.equal(first.lighting.hemisphere.length, 3);
    for (const light of [first.lighting.key, first.lighting.fill]) {
      assert.match(light.color, /^#[a-f0-9]{6}$/i);
      assert.ok(light.intensity > 0 && Number.isFinite(light.intensity));
      assert.equal(light.position.length, 3);
      assert.ok(light.position.every(Number.isFinite));
    }
    first.lighting.key.position[0] = 999;
    assert.notEqual(second.lighting.key.position[0], 999, 'host changes cannot alter another atmosphere instance');
    first.dispose(); first.dispose();
    assert.equal(disposals, 1);
    assert.equal(second.texture.image.data.length, 512 * 256 * 4);
    second.dispose();
  }
  for (const theme of ['city', 'toString', null]) assert.throws(() => createRealmAtmosphere(theme), TypeError);
});
