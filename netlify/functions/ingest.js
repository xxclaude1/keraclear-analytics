import { upsertVisitor, setVisitorActive, incrementVisitorSessions, upsertSession, updateSession, insertEvents, insertPageviews, updatePageviewExit } from './lib/db.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS })
  }

  let body
  try { body = await req.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS })
  }

  const { visitor_id, session_id, is_new_session, device_type, browser, os, screen_resolution, referrer, utm, events } = body

  if (!visitor_id || !session_id || !events || !Array.isArray(events)) {
    return Response.json({ error: 'Missing required fields' }, { status: 400, headers: CORS_HEADERS })
  }

  try {
    const country = req.headers.get('x-country') || null
    const city = req.headers.get('x-nf-client-connection-city') || null
    const clientIp = req.headers.get('x-nf-client-connection-ip') || ''
    const ipHash = clientIp ? await hashString(clientIp) : null

    // Upsert visitor
    await upsertVisitor({
      visitor_id, device_type, browser, os, screen_resolution, country, city,
      first_referrer: referrer || null,
      utm_source: utm?.utm_source || null,
      utm_medium: utm?.utm_medium || null,
      utm_campaign: utm?.utm_campaign || null,
      utm_content: utm?.utm_content || null,
      utm_term: utm?.utm_term || null,
      is_active: true,
      last_seen_at: new Date().toISOString(),
    })

    // Create session if new
    if (is_new_session) {
      await incrementVisitorSessions(visitor_id)
      const landingPage = events.find(e => e.event_type === 'page_view')?.event_data?.page_url || null
      await upsertSession({
        id: session_id, visitor_id, started_at: new Date().toISOString(),
        device_type, referrer: referrer || null,
        utm_source: utm?.utm_source || null, utm_medium: utm?.utm_medium || null,
        utm_campaign: utm?.utm_campaign || null, landing_page: landingPage,
        country, city, ip_hash: ipHash, page_count: 0,
      })
    }

    // Process events
    const eventRows = []
    const pageviewRows = []
    let abandonmentType = null
    let exitPage = null
    let pageCount = 0

    for (const event of events) {
      eventRows.push({
        session_id, visitor_id,
        event_type: event.event_type,
        event_data: event.event_data || {},
        page_url: event.page_url || null,
        timestamp: event.timestamp || new Date().toISOString(),
      })

      if (event.event_type === 'page_view') {
        pageCount++
        pageviewRows.push({
          session_id, visitor_id,
          page_url: event.event_data?.page_url || event.page_url || '',
          page_title: event.event_data?.page_title || null,
          referrer: event.event_data?.referrer || null,
          entered_at: event.timestamp || new Date().toISOString(),
        })
      }

      if (event.event_type === 'page_exit') {
        exitPage = event.event_data?.page_url || event.page_url
        if (event.event_data?.page_url) {
          await updatePageviewExit(session_id, event.event_data.page_url, {
            exited_at: event.timestamp || new Date().toISOString(),
            time_on_page_seconds: event.event_data?.time_on_page_seconds || null,
          })
        }
      }

      if (event.event_type === 'cart_abandonment') abandonmentType = 'cart'
      if (event.event_type === 'checkout_abandonment') abandonmentType = 'checkout'

      if (event.event_type === 'session_end') {
        await setVisitorActive(visitor_id, false)
        await updateSession(session_id, {
          ended_at: event.timestamp || new Date().toISOString(),
          exit_page: exitPage || event.page_url,
        })
      }
    }

    // Batch insert
    if (eventRows.length > 0) await insertEvents(eventRows)
    if (pageviewRows.length > 0) await insertPageviews(pageviewRows)

    // Update session
    const sessionUpdates = {}
    if (abandonmentType) sessionUpdates.abandonment_type = abandonmentType
    if (pageCount > 0) sessionUpdates.page_count = pageCount
    if (exitPage) sessionUpdates.exit_page = exitPage
    if (Object.keys(sessionUpdates).length > 0) {
      await updateSession(session_id, sessionUpdates)
    }

    return Response.json({ status: 'ok', events_received: events.length }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Ingest error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}

async function hashString(str) {
  const data = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)
}
