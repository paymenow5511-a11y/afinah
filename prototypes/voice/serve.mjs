import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Standalone loopback-only preview. Explicit allowlist avoids exposing repo files.
const root = new URL('../../', import.meta.url);
const files = new Set([
  '/prototypes/voice/index.html', '/prototypes/voice/style.css', '/prototypes/voice/app.js',
  '/prototypes/voice/demo-responder.js', '/src/core/voice.js', '/src/core/voice-session.js',
  '/src/adapters/browser-speech.js'
]);
const mime = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8' };
const port = Number(process.env.AFINAH_VOICE_PORT || 4178);
createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const file = path === '/' ? '/prototypes/voice/index.html' : path;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
  response.setHeader('Permissions-Policy', 'microphone=(self), camera=(), geolocation=()');
  if (!['GET', 'HEAD'].includes(request.method) || !files.has(file)) {
    response.writeHead(404); response.end('Not found'); return;
  }
  // Redirect root so relative assets resolve consistently.
  if (path === '/') { response.writeHead(302, { Location: '/prototypes/voice/index.html' }); response.end(); return; }
  try {
    const body = await readFile(fileURLToPath(new URL(file.slice(1), root)));
    response.writeHead(200, { 'Content-Type': mime[file.split('.').pop()] });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Afinah voice prototype: http://127.0.0.1:${port}/`));
