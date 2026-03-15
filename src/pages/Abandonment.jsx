import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Monitor, Smartphone, PlayCircle, Filter,
  TrendingDown, TrendingUp, ChevronLeft, ChevronRight, BarChart3,
} from 'lucide-react'
import TimeFilter from '../components/TimeFilter'
import MetricCard from '../components/MetricCard'
import useTimeFilter from '../hooks/useTimeFilter'
import { formatNumber, formatPercent, formatDuration, formatRelativeTime } from '../utils/formatters'
import { supabase } from '../lib/supabase'

const PERIOD_MS = {
  '1h': 3600000, '6h': 21600000, '12h': 43200000,
  '24h': 86400000, '7d': 604800000, '30d': 2592000000,
}

export default function Abandonment() {
  const navigate = useNavigate()
  const { period, setPeriod, getQueryParams } = useTimeFilter('7d')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [flaggedRecordings, setFlaggedRecordings] = useState([])
  const [exitPages, setExitPages] = useState([])
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ type: '', device: '', source: '' })
  const limit = 20

  useEffect(() => { fetchAll() }, [period])
  useEffect(() => { fetchSessions() }, [page, filters, period])

  function getSinceISO() {
    const tp = getQueryParams()
    const ms = PERIOD_MS[tp.period] || 604800000
    return new Date(Date.now() - ms).toISOString()
  }

  async function fetchAll() {
    setLoading(true)
    const sinceISO = getSinceISO()

    try {
      // Fetch abandonment stats
      const [cartAbandonRes, checkoutAbandonRes, totalATCRes, totalCORes, prevCartRes, prevCORes] = await Promise.all([
        supabase.from('sessions').select('id', { count: 'exact', head: true })
          .eq('abandonment_type', 'cart').gte('started_at', sinceISO),
        supabase.from('sessions').select('id', { count: 'exact', head: true })
          .eq('abandonment_type', 'checkout').gte('started_at', sinceISO),
        supabase.from('events').select('id', { count: 'exact', head: true })
          .eq('event_type', 'add_to_cart').gte('timestamp', sinceISO),
        supabase.from('events').select('id', { count: 'exact', head: true })
          .eq('event_type', 'checkout_initiated').gte('timestamp', sinceISO),
        // Previous period for trend comparison
        supabase.from('sessions').select('id', { count: 'exact', head: true })
          .eq('abandonment_type', 'cart')
          .gte('started_at', new Date(new Date(sinceISO).getTime() - (Date.now() - new Date(sinceISO).getTime())).toISOString())
          .lt('started_at', sinceISO),
        supabase.from('sessions').select('id', { count: 'exact', head: true })
          .eq('abandonment_type', 'checkout')
          .gte('started_at', new Date(new Date(sinceISO).getTime() - (Date.now() - new Date(sinceISO).getTime())).toISOString())
          .lt('started_at', sinceISO),
      ])

      const cartAbandons = cartAbandonRes.count || 0
      const checkoutAbandons = checkoutAbandonRes.count || 0
      const totalATC = totalATCRes.count || 0
      const totalCO = totalCORes.count || 0
      const prevCartAbandons = prevCartRes.count || 0
      const prevCheckoutAbandons = prevCORes.count || 0

      const cartRate = totalATC > 0 ? (cartAbandons / totalATC) * 100 : 0
      const checkoutRate = totalCO > 0 ? (checkoutAbandons / totalCO) * 100 : 0

      // Trend: compare with previous equal-length period
      const prevCartRate = totalATC > 0 ? (prevCartAbandons / Math.max(totalATC, 1)) * 100 : 0
      const prevCheckoutRate = totalCO > 0 ? (prevCheckoutAbandons / Math.max(totalCO, 1)) * 100 : 0
      const cartTrend = cartRate - prevCartRate
      const checkoutTrend = checkoutRate - prevCheckoutRate

      setStats({
        cartRate, checkoutRate, cartAbandons, checkoutAbandons,
        cartTrend, checkoutTrend, totalATC, totalCO,
      })

      // Fetch auto-flagged recordings (abandonment + has_recording, most recent 10)
      const { data: flagged } = await supabase
        .from('sessions')
        .select('*')
        .not('abandonment_type', 'is', null)
        .eq('has_recording', true)
        .gte('started_at', sinceISO)
        .order('started_at', { ascending: false })
        .limit(10)

      setFlaggedRecordings(flagged || [])

      // Fetch exit page heatmap data
      const { data: abandonSessions } = await supabase
        .from('sessions')
        .select('exit_page, abandonment_type')
        .not('abandonment_type', 'is', null)
        .gte('started_at', sinceISO)

      const exitMap = {}
      for (const s of (abandonSessions || [])) {
        const page = s.exit_page || 'Unknown'
        exitMap[page] = (exitMap[page] || 0) + 1
      }
      const totalExits = Object.values(exitMap).reduce((s, v) => s + v, 0) || 1
      const exitList = Object.entries(exitMap)
        .map(([page, count]) => ({ page, count, pct: (count / totalExits) * 100 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      setExitPages(exitList)
    } catch (err) {
      console.error('Abandonment stats error:', err)
    }
    setLoading(false)
  }

  async function fetchSessions() {
    const sinceISO = getSinceISO()
    try {
      let query = supabase
        .from('sessions')
        .select('*', { count: 'exact' })
        .not('abandonment_type', 'is', null)
        .gte('started_at', sinceISO)
        .order('started_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (filters.type === 'cart') query = query.eq('abandonment_type', 'cart')
      else if (filters.type === 'checkout') query = query.eq('abandonment_type', 'checkout')

      if (filters.device) query = query.eq('device_type', filters.device)
      if (filters.source) query = query.eq('utm_source', filters.source)

      const { data, count } = await query
      setSessions(data || [])
      setTotalSessions(count || 0)
    } catch (err) {
      console.error('Abandonment sessions error:', err)
    }
  }

  const totalPages = Math.ceil(totalSessions / limit)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} className="text-negative" />
          <h2 className="text-xl font-semibold">Abandonment Analysis</h2>
        </div>
        <TimeFilter selected={period} onChange={setPeriod} />
      </div>

      {loading && !stats ? (
        <div className="text-center text-text-secondary py-12">Loading abandonment data...</div>
      ) : (
        <>
          {/* Rate Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-bg-secondary border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-secondary uppercase tracking-wide">Cart Abandonment Rate</p>
                <ShoppingCart size={16} className="text-negative" />
              </div>
              <p className="text-3xl font-bold font-mono text-negative">
                {formatPercent(stats?.cartRate)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(stats?.cartTrend || 0) > 0 ? (
                  <TrendingUp size={12} className="text-negative" />
                ) : (
                  <TrendingDown size={12} className="text-positive" />
                )}
                <span className={`text-xs font-mono ${(stats?.cartTrend || 0) > 0 ? 'text-negative' : 'text-positive'}`}>
                  {(stats?.cartTrend || 0) > 0 ? '+' : ''}{formatPercent(stats?.cartTrend)} vs prev period
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {formatNumber(stats?.cartAbandons)} of {formatNumber(stats?.totalATC)} add-to-carts
              </p>
            </div>

            <div className="bg-bg-secondary border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-secondary uppercase tracking-wide">Checkout Abandonment Rate</p>
                <ShoppingCart size={16} className="text-warning" />
              </div>
              <p className="text-3xl font-bold font-mono text-warning">
                {formatPercent(stats?.checkoutRate)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(stats?.checkoutTrend || 0) > 0 ? (
                  <TrendingUp size={12} className="text-negative" />
                ) : (
                  <TrendingDown size={12} className="text-positive" />
                )}
                <span className={`text-xs font-mono ${(stats?.checkoutTrend || 0) > 0 ? 'text-negative' : 'text-positive'}`}>
                  {(stats?.checkoutTrend || 0) > 0 ? '+' : ''}{formatPercent(stats?.checkoutTrend)} vs prev period
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {formatNumber(stats?.checkoutAbandons)} of {formatNumber(stats?.totalCO)} checkouts initiated
              </p>
            </div>
          </div>

          {/* Auto-Flagged Recordings */}
          {flaggedRecordings.length > 0 && (
            <div className="bg-bg-secondary border border-negative/30 rounded-lg p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <PlayCircle size={16} className="text-negative" />
                <h3 className="text-sm font-medium text-text-primary">
                  Auto-Flagged Recordings ({flaggedRecordings.length})
                </h3>
              </div>
              <div className="space-y-1">
                {flaggedRecordings.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/sessions/${s.id}`)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-tertiary/50 cursor-pointer transition-colors"
                  >
                    {s.device_type === 'mobile' ? (
                      <Smartphone size={14} className="text-text-secondary shrink-0" />
                    ) : (
                      <Monitor size={14} className="text-text-secondary shrink-0" />
                    )}
                    <span className="text-xs font-mono text-text-primary w-24 shrink-0">
                      {s.visitor_id?.substring(0, 12)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      s.abandonment_type === 'cart'
                        ? 'bg-negative/20 text-negative'
                        : 'bg-warning/20 text-warning'
                    }`}>
                      {s.abandonment_type === 'cart' ? 'Cart' : 'Checkout'}
                    </span>
                    <span className="text-xs text-text-secondary truncate flex-1">
                      {s.utm_source || 'Direct'}
                    </span>
                    <span className="text-xs font-mono text-text-secondary shrink-0">
                      {formatDuration(s.duration_seconds)}
                    </span>
                    <span className="text-xs text-text-secondary shrink-0">
                      {formatRelativeTime(s.started_at)}
                    </span>
                    <PlayCircle size={16} className="text-accent shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exit Heatmap */}
          {exitPages.length > 0 && (
            <div className="bg-bg-secondary border border-border rounded-lg p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-negative" />
                <h3 className="text-sm font-medium text-text-primary">Exit Heatmap — Where visitors abandon</h3>
              </div>
              <div className="space-y-2">
                {exitPages.map((ep, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-48 truncate shrink-0">{ep.page}</span>
                    <div className="flex-1 bg-bg-tertiary rounded-sm h-6 overflow-hidden">
                      <div
                        className="h-full bg-negative/60 rounded-sm transition-all duration-500"
                        style={{ width: `${Math.max(ep.pct, 3)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-text-secondary w-16 text-right shrink-0">
                      {formatPercent(ep.pct)}
                    </span>
                    <span className="text-xs font-mono text-text-secondary w-10 text-right shrink-0">
                      {ep.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <Filter size={14} className="text-text-secondary" />
            <select value={filters.type}
              onChange={e => { setFilters({ ...filters, type: e.target.value }); setPage(1) }}
              className="bg-bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary">
              <option value="">All Abandonment</option>
              <option value="cart">Cart Only</option>
              <option value="checkout">Checkout Only</option>
            </select>
            <select value={filters.device}
              onChange={e => { setFilters({ ...filters, device: e.target.value }); setPage(1) }}
              className="bg-bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary">
              <option value="">All Devices</option>
              <option value="mobile">Mobile</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>

          {/* Abandonment Sessions Table */}
          <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase">Visitor</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase">Device</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase">Type</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase">Source</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase">Exit Page</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase">Duration</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase">Pages</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase">When</th>
                  <th className="px-4 py-3 text-xs font-medium text-text-secondary uppercase">Replay</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-text-secondary text-sm">
                      {loading ? 'Loading...' : 'No abandonment sessions found for this period.'}
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border/30 hover:bg-bg-tertiary/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/sessions/${s.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-text-primary">
                        {s.visitor_id?.substring(0, 12)}...
                      </td>
                      <td className="px-4 py-3">
                        {s.device_type === 'mobile'
                          ? <Smartphone size={16} className="text-text-secondary" />
                          : <Monitor size={16} className="text-text-secondary" />}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          s.abandonment_type === 'cart'
                            ? 'bg-negative/20 text-negative'
                            : 'bg-warning/20 text-warning'
                        }`}>
                          {s.abandonment_type === 'cart' ? 'Cart' : 'Checkout'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {s.utm_source || s.referrer?.substring(0, 20) || 'Direct'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary truncate max-w-[150px]">
                        {s.exit_page || s.landing_page || '/'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-text-primary">
                        {formatDuration(s.duration_seconds)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-text-primary">
                        {s.page_count || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatRelativeTime(s.started_at)}
                      </td>
                      <td className="px-4 py-3">
                        {s.has_recording && <PlayCircle size={18} className="text-accent" />}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-text-secondary">
                  Page {page} of {totalPages} ({totalSessions} total)
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                    className="p-1.5 rounded-md bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-md bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
