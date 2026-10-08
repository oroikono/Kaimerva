import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, lstat, rm, rename, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent, publicSnapshot } from '../src/content.js';
import { validateWorldConfig } from '../src/world-config.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = path.join(root, 'skills/kaimerva/assets/starter');
const encode = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceFiles = [
  '.gitignore', 'index.html', 'LICENSE', 'package-lock.json',
  'scripts/build.mjs', 'scripts/serve.mjs', 'scripts/world-edit.mjs',
  'src/main.js', 'src/content.js', 'src/world-config.js', 'src/world.js',
  'src/realm-atmosphere.js', 'src/realm-portal.js', 'src/realm-surfaces.js',
  'src/coastal-detail.js', 'src/voyage.js', 'src/voyage-clearance.js',
  'src/exploration.js', 'src/exploration-beacons.js',
  'src/figure-passage.js', 'src/figure-reader.js', 'src/navigation.js',
  'src/themes.js', 'src/styles.css',
  'assets/brand/kaimerva-icon.png', 'assets/brand/ATTRIBUTION.md',
];
const assetIds = new Set([
  'procedural-worlds', 'three-renderer', 'signature-wave-plates',
  'kaimerva-brand-icon', 'inspection-instruments', 'starter-project-plates',
  'realm-gateway', 'realm-atmospheres', 'realm-surfaces', 'coastal-shore-detail',
  'held-voyage-controller', 'voyage-camera-course',
  'exploration-session', 'exploration-beacons',
]);

async function readSource(relative) {
  let file = root;
  const parts = relative.split('/');
  for (let i = 0; i < parts.length; i++) {
    file = path.join(file, parts[i]);
    const stat = await lstat(file);
    if (stat.isSymbolicLink() || (i === parts.length - 1 ? !stat.isFile() : !stat.isDirectory())) throw new Error(`Bundle source must be regular: ${relative}`);
  }
  return readFile(file);
}

async function expectedFiles() {
  const files = new Map();
  for (const file of sourceFiles) files.set(file, await readSource(file));
  const site = validateContent(JSON.parse(await readSource('data/site.json')));
  if (!site.demo || site.identity.name !== 'Your name' || site.items.length !== 5 || site.items.some(item => !item.id.startsWith('example-'))) {
    throw new Error('Portable packaging requires the reviewed five-entry demo; do not redistribute personal content.');
  }
  files.set('data/site.json', encode(publicSnapshot(site)));
  files.set('data/world.json', encode(validateWorldConfig(JSON.parse(await readSource('data/world.json')))));
  const figures = new Set(publicSnapshot(site).items.flatMap(item => item.figure ? [item.figure.src, ...item.figure.stages.map(stage => stage.src)] : []));
  for (const figure of figures) files.set(figure.slice(2), await readSource(figure.slice(2)));
  const ledger = JSON.parse(await readSource('data/assets.json'));
  const assets = ledger.assets.filter(asset => assetIds.has(asset.id)).map(asset => {
    const copy = { ...asset };
    delete copy.copies;
    if (copy.notice && copy.notice !== 'assets/brand/ATTRIBUTION.md' && copy.notice !== 'vendor/three-LICENSE.txt') copy.notice = 'LICENSE';
    return copy;
  });
  if (assets.length !== assetIds.size) throw new Error('Portable asset provenance is incomplete.');
  files.set('data/assets.json', encode({ schemaVersion: 1, assets }));
  const pkg = JSON.parse(await readSource('package.json'));
  pkg.scripts = {
    dev: 'node scripts/serve.mjs', build: 'node scripts/build.mjs',
    preview: 'node scripts/serve.mjs --production', check: 'node scripts/check.mjs',
    'world:edit': 'node scripts/world-edit.mjs',
  };
  files.set('package.json', encode(pkg));
  files.set('scripts/check.mjs', await readSource('scripts/check-world.mjs'));
  files.set('README.md', await readSource('scripts/starter/README.md'));
  files.set('vercel.json', encode({ buildCommand: 'npm run build', installCommand: 'npm ci', outputDirectory: 'dist' }));
  const entries = [...files].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([file, bytes]) => ({ path: file, sha256: sha(bytes) }));
  files.set('manifest.json', encode({ schemaVersion: 1, files: entries }));
  return files;
}

async function inventory(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Unexpected bundle symlink: ${relative}`);
    if (entry.isDirectory()) result.push(...await inventory(path.join(directory, entry.name), relative));
    else if (entry.isFile()) result.push(relative);
    else throw new Error(`Unexpected bundle file: ${relative}`);
  }
  return result.sort();
}

export async function checkSkillBundle() {
  const expected = await expectedFiles();
  let present;
  try { present = await inventory(bundle); }
  catch (error) { throw new Error(`Portable starter is missing or invalid. Run npm run skill:pack. ${error.message}`); }
  if (JSON.stringify(present) !== JSON.stringify([...expected.keys()].sort())) throw new Error('Portable starter file list is stale. Run npm run skill:pack and review the result.');
  for (const [file, bytes] of expected) if (!bytes.equals(await readFile(path.join(bundle, file)))) throw new Error(`Portable starter is stale: ${file}. Run npm run skill:pack and review the result.`);
  return { files: expected.size - 1, bytes: [...expected.values()].reduce((sum, bytes) => sum + bytes.length, 0) };
}

async function packageSkill() {
  const expected = await expectedFiles();
  await mkdir(path.dirname(bundle), { recursive: true });
  const stage = await mkdtemp(path.join(path.dirname(bundle), '.starter-stage-'));
  const backup = `${stage}-previous`;
  let previous = false;
  let committed = false;
  try {
    for (const [file, bytes] of expected) {
      const target = path.join(stage, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, bytes, { flag: 'wx' });
    }
    try {
      const old = await lstat(bundle);
      if (!old.isDirectory() || old.isSymbolicLink()) throw new Error('Managed starter output must be a real directory.');
      await rename(bundle, backup);
      previous = true;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { await rename(stage, bundle); committed = true; }
    catch (error) { if (previous) { await rename(backup, bundle); previous = false; } throw error; }
  } finally {
    if (!committed) await rm(stage, { recursive: true, force: true });
    if (previous) await rm(backup, { recursive: true, force: true });
  }
  return checkSkillBundle();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || (args.length && args[0] !== '--check')) throw new Error('Usage: node scripts/package-skill.mjs [--check]');
    const result = args.length ? await checkSkillBundle() : await packageSkill();
    console.log(`PASS: ${result.files}-file portable starter, ${result.bytes} bytes${args.length ? ' matches source' : ' packaged and checked'}.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
