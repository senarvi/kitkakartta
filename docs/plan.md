# Implementation Plan

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

## Test Coverage

- Parse/normalize FMI response.
- Latest-value selection per station.
- Missing and malformed values.
- Empty response handling.
- Layer toggle behavior (`Temperature`, `Rainfall`, both on/off).
- If radar is added: legend scale mapping and overlay visibility logic.
- Coordinate order safety (`longitude`, `latitude` internal format).
