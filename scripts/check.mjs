import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateContent } from '../src/content.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFile(path.join(root, file), 'utf8');
validateContent(JSON.parse(await read('data/site.json')));
const assets = JSON.parse(await read('data/assets.json'));
if (assets.schemaVersion !== 1 || !Array.isArray(assets.assets)) throw new Error('Invalid asset manifest.');
for (const asset of assets.assets) if (!asset.creator || !asset.source || !asset.license || !['authored','dependency','licensed','permission'].includes(asset.origin)) throw new Error(`Incomplete provenance: ${asset.id}`);
const skill = await read('skills/build-personal-world/SKILL.md');
if (!/^---\r?\nname: build-personal-world\r?\n/.test(skill) || !/\r?\ndescription:/.test(skill)) throw new Error('Skill metadata missing.');
for (const match of skill.matchAll(/\]\((references\/[^)]+)\)/g)) await stat(path.join(root, 'skills/build-personal-world', match[1]));
async function paths(dir = root) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules','dist','.git','.local'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isSymbolicLink()) throw new Error(`Review symlink before release: ${path.relative(root, full)}`);
    if (item.isDirectory()) result.push(...await paths(full)); else result.push(full);
  }
  return result;
}
const files = await paths();
const proofImages = new Set(['docs/assets/sea.jpg', 'docs/assets/orbital.jpg', 'docs/assets/woodland.jpg']);
const forbiddenNames = /(?:^|\/)(?:\.env(?:\..*)?|portrait[^/]*\.(?:jpe?g|png|webp)|.*\.pdf|.*\.glb|.*\.gltf|.*\.woff2?|.*\.zip)$/i;
for (const file of files) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (forbiddenNames.test(relative)) throw new Error(`Unexpected personal/binary/config asset: ${relative}`);
  const bytes = await readFile(file);
  if (proofImages.has(relative)) {
    if (!bytes.subarray(0, 3).equals(Buffer.from([255,216,255]))) throw new Error(`Proof image is not JPEG: ${relative}`);
    continue;
  }
  if (bytes.includes(0)) throw new Error(`Unreviewed binary file: ${relative}`);
  const text = bytes.toString('utf8');
  if (/\b(?:ntn|secret)_[A-Za-z0-9]{20,}\b|(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)|(?:github_pat_[A-Za-z0-9_]{20,})|(?:ghp_[A-Za-z0-9]{20,})/.test(text)) throw new Error(`Possible credential in ${relative}; remove and review.`);
  if (/\/Users\/|\/home\/[^/]+\//.test(text)) throw new Error(`Host-specific absolute path in ${relative}.`);
}
console.log(`PASS: content, provenance fields, skill references, and bounded ${files.length}-file source hygiene check. This does not prove legal clearance or detect every secret.`);
