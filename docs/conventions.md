# Tailwind Conventions

This guide defines how Tailwind is used in Kitkakartta so component markup stays readable and maintainable.

## Goals

- Keep JSX easy to scan
- Avoid long, duplicated utility strings
- Keep visual behavior consistent across map UI components

## 1. Class String Length Rule

- If a `className` grows beyond about 8-10 utilities, extract it.
- Extract repeated strings to constants or helper maps in the same file.

Example:

```jsx
const panelClassName =
  'rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur'
```

## 2. Use Variant Maps, Not Conditional String Noise

- Avoid nested ternaries inside `className`.
- Prefer maps keyed by semantic state.

Example:

```jsx
const toneClassByState = {
  normal: 'text-slate-900',
  muted: 'text-slate-600',
  error: 'text-rose-700',
}

<p className={toneClassByState[state]}>{message}</p>
```

## 3. Keep Utility Order Stable

Use this order inside each class string:
1. Layout (`flex`, `grid`, `absolute`, `inset-0`)
2. Spacing (`p-3`, `gap-2`, `mt-2`)
3. Size (`w-`, `h-`, `max-w-`)
4. Typography (`text-`, `font-`, `leading-`)
5. Colors (`bg-`, `text-`, `border-`)
6. Effects (`shadow-`, `backdrop-blur`, `opacity-`)
7. Interaction (`hover:`, `focus-visible:`)
8. Responsive/state prefixes (`md:`, `data-[state=on]:`)

This is a readability rule, not a strict compiler requirement.

## 4. Prefer Semantic Wrapper Components for Shared UI

For repeated structures (map panel, toggle button, legend item), create small UI components.

Suggested reusable components:
- `MapPanel`
- `LayerToggleButton`
- `LegendScale`
- `StatusBanner`

Do not copy-paste long utility strings across feature components.

## 5. Keep Dynamic Styling in JS, Static Styling in Tailwind

- Use Tailwind for static visual structure.
- Use inline style only for true runtime values (for example dynamic marker color from temperature).

Example:

```jsx
<span className="inline-block size-3 rounded-full" style={{ backgroundColor: color }} />
```

## 6. Restrict Arbitrary Values

- Avoid frequent use of arbitrary values like `w-[173px]`.
- Prefer scale tokens first.
- Arbitrary values are acceptable for map-specific edge cases only.

## 7. Responsive Rules

- Mobile-first defaults.
- Add `sm:`, `md:`, `lg:` only when behavior actually changes.
- Do not repeat unchanged utilities at larger breakpoints.

## 8. Accessibility Rules in Class Usage

- Every interactive element must have visible focus styles (`focus-visible:outline-*` or ring).
- Ensure text over map backgrounds has sufficient contrast.
- Do not encode status with color alone; pair with text/icon.

## 9. State Styling Convention

- Use data attributes or boolean prop maps for stateful styles.
- Keep states explicit: `default`, `active`, `disabled`, `error`.

Example:

```jsx
const toggleClassByState = {
  default: 'bg-white text-slate-700 border-slate-300',
  active: 'bg-sky-600 text-white border-sky-700',
  disabled: 'bg-slate-100 text-slate-400 border-slate-200',
}
```

## 10. Recommended Helper Utility

Use a tiny `cn` helper for composition.

`src/utils/cn.js`:

```js
export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}
```

Usage:

```jsx
<button className={cn(baseButtonClass, isActive && activeButtonClass)} />
```

## 11. File-Level Pattern

Inside each React component file, keep style constants near the top:

1. Base classes
2. Variant maps
3. Component JSX

This keeps behavior and presentation aligned without giant inline strings.

## 12. Pull Request Checklist (Tailwind)

- No duplicated long class strings across files
- No deeply nested ternaries in `className`
- Focus-visible styles present on controls
- Class order is consistent and readable
- Extracted reusable UI component when pattern repeats 3 or more times

# Coordinate And CRS Conventions

This section defines coordinate assumptions across FMI parsing, internal data models, and map rendering.

## Upstream Conventions

- `maplibre-gl` and `react-map-gl` use WGS84 semantics and coordinate order `longitude, latitude` (`lng, lat`).
- GeoJSON (RFC 7946) positions are also `longitude, latitude`.
- FMI request `bbox` is provided as `minLon,minLat,maxLon,maxLat` (for example `19,59,32,71`).
- FMI XML responses in this project use GML coordinate tuples in `latitude longitude` order in `gml:pos` and `gmlcov:positions`.

## Project Decision

- Internal canonical coordinate format is `longitude, latitude`.
- Parse FMI coordinates as input-format-specific data and convert immediately during normalization.
- Store named fields (`longitude`, `latitude`) in app data structures, not unlabeled arrays.
- Emit coordinate arrays only at integration boundaries, always as `[longitude, latitude]`.

## Guardrails

- Keep CRS assumptions explicit in parser code and tests.
- Add tests that fail on swapped axes and verify conversion from FMI `latitude longitude` to internal `longitude, latitude`.
- When reading FMI payloads, trust `srsName`/coverage metadata over assumptions from previous queries.

# Timestamp Conventions

This section defines timestamp handling across FMI requests, normalized observation models, and UI rendering.

## Canonical Formats

- Use UTC as the canonical time basis for parsing, comparisons, and request construction.
- Keep both forms when useful:
  - Epoch milliseconds for logic: `observedAtEpochMs`
  - ISO-8601 string for metadata/UI: `observedAtIso`, `lastUpdatedAt`, `requestedAt`
- Keep units explicit in names:
  - `*EpochMs` for numeric millisecond timestamps
  - `*Iso` for ISO timestamp strings

## FMI Request Timestamps

- Build FMI `starttime` and `endtime` as UTC ISO-8601 values.
- Strip milliseconds from query parameters for stable request strings (`YYYY-MM-DDTHH:mm:ssZ`).
- Keep request window logic explicit in code (for example lookback minutes/hours and aggregation window).

## Observation Normalization

- Convert FMI Unix timestamps (seconds) to epoch milliseconds immediately during parsing.
- Preserve the original observation time as ISO in normalized objects.
- Do not store local-time-formatted values in domain models.

## UI Display Conventions

- Format display timestamps only at UI boundaries.
- Show user-facing times with explicit locale/timezone settings (currently `fi-FI`, `Europe/Helsinki`).
- Keep internal state and comparisons timezone-agnostic (UTC-based).

## Staleness And Polling

- Evaluate staleness using epoch millisecond arithmetic only.
- Keep polling interval and stale threshold centralized in constants.
- Use `lastUpdatedAt` to represent the timestamp of the last successful data refresh.

## Guardrails

- Avoid mixing seconds and milliseconds in the same field.
- Avoid parsing localized date strings back into logic.
- Add tests for time-window boundaries (inclusive/exclusive behavior) for rainfall aggregation and freshness filtering.