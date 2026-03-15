# Implementation Details

## Data Source

This project uses [FMI open data services](fmi), which provide free and high-quality weather and observation data in Finland, including:
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

## Description of Features

- Fetch latest measured air temperature from FMI observation stations.
- The client calls FMI directly from browser. Avoid having to implement a separate backend.
- Display the temperatures on a map of Finland as numerical values (degrees Celsius).
- Visualize rainfall on the map with numerical values (mm) and by overlaying radar data.
- Render values on the map using React + MapLibre GL JS.
- If there's no data from all stations, it's not a problem. Display the data that we have.
- Cache latest successful payload in memory for transient errors.
- Show user-friendly error state for full fetch failure. Keep the last successful map layer visible when possible.
- Poll data every 10 minutes.
- Consider data stale if older than 30 minutes.
- `Temperature`, `Rainfall`, and `Radar` can be toggled on or off.
- Additional three buttons control simultaneously the rainfall observation and radar timespan (`1h`, `2h`, `3h`).

## Programming Conventions

See [conventions.md](conventions.md).
