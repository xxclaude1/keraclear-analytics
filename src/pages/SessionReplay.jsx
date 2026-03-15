import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatDuration, formatDateTime, formatRelativeTime } from '../utils/formatters'

const SPEED_OPTIONS = [0.5, 1, 2, 4]

export default function SessionReplay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [session, setSession] = useState(null)
  const [visitor, setVisitor] = useState(null)
  const [events, setEvents] = useState([])
  const [pageviews, setPageviews] = useState([])
  const [recording, setRecording] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [speed, setSpeed] = useState(1)
  const [playerInstance, setPlayerInstance] = useState(null)

  useEffect(() => { fetchSession() }, [id])

  useEffect(() => {
    if (recording.length > 0 && containerRef.current && !playerInstance) {
      initPlayer()
    }
    return () => { if (playerInstance) playerInstance.pause() }
  }, [recording, playerInstance])

  async function fetchSession() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions?id=${encodeURIComponent(id)}`)
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Session not found'); setLoading(false); return }
      setSession(data.session)
      setVisitor(data.visitor)
      setEvents(data.events || [])
      setPageviews(data.pageviews || [])
      setRecording(data.recording || [])
    } catch (err) {
      console.error('Failed to fetch session:', err)
      setError('Failed to load session')
    }
    setLoading(false)
  }

  async function initPlayer() {
    try {
      const rrwebPlayer = await import('rrweb-player')
      const RRWebPlayer = rrwebPlayer.default || rrwebPlayer
      if (containerRef.current) containerRef.current.innerHTML = ''
      const instance = new RRWebPlayer({
        target: containerRef.current,
        props: {
          events: recording, speed, showController: true, autoPlay: false,
          width: containerRef.current.offsetWidth,
          height: Math.min(containerRef.current.offsetWidth * 0.625, 500),
        },
      })
      setPlayerInstance(instance)
    } catch (err) {
      console.error('Failed to init rrweb player:', err)
    }
  }

  useEffect(() => {
    if (playerInstance) { try { playerInstance.setSpeed(speed) } catch {} }
  }, [speed, playerInstance])

  function getEventIcon(type) {
    const icons = {
      page_view: '📄', landing_page_view: '🏠', vsl_page_view: '🎬',
      sales_page_view: '🛍️', add_to_cart: '🛒', checkout_initiated: '💳',
      checkout_completed: '✅', cart_abandonment: '🔴', checkout_abandonment: '🔴',
      click: '👆', scroll_depth: '📜',
    }
    return icons[type] || '📌'
  }

  function getEventLabel(event) {
    const labels = {
      page_view: `Viewed ${event.event_data?.page_url || event.page_url || 'page'}`,
      landing_page_view: 'Landed on site', vsl_page_view: 'Viewed VSL',
      sales_page_view: 'Viewed product page', add_to_cart: 'Added to cart',
      checkout_initiated: 'Started checkout', checkout_completed: 'Completed purchase',
      cart_abandonment: 'Abandoned cart', checkout_abandonment: 'Abandoned checkout',
      click: `Clicked "${(event.event_data?.text || '').substring(0, 40)}"`,
      scroll_depth: `Scrolled to ${event.event_data?.depth}%`,
      page_exit: `Left ${event.event_data?.page_url || 'page'}`,
      session_end: 'Session ended',
    }
    return labels[event.event_type] || event.event_type
  }

  if (loading) {
    return <div className="empty-state"><div className="empty-state-text">Loading session...</div></div>
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-text">{error}</div>
        <button onClick={() => navigate('/sessions')} className="btn" style={{ marginTop: 12 }}>Back to Sessions</button>
      </div>
    )
  }

  const isMobile = session?.device_type === 'mobile'

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span className="btn" onClick={() => navigate('/sessions')} style={{ cursor: 'pointer' }}>← Back</span>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Session Replay</h1>
        {session?.abandonment_type && (
          <span className={`flag-badge ${session.abandonment_type === 'cart' ? 'cart' : 'checkout'}`}>
            {session.abandonment_type === 'cart' ? 'Cart Abandoned' : 'Checkout Abandoned'}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Player Area */}
        <div>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
            {/* Browser chrome */}
            {!isMobile && (
              <div style={{
                height: 34, background: '#2a2a32', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
              }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                </div>
                <div style={{
                  flex: 1, background: '#1a1a20', borderRadius: 5, padding: '4px 10px',
                  fontSize: 10, color: '#888', fontFamily: 'var(--font-mono)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 6,
                }}>mykeraclear.com{session?.landing_page || '/'}</div>
              </div>
            )}
            {isMobile && (
              <div style={{
                height: 28, background: '#2a2a32', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: 'var(--text-muted)',
              }}>📱 Mobile Session</div>
            )}

            <div ref={containerRef} style={{ width: '100%', background: '#fff', minHeight: 300, position: 'relative' }}>
              {recording.length === 0 && (
                <div className="empty-state" style={{ position: 'absolute', inset: 0, background: 'var(--bg-primary)' }}>
                  <div className="empty-state-icon">🎬</div>
                  <div className="empty-state-text">No recording available</div>
                  <div className="empty-state-sub">Recording will appear once the snippet captures session data</div>
                </div>
              )}
            </div>

            {recording.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>Speed:</span>
                {SPEED_OPTIONS.map((s) => (
                  <button key={s} onClick={() => setSpeed(s)} className={`period-btn ${speed === s ? 'active' : ''}`} style={{ padding: '4px 12px' }}>
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metadata Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Visitor Info */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 12 }}>
              Visitor Info
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <MetaRow label="Device" value={`${session?.device_type || 'Unknown'} ${visitor?.browser ? `· ${visitor.browser}` : ''}`} />
              <MetaRow label="Location" value={[session?.city, session?.country].filter(Boolean).join(', ') || 'Unknown'} />
              <MetaRow label="Source" value={session?.utm_source || session?.referrer || 'Direct'} />
              {session?.utm_campaign && <MetaRow label="Campaign" value={session.utm_campaign} />}
              <MetaRow label="Duration" value={formatDuration(session?.duration_seconds)} />
              <MetaRow label="Pages" value={`${session?.page_count || 0} pages`} />
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
              <div>Started: {formatDateTime(session?.started_at)}</div>
              {session?.ended_at && <div style={{ marginTop: 2 }}>Ended: {formatDateTime(session.ended_at)}</div>}
            </div>
          </div>

          {/* Event Timeline */}
          <div className="card">
            <div className="card-header">
              Event Timeline
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {events.filter(e => !['click', 'scroll_depth', 'page_exit'].includes(e.event_type)).length}
              </span>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {events
                .filter(e => !['click', 'scroll_depth', 'page_exit'].includes(e.event_type))
                .map((event, i) => (
                <div key={event.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 12,
                }}>
                  <span style={{ width: 20, textAlign: 'center', flexShrink: 0, fontSize: 14 }}>
                    {getEventIcon(event.event_type)}
                  </span>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>{getEventLabel(event)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>
              ))}
              {events.length === 0 && (
                <div style={{ padding: 20, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No events recorded</div>
              )}
            </div>
          </div>

          {/* Pages Visited */}
          <div className="card">
            <div className="card-header">
              Pages Visited
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{pageviews.length}</span>
            </div>
            <div style={{ padding: '8px 16px' }}>
              {pageviews.map((pv, i) => (
                <div key={pv.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? 'var(--green)' : i === pageviews.length - 1 ? 'var(--red)' : 'var(--accent)',
                  }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pv.page_url}</span>
                  {pv.time_on_page_seconds > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {formatDuration(pv.time_on_page_seconds)}
                    </span>
                  )}
                </div>
              ))}
              {pageviews.length === 0 && (
                <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No page data yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 70 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}
