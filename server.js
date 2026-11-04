/**
 * Server fuer das Home-Dashboard.
 *
 * Der Status der Dienste kommt NICHT mehr aus eigenen Pruefungen, sondern aus Prometheus
 * (Blackbox-Exporter, job="blackbox"). Welche Dienste es gibt, wie sie heissen und wohin der
 * Klick fuehrt, steht in den Labels der Ziele (slnas02-infra: prometheus/conf/ziele/*.yml).
 * So gibt es nur eine Liste fuer Ueberwachung und Dashboard.
 *
 *   GET /api/dienste    Dienste mit Status, gruppiert nach Labels
 *   GET /api/alarme     aktive Alarme (ohne Watchdog)
 *   GET /api/diagramme  Bilder im Ordner dist/diagrams (Groesse, Stand)
 *
 * Dev: API_ONLY=1, Vite leitet /api hierher weiter. Produktion: liefert auch dist/ aus.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const API_ONLY = process.env.API_ONLY === '1' || process.env.API_ONLY === 'true';
const PROMETHEUS_URL = (process.env.PROMETHEUS_URL || 'http://prometheus:9090').replace(/\/$/, '');
const DIST = path.join(__dirname, 'dist');
const STATIC_ROOT = fs.existsSync(DIST) ? DIST : null;
const DIAGRAMME = path.join(STATIC_ROOT || path.join(__dirname, 'public'), 'diagrams');
const CACHE_MS = 10_000;
const TIMEOUT_MS = 8_000;

const cache = new Map();

async function prometheus(pfad) {
  const treffer = cache.get(pfad);
  if (treffer && Date.now() - treffer.zeit < CACHE_MS) return treffer.daten;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(PROMETHEUS_URL + pfad, { signal: controller.signal });
    if (!res.ok) throw new Error(`Prometheus antwortet ${res.status}`);
    const json = await res.json();
    if (json.status !== 'success') throw new Error(json.error || 'Prometheus-Fehler');
    cache.set(pfad, { zeit: Date.now(), daten: json.data });
    return json.data;
  } finally {
    clearTimeout(t);
  }
}

const abfrage = (q) => prometheus('/api/v1/query?query=' + encodeURIComponent(q));

/** Ziel-URL fuer den Klick: Label 'link', sonst die Pruefadresse, wenn sie eine Webseite ist. */
function linkFuer(labels) {
  if (labels.link) return labels.link;
  return /^https?:\/\//.test(labels.instance) ? labels.instance : null;
}

export async function dienste() {
  const [ok, dauer] = await Promise.all([
    abfrage('probe_success{job="blackbox"}'),
    abfrage('probe_duration_seconds{job="blackbox"}'),
  ]);
  const ms = new Map(dauer.result.map((r) => [r.metric.instance, Math.round(Number(r.value[1]) * 1000)]));
  return ok.result
    .map(({ metric: m, value }) => ({
      name: m.name || m.instance,
      gruppe: m.gruppe || 'Sonstiges',
      art: m.art || 'dienst',
      host: m.host || null,
      beschreibung: m.beschreibung || null,
      icon: m.icon || null,
      ziel: m.instance,
      link: linkFuer(m),
      ok: value[1] === '1',
      dauer_ms: ms.get(m.instance) ?? null,
    }))
    .sort((a, b) => a.gruppe.localeCompare(b.gruppe, 'de') || a.name.localeCompare(b.name, 'de'));
}

export async function alarme() {
  const daten = await prometheus('/api/v1/alerts');
  return daten.alerts
    .filter((a) => a.state === 'firing' && a.labels.alertname !== 'Watchdog')
    .map((a) => ({
      name: a.labels.alertname,
      schwere: a.labels.schwere || null,
      text: a.annotations.summary || a.labels.alertname,
      seit: a.activeAt,
    }));
}

function diagramme() {
  if (!fs.existsSync(DIAGRAMME)) return [];
  return fs
    .readdirSync(DIAGRAMME)
    .filter((d) => /\.(png|jpe?g|svg|webp)$/i.test(d))
    .map((datei) => {
      const st = fs.statSync(path.join(DIAGRAMME, datei));
      return { datei, url: '/diagrams/' + encodeURIComponent(datei), bytes: st.size, stand: st.mtime.toISOString() };
    })
    .sort((a, b) => b.stand.localeCompare(a.stand));
}

function sendJson(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.yaml': 'text/yaml; charset=utf-8',
};

function serveStatic(req, res, basePath) {
  const pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const rel = pfad === '/' ? 'index.html' : path.normalize(pfad).replace(/^[/\\]+/, '');
  const p = path.join(basePath, rel);
  if (!p.startsWith(basePath + path.sep)) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  fs.readFile(p, (err, data) => {
    if (err) {
      // Single-Page-App: unbekannte Seiten auf index.html, fehlende Dateien 404
      if (err.code === 'ENOENT' && !path.extname(p)) {
        res.setHeader('Location', '/');
        res.statusCode = 302;
        res.end();
        return;
      }
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    res.setHeader('Content-Type', TYPEN[path.extname(p).toLowerCase()] || 'application/octet-stream');
    if (rel === 'config.yaml' || rel === 'index.html') res.setHeader('Cache-Control', 'no-cache');
    res.end(data);
  });
}

const API = {
  '/api/dienste': dienste,
  '/api/alarme': alarme,
  '/api/diagramme': async () => diagramme(),
};

export const server = http.createServer(async (req, res) => {
  const pfad = (req.url || '/').split('?')[0];
  const handler = API[pfad];
  if (req.method === 'GET' && handler) {
    try {
      sendJson(res, 200, await handler());
    } catch (e) {
      sendJson(res, 502, { fehler: String(e.message || e) });
    }
    return;
  }
  if (!API_ONLY && STATIC_ROOT && req.method === 'GET') {
    serveStatic(req, res, STATIC_ROOT);
    return;
  }
  res.statusCode = 404;
  res.end('Not found');
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Home-Dashboard auf Port ${PORT} (Prometheus ${PROMETHEUS_URL}, API_ONLY=${API_ONLY})`);
  });
}
