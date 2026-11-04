import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceCard from './ServiceCard';
import { Dienst } from '../types';

const dienst: Dienst = {
  name: 'Home Assistant',
  gruppe: 'Smarthome',
  art: 'dienst',
  host: 'ha',
  beschreibung: null,
  icon: 'homeassistant.webp',
  ziel: 'https://ha.um.schretzi.net/manifest.json',
  link: 'https://ha.um.schretzi.net',
  ok: true,
  dauer_ms: 42,
};

describe('ServiceCard', () => {
  afterEach(() => jest.restoreAllMocks());

  test('zeigt Online mit Antwortzeit', () => {
    render(<ServiceCard dienst={dienst} />);
    expect(screen.getByText('Home Assistant')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('42 ms')).toBeInTheDocument();
  });

  test('zeigt Offline', () => {
    render(<ServiceCard dienst={{ ...dienst, ok: false }} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  test('Link ohne Pruefung', () => {
    render(<ServiceCard verweis={{ name: 'UniFi', url: 'https://unifi.ui.com' }} />);
    expect(screen.getByText('Link')).toBeInTheDocument();
  });

  test('Linksklick oeffnet per window.open einen neuen Tab', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<ServiceCard dienst={dienst} />);
    const a = screen.getByRole('link', { name: /Öffnen/ });
    expect(a).toHaveAttribute('href', 'https://ha.um.schretzi.net');
    expect(a).toHaveAttribute('target', '_blank');
    fireEvent.click(a, { button: 0 });
    expect(open).toHaveBeenCalledWith('https://ha.um.schretzi.net', '_blank', 'noopener,noreferrer');
  });

  test('Strg-Klick bleibt dem Browser ueberlassen', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<ServiceCard dienst={dienst} />);
    fireEvent.click(screen.getByRole('link', { name: /Öffnen/ }), { button: 0, ctrlKey: true });
    expect(open).not.toHaveBeenCalled();
  });

  test('ohne Link kein Knopf', () => {
    render(<ServiceCard dienst={{ ...dienst, link: null }} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
