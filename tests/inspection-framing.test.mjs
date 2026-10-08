import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFigurePassage } from '../src/figure-passage.js';
import { inspectionCameraPose } from '../src/world.js';

// Analytic projections of the actual open meshes and host camera, not rendered
// screenshots or DOM measurements. Caption wrapping remains a browser check.
test('open housings fit the visual panel and their source plates clear reserved reading controls', () => {
  const point = new THREE.Vector3();
  for (const [width, height] of [[1280, 720], [800, 600], [390, 844], [600, 500]]) {
    const phone = width <= 600;
    for (const theme of ['sea', 'orbital', 'woodland']) {
      const anchor = new THREE.Vector3(4, 3, -2);
      const bearing = 0.7;
      const rig = createFigurePassage({ anchor, bearing, theme });
      try {
        const pose = inspectionCameraPose({ anchor, bearing, width, height });
        const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 130);
        camera.position.copy(pose.position);
        camera.lookAt(pose.target);
        camera.updateMatrixWorld();
        for (let stage = 0; stage < 3; stage++) {
          rig.setStage(stage, null, true);
          rig.update(0, 1, true);
          rig.group.updateMatrixWorld(true);
          rig.group.traverse(mesh => {
            if (!mesh.isMesh) return;
            const source = mesh.material.isMeshBasicMaterial && mesh.material.toneMapped === false;
            const vertices = mesh.geometry.attributes.position;
            for (let i = 0; i < vertices.count; i++) {
              point.fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld).project(camera);
              const x = (point.x + 1) * width / 2;
              const y = (1 - point.y) * height / 2;
              const label = `${theme}, stage ${stage}, ${width}×${height}`;
              assert.ok(x >= -0.1 && x <= width * (phone ? 1 : 0.6) + 0.1, `housing clipped: ${label}, x=${x}`);
              if (source) {
                assert.ok(y >= (phone ? 70 : 150), `source under heading: ${label}, y=${y}`);
                assert.ok(y <= (phone ? height * 0.46 - (height <= 600 ? 70 : 95) : height - 170), `source under view controls: ${label}, y=${y}`);
              }
            }
          });
        }
      } finally { rig.dispose(); }
    }
  }
});
