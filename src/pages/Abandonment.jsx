import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TimeFilter from '../components/TimeFilter'
import MetricCard from '../components/MetricCard'
import useTimeFilter from '../hooks/useTimeFilter'
import { formatNumber, formatPercent, formatDuration, formatRelativeTime } from '../utils/formatters'

export default function Abandonment() {
  const navigate = useNavigate()
  const { period, setPeriod } = useTimeFilter('7d')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [flaggedRecordings, setFlaggedRecordings] = useState([])
  const [exitPages, setExitPages] = useState([])
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ type: '', device: '' })
  const limit = 20

  useEffect(() => { fetchAll() }, [period])
  useEffect(() => { fetchSessions() }, [page, filters, period])

  async function fetchAll() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?section=abandonment&period=${period}`)
      const data = await res.json()
      setStats({
        cartRate: data.cart_rate || 0, checkoutRate: data.checkout_rate || 0,
        cartAbandons: data.cart_abandons || 0, checkoutAbandons: data.checkout_abandons || 0,
        cartTrend: data.cart_trend || 0, checkoutTrend: data.checkout_trend || 0,
        totalATC: data.total_atc || 0, totalCO: data.total_co || 0,
      })
      setFlaggedRecordings(data.flagged_recordings || [])
      setExitPages(data.exit_pages || [])
    } catch (err) { console.error('Abandonment stats error:', err) }
    setLoading(false)
  }

  async function fetchSessions() {
    try {
      const params = new URLSearchParams({
        page: page.toString(), limit: limit.toString(), period, abandonment: filters.type || 'any',
      })
      if (filters.device) params.set('device', filters.device)
      const res = await fetch(`/api/sessions?${params}`)
      const data = await res.json()
      setSessions(data.sessions || [])
      setTotalSessions(data.total || 0)
    } catch (err) { console.error('Abandonment sessions error:', err) }
  }

  const totalPages = Math.ceil(totalSessions / limit)

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Abandonment Analysis</h1>
          <p className="page-subtitle">Cart and checkout abandonment insights</p>
        </div>
        <TimeFilter selected={period} onChange={setPeriod} />
      </div>

      {loading && !stats ? (
        <div className="empty-state"><div className="empty-state-text">Loading abandonment data...</div></div>
      ) : (
        <>
          {/* Rate Cards */}
          <div className="metrics-grid cols-2" style={{ marginBottom: 24 }}>
            <div className="metric-card">
              <div className="metric-label">Cart Abandonment Rate</div>
              <div className="metric-value" style={{ color: 'var(--red)' }}>{formatPercent(stats?.cartRate)}</div>
              <div className="metric-sub">
                {(stats?.cartTrend || 0) > 0 ? '↑' : '↓'}
                <span style={{ color: (stats?.cartTrend || 0) > 0 ? 'var(--red)' : 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {(stats?.cartTrend || 0) > 0 ? '+' : ''}{formatPercent(stats?.cartTrend)} vs prev
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {formatNumber(stats?.cartAbandons)} of {formatNumber(stats?.totalATC)} add-to-carts
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Checkout Abandonment Rate</div>
              <div className="metric-value" style={{ color: 'var(--yellow)' }}>{formatPercent(stats?.checkoutRate)}</div>
              <div className="metric-sub">
                {(stats?.checkoutTrend || 0) > 0 ? '↑' : '↓'}
                <span style={{ color: (stats?.checkoutTrend || 0) > 0 ? 'var(--red)' : 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {(stats?.checkoutTrend || 0) > 0 ? '+' : ''}{formatPercent(stats?.checkoutTrend)} vs prev
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {formatNumber(stats?.checkoutAbandons)} of {formatNumber(stats?.totalCO)} checkouts initiated
              </div>
            </div>
          </div>

          {/* Auto-Flagged Recordings */}
          {flaggedRecordings.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 16 }}>
              <div className="card-header" style={{ color: 'var(--red)' }}>
                Auto-Flagged Recordings
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{flaggedRecordings.length}</span>
              </div>
              <div className="card-body">
                {flaggedRecordings.map((s) => (
                  <div key={s.id} className="session-row" onClick={() => navigate(`/sessions/${s.id}`)}>
                    <span style={{ fontSize: 14 }}>{s.device_type === 'mobile' ? '📱' : '🖥'}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, width: 80 }}>{s.visitor_id?.substring(0, 12)}</span>
                    <span className={`flag-badge ${s.abandonment_type === 'cart' ? 'cart' : 'checkout'}`}>
                      {s.abandonment_type === 'cart' ? 'Cart' : 'Checkout'}
                    </span>
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.utm_source || 'Direct'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {formatDuration(s.duration_seconds)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatRelativeTime(s.started_at)}</span>
                    <span style={{ fontSize: 16 }}>▶</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exit Heatmap */}
          {exitPages.length > 0 && (
            <div className="chart-card" style={{ marginBottom: 16 }}>
              <div className="chart-title">Exit Heatmap — Where visitors abandon</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {exitPages.map((ep, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{ep.page}</span>
                    <div className="funnel-track" style={{ height: 22 }}>
                      <div className="funnel-fill" style={{ width: `${Math.max(ep.pct, 3)}%`, background: 'var(--red)', opacity: 0.6 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', width: 50, textAlign: 'right', flexShrink: 0 }}>
                      {formatPercent(ep.pct)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', width: 40, textAlign: 'right', flexShrink: 0 }}>
                      {ep.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="sessions-filters">
            <select className="filter-select" value={filters.type}
              onChange={e => { setFilters({ ...filters, type: e.target.value }); setPage(1) }}>
              <option value="">All Abandonment</option>
              <option value="cart">Cart Only</option>
              <option value="checkout">Checkout Only</option>
            </select>
            <select className="filter-select" value={filters.device}
              onChange={e => { setFilters({ ...filters, device: e.target.value }); setPage(1) }}>
              <option value="">All Devices</option>
              <option value="mobile">Mobile</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>

          {/* Sessions Table */}
          <div className="card">
            <div className="card-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Device</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Exit Page</th>
                    <th className="right">Duration</th>
                    <th className="right">Pages</th>
                    <th>When</th>
                    <th>Replay</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      {loading ? 'Loading...' : 'No abandonment sessions found'}
                    </td></tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={s.id} onClick={() => navigate(`/sessions/${s.id}`)}>
                        <td className="mono">{s.visitor_id?.substring(0, 12)}...</td>
                        <td>{s.device_type === 'mobile' ? '📱' : '🖥'}</td>
                        <td>
                          <span className={`flag-badge ${s.abandonment_type === 'cart' ? 'cart' : 'checkout'}`}>
                            {s.abandonment_type === 'cart' ? 'Cart' : 'Checkout'}
                          </span>
                        </td>
                        <td className="muted">{s.utm_source || s.referrer?.substring(0, 20) || 'Direct'}</td>
                        <td className="muted" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.exit_page || s.landing_page || '/'}
                        </td>
                        <td className="mono right">{formatDuration(s.duration_seconds)}</td>
                        <td className="mono right">{s.page_count || 0}</td>
                        <td className="muted">{formatRelativeTime(s.started_at)}</td>
                        <td>{s.has_recording && <span style={{ fontSize: 16 }}>▶</span>}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                  <span className="page-info">Page {page} of {totalPages} ({totalSessions} total)</span>
                  <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
