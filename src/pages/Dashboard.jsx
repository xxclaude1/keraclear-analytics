import { useState, useEffect } from 'react'
import {
  BarChart3, Users, Layers, Clock, ArrowUpDown, UserPlus,
  Monitor, Smartphone, Globe,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import TimeFilter from '../components/TimeFilter'
import MetricCard from '../components/MetricCard'
import FunnelChart from '../components/FunnelChart'
import useTimeFilter from '../hooks/useTimeFilter'
import { formatNumber, formatDuration, formatPercent } from '../utils/formatters'

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
    try {
      const res = await fetch(`/api/analytics?section=all&period=${period}`)
      const data = await res.json()

      setOverview(data.overview)
      setTrafficOverTime(data.traffic_over_time || [])
      setSources(data.sources || [])
      setDevices(data.devices)
      setTopPages(data.top_pages || [])
      setGeo(data.geo || { countries: [], cities: [] })
      setFunnel(data.funnel || [])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    }
    setLoading(false)
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
