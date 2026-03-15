# Implementation Plan

## Description of Features

- Fetch latest measured air temperature from FMI observation stations.
- The client calls FMI directly from browser. Avoid having to implement a separate backend.
- Display the temperatures on a map of Finland as numerical values (degrees Celsius).
- Render values on the map using React + MapLibre GL JS.
- If there's no data from all stations, it's not a problem. Display the data that we have.
- Cache latest successful payload in memory for transient errors.
- Show user-friendly error state for full fetch failure. Keep the last successful map layer visible when possible.
- Poll data every 10 minutes.
- Consider data stale if older than 30 minutes.
- Keep a dedicated `Temperature` layer toggle.
- Plan-compatible structure for future `Rainfall` toggle.

## Test Strategy

Minimum test coverage:
- Parse/normalize FMI response
- Latest-value selection per station
- Missing and malformed values
- Empty response handling

## Definition of Done (Phase 1)

- Map renders Finland with station points.
- Latest temperature shown for each station with valid recent data.
- Clear loading, empty, and error states.
- Units shown (`°C`).
- Basic tests for data transformation logic pass.
