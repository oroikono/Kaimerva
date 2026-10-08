import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, mkdir, readFile, writeFile, readdir, lstat, readlink, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repository = fileURLToPath(new URL('../', import.meta.url));
const sourceSkill = path.join(repository, 'skills', 'kaimerva');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const encode = value => `${JSON.stringify(value, null, 2)}\n`;

async function inventory(directory, prefix = '') {
  const files = [];
  for (const name of (await readdir(directory)).sort()) {
    const relative = prefix ? `${prefix}/${name}` : name;
    const filename = path.join(directory, name); const stat = await lstat(filename);
    if (stat.isDirectory()) files.push(...await inventory(filename, relative));
    else if (stat.isSymbolicLink()) files.push([relative, 'symlink', await readlink(filename)]);
    else files.push([relative, 'file', sha(await readFile(filename))]);
  }
  return files;
}

async function detached(t) {
  const base = await mkdtemp(path.join(tmpdir(), 'kaimerva-skill-scaffold-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const skill = path.join(base, 'copied-skill');
  const cwd = path.join(base, 'unrelated-cwd');
  const projects = path.join(base, 'projects');
  await cp(sourceSkill, skill, { recursive: true, dereference: false, errorOnExist: true });
  await mkdir(cwd); await mkdir(projects);
  assert.deepEqual(await inventory(skill), await inventory(sourceSkill), 'copy the entire skill, not a selected file fixture');
  await assert.rejects(lstat(path.join(base, 'node_modules')), { code: 'ENOENT' });
  const manifest = JSON.parse(await readFile(path.join(skill, 'assets', 'starter', 'manifest.json'), 'utf8'));
  const payload = (await inventory(path.join(skill, 'assets', 'starter'))).filter(([file]) => file !== 'manifest.json');
  assert.deepEqual(payload, manifest.files.map(entry => [entry.path, 'file', entry.sha256]).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0),
    'manifest describes the exact real payload and its current byte digests');
  return { base, skill, cwd, projects, manifest, starter: path.join(skill, 'assets', 'starter') };
}

function invoke(fixture, args) {
  return spawnSync(process.execPath, [path.join(fixture.skill, 'scripts', 'create-world.mjs'), ...args],
    { cwd: fixture.cwd, encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024 });
}

function npm(project, args) {
  return spawnSync('npm', args, { cwd: project, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024,
    env: { ...process.env, PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH || ''}` } });
}

async function rejectedWithoutOutput(fixture, args, pattern) {
  const before = await inventory(fixture.projects);
  const names = await readdir(fixture.projects);
  const result = invoke(fixture, args);
  assert.equal(result.status, 1, result.error?.message || result.stderr);
  if (pattern) assert.match(result.stderr, pattern);
  assert.deepEqual(await inventory(fixture.projects), before, 'refusal preserves every existing project byte/link');
  assert.deepEqual(await readdir(fixture.projects), names, 'failure leaves no stage directories or partial project');
  return result;
}

async function assertRuntimeClosure(project) {
  const output = path.join(project, 'dist');
  const html = await readFile(path.join(output, 'index.html'), 'utf8');
  const mapSource = html.match(/<script\b[^>]*type=["']importmap["'][^>]*>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(mapSource, 'generated HTML resolves the runtime dependency locally');
  const importMap = JSON.parse(mapSource).imports;
  assert.equal(importMap.three, './vendor/three.module.js');
  const modules = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/g)].map(match => match[1]);
  const css = [...html.matchAll(/<link\b[^>]*href=["']([^"']+\.css[^"']*)["'][^>]*>/g)].map(match => match[1]);
  assert.ok(modules.some(url => url.startsWith('./src/main.js')), 'generated entrypoint is present');
  assert.ok(css.length);
  const pending = [...modules, importMap.three]; const seen = new Set();
  const resources = new Set(['index.html', 'content.json', 'world.json', 'vendor/three-LICENSE.txt']);
  function local(url, parent = 'index.html') {
    assert.ok(!/^(?:https?:|data:|\/\/)/.test(url), `runtime resource must be local: ${url}`);
    const relative = path.posix.normalize(path.posix.join(path.posix.dirname(parent), url.split(/[?#]/)[0]));
    assert.ok(relative !== '..' && !relative.startsWith('../') && !path.posix.isAbsolute(relative), `module cannot escape dist: ${url}`);
    return relative;
  }
  for (const url of css) { const file = local(url); await readFile(path.join(output, file)); resources.add(file); }
  while (pending.length) {
    const file = pending.pop(); if (seen.has(file)) continue; seen.add(file);
    const relative = local(file); const filename = path.join(output, relative);
    const source = await readFile(filename, 'utf8'); resources.add(relative);
    const checked = spawnSync(process.execPath, ['--check', filename], { encoding: 'utf8', timeout: 5000 });
    assert.equal(checked.status, 0, `${relative}: ${checked.stderr || checked.error?.message}`);
    for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)(["'])([^"']+)\1/g)) {
      const specifier = match[2];
      const resolved = specifier === 'three' ? importMap.three : local(specifier, relative);
      pending.push(resolved);
    }
  }
  const content = JSON.parse(await readFile(path.join(output, 'content.json'), 'utf8'));
  for (const item of content.items) if (item.figure) {
    for (const source of [item.figure.src, ...item.figure.stages.map(stage => stage.src)]) {
      const relative = local(source); await readFile(path.join(output, relative)); resources.add(relative);
    }
  }
  await readFile(path.join(output, 'assets', 'brand', 'ATTRIBUTION.md'));
  await readFile(path.join(output, 'assets', 'brand', 'kaimerva-icon.png'));
  return { resources, content, html };
}

function localServer(project) {
  const child = spawn(process.execPath, ['scripts/serve.mjs', '--production'],
    { cwd: project, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  const ready = new Promise((resolve, reject) => {
    let stdout = ''; let stderr = '';
    const timeout = setTimeout(() => reject(new Error('Generated static server did not become ready.')), 8000);
    child.stdout.on('data', bytes => {
      stdout += bytes;
      const url = stdout.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
      if (url) { clearTimeout(timeout); resolve(url); }
    });
    child.stderr.on('data', bytes => { stderr += bytes; });
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(stderr || `Generated server exited ${code}.`)); });
  });
  async function close() {
    if (child.exitCode !== null || child.signalCode !== null) return;
    await new Promise(resolve => {
      const timeout = setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 2000);
      child.once('exit', () => { clearTimeout(timeout); resolve(); }); child.kill('SIGTERM');
    });
  }
  return { ready, close };
}

test('a complete skill copy scaffolds and builds all three settings away from the source repository', { timeout: 60000 }, async t => {
  const fixture = await detached(t);
  const originalContent = JSON.parse(await readFile(path.join(fixture.starter, 'data', 'site.json'), 'utf8'));
  const originalWorld = JSON.parse(await readFile(path.join(fixture.starter, 'data', 'world.json'), 'utf8'));
  assert.equal(originalContent.demo, true, 'the shipped content is explicitly illustrative');
  assert.equal(originalContent.identity.name, 'Your name', 'the skill does not inherit the source author\'s personal identity');
  assert.ok(!fixture.manifest.files.some(entry => /(?:^|\/)(?:node_modules|dist|\.git|\.local)(?:\/|$)/.test(entry.path)));
  for (const theme of ['sea', 'orbital', 'woodland']) await t.test(theme, async t => {
    const project = path.join(fixture.projects, `new-${theme}`);
    t.after(() => rm(project, { recursive: true, force: true }));
    const created = invoke(fixture, [project, '--theme', theme]);
    assert.equal(created.status, 0, created.stderr || created.error?.message);
    assert.match(created.stdout, /npm ci/); assert.match(created.stdout, /npm run dev/); assert.match(created.stdout, /npm run build/);
    assert.equal((await lstat(project)).isDirectory(), true);
    assert.deepEqual(await inventory(project), (await inventory(fixture.starter)).filter(([file]) => file !== 'manifest.json')
      .map(entry => entry[0] === 'data/world.json' ? [entry[0], entry[1], sha(encode({
        ...originalWorld, environment: { ...originalWorld.environment, theme },
        interaction: { ...originalWorld.interaction, startView: theme === 'sea' ? 'voyage' : 'atlas',
          ...(theme === 'sea' ? {} : { fieldEnabled: false }) },
      }))] : entry), 'only supported theme/start-view fields differ from the copied payload');
    assert.deepEqual(JSON.parse(await readFile(path.join(project, 'data', 'site.json'), 'utf8')), originalContent);
    const pkg = JSON.parse(await readFile(path.join(project, 'package.json'), 'utf8'));
    const lock = JSON.parse(await readFile(path.join(project, 'package-lock.json'), 'utf8'));
    assert.equal(pkg.scripts.test, undefined, 'the standalone starter does not advertise unavailable repository tests');
    assert.equal(lock.packages['node_modules/three'].version, pkg.dependencies.three);
    assert.equal(lock.packages[''].dependencies.three, pkg.dependencies.three);
    const checked = npm(project, ['run', 'check']);
    assert.equal(checked.status, 0, checked.stderr || checked.error?.message);
    assert.match(checked.stdout, /PASS: content, world settings/);
    const currentWorld = JSON.parse(await readFile(path.join(project, 'data', 'world.json'), 'utf8'));
    const shown = npm(project, ['run', 'world:edit', '--', 'show']);
    assert.equal(shown.status, 0, shown.stderr || shown.error?.message);
    assert.deepEqual(JSON.parse(shown.stdout.slice(shown.stdout.indexOf('{'))), currentWorld);
    const patchFile = path.join(fixture.cwd, `${theme}-patch.json`);
    await writeFile(patchFile, encode({ interface: { panel: 'glass' } }));
    const applied = npm(project, ['run', 'world:edit', '--', 'apply', patchFile]);
    assert.equal(applied.status, 0, applied.stderr || applied.error?.message);
    assert.deepEqual(JSON.parse(await readFile(path.join(project, 'data', 'world.json'), 'utf8')),
      { ...currentWorld, interface: { ...currentWorld.interface, panel: 'glass' } });
    const undo = npm(project, ['run', 'world:edit', '--', 'undo']);
    assert.equal(undo.status, 0, undo.stderr || undo.error?.message);
    assert.deepEqual(JSON.parse(await readFile(path.join(project, 'data', 'world.json'), 'utf8')), currentWorld);
    assert.deepEqual(JSON.parse(await readFile(path.join(project, 'data', 'site.json'), 'utf8')), originalContent, 'world editing preserves the personal-content boundary');
    await assert.rejects(lstat(path.join(project, 'node_modules')), { code: 'ENOENT' });
    await assert.rejects(lstat(path.join(project, '.git')), { code: 'ENOENT' });
    await mkdir(path.join(project, 'node_modules'));
    // This is a host-supplied dependency integration, not a fresh npm install.
    await symlink(path.join(repository, 'node_modules', 'three'), path.join(project, 'node_modules', 'three'), 'dir');
    const built = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: project, encoding: 'utf8', timeout: 10000 });
    assert.equal(built.status, 0, built.stderr || built.error?.message);
    const closure = await assertRuntimeClosure(project);
    assert.deepEqual(closure.content.identity, originalContent.identity);
    assert.equal(closure.content.demo, true);
    assert.ok(closure.content.items.every(item => item.published === true));
    assert.deepEqual(JSON.parse(await readFile(path.join(project, 'dist', 'world.json'), 'utf8')),
      JSON.parse(await readFile(path.join(project, 'data', 'world.json'), 'utf8')));
    assert.deepEqual(await readFile(path.join(project, 'dist', 'vendor', 'three-LICENSE.txt')),
      await readFile(path.join(repository, 'node_modules', 'three', 'LICENSE')));
    const provenance = JSON.parse(await readFile(path.join(project, 'dist', 'vendor', 'provenance.json'), 'utf8'));
    for (const record of provenance.files) assert.equal(sha(await readFile(path.join(project, 'dist', record.path))), record.sha256);
    await assert.rejects(lstat(path.join(project, 'dist', '.local')), { code: 'ENOENT' });
    await t.test('generated static server returns its complete local runtime', async t => {
      const server = localServer(project); t.after(() => server.close());
      let url;
      try { url = await server.ready; }
      catch (error) { if (/EPERM|EACCES/.test(error.message)) { t.skip(`Loopback listener unavailable: ${error.message.trim()}`); return; } throw error; }
      for (const resource of closure.resources) {
        const response = await fetch(`${url}/${resource}`, { signal: AbortSignal.timeout(3000) });
        assert.equal(response.status, 200, `${theme} resource ${resource}`);
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(path.join(project, 'dist', resource)));
      }
      for (const privatePath of ['.git/config', '.local/history.json', 'node_modules/three/package.json', 'data/site.json']) {
        assert.equal((await fetch(`${url}/${privatePath}`, { signal: AbortSignal.timeout(3000) })).status, 404);
      }
    });
  });
});

test('scaffold CLI is useful without dependencies and preserves existing destinations', async t => {
  const fixture = await detached(t);
  const help = invoke(fixture, ['--help']); assert.equal(help.status, 0); assert.match(help.stdout, /Usage:/);
  const existing = path.join(fixture.projects, 'existing'); await mkdir(existing);
  await writeFile(path.join(existing, 'keep.txt'), 'EXISTING_PROJECT_DO_NOT_OVERWRITE');
  await rejectedWithoutOutput(fixture, [existing], /not empty/);
  const file = path.join(fixture.projects, 'existing-file'); await writeFile(file, 'KEEP_FILE');
  await rejectedWithoutOutput(fixture, [file], /new or empty real directory/);
  for (const args of [[], ['--force'], [path.join(fixture.projects, 'invalid'), '--theme', 'mountain'],
    [path.join(fixture.projects, 'invalid'), '--theme'], [path.join(fixture.projects, 'invalid'), '--theme', 'sea', '--theme', 'orbital']]) {
    await rejectedWithoutOutput(fixture, args);
  }
  await rejectedWithoutOutput(fixture, [path.join(fixture.projects, 'missing-parent', 'child')], /parent.*does not exist/i);
  const empty = path.join(fixture.projects, 'empty'); await mkdir(empty);
  assert.equal(invoke(fixture, [empty]).status, 0, 'a caller-supplied empty real directory is supported');
  const literal = path.join(fixture.projects, 'site $(touch INJECTED) `touch INJECTED`');
  const result = invoke(fixture, [literal]); assert.equal(result.status, 0, result.stderr);
  assert.ok((await lstat(literal)).isDirectory());
  await assert.rejects(lstat(path.join(fixture.cwd, 'INJECTED')), { code: 'ENOENT' });
  assert.equal(result.stdout.split('\n').some(line => /^\s*cd\b/.test(line)), false, 'next commands do not interpolate a shell path');
  assert.equal((await readdir(fixture.projects)).some(name => name.startsWith('.kaimerva-stage-')), false);
});

test('copied scaffold refuses symlinks without changing link targets or leaving partial output', async t => {
  const fixture = await detached(t);
  const outside = path.join(fixture.base, 'outside'); await mkdir(outside);
  await writeFile(path.join(outside, 'keep.txt'), 'OUTSIDE_LINK_TARGET');
  const beforeOutside = await inventory(outside);
  const destinationLink = path.join(fixture.projects, 'linked-destination'); await symlink(outside, destinationLink, 'dir');
  await rejectedWithoutOutput(fixture, [destinationLink], /real directory/);
  const parentLink = path.join(fixture.projects, 'linked-parent'); await symlink(outside, parentLink, 'dir');
  await rejectedWithoutOutput(fixture, [path.join(parentLink, 'child')], /real directory/);
  assert.deepEqual(await inventory(outside), beforeOutside);
  const source = path.join(fixture.starter, 'data', 'site.json'); const original = await readFile(source);
  const sourceTarget = path.join(outside, 'site.json'); await writeFile(sourceTarget, original);
  await rm(source); await symlink(sourceTarget, source);
  await rejectedWithoutOutput(fixture, [path.join(fixture.projects, 'linked-file-pack')], /symlinks/);
  assert.deepEqual(await readFile(sourceTarget), original);
  await rm(source); await writeFile(source, original);
  const directory = path.join(fixture.starter, 'src'); const directoryTarget = path.join(outside, 'src');
  await cp(directory, directoryTarget, { recursive: true }); await rm(directory, { recursive: true }); await symlink(directoryTarget, directory, 'dir');
  await rejectedWithoutOutput(fixture, [path.join(fixture.projects, 'linked-directory-pack')], /symlinks/);
});

test('corrupt starter bytes and unsafe manifests fail before committing any project', async t => {
  const fixture = await detached(t);
  const manifestFile = path.join(fixture.starter, 'manifest.json'); const source = path.join(fixture.starter, 'data', 'site.json');
  const bytes = await readFile(source);
  await writeFile(source, Buffer.concat([bytes, Buffer.from('\n')]));
  await rejectedWithoutOutput(fixture, [path.join(fixture.projects, 'bad-hash')], /SHA-256/);
  await writeFile(source, bytes);
  await rm(source);
  await rejectedWithoutOutput(fixture, [path.join(fixture.projects, 'missing-asset')], /asset is missing/);
  await writeFile(source, bytes);
  await writeFile(manifestFile, '{not JSON');
  await rejectedWithoutOutput(fixture, [path.join(fixture.projects, 'bad-json')], /not valid JSON/);
  const first = fixture.manifest.files[0];
  const variants = [
    { ...fixture.manifest, files: [{ ...first, path: '../escaped.js' }, ...fixture.manifest.files.slice(1)] },
    { ...fixture.manifest, files: [...fixture.manifest.files, first] },
    { ...fixture.manifest, files: [...fixture.manifest.files, { ...first, path: first.path.toUpperCase() }] },
    { ...fixture.manifest, files: [...fixture.manifest.files, { ...first, path: 'src' }] },
    { ...fixture.manifest, files: fixture.manifest.files.filter(entry => entry.path !== 'data/world.json') },
  ];
  for (let index = 0; index < variants.length; index++) {
    await writeFile(manifestFile, encode(variants[index]));
    await rejectedWithoutOutput(fixture, [path.join(fixture.projects, `bad-manifest-${index}`)]);
  }
  await writeFile(manifestFile, encode(fixture.manifest));
  assert.equal(invoke(fixture, [path.join(fixture.projects, 'recovered')]).status, 0, 'a failed attempt does not poison the next clean scaffold');
});
