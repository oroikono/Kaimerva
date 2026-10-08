import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { bindLandmarkTargets, pickLandmark } from '../src/world.js';

function target(stops, id, object, position = new THREE.Vector3()) {
  stops[id] = { position };
  bindLandmarkTargets(stops[id], [object]);
}

function ray(x = 0, y = 0) {
  return new THREE.Raycaster(new THREE.Vector3(x, y, 10), new THREE.Vector3(0, 0, -1));
}

function box(z = 0, material = new THREE.MeshBasicMaterial()) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  mesh.position.z = z;
  return mesh;
}

test('nearest registered landmark wins independently of declaration order', () => {
  const stops = {};
  target(stops, 'far', box(0));
  target(stops, 'near', box(4));
  assert.equal(pickLandmark(ray(), stops).id, 'near');
  assert.equal(pickLandmark(ray(), stops, ['far']).id, 'far');
  assert.equal(pickLandmark(ray(), stops, ['not-a-destination']), null);
});

test('hidden ancestors and invisible materials cannot become landmark buttons', () => {
  const stops = {};
  const hidden = new THREE.Group();
  const child = box(4);
  hidden.add(child);
  target(stops, 'hidden', hidden);
  target(stops, 'readable', box(0));
  hidden.visible = false;
  assert.equal(pickLandmark(ray(), stops).id, 'readable');
  hidden.visible = true;
  child.material.visible = false;
  assert.equal(pickLandmark(ray(), stops).id, 'readable');
  child.material.visible = true;
  child.material.transparent = true;
  child.material.opacity = 0;
  assert.equal(pickLandmark(ray(), stops).id, 'readable');
  child.material.opacity = 0.3;
  assert.equal(pickLandmark(ray(), stops).id, 'hidden');
});

test('bounds allow nested transformed parts but never replace the actual mesh hit', () => {
  const stops = {};
  const assembly = new THREE.Group();
  assembly.position.x = 3;
  assembly.scale.setScalar(1.12);
  const telescope = new THREE.Group();
  telescope.position.y = 0.4;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 48), new THREE.MeshBasicMaterial());
  telescope.add(ring);
  assembly.add(telescope);
  target(stops, 'research', assembly, assembly.position.clone());
  assert.equal(pickLandmark(ray(3, 0.448), stops), null, 'the ring opening is not a clickable proxy sphere');
  assert.equal(pickLandmark(ray(4.11, 0.47), stops).id, 'research');
  telescope.rotation.z = Math.PI / 3;
  assert.equal(pickLandmark(ray(4.11, 0.47), stops).id, 'research', 'rotating nested geometry remains within the registered bound');
});

test('broad phase excludes distant targets and only registered roots are raycast', () => {
  const stops = {};
  const landmark = box();
  target(stops, 'work', landmark);
  const distant = box();
  distant.position.x = 50;
  target(stops, 'news', distant, distant.position.clone());
  const scene = new THREE.Group();
  scene.add(landmark, distant, new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial()));
  const caster = ray();
  const intersect = caster.intersectObjects.bind(caster);
  const queried = [];
  caster.intersectObjects = objects => {
    queried.push(...objects);
    return intersect(objects, true);
  };
  assert.equal(pickLandmark(caster, stops).id, 'work');
  assert.deepEqual(queried, [landmark], 'unregistered scenery and the distant landmark are not triangle-tested');
});
