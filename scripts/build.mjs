import { mkdir, readFile, writeFile, copyFile, access, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateContent, publicSnapshot } from '../src/content.js';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const output = path.join(root, 'dist');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function build() {
  await access(path.join(root, 'node_modules/three/build/three.module.js')).catch(() => { throw new Error('Three.js is missing. Run npm ci first.'); });
  const snapshot = validateContent(JSON.parse(await readFile(path.join(root, 'data/site.json'), 'utf8')));
  const pkg = JSON.parse(await readFile(path.join(root, 'node_modules/three/package.json'), 'utf8'));
  const wanted = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).dependencies.three;
  if (pkg.version !== wanted) throw new Error(`Three.js version mismatch: expected ${wanted}, got ${pkg.version}.`);
  // dist is managed build output. Clearing it prevents withdrawn assets staying public.
  await rm(output, { recursive: true, force: true });
  await mkdir(path.join(output, 'src'), { recursive: true });
  await mkdir(path.join(output, 'vendor'), { recursive: true });
  const files = ['index.html', 'LICENSE', 'src/main.js', 'src/content.js', 'src/world.js', 'src/navigation.js', 'src/themes.js', 'src/styles.css'];
  // Pages/CDN caches may keep modules after the HTML updates. A content-derived
  // version covers the entrypoint and every local import, keeping releases together.
  const sources = await Promise.all(files.map(file => readFile(path.join(root, file), 'utf8')));
  const version = sha(Buffer.from(sources.join('\n'))).slice(0, 12);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let source = sources[i];
    if (file === 'index.html') source = source.replace(/\.\/src\/(main\.js|styles\.css)/g, match => `${match}?v=${version}`);
    if (file.endsWith('.js')) source = source.replace(/from (['"])(\.\/[^'"]+\.js)\1/g, (_, quote, relative) => `from ${quote}${relative}?v=${version}${quote}`);
    await writeFile(path.join(output, file), source);
  }
  await writeFile(path.join(output, 'content.json'), JSON.stringify(publicSnapshot(snapshot), null, 2) + '\n');
  await copyFile(path.join(root, 'data/assets.json'), path.join(output, 'assets.json'));
  const vendor = [
    ['build/three.module.js', 'three.module.js'],
    ['build/three.core.js', 'three.core.js'],
    ['LICENSE', 'three-LICENSE.txt'],
  ];
  const notices = [];
  for (const [source, target] of vendor) {
    const bytes = await readFile(path.join(root, 'node_modules/three', source));
    await writeFile(path.join(output, 'vendor', target), bytes);
    notices.push({ package: 'three', version: pkg.version, source: `node_modules/three/${source}`, path: `vendor/${target}`, sha256: sha(bytes) });
  }
  await writeFile(path.join(output, 'vendor/provenance.json'), JSON.stringify({ files: notices }, null, 2) + '\n');
  return { published: snapshot.items.filter(item => item.published).length, demo: snapshot.demo };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await build();
  console.log(`Built dist/: ${result.published} published entries${result.demo ? ' (explicit demo content)' : ''}.`);
}
