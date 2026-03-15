import { supabase } from './lib/supabase.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS })
  }

  let body
  try {
    body = await req.json()
  } catch (e) {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS })
  }

  const {
    visitor_id,
    session_id,
    is_new_session,
    device_type,
    browser,
    os,
    screen_resolution,
    referrer,
    utm,
    events,
  } = body

  if (!visitor_id || !session_id || !events || !Array.isArray(events)) {
    return Response.json({ error: 'Missing required fields' }, { status: 400, headers: CORS_HEADERS })
  }

  try {
    // GeoIP lookup from request headers (Netlify provides these)
    const clientIp = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || ''
    const country = req.headers.get('x-country') || null
    const city = req.headers.get('x-nf-client-connection-city') || null

    // Simple hash of IP for privacy
    const ipHash = clientIp ? await hashString(clientIp) : null

    // ---- UPSERT VISITOR ----
    const { error: visitorError } = await supabase
      .from('visitors')
      .upsert({
        visitor_id,
        last_seen_at: new Date().toISOString(),
        device_type,
        browser,
        os,
        screen_resolution,
        country,
        city,
        first_referrer: referrer || null,
        utm_source: utm?.utm_source || null,
        utm_medium: utm?.utm_medium || null,
        utm_campaign: utm?.utm_campaign || null,
        utm_content: utm?.utm_content || null,
        utm_term: utm?.utm_term || null,
        is_active: true,
      }, {
        onConflict: 'visitor_id',
        ignoreDuplicates: false,
      })

    if (visitorError) {
      console.error('Visitor upsert error:', visitorError)
    }

    // ---- UPSERT SESSION ----
    if (is_new_session) {
      // Increment visitor session count
      await supabase.rpc('increment_visitor_sessions', { vid: visitor_id }).catch(() => {})

      const landingPage = events.find(e => e.event_type === 'page_view')?.event_data?.page_url || null

      const { error: sessionError } = await supabase
        .from('sessions')
        .upsert({
          id: session_id,
          visitor_id,
          started_at: new Date().toISOString(),
          device_type,
          referrer: referrer || null,
          utm_source: utm?.utm_source || null,
          utm_medium: utm?.utm_medium || null,
          utm_campaign: utm?.utm_campaign || null,
          landing_page: landingPage,
          country,
          city,
          ip_hash: ipHash,
          page_count: 0,
        }, {
          onConflict: 'id',
          ignoreDuplicates: true,
        })

      if (sessionError) {
        console.error('Session insert error:', sessionError)
      }
    }

    // ---- PROCESS EVENTS ----
    const eventRows = []
    const pageviewRows = []
    let abandonmentType = null
    let exitPage = null
    let pageCount = 0

    for (const event of events) {
      // Build event row
      eventRows.push({
        session_id,
        visitor_id,
        event_type: event.event_type,
        event_data: event.event_data || {},
        page_url: event.page_url || null,
        timestamp: event.timestamp || new Date().toISOString(),
      })

      // Track pageviews separately
      if (event.event_type === 'page_view') {
        pageCount++
        pageviewRows.push({
          session_id,
          visitor_id,
          page_url: event.event_data?.page_url || event.page_url || '',
          page_title: event.event_data?.page_title || null,
          referrer: event.event_data?.referrer || null,
          entered_at: event.timestamp || new Date().toISOString(),
        })
      }

      // Track page exits (update time on page)
      if (event.event_type === 'page_exit') {
        exitPage = event.event_data?.page_url || event.page_url
        // Update the pageview's exit time
        if (event.event_data?.page_url) {
          await supabase
            .from('pageviews')
            .update({
              exited_at: event.timestamp || new Date().toISOString(),
              time_on_page_seconds: event.event_data?.time_on_page_seconds || null,
            })
            .eq('session_id', session_id)
            .eq('page_url', event.event_data.page_url)
            .is('exited_at', null)
            .catch(() => {})
        }
      }

      // Detect abandonment
      if (event.event_type === 'cart_abandonment') {
        abandonmentType = 'cart'
      } else if (event.event_type === 'checkout_abandonment') {
        abandonmentType = 'checkout'
      }

      // Session end — mark visitor as inactive
      if (event.event_type === 'session_end') {
        await supabase
          .from('visitors')
          .update({ is_active: false })
          .eq('visitor_id', visitor_id)
          .catch(() => {})

        await supabase
          .from('sessions')
          .update({
            ended_at: event.timestamp || new Date().toISOString(),
            exit_page: exitPage || event.page_url,
          })
          .eq('id', session_id)
          .catch(() => {})
      }
    }

    // Batch insert events
    if (eventRows.length > 0) {
      const { error: eventsError } = await supabase
        .from('events')
        .insert(eventRows)

      if (eventsError) {
        console.error('Events insert error:', eventsError)
      }
    }

    // Batch insert pageviews
    if (pageviewRows.length > 0) {
      const { error: pvError } = await supabase
        .from('pageviews')
        .insert(pageviewRows)

      if (pvError) {
        console.error('Pageviews insert error:', pvError)
      }
    }

    // Update session with abandonment type and page count
    const sessionUpdates = {}
    if (abandonmentType) sessionUpdates.abandonment_type = abandonmentType
    if (pageCount > 0) sessionUpdates.page_count = pageCount
    if (exitPage) sessionUpdates.exit_page = exitPage

    if (Object.keys(sessionUpdates).length > 0) {
      await supabase
        .from('sessions')
        .update(sessionUpdates)
        .eq('id', session_id)
        .catch(() => {})
    }

    // Update session duration
    await supabase
      .from('sessions')
      .update({
        duration_seconds: Math.round((Date.now() - new Date(events[0]?.timestamp || Date.now()).getTime()) / 1000),
      })
      .eq('id', session_id)
      .catch(() => {})

    return Response.json(
      { status: 'ok', events_received: events.length },
      { headers: CORS_HEADERS }
    )

  } catch (error) {
    console.error('Ingest error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

// Simple string hash for IP privacy
async function hashString(str) {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)
}
