import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { build, root, output } from './build.mjs';
import { validateContent, publicSnapshot } from '../src/content.js';
import { validateWorldConfig } from '../src/world-config.js';

const production = process.argv.includes('--production');
if (!production) await build();
const port = Number(process.env.PORT || 4310);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be a valid TCP port (0 selects an available port).');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp' };
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow:'GET, HEAD' }); response.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    // The local preview reads the content file for every request; no build is needed for an edit.
    if (pathname === '/content.json' && !production) {
      const snapshot = validateContent(JSON.parse(await readFile(path.join(root, 'data/site.json'), 'utf8')));
      response.writeHead(200, { 'Content-Type':types['.json'] });
      response.end(request.method === 'HEAD' ? undefined : JSON.stringify(publicSnapshot(snapshot))); return;
    }
    if (pathname === '/world.json' && !production) {
      const settings = validateWorldConfig(JSON.parse(await readFile(path.join(root, 'data/world.json'), 'utf8')));
      response.writeHead(200, { 'Content-Type':types['.json'] });
      response.end(request.method === 'HEAD' ? undefined : JSON.stringify(settings)); return;
    }
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const file = path.resolve(output, relative);
    if (!file.startsWith(output + path.sep) || relative.split(/[\\/]/).some(part => part.startsWith('.'))) { response.writeHead(404); response.end('Not found.'); return; }
    const bytes = await readFile(file);
    response.writeHead(200, { 'Content-Type':relative === 'LICENSE' ? 'text/plain; charset=utf-8' : types[path.extname(file)] || 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') { response.writeHead(404); response.end('Not found.'); }
    else { response.writeHead(500, { 'Content-Type':'text/plain; charset=utf-8' }); response.end('Content or preview file could not be loaded. Check the local source file.'); }
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Kaimerva ${production ? 'static build' : 'local content and settings preview'}: http://127.0.0.1:${server.address().port}`));
server.on('error', error => { console.error(`Preview could not start: ${error.code || error.message}`); process.exitCode = 1; });
