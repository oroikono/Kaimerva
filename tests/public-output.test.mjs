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

test('real build and HTTP provider exclude drafts, preserve empty updates and remove stale output', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'personal-worlds-test-'));
  let server;
  try {
    for (const dir of ['src','scripts','data']) await mkdir(path.join(temporary, dir));
    for (const file of ['package.json','index.html','LICENSE','src/main.js','src/content.js','src/world.js','src/navigation.js','src/themes.js','src/styles.css','scripts/build.mjs','scripts/serve.mjs','data/assets.json']) await copyFile(path.join(root, file), path.join(temporary, file));
    await symlink(path.join(root, 'node_modules'), path.join(temporary, 'node_modules'), 'dir');
    const input = JSON.parse(await readFile(path.join(root, 'data/site.json'), 'utf8'));
    input.items[1].published = false; input.items[1].body = 'PRIVATE_DRAFT_SENTINEL';
    delete input.items[2].published; input.items[2].body = 'MISSING_FLAG_SENTINEL';
    await writeFile(path.join(temporary, 'data/site.json'), JSON.stringify(input));
    await run('scripts/build.mjs', temporary);
    const built = await readFile(path.join(temporary, 'dist/content.json'), 'utf8');
    assert.equal(JSON.parse(built).items.length, 3);
    assert.equal(built.includes('PRIVATE_DRAFT_SENTINEL'), false);
    assert.equal(built.includes('MISSING_FLAG_SENTINEL'), false);
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
    await writeFile(path.join(temporary, 'src/styles.css'), '/* A new visual release. */\n' + await readFile(path.join(temporary, 'src/styles.css'), 'utf8'));
    await run('scripts/build.mjs', temporary);
    await assert.rejects(readFile(path.join(temporary, 'dist/withdrawn.txt')), { code:'ENOENT' });
    assert.ok(!(await readFile(path.join(temporary, 'dist/index.html'), 'utf8')).includes(`main.js?v=${version}`));

    server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd:temporary, env:{ ...process.env, PORT:'0' }, stdio:['ignore','pipe','pipe'] });
    const url = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Temporary server startup timeout')), 8000);
      let output = '';
      server.stdout.on('data', bytes => { output += bytes; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timeout); resolve(match[0]); } });
      server.once('error', error => { clearTimeout(timeout); reject(error); });
      server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Temporary server exited ${code}`)); });
    });
    const response = await fetch(`${url}/content.json`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const served = await response.text();
    assert.equal(JSON.parse(served).items.length, 3);
    assert.equal(served.includes('PRIVATE_DRAFT_SENTINEL'), false);
    assert.equal(served.includes('MISSING_FLAG_SENTINEL'), false);
    assert.equal((await fetch(`${url}/.env`)).status, 404);
    const servedHtml = await (await fetch(url)).text();
    const entrypoint = servedHtml.match(/src="([^\"]+main\.js\?v=[a-f0-9]+)"/)?.[1];
    assert.ok(entrypoint);
    assert.equal((await fetch(new URL(entrypoint, url))).status, 200);

    await writeFile(path.join(temporary, 'data/site.json'), JSON.stringify({ ...input, items:[] }));
    assert.deepEqual((await (await fetch(`${url}/content.json`)).json()).items, []);
    await writeFile(path.join(temporary, 'data/site.json'), 'not json');
    const failed = await fetch(`${url}/content.json`);
    assert.equal(failed.status, 500);
    assert.equal((await failed.text()).includes('PRIVATE_DRAFT_SENTINEL'), false);
  } finally {
    if (server && server.exitCode === null) { const closed = once(server, 'exit'); server.kill('SIGTERM'); await closed; }
    await rm(temporary, { recursive:true, force:true });
  }
});
