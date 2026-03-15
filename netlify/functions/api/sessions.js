import { getSession, listSessions, listEvents, listPageviews, getRecordingChunks, getVisitor } from '../lib/db.js'

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
  const sessionId = params.get('id')

  if (sessionId) {
    return getSessionDetail(sessionId)
  }

  return getSessionList(params)
}

async function getSessionDetail(sessionId) {
  try {
    const session = await getSession(sessionId)
    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404, headers: CORS_HEADERS })
    }

    const [events, pageviews, chunks, visitor] = await Promise.all([
      listEvents((e) => e.session_id === sessionId),
      listPageviews((pv) => pv.session_id === sessionId),
      getRecordingChunks(sessionId),
      getVisitor(session.visitor_id),
    ])

    const recordingEvents = []
    for (const chunk of chunks) {
      if (Array.isArray(chunk.data)) {
        recordingEvents.push(...chunk.data)
      }
    }

    return Response.json({
      session,
      visitor,
      events,
      pageviews,
      recording: recordingEvents,
      has_recording: recordingEvents.length > 0,
    }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Session detail error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}

async function getSessionList(params) {
  try {
    const page = parseInt(params.get('page') || '1')
    const limit = parseInt(params.get('limit') || '50')
    const abandonment = params.get('abandonment')
    const device = params.get('device')
    const source = params.get('source')
    const hasRecording = params.get('has_recording')
    const period = params.get('period')
    const start = params.get('start')
    const end = params.get('end')

    let since = null
    if (period && PERIOD_MS[period]) {
      since = new Date(Date.now() - PERIOD_MS[period]).toISOString()
    } else if (start) {
      since = start
    }

    const filter = (s) => {
      if (since && s.started_at < since) return false
      if (end && s.started_at > end) return false
      if (abandonment === 'cart' && s.abandonment_type !== 'cart') return false
      if (abandonment === 'checkout' && s.abandonment_type !== 'checkout') return false
      if (abandonment === 'any' && !s.abandonment_type) return false
      if (device && s.device_type !== device) return false
      if (source && s.utm_source !== source) return false
      if (hasRecording === 'true' && !s.has_recording) return false
      return true
    }

    const { sessions, total } = await listSessions(filter, { limit, offset: (page - 1) * limit })

    return Response.json({
      sessions,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Session list error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
