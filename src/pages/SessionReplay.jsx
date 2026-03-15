import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Monitor, Smartphone, Globe, Clock, Layers,
  ExternalLink, AlertTriangle, Play, Pause,
} from 'lucide-react'
import { formatDuration, formatDateTime, formatRelativeTime } from '../utils/formatters'

const SPEED_OPTIONS = [0.5, 1, 2, 4]

export default function SessionReplay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const playerRef = useRef(null)
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

  useEffect(() => {
    fetchSession()
  }, [id])

  useEffect(() => {
    if (recording.length > 0 && containerRef.current && !playerInstance) {
      initPlayer()
    }
    return () => {
      if (playerInstance) {
        playerInstance.pause()
      }
    }
  }, [recording, playerInstance])

  async function fetchSession() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions?id=${encodeURIComponent(id)}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Session not found')
        setLoading(false)
        return
      }

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

      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }

      const instance = new RRWebPlayer({
        target: containerRef.current,
        props: {
          events: recording,
          speed,
          showController: true,
          autoPlay: false,
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
    if (playerInstance) {
      try {
        playerInstance.setSpeed(speed)
      } catch (e) { /* player might not be ready */ }
    }
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading session...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={24} className="text-negative" />
        <p className="text-text-secondary">{error}</p>
        <button onClick={() => navigate('/sessions')} className="text-sm text-accent hover:underline">
          Back to Sessions
        </button>
      </div>
    )
  }

  const isMobile = session?.device_type === 'mobile'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/sessions')}
          className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-xl font-semibold">Session Replay</h2>
        {session?.abandonment_type && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            session.abandonment_type === 'cart'
              ? 'bg-negative/20 text-negative'
              : 'bg-warning/20 text-warning'
          }`}>
            {session.abandonment_type === 'cart' ? 'Cart Abandoned' : 'Checkout Abandoned'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Area */}
        <div className="lg:col-span-2">
          <div className={`bg-bg-secondary border border-border rounded-lg overflow-hidden ${
            isMobile ? 'max-w-sm mx-auto' : ''
          }`}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg-tertiary">
              {isMobile ? (
                <>
                  <Smartphone size={14} className="text-text-secondary" />
                  <span className="text-xs text-text-secondary">Mobile Session</span>
                </>
              ) : (
                <>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-negative/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-positive/60" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-bg-primary rounded-md px-3 py-1 text-xs text-text-secondary truncate">
                      {session?.landing_page || 'mykeraclear.com'}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div ref={containerRef} className="w-full bg-white min-h-[300px] relative">
              {recording.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-primary">
                  <Play size={48} className="text-text-secondary/30 mb-3" />
                  <p className="text-text-secondary text-sm">No recording data available</p>
                  <p className="text-text-secondary/60 text-xs mt-1">
                    Recording will appear once the snippet captures session data
                  </p>
                </div>
              )}
            </div>

            {recording.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border">
                <span className="text-xs text-text-secondary mr-2">Speed:</span>
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      speed === s
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-4">
          <div className="bg-bg-secondary border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-primary mb-3">Visitor Info</h3>
            <div className="space-y-2.5">
              <MetaRow
                icon={isMobile ? <Smartphone size={14} /> : <Monitor size={14} />}
                label="Device"
                value={`${session?.device_type || 'Unknown'} ${visitor?.browser ? `· ${visitor.browser}` : ''}`}
              />
              <MetaRow
                icon={<Globe size={14} />}
                label="Location"
                value={[session?.city, session?.country].filter(Boolean).join(', ') || 'Unknown'}
              />
              <MetaRow
                icon={<ExternalLink size={14} />}
                label="Source"
                value={session?.utm_source || session?.referrer || 'Direct'}
              />
              {session?.utm_campaign && (
                <MetaRow icon={<Layers size={14} />} label="Campaign" value={session.utm_campaign} />
              )}
              <MetaRow icon={<Clock size={14} />} label="Duration" value={formatDuration(session?.duration_seconds)} />
              <MetaRow icon={<Layers size={14} />} label="Pages" value={`${session?.page_count || 0} pages`} />
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-text-secondary">Started: {formatDateTime(session?.started_at)}</p>
              {session?.ended_at && (
                <p className="text-xs text-text-secondary mt-0.5">Ended: {formatDateTime(session.ended_at)}</p>
              )}
            </div>
          </div>

          <div className="bg-bg-secondary border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Event Timeline ({events.filter(e => !['click', 'scroll_depth', 'page_exit'].includes(e.event_type)).length})
            </h3>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {events
                .filter(e => !['click', 'scroll_depth', 'page_exit'].includes(e.event_type))
                .map((event, i) => (
                <div key={event.id || i} className="flex items-start gap-2 py-1.5 text-sm">
                  <span className="text-base leading-none mt-0.5">{getEventIcon(event.event_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-xs truncate">{getEventLabel(event)}</p>
                    <p className="text-text-secondary text-[10px]">{formatRelativeTime(event.timestamp)}</p>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-xs text-text-secondary">No events recorded yet</p>
              )}
            </div>
          </div>

          <div className="bg-bg-secondary border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Pages Visited ({pageviews.length})
            </h3>
            <div className="space-y-1.5">
              {pageviews.map((pv, i) => (
                <div key={pv.id || i} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    i === 0 ? 'bg-positive' : i === pageviews.length - 1 ? 'bg-negative' : 'bg-neutral'
                  }`} />
                  <span className="text-xs text-text-secondary truncate flex-1">{pv.page_url}</span>
                  {pv.time_on_page_seconds && (
                    <span className="text-[10px] text-text-secondary font-mono">
                      {formatDuration(pv.time_on_page_seconds)}
                    </span>
                  )}
                </div>
              ))}
              {pageviews.length === 0 && (
                <p className="text-xs text-text-secondary">No page data yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-secondary">{icon}</span>
      <span className="text-xs text-text-secondary w-16">{label}</span>
      <span className="text-xs text-text-primary truncate">{value}</span>
    </div>
  )
}
