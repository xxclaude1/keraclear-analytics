import { TIME_PERIODS } from '../lib/constants'

export default function TimeFilter({ selected, onChange }) {
  return (
    <div className="analytics-controls" style={{ marginBottom: 0 }}>
      {TIME_PERIODS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`period-btn ${selected === value ? 'active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
