// Placeholder — will be fully implemented in Section 3
export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  return Response.json({ status: 'ok', message: 'Recordings endpoint ready' })
}

export const config = {
  path: '/.netlify/functions/recordings',
}
