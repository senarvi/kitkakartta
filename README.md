# Kitkakartta

Kitkakartta is a web tool that visualizes weather observations on a map of Finland.

The application shows:
- Current temperature at FMI measurement stations
- Rainfall amount for the last 24 hours at each location

Data is fetched from the Finnish Meteorological Institute (FMI) Open Data API.

## Data Source

This project uses FMI open data services, which provide free and high-quality weather and observation data in Finland, including:
- Temperature observations
- Precipitation observations
- Observation station metadata
- Rain radar products

Useful FMI links:
- FMI Open Data portal: <https://en.ilmatieteenlaitos.fi/open-data>
- FMI Open Data WFS examples and docs: <https://en.ilmatieteenlaitos.fi/open-data-manual-wfs-examples-and-guidelines>

## Method: Latest Station Temperatures

To fetch current measured temperatures (not forecast), use FMI WFS weather observations.

Base endpoint:
- `https://opendata.fmi.fi/wfs`

Stored query:
- `fmi::observations::weather::timevaluepair`

Recommended request pattern:

```text
https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=GetFeature&storedquery_id=fmi::observations::weather::timevaluepair&bbox=19,59,32,71&parameters=t2m&starttime=2026-03-14T10:00:00Z&endtime=2026-03-14T10:10:00Z&timestep=10
```

How this works:
1. Query only observation data (`fmi::observations::weather::timevaluepair`).
2. Request air temperature with `parameters=t2m`.
3. Limit results to Finland using `bbox=19,59,32,71` (lon,lat; EPSG:4326).
4. Use a short recent time window (for example 10-20 minutes).
5. In application logic, group by station and keep the newest value per station.

Operational recommendation:
- Round current UTC time to the nearest 10 minutes.
- Set `endtime` to that rounded time.
- Set `starttime` to `endtime - 10 minutes` (or `-20 minutes` for resilience).

Alternative format:
- `fmi::observations::weather::multipointcoverage` returns more compact payloads for map rendering.

## Tech Stack

- React
- Vite
- ESLint
- MapLibre GL JS
- Tailwind CSS

UI conventions:
- Tailwind readability and composition rules are documented in `TAILWIND_CONVENTIONS.md`.

### Map

For this project, the map stack is React + MapLibre GL JS.

Why this stack:
- Works well with mixed weather layers (station points + raster radar overlays)
- Performs better as map complexity grows
- Supports smooth layer toggles, opacity control, and future time animation

Suggested layer approach:
1. Temperature layer: station-based points colored by temperature (`t2m`)
2. Rainfall layer: station-based points colored by last 24h rainfall (`rr_24h` or equivalent)
3. Radar layer: FMI radar raster overlay for precipitation area context

Practical UI pattern:
- Add map layer toggles for `Temperature`, `Rainfall 24h`, and `Radar`
- Keep station values visible as measured ground truth
- Use radar as spatial context, not the only rainfall source

## Development

Install dependencies:

```bash
npm install
```

Start local development server:

```bash
npm run dev
```

Run linting:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Project Goal

The goal is to provide an easy-to-read, map-based weather overview for Finland, focused on near real-time temperature and recent rainfall.
