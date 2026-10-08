import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function run(file, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file], { cwd, stdio:['ignore','pipe','pipe'] });
    let errors = ''; child.stderr.on('data', bytes => { errors += bytes; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(errors || `Process exited ${code}`)));
  });
}
function startServer(cwd, args = []) {
  const server = spawn(process.execPath, ['scripts/serve.mjs', ...args], { cwd, env:{ ...process.env, PORT:'0' }, stdio:['ignore','pipe','pipe'] });
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Temporary server startup timeout')), 8000);
    let output = ''; let errors = '';
    server.stdout.on('data', bytes => { output += bytes; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timeout); resolve(match[0]); } });
    server.stderr.on('data', bytes => { errors += bytes; });
    server.once('error', error => { clearTimeout(timeout); reject(error); });
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(errors || `Temporary server exited ${code}`)); });
  });
  return { server, ready };
}

test('real build and HTTP provider exclude drafts, preserve empty updates and remove stale output', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'personal-worlds-test-'));
  let server;
  try {
    for (const dir of ['src','scripts','data','figures','assets/brand']) await mkdir(path.join(temporary, dir), { recursive:true });
    for (const file of ['package.json','index.html','LICENSE','src/main.js','src/content.js','src/world-config.js','src/world.js','src/realm-atmosphere.js','src/realm-portal.js','src/realm-surfaces.js','src/coastal-detail.js','src/voyage.js','src/voyage-clearance.js','src/exploration.js','src/exploration-beacons.js','src/figure-passage.js','src/figure-reader.js','src/navigation.js','src/themes.js','src/styles.css','scripts/build.mjs','scripts/serve.mjs','data/assets.json','data/world.json','figures/wave-sources.svg','figures/wave-propagation.svg','figures/wave-interference.svg','figures/project-overview.svg','figures/project-inspection.svg','figures/project-editing.svg']) await copyFile(path.join(root, file), path.join(temporary, file));
    await mkdir(path.join(temporary, '.local'));
    for (const file of ['assets/brand/kaimerva-icon.png','assets/brand/ATTRIBUTION.md']) await copyFile(path.join(root, file), path.join(temporary, file));
    await writeFile(path.join(temporary, '.local/history.json'), 'PRIVATE_SETTINGS_HISTORY');
    await symlink(path.join(root, 'node_modules'), path.join(temporary, 'node_modules'), 'dir');
    const input = JSON.parse(await readFile(path.join(root, 'data/site.json'), 'utf8'));
    input.items[0].figure = structuredClone(input.items[1].figure);
    input.items[1].published = false; input.items[1].body = 'PRIVATE_DRAFT_SENTINEL';
    input.items[1].figure = { ...input.items[1].figure, src:'./figures/private-draft.svg', caption:'PRIVATE_FIGURE_CAPTION', stages:[{ ...input.items[1].figure.stages[0], src:'./figures/private-draft.svg', description:'PRIVATE_FIGURE_STAGE' }] };
    await writeFile(path.join(temporary, 'figures/private-draft.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><text>PRIVATE_FIGURE_BYTES</text></svg>');
    await writeFile(path.join(temporary, 'figures/unreferenced.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><text>UNREFERENCED_FIGURE_BYTES</text></svg>');
    delete input.items[2].published; input.items[2].body = 'MISSING_FLAG_SENTINEL';
    await writeFile(path.join(temporary, 'data/site.json'), JSON.stringify(input));
    await run('scripts/build.mjs', temporary);
    const initialWorld = JSON.parse(await readFile(path.join(temporary, 'data/world.json'), 'utf8'));
    assert.deepEqual(JSON.parse(await readFile(path.join(temporary, 'dist/world.json'), 'utf8')), initialWorld);
    await assert.rejects(readFile(path.join(temporary, 'dist/.local/history.json')), { code:'ENOENT' });
    assert.ok((await readFile(path.join(temporary, 'dist/src/world-config.js'), 'utf8')).includes('validateWorldConfig'));
    const built = await readFile(path.join(temporary, 'dist/content.json'), 'utf8');
    assert.equal(JSON.parse(built).items.length, 3);
    assert.equal(built.includes('PRIVATE_DRAFT_SENTINEL'), false);
    assert.equal(built.includes('MISSING_FLAG_SENTINEL'), false);
    for (const sentinel of ['private-draft.svg','PRIVATE_FIGURE_CAPTION','PRIVATE_FIGURE_STAGE']) assert.equal(built.includes(sentinel), false);
    for (const file of ['wave-sources.svg','wave-propagation.svg','wave-interference.svg']) assert.deepEqual(await readFile(path.join(temporary, 'dist/figures', file)), await readFile(path.join(temporary, 'figures', file)));
    for (const file of ['private-draft.svg','unreferenced.svg']) await assert.rejects(readFile(path.join(temporary, 'dist/figures', file)), { code:'ENOENT' });
    // Referenced asset errors are caught before clearing the previous build.
    await writeFile(path.join(temporary, 'dist/reviewable.txt'), 'KEEP_PREVIOUS_BUILD');
    const malformedAsset = structuredClone(input); malformedAsset.items[0].figure.src = './figures/missing.svg';
    await writeFile(path.join(temporary, 'data/site.json'), JSON.stringify(malformedAsset));
    await assert.rejects(run('scripts/build.mjs', temporary), /Referenced figure is missing/);
    assert.equal(await readFile(path.join(temporary, 'dist/content.json'), 'utf8'), built);
    assert.equal(await readFile(path.join(temporary, 'dist/reviewable.txt'), 'utf8'), 'KEEP_PREVIOUS_BUILD');
    await symlink(path.join(temporary, 'data/site.json'), path.join(temporary, 'figures/escape.svg'));
    malformedAsset.items[0].figure.src = './figures/escape.svg';
    await writeFile(path.join(temporary, 'data/site.json'), JSON.stringify(malformedAsset));
    await assert.rejects(run('scripts/build.mjs', temporary), /regular local file/);
    await mkdir(path.join(temporary, 'figures/not-a-file.svg'));
    malformedAsset.items[0].figure.src = './figures/not-a-file.svg';
    await writeFile(path.join(temporary, 'data/site.json'), JSON.stringify(malformedAsset));
    await assert.rejects(run('scripts/build.mjs', temporary), /regular local file/);
    assert.equal(await readFile(path.join(temporary, 'dist/content.json'), 'utf8'), built);
    await writeFile(path.join(temporary, 'data/site.json'), JSON.stringify(input));
    const html = await readFile(path.join(temporary, 'dist/index.html'), 'utf8');
    const version = html.match(/src\/main\.js\?v=([a-f0-9]{12})/)?.[1];
    assert.ok(version, 'The entrypoint must invalidate stale CDN modules.');
    assert.ok(html.includes(`styles.css?v=${version}`));
    for (const file of ['main.js', 'world.js']) {
      const module = await readFile(path.join(temporary, 'dist/src', file), 'utf8');
      const imports = [...module.matchAll(/from ['"]\.\/([^'"]+)['"]/g)];
      assert.ok(imports.length);
      assert.ok(imports.every(match => match[1].endsWith(`?v=${version}`)));
    }
    assert.deepEqual(await readFile(path.join(temporary, 'dist/vendor/three-LICENSE.txt')), await readFile(path.join(root, 'node_modules/three/LICENSE')));
    await writeFile(path.join(temporary, 'dist/withdrawn.txt'), 'WITHDRAWN');
    await writeFile(path.join(temporary, 'dist/figures/withdrawn.svg'), 'WITHDRAWN_FIGURE');
    await writeFile(path.join(temporary, 'src/styles.css'), '/* A new visual release. */\n' + await readFile(path.join(temporary, 'src/styles.css'), 'utf8'));
    await run('scripts/build.mjs', temporary);
    await assert.rejects(readFile(path.join(temporary, 'dist/withdrawn.txt')), { code:'ENOENT' });
    await assert.rejects(readFile(path.join(temporary, 'dist/figures/withdrawn.svg')), { code:'ENOENT' });
    assert.ok(!(await readFile(path.join(temporary, 'dist/index.html'), 'utf8')).includes(`main.js?v=${version}`));

    const preview = startServer(temporary);
    server = preview.server;
    const url = await preview.ready;
    const response = await fetch(`${url}/content.json`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const served = await response.text();
    assert.equal(JSON.parse(served).items.length, 3);
    assert.equal(served.includes('PRIVATE_DRAFT_SENTINEL'), false);
    assert.equal(served.includes('MISSING_FLAG_SENTINEL'), false);
    assert.equal(served.includes('PRIVATE_FIGURE_CAPTION'), false);
    const figureResponse = await fetch(`${url}/figures/wave-interference.svg`);
    const iconResponse = await fetch(`${url}/assets/brand/kaimerva-icon.png`);
    assert.equal(iconResponse.status, 200);
    assert.equal(iconResponse.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await iconResponse.arrayBuffer()), await readFile(path.join(root, 'assets/brand/kaimerva-icon.png')));
    assert.equal(figureResponse.status, 200);
    assert.match(figureResponse.headers.get('content-type'), /image\/svg\+xml/);
    assert.equal(await figureResponse.text(), await readFile(path.join(root, 'figures/wave-interference.svg'), 'utf8'));
    assert.equal((await fetch(`${url}/figures/private-draft.svg`)).status, 404);
    assert.equal((await fetch(`${url}/figures/unreferenced.svg`)).status, 404);
    const liveFigure = structuredClone(input);
    liveFigure.items[0].figure.caption = 'A revised public caption, without rebuilding';
    await writeFile(path.join(temporary, 'data/site.json'), JSON.stringify(liveFigure));
    assert.equal((await (await fetch(`${url}/content.json`)).json()).items[0].figure.caption, liveFigure.items[0].figure.caption);
    const invalidFigure = structuredClone(liveFigure); invalidFigure.items[0].figure.stages[0].src = './figures/%2e%2e/private.svg';
    await writeFile(path.join(temporary, 'data/site.json'), JSON.stringify(invalidFigure));
    const rejectedFigure = await fetch(`${url}/content.json`);
    assert.equal(rejectedFigure.status, 500);
    assert.equal((await rejectedFigure.text()).includes('PRIVATE_FIGURE_CAPTION'), false);
    await writeFile(path.join(temporary, 'data/site.json'), JSON.stringify(liveFigure));
    assert.equal((await fetch(`${url}/.env`)).status, 404);
    assert.equal((await fetch(`${url}/.local/history.json`)).status, 404);
    const settingsResponse = await fetch(`${url}/world.json`);
    assert.equal(settingsResponse.status, 200);
    assert.equal(settingsResponse.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await settingsResponse.json(), initialWorld);
    const updatedWorld = structuredClone(initialWorld);
    updatedWorld.interface = { reader:'dialog', panel:'glass', buttonShape:'pill' };
    updatedWorld.environment.exposure = 0.8;
    updatedWorld.environment.keyLightMultiplier = 0.6;
    await writeFile(path.join(temporary, 'data/world.json'), JSON.stringify(updatedWorld));
    assert.deepEqual(await (await fetch(`${url}/world.json`)).json(), updatedWorld, 'The preview must read settings edits without rebuilding.');
    await writeFile(path.join(temporary, 'data/world.json'), JSON.stringify({ ...updatedWorld, secret:'PRIVATE_SETTINGS_HISTORY' }));
    const failedSettings = await fetch(`${url}/world.json`);
    assert.equal(failedSettings.status, 500);
    assert.equal((await failedSettings.text()).includes('PRIVATE_SETTINGS_HISTORY'), false);
    await writeFile(path.join(temporary, 'data/world.json'), JSON.stringify(updatedWorld));
    const servedHtml = await (await fetch(url)).text();
    const entrypoint = servedHtml.match(/src="([^\"]+main\.js\?v=[a-f0-9]+)"/)?.[1];
    assert.ok(entrypoint);
    assert.equal((await fetch(new URL(entrypoint, url))).status, 200);
    for (const file of ['realm-atmosphere.js', 'realm-portal.js', 'realm-surfaces.js', 'coastal-detail.js', 'voyage.js', 'voyage-clearance.js']) {
      const imported = new URL(`./src/${file}`, url);
      imported.search = new URL(entrypoint, url).search;
      const moduleResponse = await fetch(imported);
      assert.equal(moduleResponse.status, 200, `new scene import is served: ${file}`);
      assert.match(moduleResponse.headers.get('content-type'), /javascript/);
      assert.equal(await moduleResponse.text(), await readFile(path.join(temporary, 'dist/src', file), 'utf8'));
    }

    await writeFile(path.join(temporary, 'data/site.json'), JSON.stringify({ ...input, items:[] }));
    assert.deepEqual((await (await fetch(`${url}/content.json`)).json()).items, []);
    await writeFile(path.join(temporary, 'data/site.json'), 'not json');
    const failed = await fetch(`${url}/content.json`);
    assert.equal(failed.status, 500);
    assert.equal((await failed.text()).includes('PRIVATE_DRAFT_SENTINEL'), false);
    const closed = once(server, 'exit'); server.kill('SIGTERM'); await closed;
    const production = startServer(temporary, ['--production']);
    server = production.server;
    const productionUrl = await production.ready;
    assert.deepEqual(await (await fetch(`${productionUrl}/world.json`)).json(), initialWorld, 'Production serves the validated build snapshot, not subsequent local edits.');
    assert.equal((await fetch(`${productionUrl}/.local/history.json`)).status, 404);
  } finally {
    if (server && server.exitCode === null) { const closed = once(server, 'exit'); server.kill('SIGTERM'); await closed; }
    await rm(temporary, { recursive:true, force:true });
  }
});
