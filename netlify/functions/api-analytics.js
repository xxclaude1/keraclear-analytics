import { listSessions, listVisitors, listPageviews, listEvents, countEvents } from './lib/db.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  const url = new URL(req.url)
  const params = url.searchParams
  const section = params.get('section') || 'overview'
  const period = params.get('period') || '24h'
  const now = new Date()
  let since

  if (params.get('start')) {
    since = new Date(params.get('start'))
  } else if (PERIOD_MS[period]) {
    since = new Date(now.getTime() - PERIOD_MS[period])
  } else {
    since = new Date(now.getTime() - 86400000)
  }

  const sinceISO = since.toISOString()

  try {
    if (section === 'overview') return json(await getOverviewData(sinceISO))
    if (section === 'traffic_over_time') return json(await getTrafficOverTimeData(sinceISO, period))
    if (section === 'sources') return json(await getSourcesData(sinceISO))
    if (section === 'devices') return json(await getDevicesData(sinceISO))
    if (section === 'top_pages') return json(await getTopPagesData(sinceISO))
    if (section === 'geo') return json(await getGeoData(sinceISO))
    if (section === 'funnel') return json(await getFunnelData(sinceISO))
    if (section === 'abandonment') return json(await getAbandonmentData(sinceISO))
    if (section === 'all') {
      const [overview, trafficOverTime, sources, devices, topPages, geo, funnel] = await Promise.all([
        getOverviewData(sinceISO),
        getTrafficOverTimeData(sinceISO, period),
        getSourcesData(sinceISO),
        getDevicesData(sinceISO),
        getTopPagesData(sinceISO),
        getGeoData(sinceISO),
        getFunnelData(sinceISO),
      ])
      return json({ overview, traffic_over_time: trafficOverTime, sources, devices, top_pages: topPages, geo, funnel })
    }

    return Response.json({ error: 'Unknown section' }, { status: 400, headers: CORS_HEADERS })
  } catch (error) {
    console.error('Analytics error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}

function json(data) {
  return Response.json(data, { headers: CORS_HEADERS })
}

// ===== DATA FETCHERS =====

async function getOverviewData(sinceISO) {
  const [allSessions, allVisitors, allPageviews] = await Promise.all([
    listSessions((s) => s.started_at >= sinceISO),
    listVisitors((v) => v.last_seen_at >= sinceISO),
    listPageviews((pv) => pv.entered_at >= sinceISO, { sinceDate: sinceISO }),
  ])

  const sessions = allSessions.sessions
  const totalSessions = allSessions.total
  const visitors = allVisitors
  const totalVisitors = visitors.length
  const totalPageviews = allPageviews.length

  const durWithValues = sessions.filter(s => s.duration_seconds > 0)
  const avgDuration = durWithValues.length > 0
    ? Math.round(durWithValues.reduce((sum, s) => sum + s.duration_seconds, 0) / durWithValues.length) : 0

  const bounces = sessions.filter(s => (s.page_count || 0) <= 1).length
  const bounceRate = totalSessions > 0 ? ((bounces / totalSessions) * 100) : 0

  const newVisitors = visitors.filter(v => v.first_seen_at >= sinceISO).length
  const newPct = totalVisitors > 0 ? ((newVisitors / totalVisitors) * 100) : 0

  return {
    total_visitors: totalVisitors,
    total_sessions: totalSessions,
    total_pageviews: totalPageviews,
    avg_duration: avgDuration,
    bounce_rate: parseFloat(bounceRate.toFixed(1)),
    new_visitors: newVisitors,
    returning_visitors: totalVisitors - newVisitors,
    new_pct: parseFloat(newPct.toFixed(1)),
  }
}

async function getTrafficOverTimeData(sinceISO, period) {
  let granularity = 'hour'
  if (period === '1h') granularity = 'minute'
  else if (['6h', '12h', '24h'].includes(period)) granularity = 'hour'
  else granularity = 'day'

  const { sessions } = await listSessions((s) => s.started_at >= sinceISO)

  const buckets = {}
  for (const s of sessions) {
    const d = new Date(s.started_at)
    let key
    if (granularity === 'minute') {
      key = `${pad(d.getHours())}:${pad(d.getMinutes())}`
    } else if (granularity === 'hour') {
      key = `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:00`
    } else {
      key = `${pad(d.getMonth()+1)}/${pad(d.getDate())}`
    }

    if (!buckets[key]) buckets[key] = { time: key, sessions: 0, visitors: new Set() }
    buckets[key].sessions++
    buckets[key].visitors.add(s.visitor_id)
  }

  return Object.values(buckets).map(b => ({
    time: b.time, sessions: b.sessions, visitors: b.visitors.size,
  }))
}

async function getSourcesData(sinceISO) {
  const { sessions } = await listSessions((s) => s.started_at >= sinceISO)

  const sourceMap = {}
  for (const s of sessions) {
    const source = s.utm_source || extractDomain(s.referrer) || 'Direct'
    const medium = s.utm_medium || (s.referrer ? 'referral' : 'none')
    const key = `${source}|${medium}`

    if (!sourceMap[key]) {
      sourceMap[key] = { source, medium, campaign: s.utm_campaign || null, sessions: 0, visitors: new Set() }
    }
    sourceMap[key].sessions++
    sourceMap[key].visitors.add(s.visitor_id)
  }

  return Object.values(sourceMap)
    .map(s => ({ ...s, visitors: s.visitors.size }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 20)
}

async function getDevicesData(sinceISO) {
  const { sessions } = await listSessions((s) => s.started_at >= sinceISO)

  const counts = { mobile: 0, desktop: 0 }
  for (const s of sessions) {
    if (s.device_type === 'mobile') counts.mobile++
    else counts.desktop++
  }
  const total = counts.mobile + counts.desktop
  return {
    mobile: counts.mobile,
    desktop: counts.desktop,
    mobile_pct: total > 0 ? parseFloat(((counts.mobile / total) * 100).toFixed(1)) : 0,
    desktop_pct: total > 0 ? parseFloat(((counts.desktop / total) * 100).toFixed(1)) : 0,
  }
}

async function getTopPagesData(sinceISO) {
  const pageviews = await listPageviews(
    (pv) => pv.entered_at >= sinceISO,
    { sinceDate: sinceISO }
  )

  const pageMap = {}
  for (const p of pageviews) {
    const url = p.page_url || '/'
    if (!pageMap[url]) pageMap[url] = { page_url: url, views: 0, total_time: 0, time_count: 0 }
    pageMap[url].views++
    if (p.time_on_page_seconds) {
      pageMap[url].total_time += p.time_on_page_seconds
      pageMap[url].time_count++
    }
  }

  return Object.values(pageMap)
    .map(p => ({ page_url: p.page_url, views: p.views, avg_time: p.time_count > 0 ? Math.round(p.total_time / p.time_count) : 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20)
}

async function getGeoData(sinceISO) {
  const { sessions } = await listSessions((s) => s.started_at >= sinceISO)

  const countryMap = {}
  const cityMap = {}
  for (const s of sessions) {
    const country = s.country || 'Unknown'
    const city = s.city || 'Unknown'
    countryMap[country] = (countryMap[country] || 0) + 1
    if (city !== 'Unknown') {
      const cityKey = `${city}, ${country}`
      cityMap[cityKey] = (cityMap[cityKey] || 0) + 1
    }
  }

  return {
    countries: Object.entries(countryMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15),
    cities: Object.entries(cityMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15),
  }
}

async function getFunnelData(sinceISO) {
  const steps = ['landing_page_view', 'vsl_page_view', 'sales_page_view', 'add_to_cart', 'checkout_initiated', 'checkout_completed']

  const counts = {}
  await Promise.all(steps.map(async (step) => {
    counts[step] = await countEvents(step, sinceISO)
  }))

  return steps.map((step, i) => {
    const count = counts[step]
    const prevCount = i === 0 ? count : counts[steps[i - 1]]
    const conversionRate = prevCount > 0 ? ((count / prevCount) * 100) : 0
    const overallRate = counts[steps[0]] > 0 ? ((count / counts[steps[0]]) * 100) : 0
    const dropOff = i === 0 ? 0 : prevCount - count

    return {
      step, count,
      conversion_rate: parseFloat(conversionRate.toFixed(1)),
      overall_rate: parseFloat(overallRate.toFixed(1)),
      drop_off: dropOff,
    }
  })
}

async function getAbandonmentData(sinceISO) {
  const periodMs = Date.now() - new Date(sinceISO).getTime()
  const prevSinceISO = new Date(new Date(sinceISO).getTime() - periodMs).toISOString()

  // Get sessions and events counts
  const { sessions: allSessions } = await listSessions((s) => s.started_at >= sinceISO)
  const { sessions: prevSessions } = await listSessions((s) => s.started_at >= prevSinceISO && s.started_at < sinceISO)

  const cartAbandons = allSessions.filter(s => s.abandonment_type === 'cart').length
  const checkoutAbandons = allSessions.filter(s => s.abandonment_type === 'checkout').length
  const prevCartAbandons = prevSessions.filter(s => s.abandonment_type === 'cart').length
  const prevCheckoutAbandons = prevSessions.filter(s => s.abandonment_type === 'checkout').length

  const [totalATC, totalCO] = await Promise.all([
    countEvents('add_to_cart', sinceISO),
    countEvents('checkout_initiated', sinceISO),
  ])

  const cartRate = totalATC > 0 ? (cartAbandons / totalATC) * 100 : 0
  const checkoutRate = totalCO > 0 ? (checkoutAbandons / totalCO) * 100 : 0
  const prevCartRate = totalATC > 0 ? (prevCartAbandons / Math.max(totalATC, 1)) * 100 : 0
  const prevCheckoutRate = totalCO > 0 ? (prevCheckoutAbandons / Math.max(totalCO, 1)) * 100 : 0

  // Flagged recordings
  const flagged = allSessions
    .filter(s => s.abandonment_type && s.has_recording)
    .slice(0, 10)

  // Exit page heatmap
  const exitMap = {}
  for (const s of allSessions.filter(s => s.abandonment_type)) {
    const page = s.exit_page || 'Unknown'
    exitMap[page] = (exitMap[page] || 0) + 1
  }
  const totalExits = Object.values(exitMap).reduce((s, v) => s + v, 0) || 1
  const exitPages = Object.entries(exitMap)
    .map(([page, count]) => ({ page, count, pct: (count / totalExits) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    cart_rate: cartRate,
    checkout_rate: checkoutRate,
    cart_abandons: cartAbandons,
    checkout_abandons: checkoutAbandons,
    cart_trend: cartRate - prevCartRate,
    checkout_trend: checkoutRate - prevCheckoutRate,
    total_atc: totalATC,
    total_co: totalCO,
    flagged_recordings: flagged,
    exit_pages: exitPages,
  }
}

// ===== HELPERS =====

function pad(n) { return n.toString().padStart(2, '0') }

function extractDomain(url) {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') } catch { return null }
}
