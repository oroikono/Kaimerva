import { readFile, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateContent, publicSnapshot } from '../src/content.js';
import { validateWorldConfig } from '../src/world-config.js';

const root = fileURLToPath(new URL('../', import.meta.url));
async function readLocal(relative) {
  if (typeof relative !== 'string' || relative.includes('\\') || relative.startsWith('/')
    || relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error(`Invalid local path: ${relative}`);
  const segments = relative.split('/');
  let file = root;
  for (let i = 0; i < segments.length; i++) {
    file = path.join(file, segments[i]);
    const stat = await lstat(file);
    if (stat.isSymbolicLink() || (i === segments.length - 1 ? !stat.isFile() : !stat.isDirectory())) throw new Error(`Expected a regular local file: ${relative}`);
    if (i === segments.length - 1 && stat.size > 8 * 1024 * 1024) throw new Error(`File exceeds 8 MiB: ${relative}`);
  }
  return readFile(file);
}
const site = validateContent(JSON.parse(await readLocal('data/site.json')));
validateWorldConfig(JSON.parse(await readLocal('data/world.json')));
const assets = JSON.parse(await readLocal('data/assets.json'));
if (assets.schemaVersion !== 1 || !Array.isArray(assets.assets)) throw new Error('Invalid asset ledger.');
const ids = new Set();
for (const asset of assets.assets) {
  if (!asset.id || ids.has(asset.id) || !asset.creator || !asset.source || !asset.license
    || !['authored', 'dependency', 'licensed', 'permission'].includes(asset.origin)) throw new Error(`Incomplete or duplicate provenance: ${asset.id}`);
  ids.add(asset.id);
}
const references = new Set(publicSnapshot(site).items.flatMap(item => item.figure ? [item.figure.src, ...item.figure.stages.map(stage => stage.src)] : []));
for (const src of references) await readLocal(src.slice(2));
const brand = assets.assets.find(asset => asset.id === 'kaimerva-brand-icon');
if (brand?.sha256) {
  if (!/^[a-f0-9]{64}$/.test(brand.sha256) || createHash('sha256').update(await readLocal(brand.path)).digest('hex') !== brand.sha256) throw new Error('Brand artwork differs from its ledger; update its provenance after an intentional replacement.');
}
await readLocal('LICENSE');
console.log(`PASS: content, world settings, ${references.size} published figure files and ${assets.assets.length} provenance records${site.demo ? ' (explicit demo content)' : ''}. This is not browser or legal validation.`);
