# KeraClear Analytics — Project Documentation

## Overview

KeraClear Analytics is a standalone web application that provides real-time visitor monitoring, session replay with screen recording, a full analytics dashboard, and funnel economics tracking for the KeraClear Shopify DTC store (mykeraclear.com). It connects to the Shopify store via a lightweight JavaScript tracking snippet.

**Zero external dependencies** — everything runs on Netlify + GitHub. No database setup required.

## Tech Stack

| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| Frontend | React (Vite 8) + Tailwind CSS v4 | Fast dev server, instant HMR, utility-first styling |
| Backend | Netlify Functions (serverless) | Zero-ops, auto-scaling, co-located with frontend |
| Data Storage | Netlify Blobs (key-value store) | Built into Netlify, no external DB needed, zero config |
| Session Recording | rrweb (open-source DOM recorder) | Industry-standard DOM mutation recording, loaded from CDN |
| Session Playback | rrweb-player | Official companion player for rrweb recordings |
| Hosting | Netlify | Git-based deploys, serverless functions, global CDN |
| Tracking Snippet | Vanilla JS | Framework-agnostic, ~5KB gzipped, non-blocking |
| Charts | Recharts | React-native charting library, composable |
| Icons | Lucide React | Tree-shakable icon set, consistent style |
| Routing | React Router v7 | Standard React routing solution |

## Folder Structure

```
keraclear-analytics/
├── CLAUDE.md                       # This file — project architecture reference
├── PRD.md                          # Product requirements document
├── netlify.toml                    # Netlify build, redirects & function config
├── vite.config.js                  # Vite build configuration
├── index.html                      # SPA entry point
├── .env.example                    # Environment variable template
├── public/
│   └── snippet/
│       └── keraclear-analytics.js  # Tracking snippet (served as static asset)
├── netlify/
│   └── functions/                  # Serverless API endpoints
│       ├── lib/
│       │   └── db.js              # Netlify Blobs data layer (all CRUD)
│       ├── ingest.js              # Receives tracking data from snippet
│       ├── recordings.js          # Handles session recording chunks
│       ├── api-analytics.js       # Analytics aggregations + abandonment
│       ├── api-sessions.js        # Session list & detail + replay data
│       ├── api-visitors.js        # Active visitors + recent events
│       └── api-economics.js       # Ad spend, costs, funnel economics
├── src/
│   ├── main.jsx                   # App entry point
│   ├── App.jsx                    # Root component with routing
│   ├── index.css                  # Global styles (Tailwind v4 @theme)
│   ├── components/                # Shared UI components
│   │   ├── Layout.jsx             # Dashboard shell (sidebar + main)
│   │   ├── Sidebar.jsx            # Navigation sidebar
│   │   ├── MetricCard.jsx         # Reusable stat card
│   │   ├── TimeFilter.jsx         # Time period selector
│   │   └── FunnelChart.jsx        # Funnel visualization
│   ├── pages/                     # Route-level page components
│   │   ├── Dashboard.jsx          # Analytics overview
│   │   ├── LiveVisitors.jsx       # Real-time visitors (15s polling)
│   │   ├── Sessions.jsx           # Session list with filters
│   │   ├── SessionReplay.jsx      # Individual session player
│   │   ├── Funnels.jsx            # Funnel economics & P&L
│   │   └── Abandonment.jsx        # Abandonment analysis
│   ├── hooks/
│   │   ├── useRealtime.js         # No-op stub (polling replaced realtime)
│   │   └── useTimeFilter.js       # Shared time filter state
│   ├── lib/
│   │   └── constants.js           # App-wide constants
│   └── utils/
│       └── formatters.js          # Number, currency, duration formatters
```

## Data Architecture

All data is stored in **Netlify Blobs** — a key-value store built into Netlify. No external database required.

| Store | Key Pattern | Description |
|-------|------------|-------------|
| `visitors` | `{visitor_id}` | Visitor profiles (device, geo, UTM, session count) |
| `sessions` | `{session_id}` | Session records (pages, duration, abandonment) |
| `events` | `{YYYY-MM-DD}/{timestamp}_{id}` | Timestamped events (date-prefixed for range queries) |
| `pageviews` | `{YYYY-MM-DD}/{timestamp}_{id}` | Page view records (date-prefixed) |
| `recordings` | `{session_id}/{chunk_index}` | rrweb recording chunks |
| `funnels` | `{date}_{platform}` | Daily ad spend & cost data |

## API Endpoints

Frontend pages use `fetch('/api/...')` which redirects to `/.netlify/functions/api-...`:

| Path | Method | Description |
|------|--------|-------------|
| `/api/analytics?section=all&period=24h` | GET | Full analytics dashboard data |
| `/api/analytics?section=abandonment&period=7d` | GET | Abandonment stats, flagged recordings, exit pages |
| `/api/sessions?page=1&limit=25&period=24h` | GET | Paginated session list with filters |
| `/api/sessions?id={id}` | GET | Session detail + events + pageviews + recording |
| `/api/visitors` | GET | Active visitors + recent activity feed |
| `/api/economics?period=30d` | GET | Funnel economics, ROAS, P&L |
| `/api/economics` | POST | Add spend, bulk import, save costs |

Ingest endpoints (called by tracking snippet):
| Path | Method | Description |
|------|--------|-------------|
| `/.netlify/functions/ingest` | POST | Batch event ingestion |
| `/.netlify/functions/recordings` | POST | Recording chunk upload |

## Environment Variables

No environment variables are required! Netlify Blobs works automatically on Netlify.

## Deployment

```bash
npx netlify deploy --prod    # Deploy to production
```

Or push to `main` branch for auto-deploy via Netlify's git integration.

## Development

```bash
npm run dev          # Start Vite dev server (port 5173)
netlify dev          # Start with Netlify Functions (port 8888)
```

## Key Architectural Decisions

1. **Zero external dependencies:** All data stored in Netlify Blobs. No Supabase, no Postgres, no Redis. Just Netlify + GitHub.
2. **Server-side data access:** Frontend pages call API endpoints via fetch(). All data queries happen server-side in Netlify Functions. The snippet never accesses storage directly.
3. **Polling over WebSockets:** Live visitors page polls every 15 seconds. Simple, reliable, no WebSocket infrastructure needed.
4. **Recording chunking:** Session recordings stream in chunks during the session to avoid data loss on tab close.
5. **Dark mode first:** Dashboard designed dark-mode-first (PostHog/Vercel Analytics aesthetic).
6. **Date-prefixed keys:** Events and pageviews use `YYYY-MM-DD/` key prefixes for efficient time-range queries in Netlify Blobs.
