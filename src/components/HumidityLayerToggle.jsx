export function HumidityLayerToggle({ isVisible, onToggle }) {
  const buttonClassName = isVisible
    ? 'inline-flex items-center rounded-md border border-indigo-700 bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white'
    : 'inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700'

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={onToggle}
      aria-pressed={isVisible}
    >
      Humidity
    </button>
  )
}
