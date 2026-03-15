export default function MetricCard({ label, value, subtext, color, small }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${small ? 'sm' : ''}`} style={color ? { color } : undefined}>
        {value}
      </div>
      {subtext && <div className="metric-sub">{subtext}</div>}
    </div>
  )
}
