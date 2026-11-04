// node --test server.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.PROMETHEUS_URL = 'http://prom.test';

const antworten = {
  'probe_success{job="blackbox"}': [
    { metric: { instance: 'https://ha.um.schretzi.net/manifest.json', name: 'Home Assistant', gruppe: 'Smarthome', link: 'https://ha.um.schretzi.net', art: 'dienst' }, value: [0, '1'] },
    { metric: { instance: 'rabbitmq:1883', name: 'MQTT', gruppe: 'Smarthome', art: 'dienst' }, value: [0, '0'] },
  ],
  'probe_duration_seconds{job="blackbox"}': [
    { metric: { instance: 'https://ha.um.schretzi.net/manifest.json' }, value: [0, '0.0421'] },
  ],
};
const aufrufe = [];
globalThis.fetch = async (url) => {
  aufrufe.push(url);
  const u = new URL(url);
  if (u.pathname === '/api/v1/alerts') {
    return { ok: true, json: async () => ({ status: 'success', data: { alerts: [
      { state: 'firing', labels: { alertname: 'Watchdog' }, annotations: {}, activeAt: 'x' },
      { state: 'firing', labels: { alertname: 'DienstNichtErreichbar', schwere: 'kritisch' }, annotations: { summary: 'MQTT nicht erreichbar' }, activeAt: 't' },
      { state: 'pending', labels: { alertname: 'GeraetOffline' }, annotations: {}, activeAt: 't' },
    ] } }) };
  }
  const q = u.searchParams.get('query');
  return { ok: true, json: async () => ({ status: 'success', data: { result: antworten[q] } }) };
};

const { dienste, alarme } = await import('./server.js');

test('dienste: Status, Link und Antwortzeit aus Prometheus', async () => {
  const d = await dienste();
  assert.equal(d.length, 2);
  const ha = d.find((x) => x.name === 'Home Assistant');
  assert.equal(ha.ok, true);
  assert.equal(ha.link, 'https://ha.um.schretzi.net');
  assert.equal(ha.dauer_ms, 42);
  const mqtt = d.find((x) => x.name === 'MQTT');
  assert.equal(mqtt.ok, false);
  assert.equal(mqtt.link, null, 'TCP-Ziel ohne link-Label hat keinen Link');
  assert.ok(aufrufe.every((u) => u.startsWith('http://prom.test/')), 'fragt nur Prometheus');
});

test('alarme: nur feuernde, ohne Watchdog', async () => {
  const a = await alarme();
  assert.deepEqual(a.map((x) => x.text), ['MQTT nicht erreichbar']);
});
