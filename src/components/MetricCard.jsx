export default function MetricCard({ label, value, subtext, color = 'text-text-primary' }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-2xl font-semibold font-mono ${color}`}>{value}</p>
      {subtext && (
        <p className="text-xs text-text-secondary mt-1">{subtext}</p>
      )}
    </div>
  )
}
