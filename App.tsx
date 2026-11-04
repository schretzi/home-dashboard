import React, { useState, useMemo, useEffect, useCallback } from 'react';
import yaml from 'js-yaml';
import { Alarm, Ansicht, Diagramm, Dienst, Konfiguration } from './types';
import ServiceCard from './components/ServiceCard';
import DiagramViewer from './components/DiagramViewer';

const AKTUALISIEREN_MS = 30_000;

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.fehler || `${url}: ${res.status}`);
  }
  return res.json();
}

/** Gruppen in der Reihenfolge aus config.yaml, Rest alphabetisch */
export function gruppieren<T extends { gruppe?: string }>(liste: T[], reihenfolge: string[] = []) {
  const map = new Map<string, T[]>();
  for (const x of liste) {
    const g = x.gruppe || 'Sonstiges';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(x);
  }
  const rang = (g: string) => {
    const i = reihenfolge.indexOf(g);
    return i === -1 ? reihenfolge.length : i;
  };
  return [...map.entries()].sort(([a], [b]) => rang(a) - rang(b) || a.localeCompare(b, 'de'));
}

const groesse = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} kB`);
const datum = (iso: string) =>
  new Date(iso).toLocaleString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const NAVI: { id: Ansicht; text: string; icon: string }[] = [
  { id: 'dienste', text: 'Dienste', icon: 'dns' },
  { id: 'links', text: 'Links', icon: 'link' },
  { id: 'diagramme', text: 'Diagramme', icon: 'schema' },
];

const App: React.FC = () => {
  const [ansicht, setAnsicht] = useState<Ansicht>('dienste');
  const [suche, setSuche] = useState('');
  const [nurProbleme, setNurProbleme] = useState(false);
  const [diagramm, setDiagramm] = useState<Diagramm | null>(null);

  const [konfig, setKonfig] = useState<Konfiguration>({});
  const [dienste, setDienste] = useState<Dienst[]>([]);
  const [alarme, setAlarme] = useState<Alarm[]>([]);
  const [diagramme, setDiagramme] = useState<Diagramm[]>([]);
  const [fehler, setFehler] = useState<string | null>(null);
  const [stand, setStand] = useState<Date | null>(null);
  const [laedt, setLaedt] = useState(true);

  useEffect(() => {
    fetch('/config.yaml')
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => setKonfig(((t && yaml.load(t)) as Konfiguration) || {}))
      .catch(() => setKonfig({}));
    json<Diagramm[]>('/api/diagramme').then(setDiagramme).catch(() => setDiagramme([]));
  }, []);

  const laden = useCallback(async () => {
    try {
      const [d, a] = await Promise.all([json<Dienst[]>('/api/dienste'), json<Alarm[]>('/api/alarme')]);
      setDienste(d);
      setAlarme(a);
      setFehler(null);
      setStand(new Date());
    } catch (e) {
      setFehler(String((e as Error).message || e));
    } finally {
      setLaedt(false);
    }
  }, []);

  useEffect(() => {
    laden();
    const t = setInterval(laden, AKTUALISIEREN_MS);
    return () => clearInterval(t);
  }, [laden]);

  const passt = (...felder: (string | null | undefined)[]) =>
    felder.some((f) => f && f.toLowerCase().includes(suche.toLowerCase()));

  const gefilterteDienste = useMemo(
    () => dienste.filter((d) => (!nurProbleme || !d.ok) && passt(d.name, d.ziel, d.gruppe, d.beschreibung, d.host)),
    [dienste, suche, nurProbleme],
  );
  const gefilterteLinks = useMemo(
    () => (konfig.links || []).filter((l) => passt(l.name, l.url, l.beschreibung, l.gruppe)),
    [konfig, suche],
  );
  const gefilterteDiagramme = useMemo(
    () =>
      diagramme
        .map((d) => ({ ...d, beschreibung: konfig.diagramme?.[d.datei] }))
        .filter((d) => passt(d.datei, d.beschreibung)),
    [diagramme, konfig, suche],
  );

  const offline = dienste.filter((d) => !d.ok);

  if (laedt) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Lade Status …</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside className="w-52 flex-shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="size-8 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20 ring-1 ring-slate-200/50">
            <img src="/dashboard.png" alt="" className="size-full object-cover" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Home-Dashboard</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {NAVI.map((n) => (
            <button
              key={n.id}
              onClick={() => setAnsicht(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${
                ansicht === n.id ? 'bg-primary/5 text-primary font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span
                className={`material-symbols-outlined ${ansicht === n.id ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}
              >
                {n.icon}
              </span>
              <span>{n.text}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium uppercase tracking-tight">Dienste</span>
              <span className={`font-bold ${offline.length ? 'text-rose-600' : 'text-emerald-600'}`}>
                {dienste.length - offline.length}/{dienste.length} online
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-400 font-medium uppercase tracking-tight">Alarme</span>
              <span className={`font-bold ${alarme.length ? 'text-amber-600' : 'text-emerald-600'}`}>{alarme.length}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 text-slate-400">
              {fehler ? <span className="text-rose-600">Prometheus nicht erreichbar</span> : stand && `Stand ${stand.toLocaleTimeString('de-AT')}`}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 gap-4">
          <h2 className="text-lg font-bold text-slate-900">{NAVI.find((n) => n.id === ansicht)!.text}</h2>
          <div className="flex items-center gap-4">
            {ansicht === 'dienste' && (
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                <input type="checkbox" checked={nurProbleme} onChange={(e) => setNurProbleme(e.target.checked)} className="rounded" />
                nur Störungen
              </label>
            )}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Suchen …"
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
                className="w-56 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {fehler && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Status nicht abrufbar: {fehler}
            </div>
          )}

          {ansicht === 'dienste' && alarme.length > 0 && (
            <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <h3 className="text-sm font-bold text-amber-800 mb-2">Aktive Alarme</h3>
              <ul className="space-y-1 text-xs text-amber-900">
                {alarme.map((a, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span>{a.text}</span>
                    <span className="text-amber-700/70 whitespace-nowrap">seit {datum(a.seit)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {ansicht === 'dienste' && (
            <div className="space-y-8">
              {gruppieren(gefilterteDienste, konfig.gruppen).map(([gruppe, liste]) => (
                <section key={gruppe}>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4">{gruppe}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {liste.map((d) => (
                      <ServiceCard key={d.ziel} dienst={d} />
                    ))}
                  </div>
                </section>
              ))}
              {gefilterteDienste.length === 0 && !fehler && (
                <Leer text={nurProbleme ? 'Keine Störungen.' : `Nichts gefunden für „${suche}“.`} icon={nurProbleme ? 'check_circle' : 'search_off'} />
              )}
            </div>
          )}

          {ansicht === 'links' && (
            <div className="space-y-8">
              {gruppieren(gefilterteLinks, konfig.gruppen).map(([gruppe, liste]) => (
                <section key={gruppe}>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4">{gruppe}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {liste.map((l) => (
                      <ServiceCard key={l.url} verweis={l} />
                    ))}
                  </div>
                </section>
              ))}
              {gefilterteLinks.length === 0 && <Leer text="Keine Links (config.yaml → links)." icon="link_off" />}
            </div>
          )}

          {ansicht === 'diagramme' && (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-subtle">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 border-b border-border text-slate-400 uppercase text-[9px] font-bold tracking-[0.1em]">
                  <tr>
                    <th className="px-6 py-3">Datei</th>
                    <th className="px-6 py-3">Größe</th>
                    <th className="px-6 py-3">Stand</th>
                    <th className="px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gefilterteDiagramme.map((d) => (
                    <tr key={d.datei} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3">
                        <button className="text-left" onClick={() => setDiagramm(d)}>
                          <span className="block font-semibold text-slate-900 group-hover:text-primary">{d.datei}</span>
                          {d.beschreibung && <span className="text-xs text-slate-400">{d.beschreibung}</span>}
                        </button>
                      </td>
                      <td className="px-6 py-3 text-slate-500">{groesse(d.bytes)}</td>
                      <td className="px-6 py-3 text-slate-500">{datum(d.stand)}</td>
                      <td className="px-6 py-3 text-right">
                        <a href={d.url} download className="p-2 text-slate-400 hover:text-primary" title="Herunterladen">
                          <span className="material-symbols-outlined text-lg">download</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                  {gefilterteDiagramme.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <Leer text="Keine Diagramme im Ordner diagrams/." icon="folder_open" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {diagramm && <DiagramViewer diagram={diagramm} onClose={() => setDiagramm(null)} />}
    </div>
  );
};

const Leer: React.FC<{ text: string; icon: string }> = ({ text, icon }) => (
  <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
    <span className="material-symbols-outlined text-4xl mb-2">{icon}</span>
    <p>{text}</p>
  </div>
);

export default App;
