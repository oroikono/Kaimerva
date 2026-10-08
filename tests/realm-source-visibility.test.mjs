import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildRealmScene, inspectionCameraPose, inspectionSceneAnchor } from '../src/world.js';
import { createFigurePassage } from '../src/figure-passage.js';

const themes = ['sea', 'orbital', 'woodland'];
const collections = ['work', 'research', 'journal', 'journey', 'news'];
const screens = [[1280, 720], [800, 600], [390, 844], [600, 500]];
const aspects = [[1200, 720], [1600, 600], [600, 1200]];
// Closely sample the lower edge: the gateway formerly covered its interior,
// although both extreme corners and the isolated instrument remained clear.
const sourceSamples = [
  ...Array.from({ length: 9 }, (_, index) => [(index / 4 - 1) * 0.97, -0.97]),
  ...[-0.97, 0, 0.97].flatMap(x => [[x, 0], [x, 0.97]]),
];

function visibleMesh(object) {
  // The starfield's Points.raycast uses a one-world-unit proximity threshold;
  // that is not the tiny rendered star and cannot test pixel occlusion.
  if (!object.isMesh) return false;
  for (let parent = object; parent; parent = parent.parent) if (!parent.visible) return false;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  return materials.some(material => material?.visible !== false
    && !(material?.transparent && material.opacity === 0));
}

test('real world scenery never covers or colors a supplied source in any collection inspection', t => {
  const previousWindow = globalThis.window;
  globalThis.window = { location: { href: 'http://portfolio.test/', origin: 'http://portfolio.test' } };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  let sourceSize = aspects[0];
  let loadedTexture;
  t.mock.method(THREE.TextureLoader.prototype, 'load', (_url, complete) => {
    loadedTexture = new THREE.Texture({ width: sourceSize[0], height: sourceSize[1] });
    complete(loadedTexture);
    return loadedTexture;
  });
  const ray = new THREE.Raycaster();
  const sourcePoint = new THREE.Vector3();
  const direction = new THREE.Vector3();
  for (const theme of themes) {
    const group = new THREE.Group();
    const world = buildRealmScene(theme, group);
    try {
      world.animate(0);
      group.updateMatrixWorld(true);
      assert.ok(Number.isFinite(world.inspectionElevation), `${theme} exposes its scenery clearance`);
      for (const collection of collections) {
        const anchor = inspectionSceneAnchor({ world, collection });
        const bearing = Math.atan2(world.camera[0], world.camera[2]);
        const rig = createFigurePassage({ anchor, bearing, theme });
        try {
          let image;
          rig.group.traverse(object => {
            if (object.isMesh && object.material.isMeshBasicMaterial && object.material.toneMapped === false) image = object;
          });
          assert.ok(image);
          assert.equal(image.material.fog, false, 'haze must not change the supplied colors');
          assert.equal(image.material.color.getHex(), 0xffffff);
          assert.equal(image.material.toneMapped, false);
          for (const [width, height] of screens) {
            const pose = inspectionCameraPose({ anchor, bearing, width, height });
            const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 130);
            camera.position.copy(pose.position);
            camera.lookAt(pose.target);
            camera.updateMatrixWorld(true);
            for (let stage = 0; stage < 3; stage++) {
              for (const size of aspects) {
                sourceSize = size;
                rig.setStage(stage, `/figures/view-${stage}.svg`, true);
                rig.update(0, 1, true);
                rig.group.updateMatrixWorld(true);
                assert.equal(image.material.map, loadedTexture, 'inspect the real loaded source');
                assert.equal(loadedTexture.colorSpace, THREE.SRGBColorSpace);
                for (const [x, y] of sourceSamples) {
                  sourcePoint.set(x * 2.3, y * 1.38, 0).applyMatrix4(image.matrixWorld);
                  ray.set(camera.position, direction.copy(sourcePoint).sub(camera.position).normalize());
                  const first = ray.intersectObjects([group, rig.group], true).find(hit => visibleMesh(hit.object));
                  assert.equal(first?.object, image,
                    `${theme}/${collection}, stage ${stage}, screen ${width}×${height}, source ${size.join('×')}, sample ${x},${y}: blocked by ${first?.object.name || first?.object.geometry.type}`);
                }
              }
            }
          }
        } finally { rig.dispose(); }
      }
    } finally { world.dispose?.(); world.kit.dispose(); }
  }
});
