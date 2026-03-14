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