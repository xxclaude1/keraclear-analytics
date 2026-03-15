import { insertRecording, updateSession } from './lib/db.js'

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
  try {
    body = await req.json()
  } catch (e) {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS })
  }

  const { session_id, visitor_id, chunk_index, data } = body

  if (!session_id || !visitor_id || chunk_index === undefined || !data) {
    return Response.json({ error: 'Missing required fields' }, { status: 400, headers: CORS_HEADERS })
  }

  try {
    await insertRecording(session_id, visitor_id, chunk_index, data)
    try { await updateSession(session_id, { has_recording: true }) } catch {}

    return Response.json(
      { status: 'ok', chunk_index },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('Recordings error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
