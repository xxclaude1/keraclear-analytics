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

const STEP_COLORS = ['#3B82F6', '#A855F7', '#A855F7', '#22C55E', '#EAB308', '#22C55E']

export default function FunnelChart({ data = [] }) {
  const navigate = useNavigate()

  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-title">Conversion Funnel</div>
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-state-sub">No funnel data available yet</div>
        </div>
      </div>
    )
  }

  const maxCount = data[0]?.count || 1

  return (
    <div className="chart-card">
      <div className="chart-title">Conversion Funnel</div>

      <div>
        {data.map((step, i) => {
          const widthPct = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 2) : 2
          const label = STEP_LABELS[step.step] || step.step
          const dropOff = step.drop_off || 0
          const convRate = step.conversion_rate || 0

          return (
            <div key={step.step}>
              {i > 0 && dropOff > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 4px 132px' }}>
                  <span style={{ width: 1, height: 12, background: 'var(--border)' }} />
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>
                    -{formatNumber(dropOff)} dropped ({formatPercent(100 - convRate)})
                  </span>
                </div>
              )}

              <div className="funnel-bar" style={{ cursor: 'pointer' }} onClick={() => navigate('/sessions')}>
                <span className="funnel-label">{label}</span>
                <div className="funnel-track" style={{ position: 'relative' }}>
                  <div className="funnel-fill" style={{ width: `${widthPct}%`, background: STEP_COLORS[i] || '#3B82F6', opacity: 0.7 }} />
                  {i > 0 && (
                    <span style={{
                      position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)',
                    }}>
                      {formatPercent(convRate)} from prev
                    </span>
                  )}
                </div>
                <span className="funnel-value">
                  {formatNumber(step.count)} ({formatPercent(step.overall_rate)})
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {data.length >= 2 && (
        <div style={{
          marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Overall conversion</span>
          <span style={{
            fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 600,
            color: (data[data.length - 1]?.overall_rate || 0) >= 5 ? 'var(--green)' :
              (data[data.length - 1]?.overall_rate || 0) >= 2 ? 'var(--yellow)' : 'var(--red)',
          }}>
            {formatPercent(data[data.length - 1]?.overall_rate || 0)}
          </span>
        </div>
      )}
    </div>
  )
}
