# Kitkakartta

Kitkakartta is a web tool that visualizes weather observations on a map of Finland.

The application shows:
- Current temperature at FMI measurement stations
- Rainfall amount for the last 24 hours at each location

Data is fetched from the Finnish Meteorological Institute (FMI) Open Data API.

## Data Source

This project uses [FMI open data services](docs/fmi), which provide free and high-quality weather and observation data in Finland, including:
- Temperature observations
- Precipitation observations
- Observation station metadata
- Rain radar products

## Tech Stack

- React
- Vite
- ESLint
- MapLibre GL JS
- Tailwind CSS

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
