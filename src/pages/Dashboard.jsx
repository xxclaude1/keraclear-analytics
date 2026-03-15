import { useState, useEffect } from 'react'
import {
  BarChart3, Users, Layers, Clock, ArrowUpDown, UserPlus,
  Monitor, Smartphone, Globe,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import TimeFilter from '../components/TimeFilter'
import MetricCard from '../components/MetricCard'
import FunnelChart from '../components/FunnelChart'
import useTimeFilter from '../hooks/useTimeFilter'
import { formatNumber, formatDuration, formatPercent } from '../utils/formatters'
import { supabase } from '../lib/supabase'

const PERIOD_MS = {
  '1h': 3600000, '6h': 21600000, '12h': 43200000,
  '24h': 86400000, '7d': 604800000, '30d': 2592000000,
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6']

export default function Dashboard() {
  const { period, setPeriod, getQueryParams } = useTimeFilter('24h')
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [trafficOverTime, setTrafficOverTime] = useState([])
  const [sources, setSources] = useState([])
  const [devices, setDevices] = useState(null)
  const [topPages, setTopPages] = useState([])
  const [geo, setGeo] = useState({ countries: [], cities: [] })
  const [funnel, setFunnel] = useState([])

  useEffect(() => {
    fetchAll()
  }, [period])

  async function fetchAll() {
    setLoading(true)
    const timeParams = getQueryParams()
    const sinceISO = getSinceISO(timeParams)

    try {
      const [overviewData, trafficData, sourcesData, devicesData, pagesData, geoData, funnelData] = await Promise.all([
        fetchOverview(sinceISO),
        fetchTrafficOverTime(sinceISO, period),
        fetchSources(sinceISO),
        fetchDevices(sinceISO),
        fetchTopPages(sinceISO),
        fetchGeo(sinceISO),
        fetchFunnel(sinceISO),
      ])

      setOverview(overviewData)
      setTrafficOverTime(trafficData)
      setSources(sourcesData)
      setDevices(devicesData)
      setTopPages(pagesData)
      setGeo(geoData)
      setFunnel(funnelData)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    }
    setLoading(false)
  }

  function getSinceISO(timeParams) {
    if (timeParams.start) return new Date(timeParams.start).toISOString()
    const ms = PERIOD_MS[timeParams.period] || 86400000
    return new Date(Date.now() - ms).toISOString()
  }

  // ---- Data fetchers (direct Supabase queries) ----

  async function fetchOverview(sinceISO) {
    const [sessionsRes, visitorsRes, pageviewsRes] = await Promise.all([
      supabase.from('sessions').select('id, visitor_id, duration_seconds, page_count', { count: 'exact' }).gte('started_at', sinceISO),
      supabase.from('visitors').select('visitor_id, first_seen_at', { count: 'exact' }).gte('last_seen_at', sinceISO),
      supabase.from('pageviews').select('id', { count: 'exact', head: true }).gte('entered_at', sinceISO),
    ])

    const sessions = sessionsRes.data || []
    const visitors = visitorsRes.data || []
    const totalSessions = sessionsRes.count || 0
    const totalVisitors = visitorsRes.count || 0
    const totalPageviews = pageviewsRes.count || 0

    const durWithValues = sessions.filter(s => s.duration_seconds > 0)
    const avgDuration = durWithValues.length > 0
      ? Math.round(durWithValues.reduce((sum, s) => sum + s.duration_seconds, 0) / durWithValues.length) : 0

    const bounces = sessions.filter(s => (s.page_count || 0) <= 1).length
    const bounceRate = totalSessions > 0 ? (bounces / totalSessions) * 100 : 0

    const newVisitors = visitors.filter(v => new Date(v.first_seen_at) >= new Date(sinceISO)).length
    const newPct = totalVisitors > 0 ? (newVisitors / totalVisitors) * 100 : 0

    return {
      total_visitors: totalVisitors,
      total_sessions: totalSessions,
      total_pageviews: totalPageviews,
      avg_duration: avgDuration,
      bounce_rate: bounceRate,
      new_visitors: newVisitors,
      returning_visitors: totalVisitors - newVisitors,
      new_pct: newPct,
    }
  }

  async function fetchTrafficOverTime(sinceISO, period) {
    let granularity = 'hour'
    if (period === '1h') granularity = 'minute'
    else if (['6h', '12h', '24h'].includes(period)) granularity = 'hour'
    else granularity = 'day'

    const { data: sessions } = await supabase
      .from('sessions').select('started_at, visitor_id')
      .gte('started_at', sinceISO).order('started_at', { ascending: true })

    const buckets = {}
    for (const s of (sessions || [])) {
      const d = new Date(s.started_at)
      let key
      if (granularity === 'minute') key = `${pad(d.getHours())}:${pad(d.getMinutes())}`
      else if (granularity === 'hour') key = `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:00`
      else key = `${pad(d.getMonth()+1)}/${pad(d.getDate())}`

      if (!buckets[key]) buckets[key] = { time: key, sessions: 0, visitors: new Set() }
      buckets[key].sessions++
      buckets[key].visitors.add(s.visitor_id)
    }

    return Object.values(buckets).map(b => ({
      time: b.time, sessions: b.sessions, visitors: b.visitors.size,
    }))
  }

  async function fetchSources(sinceISO) {
    const { data: sessions } = await supabase
      .from('sessions').select('utm_source, utm_medium, utm_campaign, referrer, visitor_id')
      .gte('started_at', sinceISO)

    const map = {}
    for (const s of (sessions || [])) {
      const source = s.utm_source || extractDomain(s.referrer) || 'Direct'
      const medium = s.utm_medium || (s.referrer ? 'referral' : 'none')
      const key = `${source}|${medium}`
      if (!map[key]) map[key] = { source, medium, sessions: 0, visitors: new Set() }
      map[key].sessions++
      map[key].visitors.add(s.visitor_id)
    }

    return Object.values(map)
      .map(s => ({ ...s, visitors: s.visitors.size }))
      .sort((a, b) => b.sessions - a.sessions).slice(0, 15)
  }

  async function fetchDevices(sinceISO) {
    const { data: sessions } = await supabase
      .from('sessions').select('device_type').gte('started_at', sinceISO)

    const counts = { mobile: 0, desktop: 0 }
    for (const s of (sessions || [])) {
      if (s.device_type === 'mobile') counts.mobile++; else counts.desktop++
    }
    const total = counts.mobile + counts.desktop
    return {
      mobile: counts.mobile, desktop: counts.desktop,
      mobile_pct: total > 0 ? (counts.mobile / total) * 100 : 0,
      desktop_pct: total > 0 ? (counts.desktop / total) * 100 : 0,
    }
  }

  async function fetchTopPages(sinceISO) {
    const { data } = await supabase
      .from('pageviews').select('page_url, time_on_page_seconds')
      .gte('entered_at', sinceISO)

    const map = {}
    for (const p of (data || [])) {
      const url = p.page_url || '/'
      if (!map[url]) map[url] = { page_url: url, views: 0, totalTime: 0, timeCount: 0 }
      map[url].views++
      if (p.time_on_page_seconds) { map[url].totalTime += p.time_on_page_seconds; map[url].timeCount++ }
    }

    return Object.values(map)
      .map(p => ({ ...p, avg_time: p.timeCount > 0 ? Math.round(p.totalTime / p.timeCount) : 0 }))
      .sort((a, b) => b.views - a.views).slice(0, 15)
  }

  async function fetchGeo(sinceISO) {
    const { data } = await supabase
      .from('sessions').select('country, city').gte('started_at', sinceISO)

    const countryMap = {}, cityMap = {}
    for (const s of (data || [])) {
      const country = s.country || 'Unknown'
      countryMap[country] = (countryMap[country] || 0) + 1
      if (s.city) {
        const key = `${s.city}, ${country}`
        cityMap[key] = (cityMap[key] || 0) + 1
      }
    }

    return {
      countries: Object.entries(countryMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      cities: Object.entries(cityMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    }
  }

  async function fetchFunnel(sinceISO) {
    const steps = ['landing_page_view', 'vsl_page_view', 'sales_page_view', 'add_to_cart', 'checkout_initiated', 'checkout_completed']
    const counts = {}
    await Promise.all(steps.map(async (step) => {
      const { count } = await supabase.from('events').select('id', { count: 'exact', head: true }).eq('event_type', step).gte('timestamp', sinceISO)
      counts[step] = count || 0
    }))

    return steps.map((step, i) => {
      const count = counts[step]
      const prev = i === 0 ? count : counts[steps[i - 1]]
      return {
        step, count,
        conversion_rate: prev > 0 ? parseFloat(((count / prev) * 100).toFixed(1)) : 0,
        overall_rate: counts[steps[0]] > 0 ? parseFloat(((count / counts[steps[0]]) * 100).toFixed(1)) : 0,
        drop_off: i === 0 ? 0 : prev - count,
      }
    })
  }

  const chartTooltipStyle = {
    contentStyle: { backgroundColor: '#161822', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: '#94a3b8' },
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-neutral" />
          <h2 className="text-xl font-semibold">Analytics</h2>
        </div>
        <TimeFilter selected={period} onChange={setPeriod} />
      </div>

      {loading && !overview ? (
        <div className="text-center text-text-secondary py-12">Loading analytics...</div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <MetricCard label="Visitors" value={formatNumber(overview?.total_visitors)} />
            <MetricCard label="Sessions" value={formatNumber(overview?.total_sessions)} />
            <MetricCard label="Pageviews" value={formatNumber(overview?.total_pageviews)} />
            <MetricCard label="Avg Duration" value={formatDuration(overview?.avg_duration)} />
            <MetricCard
              label="Bounce Rate"
              value={formatPercent(overview?.bounce_rate)}
              color={overview?.bounce_rate > 60 ? 'text-negative' : overview?.bounce_rate > 40 ? 'text-warning' : 'text-positive'}
            />
            <MetricCard
              label="New Visitors"
              value={formatPercent(overview?.new_pct)}
              subtext={`${formatNumber(overview?.new_visitors)} new · ${formatNumber(overview?.returning_visitors)} ret`}
            />
          </div>

          {/* Traffic Over Time */}
          <div className="bg-bg-secondary border border-border rounded-lg p-5 mb-6">
            <h3 className="text-sm font-medium text-text-primary mb-4">Traffic Over Time</h3>
            {trafficOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trafficOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip {...chartTooltipStyle} />
                  <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sessions" />
                  <Line type="monotone" dataKey="visitors" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Visitors" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">
                No traffic data for this period
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Traffic Sources */}
            <div className="bg-bg-secondary border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-text-primary mb-4">Traffic Sources</h3>
              {sources.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-[10px] font-medium text-text-secondary uppercase pb-2">Source</th>
                        <th className="text-left text-[10px] font-medium text-text-secondary uppercase pb-2">Medium</th>
                        <th className="text-right text-[10px] font-medium text-text-secondary uppercase pb-2">Sessions</th>
                        <th className="text-right text-[10px] font-medium text-text-secondary uppercase pb-2">Visitors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.map((s, i) => (
                        <tr key={i} className="border-b border-border/30">
                          <td className="py-2 text-xs text-text-primary">{s.source}</td>
                          <td className="py-2 text-xs text-text-secondary">{s.medium}</td>
                          <td className="py-2 text-xs text-text-primary text-right font-mono">{formatNumber(s.sessions)}</td>
                          <td className="py-2 text-xs text-text-primary text-right font-mono">{formatNumber(s.visitors)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No source data yet</p>
              )}
            </div>

            {/* Device Breakdown */}
            <div className="bg-bg-secondary border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-text-primary mb-4">Device Breakdown</h3>
              {devices && (devices.mobile > 0 || devices.desktop > 0) ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Desktop', value: devices.desktop },
                          { name: 'Mobile', value: devices.mobile },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={40} outerRadius={65}
                        dataKey="value" strokeWidth={0}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#8b5cf6" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Monitor size={16} className="text-neutral" />
                      <div>
                        <p className="text-sm font-mono text-text-primary">
                          {formatNumber(devices.desktop)} <span className="text-text-secondary">({formatPercent(devices.desktop_pct)})</span>
                        </p>
                        <p className="text-[10px] text-text-secondary">Desktop</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} className="text-accent" />
                      <div>
                        <p className="text-sm font-mono text-text-primary">
                          {formatNumber(devices.mobile)} <span className="text-text-secondary">({formatPercent(devices.mobile_pct)})</span>
                        </p>
                        <p className="text-[10px] text-text-secondary">Mobile</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No device data yet</p>
              )}
            </div>
          </div>

          {/* Funnel */}
          <div className="mb-6">
            <FunnelChart data={funnel} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Pages */}
            <div className="bg-bg-secondary border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-text-primary mb-4">Top Pages</h3>
              {topPages.length > 0 ? (
                <div className="space-y-2">
                  {topPages.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-text-primary truncate flex-1 mr-4">{p.page_url}</span>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs font-mono text-text-primary w-12 text-right">{formatNumber(p.views)}</span>
                        <span className="text-xs font-mono text-text-secondary w-14 text-right">{formatDuration(p.avg_time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No page data yet</p>
              )}
            </div>

            {/* Geographic */}
            <div className="bg-bg-secondary border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-text-primary mb-4">Top Locations</h3>
              {geo.countries.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase mb-2">Countries</p>
                    <div className="space-y-1.5">
                      {geo.countries.map((c, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-text-primary">{c.name}</span>
                          <span className="text-xs font-mono text-text-secondary">{formatNumber(c.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary uppercase mb-2">Cities</p>
                    <div className="space-y-1.5">
                      {geo.cities.map((c, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-text-primary truncate mr-2">{c.name}</span>
                          <span className="text-xs font-mono text-text-secondary">{formatNumber(c.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No location data yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function pad(n) { return n.toString().padStart(2, '0') }

function extractDomain(url) {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') } catch { return null }
}
