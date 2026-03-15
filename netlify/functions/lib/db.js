import { getStore } from '@netlify/blobs'

// Store names
const STORES = {
  visitors: 'visitors',
  sessions: 'sessions',
  events: 'events',
  pageviews: 'pageviews',
  recordings: 'recordings',
  funnels: 'funnels',
  active: 'active_visitors',
}

function store(name) {
  return getStore(name)
}

function datePrefix(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function pad(n) {
  return n.toString().padStart(2, '0')
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
}

// ===== VISITORS =====

export async function upsertVisitor(data) {
  const s = store(STORES.visitors)
  let existing = null
  try { existing = await s.get(data.visitor_id, { type: 'json' }) } catch {}

  const record = existing ? {
    ...existing,
    last_seen_at: data.last_seen_at || new Date().toISOString(),
    is_active: data.is_active !== undefined ? data.is_active : existing.is_active,
    device_type: data.device_type || existing.device_type,
    browser: data.browser || existing.browser,
    os: data.os || existing.os,
    screen_resolution: data.screen_resolution || existing.screen_resolution,
    country: data.country || existing.country,
    city: data.city || existing.city,
  } : {
    visitor_id: data.visitor_id,
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    device_type: data.device_type || null,
    browser: data.browser || null,
    os: data.os || null,
    screen_resolution: data.screen_resolution || null,
    country: data.country || null,
    city: data.city || null,
    first_referrer: data.first_referrer || null,
    utm_source: data.utm_source || null,
    utm_medium: data.utm_medium || null,
    utm_campaign: data.utm_campaign || null,
    utm_content: data.utm_content || null,
    utm_term: data.utm_term || null,
    is_active: true,
    total_sessions: 0,
  }

  await s.setJSON(data.visitor_id, record)
  return record
}

export async function getVisitor(visitorId) {
  try { return await store(STORES.visitors).get(visitorId, { type: 'json' }) } catch { return null }
}

export async function setVisitorActive(visitorId, active) {
  const v = await getVisitor(visitorId)
  if (v) {
    v.is_active = active
    v.last_seen_at = new Date().toISOString()
    await store(STORES.visitors).setJSON(visitorId, v)
  }
}

export async function incrementVisitorSessions(visitorId) {
  const v = await getVisitor(visitorId)
  if (v) {
    v.total_sessions = (v.total_sessions || 0) + 1
    await store(STORES.visitors).setJSON(visitorId, v)
  }
}

export async function listVisitors(filter) {
  const s = store(STORES.visitors)
  const { blobs } = await s.list()
  const results = []
  for (const blob of blobs) {
    try {
      const v = await s.get(blob.key, { type: 'json' })
      if (v && (!filter || filter(v))) results.push(v)
    } catch {}
  }
  return results
}

// ===== SESSIONS =====

export async function upsertSession(data) {
  const s = store(STORES.sessions)
  let existing = null
  try { existing = await s.get(data.id, { type: 'json' }) } catch {}

  if (existing) {
    const updated = { ...existing, ...data }
    await s.setJSON(data.id, updated)
    return updated
  } else {
    const record = {
      id: data.id,
      visitor_id: data.visitor_id,
      started_at: data.started_at || new Date().toISOString(),
      ended_at: data.ended_at || null,
      duration_seconds: data.duration_seconds || null,
      device_type: data.device_type || null,
      referrer: data.referrer || null,
      utm_source: data.utm_source || null,
      utm_medium: data.utm_medium || null,
      utm_campaign: data.utm_campaign || null,
      landing_page: data.landing_page || null,
      exit_page: data.exit_page || null,
      page_count: data.page_count || 0,
      has_recording: data.has_recording || false,
      abandonment_type: data.abandonment_type || null,
      country: data.country || null,
      city: data.city || null,
      ip_hash: data.ip_hash || null,
    }
    await s.setJSON(data.id, record)
    return record
  }
}

export async function getSession(sessionId) {
  try { return await store(STORES.sessions).get(sessionId, { type: 'json' }) } catch { return null }
}

export async function updateSession(sessionId, updates) {
  const s = store(STORES.sessions)
  const existing = await getSession(sessionId)
  if (existing) {
    const updated = { ...existing, ...updates }
    await s.setJSON(sessionId, updated)
    return updated
  }
  return null
}

export async function listSessions(filter, opts = {}) {
  const s = store(STORES.sessions)
  const { blobs } = await s.list()
  let results = []
  for (const blob of blobs) {
    try {
      const session = await s.get(blob.key, { type: 'json' })
      if (session && (!filter || filter(session))) results.push(session)
    } catch {}
  }
  // Sort by started_at descending
  results.sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
  if (opts.limit) {
    const offset = opts.offset || 0
    const total = results.length
    results = results.slice(offset, offset + opts.limit)
    return { sessions: results, total }
  }
  return { sessions: results, total: results.length }
}

// ===== EVENTS =====

export async function insertEvents(events) {
  const s = store(STORES.events)
  for (const event of events) {
    const key = `${datePrefix(event.timestamp || new Date())}/${Date.now()}_${genId()}`
    await s.setJSON(key, { ...event, id: key })
  }
}

export async function listEvents(filter, opts = {}) {
  const s = store(STORES.events)
  // List with date prefix filtering for efficiency
  let allBlobs = []
  if (opts.sinceDate) {
    // Collect date prefixes from sinceDate to today
    const start = new Date(opts.sinceDate)
    const end = new Date()
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const prefix = datePrefix(d)
      try {
        const { blobs } = await s.list({ prefix })
        allBlobs.push(...blobs)
      } catch {}
    }
  } else {
    const { blobs } = await s.list()
    allBlobs = blobs
  }

  const results = []
  for (const blob of allBlobs) {
    try {
      const event = await s.get(blob.key, { type: 'json' })
      if (event && (!filter || filter(event))) results.push(event)
    } catch {}
  }
  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  if (opts.limit) results.splice(opts.limit)
  return results
}

export async function countEvents(eventType, sinceISO) {
  const events = await listEvents(
    (e) => e.event_type === eventType && new Date(e.timestamp) >= new Date(sinceISO),
    { sinceDate: sinceISO }
  )
  return events.length
}

// ===== PAGEVIEWS =====

export async function insertPageviews(pageviews) {
  const s = store(STORES.pageviews)
  for (const pv of pageviews) {
    const key = `${datePrefix(pv.entered_at || new Date())}/${Date.now()}_${genId()}`
    await s.setJSON(key, { ...pv, id: key })
  }
}

export async function listPageviews(filter, opts = {}) {
  const s = store(STORES.pageviews)
  let allBlobs = []
  if (opts.sinceDate) {
    const start = new Date(opts.sinceDate)
    const end = new Date()
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      try {
        const { blobs } = await s.list({ prefix: datePrefix(d) })
        allBlobs.push(...blobs)
      } catch {}
    }
  } else {
    const { blobs } = await s.list()
    allBlobs = blobs
  }

  const results = []
  for (const blob of allBlobs) {
    try {
      const pv = await s.get(blob.key, { type: 'json' })
      if (pv && (!filter || filter(pv))) results.push(pv)
    } catch {}
  }
  results.sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at))
  return results
}

export async function updatePageviewExit(sessionId, pageUrl, exitData) {
  const pvs = await listPageviews(
    (pv) => pv.session_id === sessionId && pv.page_url === pageUrl && !pv.exited_at
  )
  if (pvs.length > 0) {
    const pv = pvs[pvs.length - 1]
    const updated = { ...pv, ...exitData }
    await store(STORES.pageviews).setJSON(pv.id, updated)
  }
}

// ===== RECORDINGS =====

export async function insertRecording(sessionId, visitorId, chunkIndex, data) {
  const s = store(STORES.recordings)
  const key = `${sessionId}/${String(chunkIndex).padStart(6, '0')}`
  await s.setJSON(key, { session_id: sessionId, visitor_id: visitorId, chunk_index: chunkIndex, data, created_at: new Date().toISOString() })
}

export async function getRecordingChunks(sessionId) {
  const s = store(STORES.recordings)
  const { blobs } = await s.list({ prefix: `${sessionId}/` })
  const chunks = []
  for (const blob of blobs) {
    try {
      const chunk = await s.get(blob.key, { type: 'json' })
      if (chunk) chunks.push(chunk)
    } catch {}
  }
  chunks.sort((a, b) => a.chunk_index - b.chunk_index)
  return chunks
}

// ===== FUNNELS (Ad Spend) =====

export async function upsertFunnel(data) {
  const s = store(STORES.funnels)
  const key = `${data.date}_${data.platform || 'all'}`
  let existing = null
  try { existing = await s.get(key, { type: 'json' }) } catch {}

  const record = existing
    ? { ...existing, ...data }
    : { id: key, date: data.date, platform: data.platform || 'all', ad_spend: 0, revenue: 0, orders: 0, cogs_per_unit: 0, shipping_cost: 0, processing_fee_pct: 2.9, refund_rate_pct: 0, ...data }

  await s.setJSON(key, record)
  return record
}

export async function listFunnels(sinceDate) {
  const s = store(STORES.funnels)
  const { blobs } = await s.list()
  const results = []
  for (const blob of blobs) {
    try {
      const f = await s.get(blob.key, { type: 'json' })
      if (f && (!sinceDate || f.date >= sinceDate)) results.push(f)
    } catch {}
  }
  results.sort((a, b) => a.date.localeCompare(b.date))
  return results
}
