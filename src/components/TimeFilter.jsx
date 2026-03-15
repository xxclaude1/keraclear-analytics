import { TIME_PERIODS } from '../lib/constants'

export default function TimeFilter({ selected, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-lg p-1">
      {TIME_PERIODS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            selected === value
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {label}
        </button>
      ))}
      <button
        onClick={() => onChange('custom')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          selected === 'custom'
            ? 'bg-bg-tertiary text-text-primary'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        Custom
      </button>
    </div>
  )
}
