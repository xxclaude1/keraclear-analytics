import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDuration } from '../utils/formatters'

const EVENT_ICONS = {
  page_view: '👁', landing_page_view: '🆕', vsl_page_view: '🎬',
  sales_page_view: '🛍', add_to_cart: '🛒', checkout_initiated: '💳',
  checkout_completed: '💰', cart_abandonment: '🚪', checkout_abandonment: '🚪',
  click: '👆',
}

export default function LiveVisitors() {
  const navigate = useNavigate()
  const [visitors, setVisitors] = useState([])
  const [activityFeed, setActivityFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchActiveVisitors()
    const interval = setInterval(fetchActiveVisitors, 15000)
    return () => clearInterval(interval)
  }, [])

  async function fetchActiveVisitors() {
    try {
      const res = await fetch('/api/visitors')
      const data = await res.json()
      setVisitors(data.visitors || [])
      if (data.recent_events?.length > 0) {
        setActivityFeed(data.recent_events)
      }
    } catch (err) {
      console.error('Failed to fetch active visitors:', err)
    }
    setLoading(false)
  }

  function getTimeOnSite(lastSeen) {
    if (!lastSeen) return '0:00'
    const seconds = Math.max(0, Math.round((now - new Date(lastSeen).getTime()) / 1000))
    return formatDuration(seconds)
  }

  function getSourceLabel(visitor) {
    if (visitor.utm_source) return visitor.utm_source
    if (visitor.referrer) {
      try { return new URL(visitor.referrer).hostname.replace('www.', '') }
      catch { return visitor.referrer.substring(0, 20) }
    }
    return 'Direct'
  }

  function getFeedEventTime(timestamp) {
    if (!timestamp) return ''
    const diffSec = Math.round((now - new Date(timestamp).getTime()) / 1000)
    if (diffSec < 5) return 'just now'
    if (diffSec < 60) return `${diffSec}s ago`
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    return `${Math.floor(diffSec / 3600)}h ago`
  }

  function getFeedText(event) {
    const shortId = event.visitor_id?.substring(2, 10)
    const icon = EVENT_ICONS[event.event_type] || '📌'
    const labels = {
      page_view: 'viewing', landing_page_view: 'arrived on', add_to_cart: 'added to cart',
      checkout_initiated: 'started checkout', checkout_completed: 'completed purchase!',
      cart_abandonment: 'abandoned cart', checkout_abandonment: 'abandoned checkout',
    }
    const label = labels[event.event_type] || event.event_type
    return { icon, text: `${shortId} ${label}`, detail: event.page_url || '' }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Live Visitors</h1>
        <p className="page-subtitle">Real-time activity on your store</p>
      </div>

      {/* Active Count */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="metric-card">
          <div className="metric-label">Active Now</div>
          <div className="metric-value" style={{ color: 'var(--green)' }}>{visitors.length}</div>
          <div className="metric-sub"><span className="live-dot" /> live visitors</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Mobile</div>
          <div className="metric-value">{visitors.filter(v => v.device_type === 'mobile').length}</div>
          <div className="metric-sub">mobile devices</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Desktop</div>
          <div className="metric-value">{visitors.filter(v => v.device_type === 'desktop').length}</div>
          <div className="metric-sub">desktop devices</div>
        </div>
      </div>

      {/* Two-column: Visitors + Feed */}
      <div className="live-grid">
        {/* Active Visitors */}
        <div className="card">
          <div className="card-header">Active Visitors ({visitors.length})</div>
          <div className="card-body">
            {loading ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-text">Loading...</div>
              </div>
            ) : visitors.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👀</div>
                <div className="empty-state-text">No active visitors</div>
                <div className="empty-state-sub">Visitors will appear here in real-time</div>
              </div>
            ) : (
              <div className="visitors-table">
                {visitors.map((visitor) => (
                  <div
                    key={visitor.visitor_id}
                    className="visitor-row"
                    onClick={() => { if (visitor.session_id) navigate(`/sessions/${visitor.session_id}`) }}
                    style={{ padding: '14px 16px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <span className="visitor-dot" />
                      <span style={{ fontSize: 16 }}>{visitor.device_type === 'mobile' ? '📱' : '🖥'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>
                            {visitor.visitor_id?.substring(2, 10)}
                          </span>
                          <span style={{
                            fontSize: 10, padding: '1px 6px', borderRadius: 4,
                            background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent)',
                            fontWeight: 600,
                          }}>{getSourceLabel(visitor)}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {visitor.current_page || '/'}
                          {visitor.country && <span> · {visitor.city || visitor.country}</span>}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0, marginRight: 8 }}>
                      {getTimeOnSite(visitor.last_seen_at)}
                    </span>
                    {visitor.has_recording && (
                      <span style={{ fontSize: 11, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1.5s infinite' }} />
                        REC
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Feed */}
        <div className="card">
          <div className="card-header">Live Feed</div>
          <div className="card-body feed-list">
            {activityFeed.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📡</div>
                <div className="empty-state-text">Waiting for events</div>
                <div className="empty-state-sub">Activity will stream in real-time</div>
              </div>
            ) : (
              activityFeed.map((event, idx) => {
                const { icon, text, detail } = getFeedText(event)
                return (
                  <div key={event.id || idx} className="feed-item">
                    <div className="feed-text">
                      <span className="feed-icon">{icon}</span>
                      {text}
                    </div>
                    {detail && <div className="feed-detail">{detail}</div>}
                    <div className="feed-time">{getFeedEventTime(event.timestamp)}</div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
