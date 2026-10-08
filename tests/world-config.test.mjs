import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DEFAULT_WORLD_CONFIG, applyWorldPatch, diffWorldConfig, validateWorldConfig } from '../src/world-config.js';

const script = fileURLToPath(new URL('../scripts/world-edit.mjs', import.meta.url));
const encode = value => `${JSON.stringify(value, null, 2)}\n`;
const cli = (root, ...args) => spawnSync(process.execPath, [script, '--root', root, ...args], { encoding: 'utf8' });

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'personal-worlds-edit-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'data'));
  await writeFile(path.join(root, 'data', 'world.json'), encode(DEFAULT_WORLD_CONFIG));
  const content = '{"profile":{"name":"Example person"},"entries":[{"id":"untouched-work","title":"Keep this content"}]}\n';
  await writeFile(path.join(root, 'data', 'site.json'), content);
  return { root, content, world: path.join(root, 'data', 'world.json') };
}

async function patchFile(root, patch) {
  const file = path.join(root, 'patch.json');
  await writeFile(file, encode(patch));
  return file;
}

test('validation returns independent objects and enforces typed ranges, known keys and theme compatibility', () => {
  const fresh = validateWorldConfig(DEFAULT_WORLD_CONFIG);
  fresh.environment.exposure = 0.8;
  assert.equal(DEFAULT_WORLD_CONFIG.environment.exposure, 1);
  for (const patch of [
    { environment: { exposure: '1' } },
    { environment: { exposure: 1.61 } },
    { environment: { keyLightMultiplier: 0.19 } },
    { interaction: { fieldSpacing: -0.01 } },
    { interface: { reader: 'magic' } },
    { interface: { panel: 'glass', customCSS: 'bad' } },
    { interaction: { fieldEnabled: 1 } },
    { environment: { theme: 'orbital' }, interaction: { startView: 'voyage' } },
    { environment: { theme: 'woodland' }, interaction: { fieldEnabled: true } },
    { schemaVersion: 2 },
    { content: { title: 'not a design control' } },
  ]) assert.throws(() => applyWorldPatch(DEFAULT_WORLD_CONFIG, patch), TypeError);
  assert.throws(() => validateWorldConfig({ schemaVersion: 1 }), /Missing/);
  assert.throws(() => applyWorldPatch(DEFAULT_WORLD_CONFIG, []), /object/);
  const changed = applyWorldPatch(DEFAULT_WORLD_CONFIG, { interface: { reader: 'dialog', buttonShape: 'pill' } });
  assert.equal(changed.interface.panel, 'solid');
  assert.deepEqual(diffWorldConfig(DEFAULT_WORLD_CONFIG, changed), [
    { path: 'interface.reader', before: 'inline', after: 'dialog' },
    { path: 'interface.buttonShape', before: 'square', after: 'pill' },
  ]);
});

test('CLI invalid patches fail before writes, including the local undo directory', async t => {
  const { root, content, world } = await fixture(t);
  const before = await readFile(world, 'utf8');
  const file = await patchFile(root, { environment: { theme: 'orbital' }, interaction: { fieldEnabled: true } });
  const result = cli(root, 'apply', file);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /only in the sea/);
  assert.equal(await readFile(world, 'utf8'), before);
  assert.equal(await readFile(path.join(root, 'data', 'site.json'), 'utf8'), content);
  await assert.rejects(access(path.join(root, '.local')), { code: 'ENOENT' });
});

test('CLI shows, applies exact nested changes, undoes in order and preserves unrelated content', async t => {
  const { root, content, world } = await fixture(t);
  assert.deepEqual(JSON.parse(cli(root, 'show').stdout), DEFAULT_WORLD_CONFIG);
  let result = cli(root, 'apply', await patchFile(root, {
    environment: { exposure: 0.85 },
    interface: { reader: 'dialog', panel: 'glass', buttonShape: 'pill' },
  }));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /environment.exposure: 1 -> 0.85/);
  assert.match(result.stdout, /interface.reader: "inline" -> "dialog"/);
  const applied = JSON.parse(await readFile(world, 'utf8'));
  assert.equal(applied.interface.panel, 'glass');
  assert.deepEqual(applied.interaction, DEFAULT_WORLD_CONFIG.interaction);
  result = cli(root, 'apply', await patchFile(root, { interaction: { startView: 'voyage', fieldEnabled: true, fieldSpacing: 0.7 } }));
  assert.equal(result.status, 0, result.stderr);
  result = cli(root, 'undo');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(await readFile(world, 'utf8')), applied);
  result = cli(root, 'undo');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(await readFile(world, 'utf8')), DEFAULT_WORLD_CONFIG);
  assert.equal(await readFile(path.join(root, 'data', 'site.json'), 'utf8'), content);
  assert.equal(cli(root, 'undo').status, 1);
});

test('CLI refuses stale undo rather than clobbering an independent edit', async t => {
  const { root, world } = await fixture(t);
  const result = cli(root, 'apply', await patchFile(root, { interface: { buttonShape: 'pill' } }));
  assert.equal(result.status, 0, result.stderr);
  const independent = applyWorldPatch(JSON.parse(await readFile(world, 'utf8')), { environment: { keyLightMultiplier: 0.8 } });
  const bytes = encode(independent);
  await writeFile(world, bytes);
  const undo = cli(root, 'undo');
  assert.equal(undo.status, 1);
  assert.match(undo.stderr, /changed independently/);
  assert.equal(await readFile(world, 'utf8'), bytes);
});

test('undoing a later edit does not erase the independent-edit boundary in older history', async t => {
  const { root, world } = await fixture(t);
  assert.equal(cli(root, 'apply', await patchFile(root, { interface: { buttonShape: 'pill' } })).status, 0);
  const independent = applyWorldPatch(JSON.parse(await readFile(world, 'utf8')), { environment: { exposure: 0.8 } });
  await writeFile(world, encode(independent));
  assert.equal(cli(root, 'apply', await patchFile(root, { interface: { panel: 'glass' } })).status, 0);
  assert.equal(cli(root, 'undo').status, 0);
  assert.deepEqual(JSON.parse(await readFile(world, 'utf8')), independent);
  const undoOlder = cli(root, 'undo');
  assert.equal(undoOlder.status, 1);
  assert.match(undoOlder.stderr, /changed independently/);
  assert.deepEqual(JSON.parse(await readFile(world, 'utf8')), independent);
});

test('another CLI lock blocks replacement without modifying the config or content', async t => {
  const { root, world, content } = await fixture(t);
  const before = await readFile(world, 'utf8');
  await mkdir(path.join(root, '.local', 'world-edits', 'lock'), { recursive: true });
  const result = cli(root, 'apply', await patchFile(root, { interface: { buttonShape: 'pill' } }));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /already locked/);
  assert.equal(await readFile(world, 'utf8'), before);
  assert.equal(await readFile(path.join(root, 'data', 'site.json'), 'utf8'), content);
});

test('a no-op patch creates no undo history', async t => {
  const { root } = await fixture(t);
  const result = cli(root, 'apply', await patchFile(root, { environment: { exposure: 1 } }));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No changes/);
  await assert.rejects(access(path.join(root, '.local')), { code: 'ENOENT' });
});
