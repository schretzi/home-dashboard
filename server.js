/**
 * Minimal server for status checks (avoids CORS) and optional static file serving.
 * Dev: run with API_ONLY=1; Vite proxies /api to this server.
 * Production: serves static from dist/ and /api/status.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const API_ONLY = process.env.API_ONLY === '1' || process.env.API_ONLY === 'true';
const DIST = path.join(__dirname, 'dist');
const STATIC_ROOT = fs.existsSync(DIST) ? DIST : null;

const STATUS_TIMEOUT_MS = 8000;

function parseUrlQuery(raw) {
  const i = raw.indexOf('?');
  if (i === -1) return {};
  const params = new URLSearchParams(raw.slice(i));
  return Object.fromEntries(params);
}

async function checkServiceStatus(targetUrl) {
  let url;
  try {
    url = new URL(targetUrl);
  } catch {
    return { ok: false };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS);
  const opts = {
    redirect: 'follow',
    signal: controller.signal,
    headers: { 'User-Agent': 'HomeDashboard/1.0' },
  };
  try {
    let res = await fetch(targetUrl, { ...opts, method: 'HEAD' });
    if (res.status === 405) {
      res = await fetch(targetUrl, { ...opts, method: 'GET' });
    }
    clearTimeout(timeout);
    return { ok: res.ok };
  } catch {
    clearTimeout(timeout);
    return { ok: false };
  }
}

function sendJson(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

function serveStatic(req, res, basePath) {
  let p = req.url === '/' ? '/index.html' : req.url;
  p = path.join(basePath, path.normalize(p).replace(/^\//, ''));
  if (!p.startsWith(basePath)) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  fs.readFile(p, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT' && !p.endsWith('.html')) {
        res.setHeader('Location', '/index.html');
        res.statusCode = 302;
        res.end();
        return;
      }
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    const ext = path.extname(p);
    const types = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.ico': 'image/x-icon',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.yaml': 'text/yaml',
    };
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET' && req.url?.startsWith('/api/status')) {
    const query = parseUrlQuery(req.url);
    const url = query.url;
    if (!url) {
      sendJson(res, 400, { ok: false, error: 'Missing url parameter' });
      return;
    }
    const result = await checkServiceStatus(decodeURIComponent(url));
    sendJson(res, 200, result);
    return;
  }

  if (!API_ONLY && STATIC_ROOT && req.method === 'GET') {
    serveStatic(req, res, STATIC_ROOT);
    return;
  }

  res.statusCode = 404;
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT} (API_ONLY=${API_ONLY}, static=${STATIC_ROOT ? 'yes' : 'no'})`);
});
