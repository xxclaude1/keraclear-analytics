import { upsertFunnel, listFunnels, countEvents } from '../lib/db.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const PERIOD_MS = {
  '1h': 3600000, '6h': 21600000, '12h': 43200000,
  '24h': 86400000, '7d': 604800000, '30d': 2592000000,
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method === 'POST') {
    return handlePost(req)
  }

  return handleGet(req)
}

async function handlePost(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS })
  }

  const { action } = body

  if (action === 'add_spend') {
    const { date, platform, ad_spend } = body
    if (!date || ad_spend === undefined) {
      return Response.json({ error: 'date and ad_spend required' }, { status: 400, headers: CORS_HEADERS })
    }

    try {
      await upsertFunnel({ date, platform: platform || 'all', ad_spend: parseFloat(ad_spend) })
      return Response.json({ status: 'ok' }, { headers: CORS_HEADERS })
    } catch (error) {
      console.error('Add spend error:', error)
      return Response.json({ error: 'Failed to save' }, { status: 500, headers: CORS_HEADERS })
    }
  }

  if (action === 'bulk_spend') {
    const { rows } = body
    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ error: 'rows array required' }, { status: 400, headers: CORS_HEADERS })
    }

    try {
      for (const r of rows) {
        await upsertFunnel({
          date: r.date,
          platform: r.platform || 'all',
          ad_spend: parseFloat(r.ad_spend || r.spend || 0),
        })
      }
      return Response.json({ status: 'ok', imported: rows.length }, { headers: CORS_HEADERS })
    } catch (error) {
      console.error('Bulk spend error:', error)
      return Response.json({ error: 'Failed to save' }, { status: 500, headers: CORS_HEADERS })
    }
  }

  if (action === 'save_costs') {
    const { date, cogs_per_unit, shipping_cost, processing_fee_pct, refund_rate_pct } = body
    const targetDate = date || new Date().toISOString().split('T')[0]

    try {
      await upsertFunnel({
        date: targetDate,
        platform: 'all',
        cogs_per_unit: parseFloat(cogs_per_unit || 0),
        shipping_cost: parseFloat(shipping_cost || 0),
        processing_fee_pct: parseFloat(processing_fee_pct || 2.9),
        refund_rate_pct: parseFloat(refund_rate_pct || 0),
      })
      return Response.json({ status: 'ok' }, { headers: CORS_HEADERS })
    } catch (error) {
      console.error('Save costs error:', error)
      return Response.json({ error: 'Failed to save' }, { status: 500, headers: CORS_HEADERS })
    }
  }

  return Response.json({ error: 'Unknown action' }, { status: 400, headers: CORS_HEADERS })
}

async function handleGet(req) {
  const url = new URL(req.url)
  const params = url.searchParams
  const period = params.get('period') || '30d'

  const now = new Date()
  const ms = PERIOD_MS[period] || 2592000000
  const since = new Date(now.getTime() - ms)
  const sinceDate = since.toISOString().split('T')[0]
  const sinceISO = since.toISOString()

  try {
    // Fetch ad spend data
    const spendData = await listFunnels(sinceDate)

    // Fetch funnel event counts
    const steps = ['landing_page_view', 'add_to_cart', 'checkout_initiated', 'checkout_completed']
    const counts = {}
    await Promise.all(steps.map(async (step) => {
      counts[step] = await countEvents(step, sinceISO)
    }))

    // Aggregate spend
    const totalSpend = spendData.reduce((sum, r) => sum + parseFloat(r.ad_spend || 0), 0)
    const totalRevenue = spendData.reduce((sum, r) => sum + parseFloat(r.revenue || 0), 0)
    const totalOrders = counts.checkout_completed || 0

    // Get the most recent cost settings
    const latestCosts = spendData.filter(r => r.cogs_per_unit > 0).pop() || {
      cogs_per_unit: 0, shipping_cost: 0, processing_fee_pct: 2.9, refund_rate_pct: 0,
    }

    const revenue = totalRevenue > 0 ? totalRevenue : 0
    const visitors = counts.landing_page_view || 0

    // Revenue metrics
    const aov = totalOrders > 0 ? revenue / totalOrders : 0
    const rpv = visitors > 0 ? revenue / visitors : 0
    const revenuePerSession = visitors > 0 ? revenue / visitors : 0

    // Ad metrics
    const roas = totalSpend > 0 ? revenue / totalSpend : 0
    const cpa = totalOrders > 0 ? totalSpend / totalOrders : 0
    const cpm = visitors > 0 ? (totalSpend / visitors) * 1000 : 0
    const costPerATC = counts.add_to_cart > 0 ? totalSpend / counts.add_to_cart : 0
    const costPerCheckout = counts.checkout_initiated > 0 ? totalSpend / counts.checkout_initiated : 0
    const costPerPurchase = cpa

    // Funnel economics table
    const funnelEconomics = [
      { step: 'Landing Page', event: 'landing_page_view', count: counts.landing_page_view, cost_per: visitors > 0 ? totalSpend / visitors : 0 },
      { step: 'Add to Cart', event: 'add_to_cart', count: counts.add_to_cart, cost_per: costPerATC },
      { step: 'Checkout', event: 'checkout_initiated', count: counts.checkout_initiated, cost_per: costPerCheckout },
      { step: 'Purchase', event: 'checkout_completed', count: counts.checkout_completed, cost_per: costPerPurchase },
    ]

    for (let i = 0; i < funnelEconomics.length; i++) {
      const prev = i === 0 ? funnelEconomics[0].count : funnelEconomics[i - 1].count
      funnelEconomics[i].conversion_rate = prev > 0 ? (funnelEconomics[i].count / prev) * 100 : 0
    }

    // Contribution margin
    const cogs = parseFloat(latestCosts.cogs_per_unit || 0)
    const shipping = parseFloat(latestCosts.shipping_cost || 0)
    const processingPct = parseFloat(latestCosts.processing_fee_pct || 2.9)
    const refundPct = parseFloat(latestCosts.refund_rate_pct || 0)

    const processingFeePerOrder = aov * (processingPct / 100)
    const grossMargin = aov - cogs - shipping - processingFeePerOrder
    const refundCostPerOrder = aov * (refundPct / 100)
    const contributionMargin = grossMargin - refundCostPerOrder
    const breakEvenCPA = contributionMargin
    const profitPerOrder = contributionMargin - cpa

    // P&L
    const totalCOGS = cogs * totalOrders
    const totalShipping = shipping * totalOrders
    const totalFees = processingFeePerOrder * totalOrders
    const totalRefunds = refundCostPerOrder * totalOrders
    const netProfit = revenue - totalSpend - totalCOGS - totalShipping - totalFees - totalRefunds

    // Trend data (daily)
    const trendData = spendData.map(row => ({
      date: row.date,
      ad_spend: parseFloat(row.ad_spend || 0),
      revenue: parseFloat(row.revenue || 0),
      orders: parseInt(row.orders || 0),
    }))

    return Response.json({
      revenue: { total: revenue, aov, rpv, revenue_per_session: revenuePerSession },
      spend: { total: totalSpend, roas, cpa, cpm, cost_per_atc: costPerATC, cost_per_checkout: costPerCheckout, cost_per_purchase: costPerPurchase },
      funnel_economics: funnelEconomics,
      contribution: { cogs, shipping, processing_fee_pct: processingPct, refund_rate_pct: refundPct, gross_margin: grossMargin, contribution_margin: contributionMargin, break_even_cpa: breakEvenCPA, profit_per_order: profitPerOrder },
      pnl: { revenue, ad_spend: totalSpend, cogs: totalCOGS, shipping: totalShipping, fees: totalFees, refunds: totalRefunds, net_profit: netProfit },
      trends: trendData,
      orders: totalOrders,
      costs: latestCosts,
    }, { headers: CORS_HEADERS })

  } catch (error) {
    console.error('Economics error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
