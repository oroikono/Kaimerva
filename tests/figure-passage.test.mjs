import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFigurePassage } from '../src/figure-passage.js';

const themes = ['sea', 'orbital', 'woodland'];
const meshes = group => {
  const result = [];
  group.traverse(value => { if (value.isMesh) result.push(value); });
  return result;
};
const rig = theme => createFigurePassage({ anchor: new THREE.Vector3(), theme });
const sourcePlate = group => meshes(group).find(value => value.material.isMeshBasicMaterial && value.material.toneMapped === false);

function loader(t) {
  const previousWindow = globalThis.window;
  globalThis.window = { location: { href: 'http://portfolio.test/', origin: 'http://portfolio.test' } };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  const requests = [];
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, complete, _progress, failure) => {
    requests.push({ url, complete, failure });
  });
  return requests;
}

function texture(width = 1200, height = 720) {
  const result = new THREE.Texture({ width, height });
  let disposals = 0;
  result.addEventListener('dispose', () => { disposals++; });
  return { value: result, disposals: () => disposals };
}

test('the three instruments have different constructions and opening mechanisms', () => {
  const values = themes.map(rig);
  try {
    const signatures = values.map(value => {
      const image = sourcePlate(value.group);
      const groups = value.group.children.filter(child => child.isGroup && child !== image.parent);
      value.update(0, 0, true);
      const closed = groups.map(child => ({ rotation: child.rotation.clone(), position: child.position.clone() }));
      value.update(0, 1, true);
      const zHinges = groups.filter((child, index) => Math.abs(child.rotation.z - closed[index].rotation.z) > 0.5).length;
      const yHinges = groups.filter((child, index) => Math.abs(child.rotation.y - closed[index].rotation.y) > 0.8).length;
      const retractingBanks = groups.filter((child, index) => Math.abs(child.position.x - closed[index].position.x) > 1).length;
      const allMeshes = meshes(value.group);
      const torusCount = allMeshes.filter(child => child.geometry.type === 'TorusGeometry').length;
      const doorGlass = allMeshes.filter(child => child.material.transparent && child.geometry.parameters?.width > 2
        && child.geometry.parameters?.height > 4).length;
      // Geometry budgets count rendered instances, including shared shapes.
      assert.ok(allMeshes.length < 140);
      assert.ok(allMeshes.reduce((total, child) => total + child.geometry.attributes.position.count, 0) < 45000);
      return { zHinges, yHinges, retractingBanks, torusCount, doorGlass };
    });
    assert.equal(signatures[0].zHinges, 6, 'sea opens an individually hinged iris');
    assert.ok(signatures[0].torusCount > 5, 'sea has a circular optical housing');
    assert.equal(signatures[1].yHinges, 2, 'orbital folds two shutter banks');
    assert.equal(signatures[1].retractingBanks, 2, 'orbital moves those banks into side bays');
    assert.equal(signatures[1].torusCount, 0, 'orbital is an angular gantry');
    assert.equal(signatures[2].yHinges, 2, 'woodland swings two cabinet doors');
    assert.equal(signatures[2].retractingBanks, 0, 'woodland hinges stay in their timber posts');
    assert.equal(signatures[2].doorGlass, 2, 'woodland contains large glass door panes');
  } finally { values.forEach(value => value.dispose()); }
});

test('every fully open instrument keeps the supplied image unobscured, color faithful and aspect correct', t => {
  const requests = loader(t);
  for (const theme of themes) {
    const value = rig(theme);
    try {
      for (const [width, height] of [[1200, 720], [1600, 600], [600, 1200]]) {
        for (let stage = 0; stage < 3; stage++) {
          value.setStage(stage, `/figures/view-${stage}.svg`, true);
          const supplied = texture(width, height);
          requests.at(-1).complete(supplied.value);
          assert.equal(value.update(0, 1, true), false, 'reduced motion resolves directly to a reading pose');
          const image = sourcePlate(value.group);
          assert.equal(image.material.map, supplied.value, 'use the actual loaded texture');
          assert.equal(image.material.color.getHex(), 0xffffff, 'do not tint the source');
          assert.equal(image.material.toneMapped, false, 'do not apply the scene film look to the source');
          assert.equal(image.material.fog, false, 'atmospheric haze must not recolor supplied evidence');
          assert.equal(supplied.value.colorSpace, THREE.SRGBColorSpace);
          const aspect = image.geometry.parameters.width * image.scale.x / (image.geometry.parameters.height * image.scale.y);
          assert.ok(Math.abs(aspect - width / height) < 1e-9);
          value.group.updateMatrixWorld(true);
          // Sample the actual displayed rectangle, including its corners.
          // First-hit testing catches translucent doors as well as solid leaves.
          const ray = new THREE.Raycaster();
          for (const x of [-0.97, 0, 0.97]) {
            for (const y of [-0.97, 0, 0.97]) {
              const point = image.localToWorld(new THREE.Vector3(x * 2.3, y * 1.38, 0));
              // Include offset desktop viewpoints and a high portrait source.
              for (const offset of [-4.5, 0, 4.5]) {
                const camera = new THREE.Vector3(offset, 0, 12.3);
                ray.set(camera, point.clone().sub(camera).normalize());
                const hit = ray.intersectObject(value.group, true).find(result => result.object.visible && result.object.parent.visible);
                assert.equal(hit?.object, image, `${theme} stage ${stage} leaves the source visible at ${x}, ${y} from offset ${offset}`);
              }
            }
          }
        }
      }
    } finally { value.dispose(); }
  }
});

test('stage changes move each theme apparatus, settle with motion paused, and reverse to the same closed pose', () => {
  for (const theme of themes) {
    const value = rig(theme);
    try {
      value.update(0, 0, true);
      const carrier = sourcePlate(value.group).parent;
      const parts = value.group.children.filter(child => child !== carrier);
      const closed = parts.map(child => ({ position: child.position.clone(), quaternion: child.quaternion.clone() }));
      value.update(0, 1, true);
      const first = parts.map(child => ({ position: child.position.clone(), quaternion: child.quaternion.clone(), visible: child.visible }));
      value.setStage(2, null);
      assert.equal(value.update(0, 1), true, 'an unapplied stage change still needs a frame');
      assert.equal(value.update(0.2, 1), true, 'the stage carriage/lenses/drawer advances smoothly');
      assert.equal(value.update(0, 1, true), false, 'static mode completes the stage without animation time');
      assert.ok(parts.some((child, index) => child.position.distanceTo(first[index].position) > 0.1
        || child.quaternion.angleTo(first[index].quaternion) > 0.01 || child.visible !== first[index].visible), `${theme} translates the stage physically`);
      value.setStage(0, null, true);
      value.update(0, 0, true);
      parts.forEach((child, index) => {
        assert.ok(child.position.distanceTo(closed[index].position) < 1e-9);
        assert.ok(child.quaternion.angleTo(closed[index].quaternion) < 1e-7);
      });
    } finally { value.dispose(); }
  }
});

test('replaced and late image requests cannot replace a newer stage and every resource is disposed once', t => {
  const requests = loader(t);
  const imageEvents = [];
  const value = createFigurePassage({ anchor: new THREE.Vector3(), theme: 'woodland', onImage: event => imageEvents.push(event) });
  const parent = new THREE.Group();
  parent.add(value.group);
  const resources = new Map();
  for (const child of meshes(value.group)) {
    for (const resource of [child.geometry, child.material]) {
      if (resources.has(resource)) continue;
      resources.set(resource, 0);
      resource.addEventListener('dispose', () => resources.set(resource, resources.get(resource) + 1));
    }
  }
  value.setStage(0, '/figures/old.svg');
  value.setStage(1, '/figures/current.svg');
  const stale = texture();
  const current = texture();
  requests[1].complete(current.value);
  requests[0].complete(stale.value);
  assert.equal(stale.disposals(), 1);
  assert.equal(sourcePlate(value.group).material.map, current.value);
  assert.deepEqual(imageEvents.filter(event => event.ready).map(event => event.stage), [1]);
  value.setStage(2, '/figures/pending.svg');
  assert.equal(current.disposals(), 1, 'release the previous stage texture before loading its replacement');
  value.dispose();
  value.dispose();
  const late = texture();
  requests[2].complete(late.value);
  assert.equal(late.disposals(), 1, 'release an image that finishes after its instrument is gone');
  assert.equal(parent.children.length, 0);
  assert.equal(value.group.children.length, 0);
  assert.ok([...resources.values()].every(count => count === 1), 'shared geometries and materials dispose exactly once');
  assert.equal(value.update(1, 1), false);
});

test('invalid stages and foreign textures fail without inventing content or making a texture request', t => {
  const requests = loader(t);
  const states = [];
  const value = createFigurePassage({ anchor: new THREE.Vector3(), onImage: state => states.push(state) });
  try {
    for (const stage of [-1, 3, 0.5]) assert.throws(() => value.setStage(stage, '/figures/view.svg'), RangeError);
    for (const url of ['https://another.test/figure.svg', 'data:image/svg+xml,<svg/>', 'file:///figure.svg']) value.setStage(0, url);
    assert.equal(requests.length, 0);
    assert.equal(states.filter(state => state.error).length, 3);
    assert.equal(sourcePlate(value.group).visible, false);
    assert.throws(() => createFigurePassage({ anchor: new THREE.Vector3(), theme: 'unknown' }), TypeError);
  } finally { value.dispose(); }
});
