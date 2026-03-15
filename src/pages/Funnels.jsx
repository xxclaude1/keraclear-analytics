import { useState, useEffect, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import TimeFilter from '../components/TimeFilter'
import MetricCard from '../components/MetricCard'
import useTimeFilter from '../hooks/useTimeFilter'
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters'

const TOOLTIP_STYLE = {
  contentStyle: { background: '#222228', border: '1px solid #2A2A30', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#A0A0AB' },
}

export default function Funnels() {
  const { period, setPeriod } = useTimeFilter('30d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [showSpendModal, setShowSpendModal] = useState(false)
  const [spendDate, setSpendDate] = useState(new Date().toISOString().split('T')[0])
  const [spendPlatform, setSpendPlatform] = useState('meta')
  const [spendAmount, setSpendAmount] = useState('')
  const [costs, setCosts] = useState({
    cogs_per_unit: '', shipping_cost: '', processing_fee_pct: '2.9', refund_rate_pct: '',
  })
  const [savingCosts, setSavingCosts] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { fetchEconomics() }, [period])

  async function fetchEconomics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/economics?period=${period}`)
      const raw = await res.json()

      const funnelEcon = (raw.funnel_economics || []).map((fe) => ({
        step: fe.step, count: fe.count, cost: fe.cost_per, cvr: fe.conversion_rate,
      }))

      const latestCosts = raw.costs || {}
      setCosts({
        cogs_per_unit: (latestCosts.cogs_per_unit || 0).toString(),
        shipping_cost: (latestCosts.shipping_cost || 0).toString(),
        processing_fee_pct: (latestCosts.processing_fee_pct || 2.9).toString(),
        refund_rate_pct: (latestCosts.refund_rate_pct || 0).toString(),
      })

      setData({
        revenue: raw.revenue?.total || 0, aov: raw.revenue?.aov || 0, rpv: raw.revenue?.rpv || 0,
        roas: raw.spend?.roas || 0, cpa: raw.spend?.cpa || 0, cpm: raw.spend?.cpm || 0,
        spend: raw.spend?.total || 0, orders: raw.orders || 0,
        funnelEcon, contribMargin: raw.contribution?.contribution_margin || 0,
        breakEven: raw.contribution?.break_even_cpa || 0,
        profitPerOrder: raw.contribution?.profit_per_order || 0,
        pnl: raw.pnl || {},
        trends: (raw.trends || []).map(r => ({ date: r.date, spend: r.ad_spend || 0, revenue: r.revenue || 0 })),
      })
    } catch (err) { console.error('Economics fetch error:', err) }
    setLoading(false)
  }

  async function submitSpend() {
    if (!spendAmount) return
    await fetch('/api/economics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_spend', date: spendDate, platform: spendPlatform, ad_spend: parseFloat(spendAmount) }),
    })
    setSpendAmount(''); setShowSpendModal(false); fetchEconomics()
  }

  async function handleCSVUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.trim().split('\n')
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim())
      if (cols.length >= 2) rows.push({ date: cols[0], platform: cols[2] || 'all', ad_spend: parseFloat(cols[1] || 0) })
    }
    if (rows.length > 0) {
      await fetch('/api/economics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_spend', rows }),
      })
      fetchEconomics()
    }
    e.target.value = ''
  }

  async function saveCostSettings() {
    setSavingCosts(true)
    await fetch('/api/economics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_costs',
        cogs_per_unit: parseFloat(costs.cogs_per_unit || 0),
        shipping_cost: parseFloat(costs.shipping_cost || 0),
        processing_fee_pct: parseFloat(costs.processing_fee_pct || 2.9),
        refund_rate_pct: parseFloat(costs.refund_rate_pct || 0),
      }),
    })
    setSavingCosts(false); fetchEconomics()
  }

  function getCostColor(cost, threshold) {
    if (cost <= 0) return 'var(--text-secondary)'
    if (cost <= threshold) return 'var(--green)'
    if (cost <= threshold * 2) return 'var(--yellow)'
    return 'var(--red)'
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Funnel Economics</h1>
          <p className="page-subtitle">Revenue, costs, and unit economics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn primary" onClick={() => setShowSpendModal(true)}>+ Add Spend</button>
          <button className="btn" onClick={() => fileInputRef.current?.click()}>CSV Upload</button>
          <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVUpload} />
          <TimeFilter selected={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Spend Modal */}
      {showSpendModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">Add Daily Ad Spend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Date</label>
                <input type="date" value={spendDate} onChange={e => setSpendDate(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Platform</label>
                <select value={spendPlatform} onChange={e => setSpendPlatform(e.target.value)} className="filter-select" style={{ width: '100%' }}>
                  <option value="meta">Meta (Facebook/Instagram)</option>
                  <option value="google">Google Ads</option>
                  <option value="tiktok">TikTok</option>
                  <option value="other">Other</option>
                  <option value="all">All Platforms</option>
                </select>
              </div>
              <div>
                <label className="form-label">Amount ($)</label>
                <input type="number" step="0.01" placeholder="0.00" value={spendAmount}
                  onChange={e => setSpendAmount(e.target.value)} className="form-input mono" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn primary" style={{ flex: 1 }} onClick={submitSpend}>Save</button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setShowSpendModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="empty-state"><div className="empty-state-text">Loading economics...</div></div>
      ) : !data ? (
        <div className="empty-state"><div className="empty-state-text">No data available</div></div>
      ) : (
        <>
          {/* Revenue Cards */}
          <div className="metrics-grid">
            <MetricCard label="Revenue" value={formatCurrency(data.revenue)} color="var(--green)" />
            <MetricCard label="AOV" value={formatCurrency(data.aov)} />
            <MetricCard label="RPV" value={formatCurrency(data.rpv)} />
            <MetricCard label="ROAS" value={`${data.roas.toFixed(2)}x`}
              color={data.roas >= 3 ? 'var(--green)' : data.roas >= 1.5 ? 'var(--yellow)' : 'var(--red)'} />
          </div>

          <div className="metrics-grid">
            <MetricCard label="Ad Spend" value={formatCurrency(data.spend)} color="var(--red)" />
            <MetricCard label="CPA" value={formatCurrency(data.cpa)}
              color={data.cpa > 0 && data.cpa <= data.breakEven ? 'var(--green)' : 'var(--red)'} />
            <MetricCard label="CPM" value={formatCurrency(data.cpm)} />
            <MetricCard label="Orders" value={formatNumber(data.orders)} color="var(--green)" />
          </div>

          {/* Funnel Economics Table */}
          <div className="chart-card" style={{ marginBottom: 16 }}>
            <div className="chart-title">Funnel Economics</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Step</th>
                  <th className="right">Count</th>
                  <th className="right">CVR</th>
                  <th className="right">Cost/Action</th>
                  <th className="right">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.funnelEcon.map((row, i) => {
                  const thresholds = [5, 25, 40, 55]
                  return (
                    <tr key={i} style={{ cursor: 'default' }}>
                      <td>{row.step}</td>
                      <td className="mono right">{formatNumber(row.count)}</td>
                      <td className="right" style={{ fontFamily: 'var(--font-mono)', color: row.cvr >= 10 ? 'var(--green)' : row.cvr >= 5 ? 'var(--yellow)' : 'var(--red)' }}>
                        {formatPercent(row.cvr)}
                      </td>
                      <td className="mono right" style={{ color: getCostColor(row.cost, thresholds[i]) }}>
                        {formatCurrency(row.cost)}
                      </td>
                      <td className="right">
                        <span style={{
                          display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                          background: row.cost <= 0 ? 'var(--text-muted)' :
                            row.cost <= thresholds[i] ? 'var(--green)' :
                            row.cost <= thresholds[i] * 2 ? 'var(--yellow)' : 'var(--red)',
                        }} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="charts-grid" style={{ marginBottom: 16 }}>
            {/* Contribution Margin */}
            <div className="chart-card">
              <div className="chart-title">Contribution Margin</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label className="form-label">COGS / Unit ($)</label>
                  <input type="number" step="0.01" value={costs.cogs_per_unit}
                    onChange={e => setCosts({ ...costs, cogs_per_unit: e.target.value })}
                    className="form-input mono" />
                </div>
                <div>
                  <label className="form-label">Shipping ($)</label>
                  <input type="number" step="0.01" value={costs.shipping_cost}
                    onChange={e => setCosts({ ...costs, shipping_cost: e.target.value })}
                    className="form-input mono" />
                </div>
                <div>
                  <label className="form-label">Processing Fee (%)</label>
                  <input type="number" step="0.1" value={costs.processing_fee_pct}
                    onChange={e => setCosts({ ...costs, processing_fee_pct: e.target.value })}
                    className="form-input mono" />
                </div>
                <div>
                  <label className="form-label">Refund Rate (%)</label>
                  <input type="number" step="0.1" value={costs.refund_rate_pct}
                    onChange={e => setCosts({ ...costs, refund_rate_pct: e.target.value })}
                    className="form-input mono" />
                </div>
              </div>
              <button className="btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }} onClick={saveCostSettings} disabled={savingCosts}>
                {savingCosts ? 'Saving...' : 'Save Cost Settings'}
              </button>

              <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Margin / Order</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: data.contribMargin >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {formatCurrency(data.contribMargin)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Break-even CPA</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--yellow)' }}>{formatCurrency(data.breakEven)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                  <span>Profit / Order</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: data.profitPerOrder >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {formatCurrency(data.profitPerOrder)}
                  </span>
                </div>
              </div>
            </div>

            {/* P&L Summary */}
            <div className="chart-card">
              <div className="chart-title">P&L Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <PLRow label="Revenue" value={data.pnl.revenue || 0} positive />
                <PLRow label="Ad Spend" value={-(data.pnl.ad_spend || 0)} />
                <PLRow label="COGS" value={-(data.pnl.cogs || 0)} />
                <PLRow label="Shipping" value={-(data.pnl.shipping || 0)} />
                <PLRow label="Processing Fees" value={-(data.pnl.fees || 0)} />
                <PLRow label="Est. Refunds" value={-(data.pnl.refunds || 0)} />
                <div style={{ paddingTop: 10, marginTop: 6, borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Net Profit</span>
                  <span style={{
                    fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: (data.pnl.net_profit || 0) >= 0 ? 'var(--green)' : 'var(--red)',
                  }}>
                    {formatCurrency(data.pnl.net_profit || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Charts */}
          {data.trends.length > 1 && (
            <div className="chart-card">
              <div className="chart-title">Spend & Revenue Over Time</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#5C5C66' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#5C5C66' }} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="spend" stroke="#EF4444" strokeWidth={2} dot={false} name="Spend" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PLRow({ label, value, positive }) {
  const isPos = value >= 0
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        color: positive ? 'var(--green)' : isPos ? 'var(--text-primary)' : 'var(--red)',
      }}>
        {value >= 0 ? formatCurrency(value) : `-${formatCurrency(Math.abs(value))}`}
      </span>
    </div>
  )
}
