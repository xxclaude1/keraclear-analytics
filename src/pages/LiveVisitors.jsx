import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Monitor, Smartphone, Globe, Clock, Eye,
  ShoppingCart, CreditCard, LogOut, MousePointer, ArrowRight,
} from 'lucide-react'
import { formatDuration } from '../utils/formatters'

const EVENT_CONFIG = {
  page_view: { icon: Eye, color: 'text-neutral', label: 'viewed' },
  landing_page_view: { icon: ArrowRight, color: 'text-positive', label: 'landed on' },
  vsl_page_view: { icon: Eye, color: 'text-accent', label: 'watching VSL on' },
  sales_page_view: { icon: Eye, color: 'text-neutral', label: 'viewing product' },
  add_to_cart: { icon: ShoppingCart, color: 'text-positive', label: 'added to cart on' },
  checkout_initiated: { icon: CreditCard, color: 'text-warning', label: 'started checkout' },
  checkout_completed: { icon: CreditCard, color: 'text-positive', label: 'completed purchase!' },
  cart_abandonment: { icon: LogOut, color: 'text-negative', label: 'abandoned cart on' },
  checkout_abandonment: { icon: LogOut, color: 'text-negative', label: 'abandoned checkout' },
  click: { icon: MousePointer, color: 'text-text-secondary', label: 'clicked on' },
}

export default function LiveVisitors() {
  const navigate = useNavigate()
  const [visitors, setVisitors] = useState([])
  const [activityFeed, setActivityFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const feedRef = useRef(null)

  // Tick every second to update time-on-site
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch and poll every 15 seconds
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

      // Update activity feed from server
      if (data.recent_events?.length > 0) {
        setActivityFeed(data.recent_events)
      }
    } catch (err) {
      console.error('Failed to fetch active visitors:', err)
    }
    setLoading(false)
  }

  function getTimeOnSite(startedAt) {
    if (!startedAt) return '0s'
    const seconds = Math.max(0, Math.round((now - new Date(startedAt).getTime()) / 1000))
    return formatDuration(seconds)
  }

  function getSourceLabel(visitor) {
    if (visitor.utm_source) return visitor.utm_source
    if (visitor.referrer) {
      try {
        return new URL(visitor.referrer).hostname.replace('www.', '')
      } catch {
        return visitor.referrer.substring(0, 20)
      }
    }
    return 'Direct'
  }

  function getLocationLabel(visitor) {
    const parts = [visitor.city, visitor.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Unknown'
  }

  function getFeedEventText(event) {
    const config = EVENT_CONFIG[event.event_type]
    const shortId = event.visitor_id?.substring(2, 10)
    const page = event.page_url || ''
    const label = config?.label || event.event_type

    if (event.event_type === 'add_to_cart') return `Visitor ${shortId} added to cart`
    if (event.event_type === 'checkout_completed') return `Visitor ${shortId} completed purchase!`
    if (event.event_type === 'cart_abandonment') return `Visitor ${shortId} abandoned cart`
    if (event.event_type === 'checkout_abandonment') return `Visitor ${shortId} abandoned checkout`

    return `Visitor ${shortId} ${label} ${page}`
  }

  function getFeedEventTime(timestamp) {
    if (!timestamp) return ''
    const diffSec = Math.round((now - new Date(timestamp).getTime()) / 1000)
    if (diffSec < 5) return 'just now'
    if (diffSec < 60) return `${diffSec}s ago`
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    return `${Math.floor(diffSec / 3600)}h ago`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity size={20} className="text-positive" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-positive rounded-full animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold">Live Visitors</h2>
        </div>
      </div>

      {/* Active Count Banner */}
      <div className="bg-bg-secondary border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-positive/10 flex items-center justify-center">
            <span className="text-2xl font-bold font-mono text-positive">
              {visitors.length}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">
              {visitors.length === 0
                ? 'No active visitors'
                : visitors.length === 1
                ? '1 person on your site right now'
                : `${visitors.length} people on your site right now`}
            </p>
            <p className="text-sm text-text-secondary">
              {visitors.filter((v) => v.device_type === 'mobile').length} mobile
              {' · '}
              {visitors.filter((v) => v.device_type === 'desktop').length} desktop
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor List */}
        <div className="lg:col-span-2">
          <div className="bg-bg-secondary border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-text-primary">Active Visitors</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-text-secondary text-sm">
                Loading...
              </div>
            ) : visitors.length === 0 ? (
              <div className="p-8 text-center text-text-secondary text-sm">
                <Activity size={32} className="mx-auto mb-3 opacity-30" />
                <p>No active visitors right now.</p>
                <p className="text-xs mt-1">Visitors will appear here in real-time once your tracking snippet is live.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {visitors.map((visitor) => (
                  <div
                    key={visitor.visitor_id}
                    className="px-4 py-3 hover:bg-bg-tertiary/30 cursor-pointer transition-colors"
                    onClick={() => {
                      if (visitor.session_id) navigate(`/sessions/${visitor.session_id}`)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {visitor.device_type === 'mobile' ? (
                          <Smartphone size={18} className="text-text-secondary" />
                        ) : (
                          <Monitor size={18} className="text-text-secondary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium text-text-primary">
                            Visitor {visitor.visitor_id?.substring(2, 10)}
                          </span>
                          <div className="w-1.5 h-1.5 bg-positive rounded-full animate-pulse" />
                        </div>

                        <p className="text-sm text-accent mt-0.5 truncate">
                          {visitor.current_page}
                        </p>

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Globe size={11} />
                            {getSourceLabel(visitor)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {getTimeOnSite(visitor.last_seen_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe size={11} />
                            {getLocationLabel(visitor)}
                          </span>
                          <span>{visitor.page_trail?.length || 0} pages</span>
                        </div>

                        {visitor.page_trail?.length > 1 && (
                          <div className="flex items-center gap-1 mt-2 overflow-x-auto">
                            {visitor.page_trail.slice(-5).map((page, i) => (
                              <span key={i} className="flex items-center gap-1 shrink-0">
                                {i > 0 && (
                                  <ArrowRight size={10} className="text-text-secondary/40" />
                                )}
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary truncate max-w-[120px]">
                                  {page}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {visitor.has_recording && (
                        <div className="shrink-0 flex items-center gap-1 text-xs text-accent">
                          <div className="w-1.5 h-1.5 bg-negative rounded-full animate-pulse" />
                          REC
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <div className="bg-bg-secondary border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-text-primary">Live Activity Feed</h3>
            </div>

            <div
              ref={feedRef}
              className="max-h-[600px] overflow-y-auto divide-y divide-border/30"
            >
              {activityFeed.length === 0 ? (
                <div className="p-6 text-center text-text-secondary text-xs">
                  <Activity size={24} className="mx-auto mb-2 opacity-30" />
                  Events will stream here in real-time
                </div>
              ) : (
                activityFeed.map((event, idx) => {
                  const config = EVENT_CONFIG[event.event_type] || {
                    icon: Eye,
                    color: 'text-text-secondary',
                  }
                  const IconComp = config.icon

                  return (
                    <div key={event.id || idx} className="px-4 py-2.5 hover:bg-bg-tertiary/20">
                      <div className="flex items-start gap-2">
                        <IconComp size={14} className={`mt-0.5 shrink-0 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary leading-relaxed">
                            {getFeedEventText(event)}
                          </p>
                          <p className="text-[10px] text-text-secondary mt-0.5">
                            {getFeedEventTime(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
