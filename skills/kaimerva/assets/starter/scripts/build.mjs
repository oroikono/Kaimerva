import { mkdir, readFile, writeFile, copyFile, access, rm, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateContent, publicSnapshot } from '../src/content.js';
import { validateWorldConfig } from '../src/world-config.js';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const output = path.join(root, 'dist');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function build() {
  await access(path.join(root, 'node_modules/three/build/three.module.js')).catch(() => { throw new Error('Three.js is missing. Run npm ci first.'); });
  const snapshot = validateContent(JSON.parse(await readFile(path.join(root, 'data/site.json'), 'utf8')));
  const worldConfig = validateWorldConfig(JSON.parse(await readFile(path.join(root, 'data/world.json'), 'utf8')));
  const pkg = JSON.parse(await readFile(path.join(root, 'node_modules/three/package.json'), 'utf8'));
  const wanted = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).dependencies.three;
  if (pkg.version !== wanted) throw new Error(`Three.js version mismatch: expected ${wanted}, got ${pkg.version}.`);
  const published = publicSnapshot(snapshot);
  const figurePaths = new Set(published.items.flatMap(item => item.figure ? [item.figure.src, ...item.figure.stages.map(stage => stage.src)] : []));
  const figures = [];
  if (figurePaths.size) {
    const directory = await lstat(path.join(root, 'figures')).catch(() => { throw new Error('Referenced figures require a local figures directory.'); });
    if (!directory.isDirectory() || directory.isSymbolicLink()) throw new Error('The figures directory must be a real local directory.');
    for (const src of figurePaths) {
      const relative = src.slice(2); // validateContent already restricted this to one safe filename.
      const file = path.join(root, relative);
      const stat = await lstat(file).catch(() => { throw new Error(`Referenced figure is missing: ${relative}`); });
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8 * 1024 * 1024) throw new Error(`Referenced figure must be a regular local file under 8 MiB: ${relative}`);
      figures.push({ relative, bytes: await readFile(file) });
    }
  }
  const files = ['index.html', 'LICENSE', 'src/main.js', 'src/content.js', 'src/world-config.js', 'src/world.js','src/realm-atmosphere.js','src/realm-portal.js','src/realm-surfaces.js','src/coastal-detail.js','src/voyage.js','src/voyage-clearance.js','src/exploration.js','src/exploration-beacons.js', 'src/figure-passage.js', 'src/figure-reader.js', 'src/navigation.js', 'src/themes.js', 'src/styles.css'];
  // Read and validate inputs before replacing managed output. A missing figure or
  // module must not destroy the previous reviewable build.
  const sources = await Promise.all(files.map(file => readFile(path.join(root, file), 'utf8')));
  const brandFiles = ['assets/brand/kaimerva-icon.png', 'assets/brand/ATTRIBUTION.md'];
  const brandBytes = await Promise.all(brandFiles.map(file => readFile(path.join(root, file))));
  // dist is managed build output. Clearing it prevents withdrawn assets staying public.
  await rm(output, { recursive: true, force: true });
  await mkdir(path.join(output, 'src'), { recursive: true });
  await mkdir(path.join(output, 'vendor'), { recursive: true });
  await mkdir(path.join(output, 'assets/brand'), { recursive: true });
  for (let i = 0; i < brandFiles.length; i++) await writeFile(path.join(output, brandFiles[i]), brandBytes[i]);
  // Pages/CDN caches may keep modules after the HTML updates. A content-derived
  // version covers the entrypoint and every local import, keeping releases together.
  const version = sha(Buffer.from(sources.join('\n'))).slice(0, 12);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let source = sources[i];
    if (file === 'index.html') source = source.replace(/\.\/src\/(main\.js|styles\.css)/g, match => `${match}?v=${version}`);
    if (file.endsWith('.js')) source = source.replace(/from (['"])(\.\/[^'"]+\.js)\1/g, (_, quote, relative) => `from ${quote}${relative}?v=${version}${quote}`);
    await writeFile(path.join(output, file), source);
  }
  await writeFile(path.join(output, 'content.json'), JSON.stringify(published, null, 2) + '\n');
  if (figures.length) await mkdir(path.join(output, 'figures'));
  for (const figure of figures) await writeFile(path.join(output, figure.relative), figure.bytes);
  await writeFile(path.join(output, 'world.json'), JSON.stringify(worldConfig, null, 2) + '\n');
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
