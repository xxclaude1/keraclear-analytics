import { useNavigate } from 'react-router-dom'
import { formatNumber, formatPercent } from '../utils/formatters'

const STEP_LABELS = {
  landing_page_view: 'Landing Page',
  vsl_page_view: 'VSL Page',
  sales_page_view: 'Sales Page',
  add_to_cart: 'Add to Cart',
  checkout_initiated: 'Checkout',
  checkout_completed: 'Purchase',
}

const STEP_COLORS = [
  'bg-neutral',
  'bg-accent',
  'bg-accent',
  'bg-positive',
  'bg-warning',
  'bg-positive',
]

export default function FunnelChart({ data = [] }) {
  const navigate = useNavigate()

  if (!data || data.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border rounded-lg p-6 text-center text-text-secondary text-sm">
        No funnel data available yet
      </div>
    )
  }

  const maxCount = data[0]?.count || 1

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-5">
      <h3 className="text-sm font-medium text-text-primary mb-4">Conversion Funnel</h3>

      <div className="space-y-2">
        {data.map((step, i) => {
          const widthPct = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 4) : 4
          const label = STEP_LABELS[step.step] || step.step
          const dropOff = step.drop_off || 0
          const convRate = step.conversion_rate || 0

          return (
            <div key={step.step}>
              {/* Drop-off indicator between steps */}
              {i > 0 && dropOff > 0 && (
                <div className="flex items-center gap-2 py-1 pl-4">
                  <div className="w-px h-4 bg-border" />
                  <span className="text-[10px] text-negative">
                    -{formatNumber(dropOff)} dropped ({formatPercent(100 - convRate)})
                  </span>
                </div>
              )}

              {/* Funnel bar */}
              <div
                className="group cursor-pointer"
                onClick={() => {
                  // Navigate to sessions filtered by this funnel step
                  // Could filter by event type in the future
                  navigate('/sessions')
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-primary">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-primary">
                      {formatNumber(step.count)}
                    </span>
                    <span className="text-xs font-mono text-text-secondary w-14 text-right">
                      {formatPercent(step.overall_rate)}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-bg-tertiary rounded-sm h-8 relative overflow-hidden">
                  <div
                    className={`h-full rounded-sm transition-all duration-500 ${STEP_COLORS[i] || 'bg-neutral'} opacity-70 group-hover:opacity-90`}
                    style={{ width: `${widthPct}%` }}
                  />
                  {/* Conversion rate label inside bar */}
                  {i > 0 && (
                    <div className="absolute inset-y-0 left-2 flex items-center">
                      <span className="text-[10px] font-mono text-white/80 drop-shadow">
                        {formatPercent(convRate)} from prev
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      {data.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-text-secondary">Overall conversion</span>
          <span className={`text-sm font-mono font-semibold ${
            (data[data.length - 1]?.overall_rate || 0) >= 5 ? 'text-positive' :
            (data[data.length - 1]?.overall_rate || 0) >= 2 ? 'text-warning' : 'text-negative'
          }`}>
            {formatPercent(data[data.length - 1]?.overall_rate || 0)}
          </span>
        </div>
      )}
    </div>
  )
}
