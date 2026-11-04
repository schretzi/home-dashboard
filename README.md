# Home-Dashboard

Übersicht über die Dienste im Heimnetz: Status, Links, Netzpläne. Läuft als Container auf der
NAS (slnas02), Konfiguration im Repo `slnas02-infra`.

## Woher der Status kommt

Das Dashboard prüft nichts selbst. Es fragt **Prometheus** nach den Ergebnissen des
Blackbox-Exporters (`probe_success{job="blackbox"}`). Welche Dienste es gibt, steht in den
Zieldateien von Prometheus (`slnas02-infra/prometheus/conf/ziele/*.yml`). Die Labels dort steuern
auch die Anzeige:

| Label | Wirkung |
|---|---|
| `name` | Titel der Karte |
| `gruppe` | Abschnitt auf der Seite |
| `link` | Ziel beim Klick (sonst die Prüfadresse, wenn sie mit http beginnt) |
| `icon` | Datei aus `/icons` oder Name eines Material-Symbols |
| `beschreibung` | Unterzeile |

Einen Dienst ergänzt man also einmal in Prometheus – Überwachung, Alarm und Dashboard folgen
von selbst.

`config.yaml` enthält nur noch:

- `gruppen`: Reihenfolge der Abschnitte
- `links`: Verweise ohne Prüfung (Cloud-Dienste)
- `diagramme`: Beschreibungen zu den Bildern im Ordner `diagrams/`

Beispiel: [`config.yaml.example`](config.yaml.example).

## Links öffnen in neuem Tab

Ein Linksklick öffnet die Seite per `window.open` in einem neuen Tab. Grund: Arc (Peek) und Zen
(Glance) zeigen Links aus angehefteten Tabs sonst als Overlay. Mittelklick und Strg/Cmd-Klick
bleiben dem Browser überlassen.

## API

| Pfad | Inhalt |
|---|---|
| `GET /api/dienste` | Dienste mit Status und Antwortzeit |
| `GET /api/alarme` | feuernde Alarme aus Prometheus (ohne Watchdog) |
| `GET /api/diagramme` | Bilder in `dist/diagrams` mit Größe und Stand |

## Betrieb

```yaml
home-dashboard:
  image: ghcr.io/schretzi/home-dashboard:v0.1.0
  ports: ['8000:8080']
  environment: [PROMETHEUS_URL=http://prometheus:9090]
  volumes:
    - /volume1/docker/home-dashboard/config.yaml:/app/dist/config.yaml:ro
    - /volume1/docker/schretzi-home/webpage/icons:/app/dist/icons:ro
    - /volume1/docker/schretzi-home/webpage/diagrams:/app/dist/diagrams:ro
```

Ein neues Image entsteht beim Push eines Tags `v*` (GitHub Actions → ghcr.io). Der Build führt
vorher die Tests aus.

## Entwicklung

```bash
npm ci
PROMETHEUS_URL=http://slnas02:9090 npm run dev   # Vite + API-Server
npm test                                          # Jest (Oberfläche) + node --test (Server)
```
