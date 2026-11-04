/** Ein geprueftes Ziel aus Prometheus (Blackbox), siehe server.js /api/dienste. */
export interface Dienst {
  name: string;
  gruppe: string;
  art: 'dienst' | 'geraet' | string;
  host: string | null;
  beschreibung: string | null;
  icon: string | null;
  ziel: string;
  link: string | null;
  ok: boolean;
  dauer_ms: number | null;
}

/** Ein Link ohne Pruefung (Cloud-Dienste u. a.), aus config.yaml. */
export interface Verweis {
  name: string;
  url: string;
  beschreibung?: string;
  icon?: string;
  gruppe?: string;
}

export interface Alarm {
  name: string;
  schwere: string | null;
  text: string;
  seit: string;
}

export interface Diagramm {
  datei: string;
  url: string;
  bytes: number;
  stand: string;
  /** aus config.yaml (diagramme: {datei: beschreibung}) */
  beschreibung?: string;
}

export interface Konfiguration {
  /** Reihenfolge der Gruppen auf der Seite; nicht genannte Gruppen folgen alphabetisch */
  gruppen?: string[];
  links?: Verweis[];
  diagramme?: Record<string, string>;
}

export type Ansicht = 'dienste' | 'links' | 'diagramme';
