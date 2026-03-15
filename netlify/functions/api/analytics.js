import { supabase } from '../lib/supabase.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const PERIOD_MS = {
  '1h': 3600000,
  '6h': 21600000,
  '12h': 43200000,
  '24h': 86400000,
  '7d': 604800000,
  '30d': 2592000000,
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const url = new URL(req.url)
  const params = url.searchParams
  const section = params.get('section') || 'overview'

  // Determine time range
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
    if (section === 'overview') {
      return await getOverview(sinceISO)
    } else if (section === 'traffic_over_time') {
      return await getTrafficOverTime(sinceISO, period)
    } else if (section === 'sources') {
      return await getSources(sinceISO)
    } else if (section === 'devices') {
      return await getDevices(sinceISO)
    } else if (section === 'top_pages') {
      return await getTopPages(sinceISO)
    } else if (section === 'geo') {
      return await getGeo(sinceISO)
    } else if (section === 'funnel') {
      return await getFunnel(sinceISO)
    } else if (section === 'all') {
      // Return everything in one call
      const [overview, trafficOverTime, sources, devices, topPages, geo, funnel] = await Promise.all([
        getOverviewData(sinceISO),
        getTrafficOverTimeData(sinceISO, period),
        getSourcesData(sinceISO),
        getDevicesData(sinceISO),
        getTopPagesData(sinceISO),
        getGeoData(sinceISO),
        getFunnelData(sinceISO),
      ])
      return Response.json({
        overview, traffic_over_time: trafficOverTime, sources, devices,
        top_pages: topPages, geo, funnel,
      }, { headers: CORS_HEADERS })
    }

    return Response.json({ error: 'Unknown section' }, { status: 400, headers: CORS_HEADERS })
  } catch (error) {
    console.error('Analytics error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}

// ===== DATA FETCHERS (return raw data) =====

async function getOverviewData(sinceISO) {
  const [sessionsRes, visitorsRes, pageviewsRes] = await Promise.all([
    supabase.from('sessions').select('id, visitor_id, duration_seconds, page_count, started_at', { count: 'exact' }).gte('started_at', sinceISO),
    supabase.from('visitors').select('visitor_id, first_seen_at', { count: 'exact' }).gte('last_seen_at', sinceISO),
    supabase.from('pageviews').select('id', { count: 'exact' }).gte('entered_at', sinceISO),
  ])

  const sessions = sessionsRes.data || []
  const totalSessions = sessionsRes.count || 0
  const totalVisitors = visitorsRes.count || 0
  const totalPageviews = pageviewsRes.count || 0

  // Avg session duration
  const durationsWithValues = sessions.filter(s => s.duration_seconds > 0)
  const avgDuration = durationsWithValues.length > 0
    ? Math.round(durationsWithValues.reduce((sum, s) => sum + s.duration_seconds, 0) / durationsWithValues.length)
    : 0

  // Bounce rate (sessions with only 1 page view)
  const bounceSessions = sessions.filter(s => (s.page_count || 0) <= 1).length
  const bounceRate = totalSessions > 0 ? ((bounceSessions / totalSessions) * 100).toFixed(1) : 0

  // New vs returning
  const visitors = visitorsRes.data || []
  const newVisitors = visitors.filter(v => new Date(v.first_seen_at) >= new Date(sinceISO)).length
  const returningVisitors = totalVisitors - newVisitors
  const newPct = totalVisitors > 0 ? ((newVisitors / totalVisitors) * 100).toFixed(1) : 0

  return {
    total_visitors: totalVisitors,
    total_sessions: totalSessions,
    total_pageviews: totalPageviews,
    avg_duration: avgDuration,
    bounce_rate: parseFloat(bounceRate),
    new_visitors: newVisitors,
    returning_visitors: returningVisitors,
    new_pct: parseFloat(newPct),
  }
}

async function getTrafficOverTimeData(sinceISO, period) {
  // Determine granularity
  let granularity = 'hour'
  if (period === '1h') granularity = 'minute'
  else if (['6h', '12h', '24h'].includes(period)) granularity = 'hour'
  else granularity = 'day'

  const { data: sessions } = await supabase
    .from('sessions')
    .select('started_at, visitor_id')
    .gte('started_at', sinceISO)
    .order('started_at', { ascending: true })

  // Group by time bucket
  const buckets = {}
  for (const s of (sessions || [])) {
    const d = new Date(s.started_at)
    let key
    if (granularity === 'minute') {
      key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    } else if (granularity === 'hour') {
      key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`
    } else {
      key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    }

    if (!buckets[key]) buckets[key] = { time: key, sessions: 0, visitors: new Set() }
    buckets[key].sessions++
    buckets[key].visitors.add(s.visitor_id)
  }

  return Object.values(buckets).map(b => ({
    time: b.time,
    sessions: b.sessions,
    visitors: b.visitors.size,
  }))
}

async function getSourcesData(sinceISO) {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('utm_source, utm_medium, utm_campaign, referrer, visitor_id')
    .gte('started_at', sinceISO)

  const sourceMap = {}
  for (const s of (sessions || [])) {
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
  const { data: sessions } = await supabase
    .from('sessions')
    .select('device_type')
    .gte('started_at', sinceISO)

  const counts = { mobile: 0, desktop: 0 }
  for (const s of (sessions || [])) {
    if (s.device_type === 'mobile') counts.mobile++
    else counts.desktop++
  }
  const total = counts.mobile + counts.desktop
  return {
    mobile: counts.mobile,
    desktop: counts.desktop,
    mobile_pct: total > 0 ? ((counts.mobile / total) * 100).toFixed(1) : 0,
    desktop_pct: total > 0 ? ((counts.desktop / total) * 100).toFixed(1) : 0,
  }
}

async function getTopPagesData(sinceISO) {
  const { data: pageviews } = await supabase
    .from('pageviews')
    .select('page_url, time_on_page_seconds')
    .gte('entered_at', sinceISO)

  const pageMap = {}
  for (const p of (pageviews || [])) {
    const url = p.page_url || '/'
    if (!pageMap[url]) pageMap[url] = { page_url: url, views: 0, total_time: 0, time_count: 0 }
    pageMap[url].views++
    if (p.time_on_page_seconds) {
      pageMap[url].total_time += p.time_on_page_seconds
      pageMap[url].time_count++
    }
  }

  return Object.values(pageMap)
    .map(p => ({
      page_url: p.page_url,
      views: p.views,
      avg_time: p.time_count > 0 ? Math.round(p.total_time / p.time_count) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20)
}

async function getGeoData(sinceISO) {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('country, city')
    .gte('started_at', sinceISO)

  const countryMap = {}
  const cityMap = {}
  for (const s of (sessions || [])) {
    const country = s.country || 'Unknown'
    const city = s.city || 'Unknown'
    countryMap[country] = (countryMap[country] || 0) + 1
    if (city !== 'Unknown') {
      const cityKey = `${city}, ${country}`
      cityMap[cityKey] = (cityMap[cityKey] || 0) + 1
    }
  }

  return {
    countries: Object.entries(countryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    cities: Object.entries(cityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
  }
}

async function getFunnelData(sinceISO) {
  const steps = [
    'landing_page_view',
    'vsl_page_view',
    'sales_page_view',
    'add_to_cart',
    'checkout_initiated',
    'checkout_completed',
  ]

  const counts = {}
  await Promise.all(
    steps.map(async (step) => {
      const { count } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', step)
        .gte('timestamp', sinceISO)
      counts[step] = count || 0
    })
  )

  const result = steps.map((step, i) => {
    const count = counts[step]
    const prevCount = i === 0 ? count : counts[steps[i - 1]]
    const conversionRate = prevCount > 0 ? ((count / prevCount) * 100).toFixed(1) : 0
    const overallRate = counts[steps[0]] > 0 ? ((count / counts[steps[0]]) * 100).toFixed(1) : 0
    const dropOff = i === 0 ? 0 : prevCount - count

    return {
      step,
      count,
      conversion_rate: parseFloat(conversionRate),
      overall_rate: parseFloat(overallRate),
      drop_off: dropOff,
    }
  })

  return result
}

// ===== RESPONSE WRAPPERS =====

async function getOverview(sinceISO) {
  return Response.json(await getOverviewData(sinceISO), { headers: CORS_HEADERS })
}
async function getTrafficOverTime(sinceISO, period) {
  return Response.json(await getTrafficOverTimeData(sinceISO, period), { headers: CORS_HEADERS })
}
async function getSources(sinceISO) {
  return Response.json(await getSourcesData(sinceISO), { headers: CORS_HEADERS })
}
async function getDevices(sinceISO) {
  return Response.json(await getDevicesData(sinceISO), { headers: CORS_HEADERS })
}
async function getTopPages(sinceISO) {
  return Response.json(await getTopPagesData(sinceISO), { headers: CORS_HEADERS })
}
async function getGeo(sinceISO) {
  return Response.json(await getGeoData(sinceISO), { headers: CORS_HEADERS })
}
async function getFunnel(sinceISO) {
  return Response.json(await getFunnelData(sinceISO), { headers: CORS_HEADERS })
}

// ===== HELPERS =====

function pad(n) { return n.toString().padStart(2, '0') }

function extractDomain(url) {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') } catch { return null }
}
