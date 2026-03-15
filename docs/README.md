# Implementation Details

## Data Source

This project uses [FMI open data services](fmi), which provide free and high-quality weather and observation data in Finland, including:
- Temperature observations
- Precipitation observations
- Relative humidity observations
- Observation station metadata
- Rain radar products

## Tech Stack

- React
- Vite
- ESLint
- MapLibre GL JS
- Tailwind CSS

## Description of Features

- Fetch latest measured air temperature from FMI observation stations.
- The client calls FMI directly from browser. Avoid having to implement a separate backend.
- Display the temperatures on a map of Finland as numerical values (degrees Celsius).
- Visualize rainfall on the map with numerical values (mm) and by overlaying radar data.
- Visualize relative humidity as percentage values averaged over the selected timespan (`1h`, `12h`, `24h`).
- Render values on the map using React + MapLibre GL JS.
- If there's no data from all stations, it's not a problem. Display the data that we have.
- Cache the latest successful payload in memory.
- Show user-friendly error state for full fetch failure. Keep the last successful map layer visible when possible.
- Poll data every 10 minutes.
- Consider data stale if older than 30 minutes.
- `Temperature`, `Relative Humidity`, `Rainfall`, and `Radar` can be toggled on or off.
- Additional three buttons control simultaneously rainfall, relative humidity aggregation, and radar timespan (`1h`, `12h`, `24h`).

## Programming Conventions

See [conventions.md](conventions.md).
