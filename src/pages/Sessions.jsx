import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TimeFilter from '../components/TimeFilter'
import useTimeFilter from '../hooks/useTimeFilter'
import { formatDuration, formatRelativeTime } from '../utils/formatters'

export default function Sessions() {
  const navigate = useNavigate()
  const { period, setPeriod } = useTimeFilter('24h')
  const [sessions, setSessions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    abandonment: '',
    device: '',
    has_recording: '',
  })

  const limit = 25

  useEffect(() => { fetchSessions() }, [page, period, filters])

  async function fetchSessions() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), period })
      if (filters.abandonment) params.set('abandonment', filters.abandonment)
      if (filters.device) params.set('device', filters.device)
      if (filters.has_recording) params.set('has_recording', filters.has_recording)

      const res = await fetch(`/api/sessions?${params}`)
      const data = await res.json()
      setSessions(data.sessions || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    }
    setLoading(false)
  }

  const totalPages = Math.ceil(total / limit)

  function getAbandonmentBadge(type) {
    if (!type) return null
    if (type === 'cart') return <span className="flag-badge cart">Cart Abandoned</span>
    if (type === 'checkout') return <span className="flag-badge checkout">Checkout Abandoned</span>
    return null
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Sessions</h1>
          <p className="page-subtitle">{total} sessions</p>
        </div>
        <TimeFilter selected={period} onChange={setPeriod} />
      </div>

      <div className="sessions-filters">
        <select className="filter-select" value={filters.abandonment}
          onChange={(e) => { setFilters({ ...filters, abandonment: e.target.value }); setPage(1) }}>
          <option value="">All Sessions</option>
          <option value="any">Abandonment Only</option>
          <option value="cart">Cart Abandonment</option>
          <option value="checkout">Checkout Abandonment</option>
        </select>
        <select className="filter-select" value={filters.device}
          onChange={(e) => { setFilters({ ...filters, device: e.target.value }); setPage(1) }}>
          <option value="">All Devices</option>
          <option value="mobile">Mobile</option>
          <option value="desktop">Desktop</option>
        </select>
        <select className="filter-select" value={filters.has_recording}
          onChange={(e) => { setFilters({ ...filters, has_recording: e.target.value }); setPage(1) }}>
          <option value="">All</option>
          <option value="true">With Recording</option>
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          Session Recordings
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{total} total</span>
        </div>
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Device</th>
                <th>Landing Page</th>
                <th>Source</th>
                <th className="right">Duration</th>
                <th className="right">Pages</th>
                <th>Status</th>
                <th>When</th>
                <th>Replay</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading sessions...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No sessions found</td></tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} onClick={() => navigate(`/sessions/${session.id}`)}>
                    <td className="mono">{session.visitor_id?.substring(0, 12)}...</td>
                    <td>{session.device_type === 'mobile' ? '📱' : '🖥'}</td>
                    <td className="muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {session.landing_page || '/'}
                    </td>
                    <td className="muted">{session.utm_source || session.referrer?.substring(0, 20) || 'Direct'}</td>
                    <td className="mono right">{formatDuration(session.duration_seconds)}</td>
                    <td className="mono right">{session.page_count || 0}</td>
                    <td>
                      {getAbandonmentBadge(session.abandonment_type) || (
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 10,
                          background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                        }}>
                          {session.ended_at ? 'Ended' : 'Active'}
                        </span>
                      )}
                    </td>
                    <td className="muted">{formatRelativeTime(session.started_at)}</td>
                    <td>
                      {session.has_recording && <span style={{ fontSize: 16, cursor: 'pointer' }}>▶</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
              <span className="page-info">Page {page} of {totalPages} ({total} total)</span>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
