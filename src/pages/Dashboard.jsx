import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import TimeFilter from '../components/TimeFilter'
import MetricCard from '../components/MetricCard'
import FunnelChart from '../components/FunnelChart'
import useTimeFilter from '../hooks/useTimeFilter'
import { formatNumber, formatDuration, formatPercent } from '../utils/formatters'

const PIE_COLORS = ['#3B82F6', '#A855F7']
const TOOLTIP_STYLE = {
  contentStyle: { background: '#222228', border: '1px solid #2A2A30', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#A0A0AB' },
}

export default function Dashboard() {
  const { period, setPeriod } = useTimeFilter('24h')
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [trafficOverTime, setTrafficOverTime] = useState([])
  const [sources, setSources] = useState([])
  const [devices, setDevices] = useState(null)
  const [topPages, setTopPages] = useState([])
  const [geo, setGeo] = useState({ countries: [], cities: [] })
  const [funnel, setFunnel] = useState([])

  useEffect(() => { fetchAll() }, [period])

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

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Store performance overview</p>
        </div>
        <TimeFilter selected={period} onChange={setPeriod} />
      </div>

      {loading && !overview ? (
        <div className="empty-state"><div className="empty-state-text">Loading analytics...</div></div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="metrics-grid cols-6">
            <MetricCard label="Visitors" value={formatNumber(overview?.total_visitors)} small />
            <MetricCard label="Sessions" value={formatNumber(overview?.total_sessions)} small />
            <MetricCard label="Pageviews" value={formatNumber(overview?.total_pageviews)} small />
            <MetricCard label="Avg Duration" value={formatDuration(overview?.avg_duration)} small />
            <MetricCard
              label="Bounce Rate"
              value={formatPercent(overview?.bounce_rate)}
              color={overview?.bounce_rate > 60 ? 'var(--red)' : overview?.bounce_rate > 40 ? 'var(--yellow)' : 'var(--green)'}
              small
            />
            <MetricCard
              label="New Visitors"
              value={formatPercent(overview?.new_pct)}
              subtext={`${formatNumber(overview?.new_visitors)} new · ${formatNumber(overview?.returning_visitors)} ret`}
              small
            />
          </div>

          {/* Traffic Over Time */}
          <div className="chart-card" style={{ marginBottom: 16 }}>
            <div className="chart-title">Traffic Over Time</div>
            {trafficOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trafficOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#5C5C66' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#5C5C66' }} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="sessions" stroke="#3B82F6" strokeWidth={2} dot={false} name="Sessions" />
                  <Line type="monotone" dataKey="visitors" stroke="#A855F7" strokeWidth={2} dot={false} name="Visitors" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ height: 260 }}>
                <div className="empty-state-sub">No traffic data for this period</div>
              </div>
            )}
          </div>

          <div className="charts-grid">
            {/* Traffic Sources */}
            <div className="chart-card">
              <div className="chart-title">Traffic Sources</div>
              {sources.length > 0 ? (
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {sources.map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12,
                    }}>
                      <span style={{ flex: 1, color: 'var(--text-primary)' }}>{s.source}</span>
                      <span style={{ color: 'var(--text-muted)', width: 80 }}>{s.medium}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', width: 50, textAlign: 'right' }}>{formatNumber(s.sessions)}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', width: 50, textAlign: 'right' }}>{formatNumber(s.visitors)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ height: 200 }}>
                  <div className="empty-state-sub">No source data yet</div>
                </div>
              )}
            </div>

            {/* Device Breakdown */}
            <div className="chart-card">
              <div className="chart-title">Devices</div>
              {devices && (devices.mobile > 0 || devices.desktop > 0) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Desktop', value: devices.desktop },
                          { name: 'Mobile', value: devices.mobile },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={40} outerRadius={70}
                        dataKey="value" strokeWidth={0}
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="#A855F7" />
                      </Pie>
                      <Tooltip {...TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 12 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3B82F6' }} />
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>Desktop</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(devices.desktop)} ({formatPercent(devices.desktop_pct)})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#A855F7' }} />
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>Mobile</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(devices.mobile)} ({formatPercent(devices.mobile_pct)})</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ height: 180 }}>
                  <div className="empty-state-sub">No device data yet</div>
                </div>
              )}
            </div>
          </div>

          {/* Funnel */}
          <div style={{ marginBottom: 16 }}>
            <FunnelChart data={funnel} />
          </div>

          <div className="charts-grid">
            {/* Top Pages */}
            <div className="chart-card">
              <div className="chart-title">Top Pages</div>
              {topPages.length > 0 ? (
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {topPages.map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12,
                    }}>
                      <span style={{ color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12 }}>{p.page_url}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', width: 50, textAlign: 'right', flexShrink: 0 }}>{formatNumber(p.views)}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 60, textAlign: 'right', flexShrink: 0 }}>{formatDuration(p.avg_time)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ height: 200 }}>
                  <div className="empty-state-sub">No page data yet</div>
                </div>
              )}
            </div>

            {/* Geographic */}
            <div className="chart-card">
              <div className="chart-title">Top Locations</div>
              {geo.countries.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Countries</div>
                    {geo.countries.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatNumber(c.count)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Cities</div>
                    {geo.cities.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{c.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', flexShrink: 0 }}>{formatNumber(c.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ height: 200 }}>
                  <div className="empty-state-sub">No location data yet</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
