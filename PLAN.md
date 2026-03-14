# Technical Decisions Before Implementation

This document lists the key technical decisions needed before implementing the feature:
- Display latest measured temperature on a map of Finland

## Scope

Target feature:
- Fetch latest measured air temperature from FMI observation stations
- Render values on a Finland map using React + MapLibre GL JS

Out of scope for this phase:
- Forecast layers
- Advanced animation and timeline playback

## Required Decisions

## 1. FMI Query Format

Decision to make:
- Use `fmi::observations::weather::timevaluepair` or `fmi::observations::weather::multipointcoverage`

Recommendation:
- Start with `timevaluepair` for simpler latest-value extraction per station

Notes:
- `multipointcoverage` can be introduced later for payload/performance optimization

## 2. Definition of "Latest"

Decision to make:
- Exact time-window rules for latest observations

Recommendation:
- Round current UTC to nearest 10 minutes
- `endtime = rounded_now`
- `starttime = endtime - 10 minutes`
- Retry fallback window: `endtime - 20 minutes`

## 3. Station Identity and Deduplication

Decision to make:
- Which field is the canonical station key
- How to choose one value when multiple records exist

Recommendation:
- Use `fmisid` as station key
- Keep newest timestamp per station

## 4. Coordinate Conventions

Decision to make:
- Internal coordinate format and CRS assumptions

Recommendation:
- Normalize to `longitude, latitude` for map rendering
- Keep one internal format across API parsing and UI components

## 5. Refresh and Caching Policy

Decision to make:
- Poll interval, stale threshold, and cache lifetime

Recommendation:
- Poll every 5 minutes
- Consider data stale if older than 30 minutes
- Cache latest successful payload in memory for transient errors

## 6. Error and Fallback Behavior

Decision to make:
- UI behavior when API fails or station values are missing

Recommendation:
- Show user-friendly error state for full fetch failure
- For station-level gaps, show `No recent observation`
- Keep last successful map layer visible when possible

## 7. Visual Encoding Rules

Decision to make:
- Temperature color scale and map readability behavior

Recommendation:
- Use a fixed color ramp with legend in `degC`
- Keep marker size constant initially for clarity
- Show labels/tooltips with station name, value, and observation time

## 8. Layer and Interaction Model

Decision to make:
- Initial layer behavior and controls

Recommendation:
- Keep a dedicated `Temperature` layer toggle
- Plan-compatible structure for future `Rainfall 24h` and `Radar` toggles

## 9. API Integration Topology

Decision to make:
- Call FMI directly from browser or via backend proxy

Recommendation:
- Start with direct client calls
- Introduce a lightweight proxy only if needed for reliability, CORS handling, or request governance

## 10. Test Strategy

Decision to make:
- What to test before feature is considered done

Minimum test coverage:
- Parse/normalize FMI response
- Latest-value selection per station
- Missing and malformed values
- Empty response handling

## Suggested Defaults (Ready to Implement)

- Map stack: React + MapLibre GL JS
- Stored query: `fmi::observations::weather::timevaluepair`
- Parameter: `t2m`
- BBox: `19,59,32,71`
- Window: 10 minutes, fallback 20 minutes
- Poll interval: 5 minutes
- Station key: `fmisid`
- Stale threshold: 30 minutes

## Definition of Done (Phase 1)

- Map renders Finland with station points
- Latest temperature shown for each station with valid recent data
- Clear loading, empty, and error states
- Legend and units shown (`degC`)
- Basic tests for data transformation logic pass
