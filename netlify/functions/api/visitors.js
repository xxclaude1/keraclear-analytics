import { listVisitors, listSessions, listPageviews, listEvents } from '../lib/db.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    const activeVisitors = await listVisitors((v) => v.is_active === true)
    activeVisitors.sort((a, b) => new Date(b.last_seen_at) - new Date(a.last_seen_at))

    const enrichedVisitors = await Promise.all(
      activeVisitors.map(async (visitor) => {
        const { sessions } = await listSessions(
          (s) => s.visitor_id === visitor.visitor_id && !s.ended_at
        )
        const currentSession = sessions[0] || null

        let pageTrail = []
        let currentPage = currentSession?.landing_page || '/'

        if (currentSession) {
          const pvs = await listPageviews((pv) => pv.session_id === currentSession.id)
          pageTrail = pvs.map(p => p.page_url)
          if (pageTrail.length > 0) {
            currentPage = pageTrail[pageTrail.length - 1]
          }
        }

        const timeOnSite = currentSession
          ? Math.round((Date.now() - new Date(currentSession.started_at).getTime()) / 1000)
          : 0

        return {
          visitor_id: visitor.visitor_id,
          device_type: visitor.device_type,
          browser: visitor.browser,
          os: visitor.os,
          country: visitor.country,
          city: visitor.city,
          referrer: visitor.first_referrer,
          utm_source: visitor.utm_source,
          utm_medium: visitor.utm_medium,
          utm_campaign: visitor.utm_campaign,
          current_page: currentPage,
          time_on_site: timeOnSite,
          page_trail: pageTrail,
          session_id: currentSession?.id || null,
          has_recording: currentSession?.has_recording || false,
          last_seen_at: visitor.last_seen_at,
        }
      })
    )

    // Get recent events for activity feed (last hour, excluding noise)
    const sinceHour = new Date(Date.now() - 3600000).toISOString()
    const recentEvents = await listEvents(
      (e) => !['scroll_depth', 'page_exit', 'session_end', 'click'].includes(e.event_type)
        && e.timestamp >= sinceHour,
      { sinceDate: sinceHour, limit: 50 }
    )

    return Response.json({
      count: enrichedVisitors.length,
      visitors: enrichedVisitors,
      recent_events: recentEvents.map(e => ({
        id: e.id,
        visitor_id: e.visitor_id,
        event_type: e.event_type,
        page_url: e.page_url || e.event_data?.page_url,
        text: e.event_data?.text,
        timestamp: e.timestamp,
      })),
    }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Visitors error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
