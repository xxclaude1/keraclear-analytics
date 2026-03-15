import { supabase } from '../lib/supabase.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const url = new URL(req.url)
  const params = url.searchParams

  // Check if requesting a single session by ID
  const sessionId = params.get('id')

  if (sessionId) {
    return getSessionDetail(sessionId)
  }

  return getSessionList(params)
}

async function getSessionDetail(sessionId) {
  try {
    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return Response.json(
        { error: 'Session not found' },
        { status: 404, headers: CORS_HEADERS }
      )
    }

    // Get events for this session
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    // Get pageviews for this session
    const { data: pageviews } = await supabase
      .from('pageviews')
      .select('*')
      .eq('session_id', sessionId)
      .order('entered_at', { ascending: true })

    // Get recording chunks for this session
    const { data: recordings } = await supabase
      .from('recordings')
      .select('*')
      .eq('session_id', sessionId)
      .order('chunk_index', { ascending: true })

    // Get visitor info
    const { data: visitor } = await supabase
      .from('visitors')
      .select('*')
      .eq('visitor_id', session.visitor_id)
      .single()

    // Flatten recording data into a single events array for rrweb-player
    const recordingEvents = []
    if (recordings) {
      for (const chunk of recordings) {
        if (Array.isArray(chunk.data)) {
          recordingEvents.push(...chunk.data)
        }
      }
    }

    return Response.json({
      session,
      visitor,
      events: events || [],
      pageviews: pageviews || [],
      recording: recordingEvents,
      has_recording: recordingEvents.length > 0,
    }, { headers: CORS_HEADERS })

  } catch (error) {
    console.error('Session detail error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

async function getSessionList(params) {
  try {
    const page = parseInt(params.get('page') || '1')
    const limit = parseInt(params.get('limit') || '50')
    const offset = (page - 1) * limit
    const abandonment = params.get('abandonment')
    const device = params.get('device')
    const source = params.get('source')
    const hasRecording = params.get('has_recording')
    const period = params.get('period')
    const start = params.get('start')
    const end = params.get('end')

    let query = supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filters
    if (abandonment === 'cart') {
      query = query.eq('abandonment_type', 'cart')
    } else if (abandonment === 'checkout') {
      query = query.eq('abandonment_type', 'checkout')
    } else if (abandonment === 'any') {
      query = query.not('abandonment_type', 'is', null)
    }

    if (device) {
      query = query.eq('device_type', device)
    }

    if (source) {
      query = query.eq('utm_source', source)
    }

    if (hasRecording === 'true') {
      query = query.eq('has_recording', true)
    }

    // Time filtering
    if (period) {
      const now = new Date()
      const periodMs = {
        '1h': 3600000,
        '6h': 21600000,
        '12h': 43200000,
        '24h': 86400000,
        '7d': 604800000,
        '30d': 2592000000,
      }
      if (periodMs[period]) {
        const since = new Date(now.getTime() - periodMs[period]).toISOString()
        query = query.gte('started_at', since)
      }
    } else if (start) {
      query = query.gte('started_at', start)
      if (end) {
        query = query.lte('started_at', end)
      }
    }

    const { data: sessions, count, error } = await query

    if (error) {
      console.error('Sessions query error:', error)
      return Response.json(
        { error: 'Failed to fetch sessions' },
        { status: 500, headers: CORS_HEADERS }
      )
    }

    return Response.json({
      sessions: sessions || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    }, { headers: CORS_HEADERS })

  } catch (error) {
    console.error('Session list error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
