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

## Phase 2 Plan: Rainfall Visualization

## Objectives

- Visualize rainfall on the Finland map with clear units and timestamps.
- Keep the implementation compatible with existing map layer toggles.
- Reuse the current polling, caching, and error-handling patterns.

## FMI Data Options

### Option A: Station observations (recommended first step)

Use weather observation stored queries and request rainfall-related parameters.

- `fmi::observations::weather::multipointcoverage`
- `fmi::observations::weather::hourly::multipointcoverage`
- `fmi::observations::weather::daily::multipointcoverage`

Benefits:

- Same data model style as current temperature implementation.
- Fast to implement with current parser architecture.
- Good for point labels and tooltips.

Limitations:

- Sparse station network compared to full-area rainfall fields.

### Option B: Radar composites (recommended second step)

Use radar grid products for area-wide precipitation maps.

- `fmi::radar::composite::rr` (precipitation rate)
- `fmi::radar::composite::rr1h` (1h amount)
- `fmi::radar::composite::rr12h` (12h amount)
- `fmi::radar::composite::rr24h` (24h amount)

Benefits:

- Continuous Finland-wide precipitation coverage.
- Better spatial context at low zoom.

Limitations:

- More complex rendering and color-scale handling than station points.

### Option C: Combined mode (target state)

- Radar composite as background precipitation field.
- Station labels for exact measured values.
- Zoom-dependent emphasis (radar at low zoom, station details at higher zoom).

## Recommended Delivery Sequence

### Phase 2A: Rainfall from stations

1. Add `Rainfall` layer toggle next to `Temperature`.
2. Implement rainfall fetch path using weather observation stored query.
3. Parse and normalize rainfall values with explicit `rainfall` naming and units.
4. Keep newest value per station.
5. Render collision-aware rainfall labels using the current `Source` + `Layer` pattern.
6. Reuse loading/empty/error and cache fallback behavior.

### Phase 2B: Radar overlay

1. Add optional radar precipitation layer (`rr1h` first).
2. Render as map overlay with adjustable opacity.
3. Add legend for radar value scale and units.
4. Show radar timestamp separately from station timestamp.

### Phase 2C: Unified rainfall view

1. Tune layer ordering and visibility by zoom level.
2. Add UI for selecting rainfall product (`rr`, `rr1h`, `rr24h`).
3. Keep map readable when temperature and rainfall are both enabled.

## Data and Naming Conventions for Rainfall

- Use explicit unit suffixes in code:
	- `rainfallRateMmPerH` for rate
	- `rainfallAmount1hMm`, `rainfallAmount24hMm` for accumulated amounts
- Keep internal coordinates in `longitude`, `latitude`.
- Keep timestamps in epoch milliseconds and ISO strings.

## Test Strategy (Phase 2)

Minimum coverage:

- Parse/normalize rainfall values from FMI response.
- Latest-value selection per station for rainfall.
- Missing/malformed rainfall values.
- Empty rainfall response handling.
- Layer toggle behavior (`Temperature`, `Rainfall`, both on/off).
- If radar is added: legend scale mapping and overlay visibility logic.

## Definition of Done (Phase 2A)

- Rainfall layer can be enabled and disabled independently.
- Latest rainfall values are shown for stations with valid recent data.
- Clear units are shown for rainfall values.
- Loading, empty, and error states behave consistently with temperature.
- Basic rainfall transformation tests pass.

## Implementation Checklist (Phase 2A)

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

