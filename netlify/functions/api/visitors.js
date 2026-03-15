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

  try {
    // Get all active visitors
    const { data: activeVisitors, error: visitorsError } = await supabase
      .from('visitors')
      .select('*')
      .eq('is_active', true)
      .order('last_seen_at', { ascending: false })

    if (visitorsError) {
      console.error('Active visitors error:', visitorsError)
      return Response.json(
        { error: 'Failed to fetch visitors' },
        { status: 500, headers: CORS_HEADERS }
      )
    }

    // For each active visitor, get their current session and recent events
    const enrichedVisitors = await Promise.all(
      (activeVisitors || []).map(async (visitor) => {
        // Get current (most recent open) session
        const { data: sessions } = await supabase
          .from('sessions')
          .select('*')
          .eq('visitor_id', visitor.visitor_id)
          .is('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1)

        const currentSession = sessions?.[0] || null

        // Get recent pageviews for this session
        let pageTrail = []
        if (currentSession) {
          const { data: pageviews } = await supabase
            .from('pageviews')
            .select('page_url, entered_at')
            .eq('session_id', currentSession.id)
            .order('entered_at', { ascending: true })

          pageTrail = (pageviews || []).map(p => p.page_url)
        }

        // Get the most recent event to determine current page
        let currentPage = currentSession?.landing_page || '/'
        if (currentSession) {
          const { data: lastPageview } = await supabase
            .from('pageviews')
            .select('page_url')
            .eq('session_id', currentSession.id)
            .order('entered_at', { ascending: false })
            .limit(1)

          if (lastPageview?.[0]) {
            currentPage = lastPageview[0].page_url
          }
        }

        // Calculate time on site
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

    return Response.json({
      count: enrichedVisitors.length,
      visitors: enrichedVisitors,
    }, { headers: CORS_HEADERS })

  } catch (error) {
    console.error('Visitors error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
