import { supabase } from './lib/supabase.js'

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
    // Insert recording chunk
    const { error: recordingError } = await supabase
      .from('recordings')
      .insert({
        session_id,
        visitor_id,
        chunk_index,
        data,
      })

    if (recordingError) {
      console.error('Recording insert error:', recordingError)
      return Response.json(
        { error: 'Failed to store recording' },
        { status: 500, headers: CORS_HEADERS }
      )
    }

    // Mark session as having a recording
    await supabase
      .from('sessions')
      .update({ has_recording: true })
      .eq('id', session_id)
      .catch(() => {})

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
