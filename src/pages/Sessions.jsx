import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayCircle, Monitor, Smartphone, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
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

  useEffect(() => {
    fetchSessions()
  }, [page, period, filters])

  async function fetchSessions() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        period,
      })
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
    const styles = {
      cart: 'bg-negative/20 text-negative',
      checkout: 'bg-warning/20 text-warning',
    }
    const labels = { cart: 'Cart Abandoned', checkout: 'Checkout Abandoned' }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[type] || ''}`}>
        {labels[type] || type}
      </span>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PlayCircle size={20} className="text-accent" />
          <h2 className="text-xl font-semibold">Session Recordings</h2>
          <span className="text-sm text-text-secondary ml-2">
            {total} sessions
          </span>
        </div>
        <TimeFilter selected={period} onChange={setPeriod} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Filter size={14} className="text-text-secondary" />
        <select
          value={filters.abandonment}
          onChange={(e) => setFilters({ ...filters, abandonment: e.target.value })}
          className="bg-bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">All Sessions</option>
          <option value="any">Abandonment Only</option>
          <option value="cart">Cart Abandonment</option>
          <option value="checkout">Checkout Abandonment</option>
        </select>

        <select
          value={filters.device}
          onChange={(e) => setFilters({ ...filters, device: e.target.value })}
          className="bg-bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">All Devices</option>
          <option value="mobile">Mobile</option>
          <option value="desktop">Desktop</option>
        </select>

        <select
          value={filters.has_recording}
          onChange={(e) => setFilters({ ...filters, has_recording: e.target.value })}
          className="bg-bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">All</option>
          <option value="true">With Recording</option>
        </select>
      </div>

      {/* Sessions Table */}
      <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Visitor</th>
              <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Device</th>
              <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Landing Page</th>
              <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Source</th>
              <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Duration</th>
              <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Pages</th>
              <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">When</th>
              <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">Replay</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-text-secondary">
                  Loading sessions...
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-text-secondary">
                  No sessions found. Deploy the tracking snippet to start collecting data.
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-border/50 hover:bg-bg-tertiary/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/sessions/${session.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-text-primary">
                      {session.visitor_id?.substring(0, 12)}...
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {session.device_type === 'mobile' ? (
                      <Smartphone size={16} className="text-text-secondary" />
                    ) : (
                      <Monitor size={16} className="text-text-secondary" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-secondary truncate max-w-[200px] block">
                      {session.landing_page || '/'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-secondary">
                      {session.utm_source || session.referrer?.substring(0, 20) || 'Direct'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-text-primary">
                      {formatDuration(session.duration_seconds)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-text-primary">
                      {session.page_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getAbandonmentBadge(session.abandonment_type) || (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary">
                        {session.ended_at ? 'Ended' : 'Active'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-secondary">
                      {formatRelativeTime(session.started_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {session.has_recording && (
                      <PlayCircle size={18} className="text-accent hover:text-accent/80" />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-text-secondary">
              Page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
