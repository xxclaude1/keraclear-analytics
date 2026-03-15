import { useState, useEffect, useRef } from 'react'
import {
  TrendingUp, DollarSign, Upload, Plus, Calculator, FileText,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import TimeFilter from '../components/TimeFilter'
import MetricCard from '../components/MetricCard'
import useTimeFilter from '../hooks/useTimeFilter'
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters'
import { supabase } from '../lib/supabase'

const PERIOD_MS = {
  '1h': 3600000, '6h': 21600000, '12h': 43200000,
  '24h': 86400000, '7d': 604800000, '30d': 2592000000,
}

export default function Funnels() {
  const { period, setPeriod, getQueryParams } = useTimeFilter('30d')
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
      const timeParams = getQueryParams()
      const ms = PERIOD_MS[timeParams.period] || 2592000000
      const since = new Date(Date.now() - ms)
      const sinceDate = since.toISOString().split('T')[0]
      const sinceISO = since.toISOString()

      // Fetch spend data
      const { data: spendData } = await supabase
        .from('funnels').select('*').gte('date', sinceDate).order('date', { ascending: true })

      // Fetch funnel counts
      const steps = ['landing_page_view', 'add_to_cart', 'checkout_initiated', 'checkout_completed']
      const counts = {}
      await Promise.all(steps.map(async (step) => {
        const { count } = await supabase.from('events')
          .select('id', { count: 'exact', head: true })
          .eq('event_type', step).gte('timestamp', sinceISO)
        counts[step] = count || 0
      }))

      const rows = spendData || []
      const totalSpend = rows.reduce((s, r) => s + parseFloat(r.ad_spend || 0), 0)
      const totalRevenue = rows.reduce((s, r) => s + parseFloat(r.revenue || 0), 0)
      const totalOrders = counts.checkout_completed
      const visitors = counts.landing_page_view

      const latestCosts = rows.filter(r => parseFloat(r.cogs_per_unit) > 0).pop() || {
        cogs_per_unit: 0, shipping_cost: 0, processing_fee_pct: 2.9, refund_rate_pct: 0,
      }

      const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0
      const rpv = visitors > 0 ? totalRevenue / visitors : 0
      const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
      const cpa = totalOrders > 0 ? totalSpend / totalOrders : 0
      const cpm = visitors > 0 ? (totalSpend / visitors) * 1000 : 0
      const costPerATC = counts.add_to_cart > 0 ? totalSpend / counts.add_to_cart : 0
      const costPerCO = counts.checkout_initiated > 0 ? totalSpend / counts.checkout_initiated : 0

      const funnelEcon = [
        { step: 'Landing Page', count: counts.landing_page_view, cost: visitors > 0 ? totalSpend / visitors : 0 },
        { step: 'Add to Cart', count: counts.add_to_cart, cost: costPerATC },
        { step: 'Checkout', count: counts.checkout_initiated, cost: costPerCO },
        { step: 'Purchase', count: counts.checkout_completed, cost: cpa },
      ]
      for (let i = 0; i < funnelEcon.length; i++) {
        const prev = i === 0 ? funnelEcon[0].count : funnelEcon[i - 1].count
        funnelEcon[i].cvr = prev > 0 ? (funnelEcon[i].count / prev) * 100 : 0
      }

      // Contribution margin
      const cogs = parseFloat(latestCosts.cogs_per_unit || 0)
      const ship = parseFloat(latestCosts.shipping_cost || 0)
      const procPct = parseFloat(latestCosts.processing_fee_pct || 2.9)
      const refPct = parseFloat(latestCosts.refund_rate_pct || 0)
      const procFee = aov * (procPct / 100)
      const refCost = aov * (refPct / 100)
      const contribMargin = aov - cogs - ship - procFee - refCost
      const breakEven = contribMargin
      const profitPerOrder = contribMargin - cpa

      // P&L
      const totalCOGS = cogs * totalOrders
      const totalShip = ship * totalOrders
      const totalFees = procFee * totalOrders
      const totalRef = refCost * totalOrders
      const netProfit = totalRevenue - totalSpend - totalCOGS - totalShip - totalFees - totalRef

      // Trends
      const trends = rows.map(r => ({
        date: r.date,
        spend: parseFloat(r.ad_spend || 0),
        revenue: parseFloat(r.revenue || 0),
      }))

      setCosts({
        cogs_per_unit: cogs.toString(),
        shipping_cost: ship.toString(),
        processing_fee_pct: procPct.toString(),
        refund_rate_pct: refPct.toString(),
      })

      setData({
        revenue: totalRevenue, aov, rpv, roas, cpa, cpm, spend: totalSpend,
        orders: totalOrders, visitors,
        funnelEcon, contribMargin, breakEven, profitPerOrder,
        pnl: { revenue: totalRevenue, spend: totalSpend, cogs: totalCOGS, shipping: totalShip, fees: totalFees, refunds: totalRef, net: netProfit },
        costs: { cogs, ship, procPct, refPct }, trends,
      })
    } catch (err) {
      console.error('Economics fetch error:', err)
    }
    setLoading(false)
  }

  async function submitSpend() {
    if (!spendAmount) return
    const { error } = await supabase.from('funnels').upsert({
      date: spendDate, platform: spendPlatform,
      ad_spend: parseFloat(spendAmount),
    }, { onConflict: 'date,platform' })
    if (!error) {
      setSpendAmount('')
      setShowSpendModal(false)
      fetchEconomics()
    }
  }

  async function handleCSVUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.trim().split('\n')
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim())
      if (cols.length >= 2) {
        rows.push({ date: cols[0], platform: cols[2] || 'all', ad_spend: parseFloat(cols[1] || 0) })
      }
    }
    if (rows.length > 0) {
      await supabase.from('funnels').upsert(rows, { onConflict: 'date,platform' })
      fetchEconomics()
    }
    e.target.value = ''
  }

  async function saveCostSettings() {
    setSavingCosts(true)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('funnels').upsert({
      date: today, platform: 'all',
      cogs_per_unit: parseFloat(costs.cogs_per_unit || 0),
      shipping_cost: parseFloat(costs.shipping_cost || 0),
      processing_fee_pct: parseFloat(costs.processing_fee_pct || 2.9),
      refund_rate_pct: parseFloat(costs.refund_rate_pct || 0),
    }, { onConflict: 'date,platform' })
    setSavingCosts(false)
    fetchEconomics()
  }

  const chartTooltipStyle = {
    contentStyle: { backgroundColor: '#161822', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: '#94a3b8' },
  }

  function getCostColor(cost, threshold) {
    if (cost <= 0) return 'text-text-secondary'
    if (cost <= threshold) return 'text-positive'
    if (cost <= threshold * 2) return 'text-warning'
    return 'text-negative'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-positive" />
          <h2 className="text-xl font-semibold">Funnel Economics</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSpendModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-md text-sm hover:bg-accent/90 transition-colors"
          >
            <Plus size={14} />
            Add Spend
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-secondary border border-border text-text-secondary rounded-md text-sm hover:text-text-primary transition-colors"
          >
            <Upload size={14} />
            CSV Upload
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          <TimeFilter selected={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Spend Modal */}
      {showSpendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Add Daily Ad Spend</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">Date</label>
                <input type="date" value={spendDate} onChange={e => setSpendDate(e.target.value)}
                  className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary" />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Platform</label>
                <select value={spendPlatform} onChange={e => setSpendPlatform(e.target.value)}
                  className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary">
                  <option value="meta">Meta (Facebook/Instagram)</option>
                  <option value="google">Google Ads</option>
                  <option value="tiktok">TikTok</option>
                  <option value="other">Other</option>
                  <option value="all">All Platforms</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Amount ($)</label>
                <input type="number" step="0.01" placeholder="0.00" value={spendAmount}
                  onChange={e => setSpendAmount(e.target.value)}
                  className="w-full bg-bg-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={submitSpend}
                className="flex-1 bg-accent text-white rounded-md py-2 text-sm hover:bg-accent/90">Save</button>
              <button onClick={() => setShowSpendModal(false)}
                className="flex-1 bg-bg-tertiary text-text-secondary rounded-md py-2 text-sm hover:text-text-primary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="text-center text-text-secondary py-12">Loading economics...</div>
      ) : !data ? (
        <div className="text-center text-text-secondary py-12">No data available</div>
      ) : (
        <>
          {/* Revenue + Ad Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MetricCard label="Revenue" value={formatCurrency(data.revenue)} color="text-positive" />
            <MetricCard label="AOV" value={formatCurrency(data.aov)} />
            <MetricCard label="RPV" value={formatCurrency(data.rpv)} />
            <MetricCard
              label="ROAS"
              value={`${data.roas.toFixed(2)}x`}
              color={data.roas >= 3 ? 'text-positive' : data.roas >= 1.5 ? 'text-warning' : 'text-negative'}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MetricCard label="Ad Spend" value={formatCurrency(data.spend)} color="text-negative" />
            <MetricCard
              label="CPA"
              value={formatCurrency(data.cpa)}
              color={data.cpa > 0 && data.cpa <= data.breakEven ? 'text-positive' : 'text-negative'}
            />
            <MetricCard label="CPM" value={formatCurrency(data.cpm)} />
            <MetricCard label="Orders" value={formatNumber(data.orders)} color="text-positive" />
          </div>

          {/* Funnel Economics Table */}
          <div className="bg-bg-secondary border border-border rounded-lg p-5 mb-6">
            <h3 className="text-sm font-medium text-text-primary mb-4">Funnel Economics</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] font-medium text-text-secondary uppercase pb-2">Step</th>
                  <th className="text-right text-[10px] font-medium text-text-secondary uppercase pb-2">Count</th>
                  <th className="text-right text-[10px] font-medium text-text-secondary uppercase pb-2">CVR</th>
                  <th className="text-right text-[10px] font-medium text-text-secondary uppercase pb-2">Cost/Action</th>
                  <th className="text-right text-[10px] font-medium text-text-secondary uppercase pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.funnelEcon.map((row, i) => {
                  const thresholds = [5, 25, 40, 55] // rough cost thresholds per step
                  const costColor = getCostColor(row.cost, thresholds[i])
                  return (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-2.5 text-sm text-text-primary">{row.step}</td>
                      <td className="py-2.5 text-sm text-text-primary text-right font-mono">{formatNumber(row.count)}</td>
                      <td className="py-2.5 text-sm text-right font-mono">
                        <span className={row.cvr >= 10 ? 'text-positive' : row.cvr >= 5 ? 'text-warning' : 'text-negative'}>
                          {formatPercent(row.cvr)}
                        </span>
                      </td>
                      <td className={`py-2.5 text-sm text-right font-mono ${costColor}`}>
                        {formatCurrency(row.cost)}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                          row.cost <= 0 ? 'bg-text-secondary/30' :
                          row.cost <= thresholds[i] ? 'bg-positive' :
                          row.cost <= thresholds[i] * 2 ? 'bg-warning' : 'bg-negative'
                        }`} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Contribution Margin Calculator */}
            <div className="bg-bg-secondary border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calculator size={16} className="text-accent" />
                <h3 className="text-sm font-medium text-text-primary">Contribution Margin</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] text-text-secondary uppercase block mb-1">COGS / Unit ($)</label>
                  <input type="number" step="0.01" value={costs.cogs_per_unit}
                    onChange={e => setCosts({ ...costs, cogs_per_unit: e.target.value })}
                    className="w-full bg-bg-primary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary font-mono" />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary uppercase block mb-1">Shipping ($)</label>
                  <input type="number" step="0.01" value={costs.shipping_cost}
                    onChange={e => setCosts({ ...costs, shipping_cost: e.target.value })}
                    className="w-full bg-bg-primary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary font-mono" />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary uppercase block mb-1">Processing Fee (%)</label>
                  <input type="number" step="0.1" value={costs.processing_fee_pct}
                    onChange={e => setCosts({ ...costs, processing_fee_pct: e.target.value })}
                    className="w-full bg-bg-primary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary font-mono" />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary uppercase block mb-1">Refund Rate (%)</label>
                  <input type="number" step="0.1" value={costs.refund_rate_pct}
                    onChange={e => setCosts({ ...costs, refund_rate_pct: e.target.value })}
                    className="w-full bg-bg-primary border border-border rounded-md px-3 py-1.5 text-sm text-text-primary font-mono" />
                </div>
              </div>
              <button onClick={saveCostSettings} disabled={savingCosts}
                className="w-full bg-bg-tertiary text-text-primary rounded-md py-2 text-sm hover:bg-border transition-colors mb-4">
                {savingCosts ? 'Saving...' : 'Save Cost Settings'}
              </button>

              <div className="space-y-2 pt-3 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Margin / Order</span>
                  <span className={`font-mono ${data.contribMargin >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrency(data.contribMargin)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Break-even CPA</span>
                  <span className="font-mono text-warning">{formatCurrency(data.breakEven)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-text-primary">Profit / Order</span>
                  <span className={`font-mono ${data.profitPerOrder >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrency(data.profitPerOrder)}
                  </span>
                </div>
              </div>
            </div>

            {/* P&L Summary */}
            <div className="bg-bg-secondary border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-accent" />
                <h3 className="text-sm font-medium text-text-primary">P&L Summary</h3>
              </div>
              <div className="space-y-2.5">
                <PLRow label="Revenue" value={data.pnl.revenue} positive />
                <PLRow label="Ad Spend" value={-data.pnl.spend} />
                <PLRow label="COGS" value={-data.pnl.cogs} />
                <PLRow label="Shipping" value={-data.pnl.shipping} />
                <PLRow label="Processing Fees" value={-data.pnl.fees} />
                <PLRow label="Est. Refunds" value={-data.pnl.refunds} />
                <div className="pt-2 mt-2 border-t-2 border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-text-primary">Net Profit</span>
                    <span className={`text-lg font-bold font-mono ${data.pnl.net >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {formatCurrency(data.pnl.net)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Charts */}
          {data.trends.length > 1 && (
            <div className="bg-bg-secondary border border-border rounded-lg p-5 mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-4">Spend & Revenue Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip {...chartTooltipStyle} />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="spend" stroke="#ef4444" strokeWidth={2} dot={false} name="Spend" />
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
    <div className="flex justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-mono ${positive ? 'text-positive' : isPos ? 'text-text-primary' : 'text-negative'}`}>
        {value >= 0 ? formatCurrency(value) : `-${formatCurrency(Math.abs(value))}`}
      </span>
    </div>
  )
}

function formatCurrencyLocal(val) {
  return `$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
