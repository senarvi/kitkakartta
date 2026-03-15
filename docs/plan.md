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
- Keep a dedicated `Temperature` layer toggle.
- Plan-compatible structure for future `Rainfall` toggle.

## Test Strategy

Minimum test coverage:
- Parse/normalize FMI response
- Latest-value selection per station
- Missing and malformed values
- Empty response handling
- Parse/normalize rainfall values from FMI response.
- Latest-value selection per station for rainfall.
- Missing/malformed rainfall values.
- Empty rainfall response handling.
- Layer toggle behavior (`Temperature`, `Rainfall`, both on/off).
- If radar is added: legend scale mapping and overlay visibility logic.

## Phase 2 Plan: Rainfall Visualization

Select rainfall product (`rr1h`, `rr12h`, `rr24h`) from the 1h/12h/24h buttons in the UI.

## Definition of Done

- Rainfall layer can be enabled and disabled independently.
- Latest rainfall values are shown for stations with valid recent data.
- Clear units are shown for rainfall values.
- Loading, empty, and error states behave consistently with temperature.
- Basic rainfall transformation tests pass.

## Implementation Checklist

### 1. Constants and query configuration

File: `src/constants/weather.js`

- Add rainfall parameter constants (start with one metric, for example 1h amount).
- Add rainfall display defaults (unit label, optional value formatting limits).
- Keep existing polling/stale defaults unless rainfall needs a different interval.

### 2. FMI API request builder

File: `src/api/fmi.js`

- Add a rainfall request URL builder using the same stored query family as temperature.
- Keep query scope to Finland bbox and explicit rainfall parameter list.
- Return request timestamp metadata for stale checks and UI status text.

### 3. Parser and transformation logic

File: `src/parsers/fmiTemperatureParser.js` or split into `src/parsers/fmiWeatherParser.js`

- Add parsing path for rainfall value extraction from the same coverage/value structure.
- Normalize to shared internal fields:
	- `stationId`, `stationName`, `longitude`, `latitude`, `observedAtEpochMs`
	- rainfall field (`rainfallAmount1hMm` or `rainfallRateMmPerH`)
- Reuse and/or generalize latest-value-per-station selector.
- Keep defensive handling for non-numeric and missing values.

### 4. Data hook

File: `src/hooks/useLatestTemperatures.js` or add `src/hooks/useLatestRainfall.js`

- Add rainfall polling hook with the same cache fallback behavior.
- Expose state flags consistent with temperature:
	- `isLoading`, `isEmpty`, `isErrorWithoutData`, `lastUpdatedAt`
- Keep hook API focused so UI can render with minimal conditional logic.

### 5. Map rendering

File: `src/App.jsx`

- Add `Rainfall` toggle alongside `Temperature`.
- Add rainfall `Source` + `Layer` definitions using collision-aware symbol labels.
- Keep temperature and rainfall layers independently togglable.
- Ensure label style remains readable on map background.

### 6. UI labels and units

File: `src/App.jsx`

- Show rainfall unit in legend/status (for example `mm` for amount, `mm/h` for rate).
- Ensure tooltip/title text includes station name, rainfall value, and observation time.
- Keep loading/error/empty messages explicit and user-friendly.

### 7. Tests

Files:

- `src/parsers/fmiTemperatureParser.test.js` (or new rainfall-focused parser test file)
- Optional: new selector test file if logic is separated

Add tests for:

- Rainfall parsing and normalization
- Latest-value selection per station
- Missing/malformed rainfall values
- Empty response handling
- Coordinate order safety (`longitude`, `latitude` internal format)

### 8. Validation and acceptance

Commands:

- `npm run lint`
- `npm run test`
- `npm run build`

Manual checks:

- Rainfall layer toggle works.
- Rainfall labels update on refresh.
- Temperature and rainfall can be shown independently without UI regressions.

