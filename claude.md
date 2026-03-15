# KeraClear Analytics — Project Documentation

## Overview

KeraClear Analytics is a standalone web application that provides real-time visitor monitoring, session replay with screen recording, a full analytics dashboard, and funnel economics tracking for the KeraClear Shopify DTC store. It connects to the Shopify store via a lightweight JavaScript tracking snippet injected into `theme.liquid`.

## Tech Stack

| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| Frontend | React (Vite) + Tailwind CSS | Fast dev server, instant HMR, utility-first styling for rapid UI iteration |
| Backend | Netlify Functions (serverless) | Zero-ops, auto-scaling, co-located with frontend deploy |
| Database | Supabase (Postgres + Realtime) | Managed Postgres with built-in realtime subscriptions for live dashboard updates, row-level security, and a generous free tier |
| Session Recording | rrweb (open-source DOM recorder) | Industry-standard DOM mutation recording library, lightweight, well-maintained |
| Session Playback | rrweb-player | Official companion player for rrweb recordings |
| Hosting | Netlify | Git-based deploys, serverless functions, global CDN |
| Tracking Snippet | Vanilla JS | Must be framework-agnostic, < 15KB gzipped, non-blocking |
| Charts | Recharts | React-native charting library, composable, lightweight |
| Icons | Lucide React | Tree-shakable icon set, consistent style |
| Routing | React Router v7 | Standard React routing solution |
| Date Utils | date-fns | Modular date manipulation, tree-shakable |

## Folder Structure

```
keraclear-analytics/
├── claude.md                    # This file — project architecture reference
├── PRD.md                       # Product requirements document
├── netlify.toml                 # Netlify build & function config
├── vite.config.js               # Vite build configuration
├── index.html                   # SPA entry point
├── .env.example                 # Environment variable template
├── public/
│   └── snippet/
│       └── keraclear-analytics.js  # Tracking snippet (served as static asset)
├── netlify/
│   └── functions/               # Serverless API endpoints
│       ├── ingest.js            # Receives tracking data from snippet
│       ├── recordings.js        # Handles session recording chunks
│       └── api/                 # Dashboard API endpoints
│           ├── visitors.js      # Active visitors queries
│           ├── analytics.js     # Analytics aggregations
│           ├── sessions.js      # Session list & detail
│           ├── funnels.js       # Funnel data queries
│           └── economics.js     # Ad spend & economics data
├── supabase/
│   └── schema.sql               # Database schema & migrations
├── src/
│   ├── main.jsx                 # App entry point
│   ├── App.jsx                  # Root component with routing
│   ├── index.css                # Global styles (Tailwind imports)
│   ├── components/              # Shared UI components
│   │   ├── Layout.jsx           # Dashboard shell (sidebar + topbar)
│   │   ├── Sidebar.jsx          # Navigation sidebar
│   │   ├── MetricCard.jsx       # Reusable stat card
│   │   ├── TimeFilter.jsx       # Time period selector
│   │   ├── FunnelChart.jsx      # Funnel visualization
│   │   └── ...
│   ├── pages/                   # Route-level page components
│   │   ├── Dashboard.jsx        # Analytics overview (Section 5)
│   │   ├── LiveVisitors.jsx     # Real-time visitors (Section 4)
│   │   ├── Sessions.jsx         # Session list & replay (Section 3)
│   │   ├── SessionReplay.jsx    # Individual session player
│   │   ├── Funnels.jsx          # Funnel economics (Section 6)
│   │   └── Abandonment.jsx      # Abandonment analysis (Section 7)
│   ├── hooks/                   # Custom React hooks
│   │   ├── useSupabase.js       # Supabase client singleton
│   │   ├── useRealtime.js       # Realtime subscription hook
│   │   ├── useAnalytics.js      # Analytics data fetching
│   │   └── useTimeFilter.js     # Shared time filter state
│   ├── lib/                     # Core library code
│   │   ├── supabase.js          # Supabase client initialization
│   │   └── constants.js         # App-wide constants
│   └── utils/                   # Utility functions
│       ├── formatters.js        # Number, currency, duration formatters
│       ├── funnel.js            # Funnel calculation helpers
│       └── geo.js               # GeoIP lookup helpers
```

## Naming Conventions

- **Files:** `PascalCase.jsx` for React components, `camelCase.js` for utilities/hooks
- **Components:** PascalCase (e.g., `MetricCard`, `FunnelChart`)
- **Hooks:** `use` prefix, camelCase (e.g., `useRealtime`, `useTimeFilter`)
- **Functions:** Netlify function files use `kebab-case` or `camelCase` — one function per file
- **CSS:** Tailwind utility classes exclusively; no custom CSS files per component
- **Database:** `snake_case` for all table and column names
- **Constants:** `UPPER_SNAKE_CASE` for true constants

## Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only (Netlify Functions)

# GeoIP (free tier)
GEOIP_API_KEY=your-geoip-key  # Optional: for IP geolocation in serverless functions

# App
VITE_APP_URL=https://your-app.netlify.app
```

- `VITE_` prefixed vars are exposed to the frontend (Vite convention).
- Non-prefixed vars are only available in Netlify Functions (server-side).
- Never commit `.env` files. Use `.env.example` as a template.

## Deployment (Netlify)

1. Connect the GitHub repo to Netlify.
2. Build settings are defined in `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. Set environment variables in Netlify dashboard (Site Settings > Environment Variables).
4. Deploy triggers on push to `main` branch.
5. The tracking snippet is served from `https://your-app.netlify.app/snippet/keraclear-analytics.js`.

## Development

```bash
npm run dev          # Start Vite dev server (port 5173)
netlify dev          # Start with Netlify Functions (port 8888) — requires netlify-cli
```

## Key Architectural Decisions

1. **Serverless ingestion:** All tracking data flows through Netlify Functions → Supabase. The snippet never talks to Supabase directly (security + flexibility to transform/validate data server-side).
2. **Supabase Realtime:** The live visitors dashboard subscribes to Supabase Realtime channels rather than polling. This gives sub-second updates with minimal overhead.
3. **Recording chunking:** Session recordings are streamed in chunks during the session (not buffered until end) to avoid data loss if the visitor closes the tab.
4. **Dark mode first:** The dashboard is designed dark-mode-first to match the analytics tool aesthetic (PostHog, Vercel Analytics style).
5. **Section-by-section build:** The project is built incrementally — each section is completed and reviewed before moving to the next.
