import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App, { gruppieren } from './App';

const DIENSTE = [
  { name: 'Grafana', gruppe: 'Monitoring', art: 'dienst', host: 'slnas02', beschreibung: null, icon: null,
    ziel: 'http://grafana:3000/api/health', link: 'http://slnas02:3000', ok: true, dauer_ms: 5 },
  { name: 'Home Assistant', gruppe: 'Smarthome', art: 'dienst', host: 'ha', beschreibung: null, icon: null,
    ziel: 'https://ha.um.schretzi.net/manifest.json', link: 'https://ha.um.schretzi.net', ok: false, dauer_ms: 8000 },
];
const KONFIG = 'gruppen: [Smarthome, Monitoring]\nlinks:\n  - {name: UniFi, url: "https://unifi.ui.com", gruppe: Extern}\n';

function antworten(url: string) {
  const body: Record<string, unknown> = {
    '/api/dienste': DIENSTE,
    '/api/alarme': [{ name: 'DienstNichtErreichbar', schwere: 'kritisch', text: 'Home Assistant nicht erreichbar', seit: '2026-11-04T20:00:00Z' }],
    '/api/diagramme': [],
  };
  if (url === '/config.yaml') return Promise.resolve({ ok: true, text: async () => KONFIG });
  return Promise.resolve({ ok: true, json: async () => body[url] });
}

beforeEach(() => {
  (global as any).fetch = jest.fn(antworten);
});

test('gruppieren: Reihenfolge aus config, Rest alphabetisch', () => {
  const g = gruppieren([{ gruppe: 'B' }, { gruppe: 'Z' }, { gruppe: 'A' }], ['Z']).map(([n]) => n);
  expect(g).toEqual(['Z', 'A', 'B']);
});

test('zeigt Dienste nach Gruppen, Zaehler und Alarme', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText('Grafana')).toBeInTheDocument());
  const ueberschriften = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(ueberschriften.slice(1)).toEqual(['Smarthome', 'Monitoring']);
  expect(screen.getByText('1/2 online')).toBeInTheDocument();
  expect(screen.getByText('Home Assistant nicht erreichbar')).toBeInTheDocument();
});

test('nur Stoerungen filtert', async () => {
  render(<App />);
  await waitFor(() => screen.getByText('Grafana'));
  fireEvent.click(screen.getByLabelText('nur Störungen'));
  expect(screen.queryByText('Grafana')).not.toBeInTheDocument();
  expect(screen.getByText('Home Assistant')).toBeInTheDocument();
});

test('Links-Ansicht aus config.yaml', async () => {
  render(<App />);
  await waitFor(() => screen.getByText('Grafana'));
  fireEvent.click(screen.getByRole('button', { name: /Links/ }));
  expect(await screen.findByText('UniFi')).toBeInTheDocument();
});
