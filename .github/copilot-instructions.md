# Copilot Instructions for Kitkakartta

## Project Context

Kitkakartta is a React + Vite web application that visualizes weather data on a map of Finland.
Primary data comes from FMI Open Data APIs.

Core features:
- Show current temperature at FMI stations
- Show rainfall totals for the last 24 hours

## General Coding Style

- Prefer clear, maintainable code over clever shortcuts.
- Keep files focused and small; split code when one file has multiple responsibilities.
- Follow existing project style (ES modules, functional React components, no semicolons).
- Avoid adding new dependencies unless there is a strong, practical reason.
- Keep comments short and useful; explain why, not obvious what.

## Naming Conventions

- Use `camelCase` for variables, functions, and object keys.
- Use `PascalCase` for React components and component file names.
- Use `UPPER_SNAKE_CASE` for true constants (for example `API_BASE_URL`).
- Use descriptive names that reveal purpose, for example:
  - `stationTemperatureC` instead of `temp`
  - `rainfallLast24hMm` instead of `rain`
  - `fetchObservationData` instead of `getData`
- Prefer singular names for single entities (`station`) and plural for arrays (`stations`).

## React Best Practices

- Use function components and hooks.
- Keep components presentational when possible; move data fetching and transformation to separate modules/hooks.
- Use `useEffect` only for side effects (network calls, subscriptions, timers).
- Keep hook dependency arrays correct; do not silence lint errors without a clear reason.
- Derive state from props/data when possible instead of duplicating state.
- Lift shared state to the nearest common parent.

## Data Fetching and API Handling

- Encapsulate FMI API calls in dedicated modules (for example `src/api/fmi.js`).
- Use `async/await` with `try/catch` for all network operations.
- Handle loading, success, empty, and error states explicitly in UI.
- Validate and normalize API responses before use in components.
- Use `AbortController` in effects to avoid updating state after unmount.
- Keep API-related constants centralized (base URLs, query parameters, time windows).

## Domain Conventions (Weather + Map)

- Keep units explicit in names:
  - Temperature in Celsius: suffix `C`
  - Rainfall in millimeters: suffix `Mm`
  - Time windows in names (for example `last24h`)
- Preserve coordinate clarity:
  - Use `latitude` and `longitude` field names
  - Document coordinate order where mapping libraries require `[lat, lon]` arrays
- Avoid hardcoding Finnish geography values in components; use config/constants files.
- Prefer deterministic data transformations so map rendering is predictable.

## Error Handling and Resilience

- Fail gracefully in UI when FMI endpoints are unavailable.
- Show user-friendly error messages; avoid exposing raw internal errors.
- Add defensive checks for missing station fields and malformed values.
- Keep fallback behavior explicit (for example `null` value rendering, placeholder labels).

## Performance Guidelines

- Memoize expensive derived values with `useMemo` when needed.
- Memoize callbacks passed deep into component trees with `useCallback` when needed.
- Avoid unnecessary re-renders by keeping state minimal and localized.
- Batch map marker updates through transformed arrays instead of repeated per-item state writes.

## Styling and UI

- Use Tailwind CSS for component UI styling.
- Keep utility classes readable: extract repeated or long class lists to constants/components.
- Prefer semantic UI wrappers for repeated patterns (for example panel, toggle, legend row).
- Avoid nested ternary expressions in `className`; use variant maps or helper functions.
- Keep utility ordering consistent (layout, spacing, size, typography, color, effects, interaction, responsive).
- Use inline style only for truly dynamic runtime values (for example computed marker colors).
- Follow repository conventions in `TAILWIND_CONVENTIONS.md`.
- Prefer consistent spacing, typography, and color usage.
- Ensure responsive layout works on desktop and mobile.
- Ensure sufficient color contrast and accessible text labels for weather values.

## Accessibility

- Use semantic HTML and proper heading structure.
- Provide meaningful `alt` text where images convey information.
- Ensure interactive elements are keyboard accessible.
- Keep ARIA usage minimal and correct; do not add ARIA where native semantics are enough.

## Security and Configuration

- Do not hardcode secrets or private keys.
- Use Vite environment variables with `import.meta.env` and `VITE_` prefix.
- Sanitize or validate external data before rendering.

## Testing Expectations

When adding or changing behavior:
- Add tests for data transformation logic where practical.
- Test edge cases (missing station values, invalid numbers, empty API responses).
- Ensure lint passes before considering a task complete.

## Pull Request Quality

- Keep changes small and focused.
- Include a short explanation of what changed and why.
- Mention tradeoffs when choosing one implementation over another.
- Update README/docs if behavior, setup, or architecture changes.
