import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRealmPortal } from '../src/realm-portal.js';

function meshes(group) {
  const result = [];
  group.traverse(object => { if (object.isMesh) result.push(object); });
  return result;
}

test('gateway is a bounded native assembly with real depth and an unobstructed opening', () => {
  const portal = createRealmPortal();
  try {
    const objects = meshes(portal.group);
    assert.ok(objects.length <= 50);
    assert.ok(objects.reduce((sum, object) => sum + object.geometry.attributes.position.count, 0) < 12000);
    assert.ok(objects.every(object => object.geometry.type !== 'PlaneGeometry' && !object.isSprite));
    const box = new THREE.Box3().setFromObject(portal.group);
    const size = box.getSize(new THREE.Vector3());
    assert.ok(size.x > 4.5 && size.x < 5);
    assert.ok(size.y > 5.5 && size.y < 6);
    assert.ok(size.z > 2 && size.z < 3);
    assert.ok(box.min.y < 0 && box.max.y > 5.5, 'the low footing and pointed crown have separate physical extents');
    const caster = new THREE.Raycaster();
    for (const x of [-0.7, 0, 0.7]) for (const y of [1.2, 2.5, 3.5]) {
      caster.set(new THREE.Vector3(x, y, 10), new THREE.Vector3(0, 0, -1));
      assert.equal(caster.intersectObject(portal.group, true).length, 0, 'the center contains no opaque facade or image plane');
    }
    caster.set(new THREE.Vector3(0, 5.04, 10), new THREE.Vector3(0, 0, -1));
    assert.equal(caster.intersectObject(portal.group, true)[0]?.object.name, 'aged-gold-inset');
  } finally { portal.dispose(); }
});

test('transform inputs are copied while local dimensions and finite geometry stay stable', () => {
  const position = new THREE.Vector3(4, 0.6, -3);
  const portal = createRealmPortal({ position, bearing: Math.PI / 3, scale: 0.65 });
  const plain = createRealmPortal();
  try {
    assert.deepEqual(portal.group.position.toArray(), [4, 0.6, -3]);
    assert.equal(portal.group.rotation.y, Math.PI / 3);
    assert.deepEqual(portal.group.scale.toArray(), [0.65, 0.65, 0.65]);
    position.set(99, 99, 99);
    assert.deepEqual(portal.group.position.toArray(), [4, 0.6, -3], 'later caller changes cannot move the created gateway');
    assert.deepEqual(portal.group.userData.portalLocalExtent, plain.group.userData.portalLocalExtent);
    for (const object of meshes(portal.group)) {
      for (const attribute of Object.values(object.geometry.attributes)) {
        assert.ok([...attribute.array].every(Number.isFinite), `${object.name} has finite vertices, normals and UVs`);
      }
    }
    assert.ok(new THREE.Box3().setFromObject(portal.group).getSize(new THREE.Vector3()).y < 4);
  } finally { portal.dispose(); plain.dispose(); }
  for (const options of [{ scale: 0 }, { scale: -1 }, { scale: Infinity }, { bearing: NaN },
    { position: new THREE.Vector3(0, Infinity, 0) }, { position: [0, 0, 0] }]) {
    assert.throws(() => createRealmPortal(options), TypeError);
  }
});

test('materials use original deterministic data maps and restrained static lights', () => {
  const first = createRealmPortal();
  const second = createRealmPortal();
  try {
    const resources = new Set();
    const a = meshes(first.group); const b = meshes(second.group);
    assert.equal(a.length, b.length);
    a.forEach((object, index) => {
      assert.deepEqual(object.geometry.attributes.position.array, b[index].geometry.attributes.position.array);
      for (const map of [object.material.map, object.material.bumpMap, object.material.roughnessMap]) if (map) resources.add(map);
    });
    assert.equal(resources.size, 3);
    for (const map of resources) {
      assert.ok(map.isDataTexture);
      assert.equal(map.image.width, 128);
      assert.equal(map.image.height, 128);
      assert.equal(map.image.data.length, 128 * 128 * 4);
      assert.ok(map.image.data.some((value, index) => index % 4 === 0 && value !== map.image.data[0]), 'the maps contain authored pixel variation');
    }
    const lights = first.group.children.filter(child => child.isPointLight);
    assert.equal(lights.length, 2);
    assert.ok(lights.every(light => !light.castShadow && light.intensity <= 3 && light.distance <= 7));
    assert.ok(a.find(object => object.name === 'wet-rock-threshold').material.roughness
      < a.find(object => object.name === 'arch-1-voussoir-0').material.roughness);
    assert.deepEqual(Object.keys(first).sort(), ['dispose', 'group'], 'the object requires no camera, DOM or animation update');
  } finally { first.dispose(); second.dispose(); }
});

test('all owned GPU resources dispose once and the gateway removes only itself', () => {
  const portal = createRealmPortal();
  const parent = new THREE.Group();
  const peer = new THREE.Group();
  parent.add(portal.group, peer);
  const resources = new Map();
  for (const object of meshes(portal.group)) {
    for (const resource of [object.geometry, object.material, object.material.map, object.material.bumpMap, object.material.roughnessMap]) {
      if (!resource || resources.has(resource)) continue;
      resources.set(resource, 0);
      resource.addEventListener('dispose', () => resources.set(resource, resources.get(resource) + 1));
    }
  }
  assert.equal(resources.size, 50);
  portal.dispose();
  portal.dispose();
  assert.ok([...resources.values()].every(value => value === 1));
  assert.deepEqual(parent.children, [peer]);
  assert.equal(portal.group.children.length, 0);
});
