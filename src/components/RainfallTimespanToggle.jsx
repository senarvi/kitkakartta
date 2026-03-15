export function RainfallTimespanToggle({ selectedKey, options, onSelect }) {
  return (
    <div
      className="mt-2 flex w-full items-center justify-end gap-1"
      role="group"
      aria-label="Rainfall timespan"
    >
      {options.map((option) => {
        const isSelected = selectedKey === option.key
        const className = isSelected
          ? 'rounded border border-emerald-700 bg-emerald-600 px-2 py-1 text-xs font-semibold text-white'
          : 'rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700'

        return (
          <button
            key={option.key}
            type="button"
            className={className}
            onClick={() => onSelect(option.key)}
            aria-pressed={isSelected}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
