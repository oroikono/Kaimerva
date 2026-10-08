import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build, root, output } from './build.mjs';

// Create a fresh, bounded upload folder; never upload the checkout itself.
// The CLI prints its path. Add the reviewed skill ZIP before publishing.
await readFile(path.join(root, 'docs/huggingface-space.md'));
for (const file of ['kaimerva-launch.mp4', 'kaimerva-launch-poster.jpg']) {
  await readFile(path.join(root, 'docs/assets', file));
}
await build();
const local = path.join(root, '.local');
await mkdir(local, { recursive: true });
const destination = await mkdtemp(path.join(local, 'huggingface-space-'));
await cp(output, destination, { recursive: true });
await cp(path.join(root, 'skills/kaimerva'), path.join(destination, 'skills/kaimerva'), { recursive: true });
await cp(path.join(root, 'docs/huggingface-space.md'), path.join(destination, 'README.md'));
await mkdir(path.join(destination, 'launch'));
for (const file of ['kaimerva-launch.mp4', 'kaimerva-launch-poster.jpg']) {
  await cp(path.join(root, 'docs/assets', file), path.join(destination, 'launch', file));
}
await writeFile(path.join(destination, 'launch/NOTICE.md'), '# Launch film\n\nEdited from original starter browser footage recorded on 6 October 2026. New Kaimerva typography, motion graphics and synthesized audio; the approved portal is AI-generated artwork. No new app features or agent execution are represented by the edit. Distributed with this package under MIT. Full provenance: https://github.com/oroikono/personal-worlds/blob/codex/personal-worlds/docs/launch-video.md\n');
console.log(destination);
