// Placeholder — will be fully implemented in Section 2
export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  return Response.json({ status: 'ok', message: 'Ingest endpoint ready' })
}

export const config = {
  path: '/.netlify/functions/ingest',
}
