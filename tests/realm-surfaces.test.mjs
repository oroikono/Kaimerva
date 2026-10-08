import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { createRealmSurface } from '../src/realm-surfaces.js';

const kinds = ['stone', 'timber', 'ceramic', 'moss'];
const maps = value => [value.map, value.bumpMap, value.roughnessMap];
const digest = value => createHash('sha256').update(value.image.data).digest('hex');
function channelBounds(value) {
  let lower = 255;
  let upper = 0;
  for (let offset = 0; offset < value.image.data.length; offset += 4) {
    lower = Math.min(lower, value.image.data[offset]);
    upper = Math.max(upper, value.image.data[offset]);
  }
  return [lower, upper];
}

test('identical seeds reproduce pixel fields while materials and seed changes remain distinct', () => {
  const signatures = new Set();
  for (const kind of kinds) {
    const first = createRealmSurface(kind, 91);
    const again = createRealmSurface(kind, 91);
    const changed = createRealmSurface(kind, 92);
    try {
      const signature = maps(first).map(digest);
      assert.deepEqual(maps(again).map(digest), signature);
      assert.ok(maps(changed).every((map, index) => digest(map) !== signature[index]));
      assert.ok(new Set(signature).size === 3, 'albedo, height and roughness have separate fields');
      signatures.add(signature.join(':'));
      assert.notEqual(first.map, again.map, 'independent studies do not share lifecycle objects');
      first.map.image.data[0] ^= 1;
      assert.equal(digest(again.map), signature[0], 'editing one study cannot mutate another');
    } finally { first.dispose(); again.dispose(); changed.dispose(); }
  }
  assert.equal(signatures.size, kinds.length);
});

test('bounded native textures preserve color interpretation, neutral host tint and mipmap sampling', () => {
  for (const kind of kinds) {
    const value = createRealmSurface(kind);
    try {
      assert.equal(value.map.colorSpace, THREE.SRGBColorSpace);
      assert.equal(value.bumpMap.colorSpace, THREE.NoColorSpace);
      assert.equal(value.roughnessMap.colorSpace, THREE.NoColorSpace);
      let bytes = 0;
      for (const map of maps(value)) {
        assert.equal(map.isDataTexture, true);
        assert.equal(map.image.width, 128);
        assert.equal(map.image.height, 128);
        assert.ok(map.image.data instanceof Uint8Array);
        assert.equal(map.image.data.length, 128 * 128 * 4);
        bytes += map.image.data.byteLength;
        assert.equal(map.format, THREE.RGBAFormat);
        assert.equal(map.type, THREE.UnsignedByteType);
        assert.equal(map.wrapS, THREE.RepeatWrapping);
        assert.equal(map.wrapT, THREE.RepeatWrapping);
        assert.equal(map.magFilter, THREE.LinearFilter);
        assert.equal(map.minFilter, THREE.LinearMipmapLinearFilter);
        assert.equal(map.generateMipmaps, true);
        assert.equal(map.version, 1, 'new texture requests one upload without DOM image loading');
        for (let offset = 0; offset < map.image.data.length; offset += 4) {
          const pixel = map.image.data;
          assert.equal(pixel[offset], pixel[offset + 1]);
          assert.equal(pixel[offset], pixel[offset + 2]);
          assert.equal(pixel[offset + 3], 255);
        }
      }
      assert.equal(bytes, 196608, 'CPU payload remains bounded independently of renderer capabilities');
    } finally { value.dispose(); }
  }
});

test('roughness fields stay in meaningful material ranges and ceramic remains smoother than moss', () => {
  const ranges = { stone: [0.65, 0.96], timber: [0.44, 0.86], ceramic: [0.28, 0.66], moss: [0.76, 0.99] };
  const observed = {};
  for (const kind of kinds) {
    const value = createRealmSurface(kind, 219);
    try {
      const [lower, upper] = channelBounds(value.roughnessMap);
      const [minimum, maximum] = ranges[kind];
      assert.ok(lower >= Math.round(minimum * 255));
      assert.ok(upper <= Math.round(maximum * 255));
      assert.ok(upper - lower >= 12, `${kind} retains spatial roughness variation`);
      const color = channelBounds(value.map);
      const height = channelBounds(value.bumpMap);
      assert.ok(color[0] > 150 && color[1] >= 195, 'neutral albedo has no black silhouette or saturated tint');
      assert.ok(height[1] - height[0] >= 15, 'height contains actual surface variation');
      observed[kind] = [lower, upper];
    } finally { value.dispose(); }
  }
  assert.ok(observed.ceramic[1] < observed.moss[0], 'glazed wear and fibrous moss have distinct roughness');
});

test('teardown releases each map once and never disposes another independently seeded study', () => {
  const first = createRealmSurface('timber', 7);
  const second = createRealmSurface('timber', 7);
  const counts = maps(first).map(map => {
    const count = { value: 0 };
    map.addEventListener('dispose', () => count.value++);
    return count;
  });
  let secondDisposals = 0;
  maps(second).forEach(map => map.addEventListener('dispose', () => secondDisposals++));
  first.dispose(); first.dispose();
  assert.deepEqual(counts.map(count => count.value), [1, 1, 1]);
  assert.equal(secondDisposals, 0);
  second.dispose();
  assert.equal(secondDisposals, 3);
});

test('unknown materials and malformed seeds are rejected before allocating a study', () => {
  for (const kind of ['', 'wood', 'metal', null, {}, '__proto__']) assert.throws(() => createRealmSurface(kind), TypeError);
  for (const seed of [-1, 0x100000000, 1.5, Infinity, NaN, '73', null]) assert.throws(() => createRealmSurface('stone', seed), RangeError);
  for (const seed of [0, 0xffffffff]) {
    const value = createRealmSurface('stone', seed);
    value.dispose();
  }
});
