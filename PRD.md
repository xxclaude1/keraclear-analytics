# KeraClear Analytics — Product Requirements Document

## Product Vision

KeraClear Analytics is a purpose-built analytics and session replay platform for the KeraClear DTC Shopify store. It replaces the need for multiple third-party tools (Google Analytics, Hotjar, Triple Whale, etc.) with a single, self-hosted dashboard that provides real-time visitor monitoring, full session recordings, funnel analytics, and unit economics tracking — all tailored to DTC e-commerce.

### Goals

1. **Full visibility into every visitor journey** — from landing page to purchase or abandonment
2. **Instant access to abandonment recordings** — watch exactly where and why people drop off
3. **Real-time monitoring** — see who's on the site right now and what they're doing
4. **DTC-specific economics** — ROAS, CPA, AOV, contribution margin, break-even analysis in one view
5. **Zero monthly cost** — self-hosted on Netlify/Supabase free tiers, no per-seat or per-session fees
6. **No impact on store performance** — tracking snippet is async, non-blocking, < 15KB

---

## User Personas

### Primary: Store Owner / Operator (You)

- Checks the dashboard multiple times daily, often from mobile
- Needs to quickly see: "How many people are on the site? What's converting? Where are they dropping off?"
- Wants to replay abandonment sessions to diagnose UX issues
- Inputs daily ad spend and needs instant feedback on profitability
- Makes media buying decisions based on funnel economics

---

## Feature Breakdown

### Section 2 — Tracking Snippet & Data Ingestion

#### Features

- **Visitor identification:** First-party cookie with unique visitor ID; new vs returning detection
- **Device detection:** Mobile/desktop, browser, OS, screen resolution
- **Traffic attribution:** Referrer URL, UTM parameters (source, medium, campaign, content, term)
- **Page view tracking:** Every page load with URL, timestamp, and time on page
- **Funnel event tracking:** Automatic detection of key e-commerce events
- **Batched data transmission:** Events queued and sent every 5 seconds via POST
- **Lightweight:** < 15KB gzipped, async loading, no render blocking

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| S2-1 | As a store owner, I want every visitor automatically tracked so I can see all traffic | Visitor ID generated on first visit, persisted in cookie, sent with every event |
| S2-2 | As a store owner, I want UTM parameters captured so I can attribute traffic to ad campaigns | UTM params parsed from URL on landing, stored with visitor record |
| S2-3 | As a store owner, I want funnel events auto-detected so I don't have to manually instrument anything | Add-to-cart, checkout, and purchase events detected automatically from Shopify DOM/URL patterns |
| S2-4 | As a store owner, I want the snippet to not slow down my store | Snippet loads async, defers all network calls, < 15KB gzipped, no blocking resources |
| S2-5 | As a store owner, I want abandonment detected automatically | Cart abandonment (items in cart + leave) and checkout abandonment (reached /checkout + leave) flagged via beforeunload + timeout |

#### Funnel Events Specification

| Event | Detection Method |
|-------|-----------------|
| `landing_page_view` | First page load in a session |
| `vsl_page_view` | Page URL contains `/pages/vsl` or configurable path |
| `sales_page_view` | Page URL contains `/products/` or configurable path |
| `add_to_cart` | Intercept Shopify AJAX cart API (`/cart/add.js`) or form submission to `/cart` |
| `checkout_initiated` | Navigation to `/checkout` or Shopify checkout URL |
| `checkout_completed` | Page URL contains `/thank_you` or `/orders/` confirmation pattern |
| `cart_abandonment` | Visitor had `add_to_cart` event but no `checkout_initiated`, and session ended (beforeunload + 30min timeout) |
| `checkout_abandonment` | Visitor had `checkout_initiated` but no `checkout_completed`, and session ended |

---

### Section 3 — Session Recording

#### Features

- **Full DOM recording** using rrweb: captures mutations, mouse movements, clicks, scrolls, form interactions, page navigations
- **Chunked streaming:** Recording data sent to server in chunks during session (not buffered)
- **Automatic abandonment flagging:** Recordings tagged with abandonment type
- **Session replay player:** rrweb-player with timeline, event markers, speed controls
- **Device-appropriate framing:** Mobile sessions shown in phone frame, desktop in browser frame
- **Metadata sidebar:** Visitor info, device, referrer, UTM, pages visited, duration

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| S3-1 | As a store owner, I want every session recorded so I can replay any visitor's experience | rrweb recording starts on page load, captures full session including navigations |
| S3-2 | As a store owner, I want abandonment recordings auto-flagged | Recordings with cart/checkout abandonment events are tagged and filterable |
| S3-3 | As a store owner, I want a smooth replay experience | Player supports 0.5x/1x/2x/4x speed, timeline scrubber, event markers for clicks/page changes |
| S3-4 | As a store owner, I want to see the session in context | Metadata panel shows device type, location, referrer, UTM, session duration, pages visited |
| S3-5 | As a store owner, I want mobile sessions to look like mobile | Mobile recordings displayed in a phone-frame mockup; desktop in a browser-frame |

---

### Section 4 — Real-Time Visitors Dashboard

#### Features

- **Active visitor count:** Live count of currently active visitors
- **Live visitor list:** Each active visitor with device, current page, referrer, time on site, location, page trail
- **Live activity feed:** Scrolling event stream ("Visitor #X added to cart", "Visitor #Y left checkout")
- **Supabase Realtime:** Push-based updates, no polling
- **Live session view:** Click any active visitor to see near-real-time replay (~5s delay)

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| S4-1 | As a store owner, I want to see how many people are on my site right now | Active visitor count updates in real-time via Supabase subscription |
| S4-2 | As a store owner, I want to see what each visitor is doing | Visitor list shows current page (updates live), device, referrer, time on site |
| S4-3 | As a store owner, I want a live event feed | Activity feed shows events as they happen, auto-scrolls, color-coded by event type |
| S4-4 | As a store owner, I want to watch a visitor live | Clicking an active visitor opens a near-real-time session replay |
| S4-5 | As a store owner, I want to know where visitors are from | GeoIP lookup provides city/country for each visitor |

---

### Section 5 — Analytics Dashboard

#### Features

- **Time period filtering:** 1hr, 6hr, 12hr, 24hr, 7d, 30d, custom range
- **Traffic overview cards:** Unique visitors, sessions, page views, avg session duration, bounce rate, new vs returning
- **Traffic over time:** Line chart with auto-adjusted granularity
- **Traffic sources:** Referrer/UTM breakdown in table and chart
- **Device breakdown:** Mobile vs desktop split
- **Top pages:** Most visited pages with views, avg time, exit rate
- **Geographic breakdown:** Top countries and cities
- **Funnel visualization:** Step-by-step funnel with conversion/drop-off rates, clickable to session list

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| S5-1 | As a store owner, I want to see key traffic metrics at a glance | Overview cards show visitors, sessions, pageviews, duration, bounce rate, new/returning |
| S5-2 | As a store owner, I want to see traffic trends over time | Line chart with auto-granularity (per-minute for 1hr, per-hour for 24hr, per-day for 30d) |
| S5-3 | As a store owner, I want to know where my traffic comes from | Source breakdown by referrer, UTM source/medium/campaign with table + chart |
| S5-4 | As a store owner, I want to see my funnel conversion rates | Visual funnel: Landing → VSL → Sales → ATC → Checkout → Purchase with conversion % between steps |
| S5-5 | As a store owner, I want to see who dropped off at each funnel step | Clicking a funnel step shows the list of sessions that dropped at that point with replay links |
| S5-6 | As a store owner, I want flexible time filtering | All metrics respond to selected time period, including custom date range |

---

### Section 6 — Funnel Economics Dashboard

#### Features

- **Revenue metrics:** Total revenue, AOV, RPV, revenue per session
- **Ad spend input:** Manual daily input or CSV bulk upload
- **Calculated metrics:** ROAS, CPA, CPM, cost per ATC, cost per checkout, cost per purchase
- **Funnel economics table:** Each step with count, conversion rate, cost per action, color-coded drop-offs
- **Contribution margin calculator:** COGS, shipping, processing fees, refund rate inputs → gross margin, contribution margin, break-even CPA, profit per order
- **P&L summary card:** Revenue - Ad Spend - COGS - Shipping - Fees - Refunds = Net Profit
- **Trend charts:** AOV, CPA, ROAS, conversion rate over time

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| S6-1 | As a store owner, I want to see revenue metrics | Total revenue, AOV, RPV, revenue per session displayed as cards |
| S6-2 | As a store owner, I want to input ad spend | Daily spend input field + CSV upload for bulk data (date, platform, spend) |
| S6-3 | As a store owner, I want to see my ROAS and CPA | Calculated from revenue / ad spend (ROAS) and spend / purchases (CPA) |
| S6-4 | As a store owner, I want to see cost per funnel step | Table showing cost per ATC, cost per checkout, cost per purchase based on ad spend |
| S6-5 | As a store owner, I want to know my actual profit per order | Calculator with COGS, shipping, fees, refund rate → contribution margin and break-even CPA |
| S6-6 | As a store owner, I want a simple P&L view | Summary card: Revenue - Spend - COGS - Shipping - Fees - Refunds = Net Profit |
| S6-7 | As a store owner, I want to see economic trends | AOV, CPA, ROAS, conversion rate over time charts with time filtering |

---

### Section 7 — Abandonment Analysis

#### Features

- **Abandonment rates:** Cart and checkout abandonment rates with trends
- **Abandonment session list:** Filterable by type, device, source, date — with one-click replay
- **Exit heatmap:** Pages/steps with highest exit rates
- **Auto-flagged recordings:** Abandonment recordings surfaced at top

#### User Stories

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| S7-1 | As a store owner, I want to see abandonment rates | Cart and checkout abandonment rates displayed as cards with trend sparklines |
| S7-2 | As a store owner, I want to filter abandonment sessions | Filter by: cart vs checkout abandonment, device, traffic source, date range |
| S7-3 | As a store owner, I want to replay abandonment sessions instantly | One-click from session row to full replay, abandonment point marked on timeline |
| S7-4 | As a store owner, I want to see where people leave most | Exit heatmap showing pages with highest exit rates |
| S7-5 | As a store owner, I want abandonment recordings prioritized | Auto-flagged recordings always surfaced at top of the view |

---

## Data Model

### `visitors` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Internal ID |
| `visitor_id` | `text` UNIQUE | Cookie-based visitor identifier |
| `first_seen_at` | `timestamptz` | First visit timestamp |
| `last_seen_at` | `timestamptz` | Most recent activity |
| `device_type` | `text` | `mobile` or `desktop` |
| `browser` | `text` | Browser name |
| `os` | `text` | Operating system |
| `screen_resolution` | `text` | e.g., `1920x1080` |
| `country` | `text` | From GeoIP |
| `city` | `text` | From GeoIP |
| `first_referrer` | `text` | Referrer on first visit |
| `utm_source` | `text` | UTM source |
| `utm_medium` | `text` | UTM medium |
| `utm_campaign` | `text` | UTM campaign |
| `utm_content` | `text` | UTM content |
| `utm_term` | `text` | UTM term |
| `is_active` | `boolean` | Currently on site |
| `total_sessions` | `integer` | Lifetime session count |

### `sessions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Internal ID |
| `visitor_id` | `text` FK | Links to visitors |
| `started_at` | `timestamptz` | Session start |
| `ended_at` | `timestamptz` | Session end (null if active) |
| `duration_seconds` | `integer` | Calculated session duration |
| `device_type` | `text` | Device for this session |
| `referrer` | `text` | Session referrer |
| `utm_source` | `text` | Session UTM source |
| `utm_medium` | `text` | Session UTM medium |
| `utm_campaign` | `text` | Session UTM campaign |
| `landing_page` | `text` | First page URL |
| `exit_page` | `text` | Last page URL |
| `page_count` | `integer` | Pages viewed in session |
| `has_recording` | `boolean` | Whether recording exists |
| `abandonment_type` | `text` | `null`, `cart`, or `checkout` |
| `country` | `text` | GeoIP country |
| `city` | `text` | GeoIP city |
| `ip_hash` | `text` | Hashed IP (privacy) |

### `events` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Internal ID |
| `session_id` | `uuid` FK | Links to sessions |
| `visitor_id` | `text` FK | Links to visitors |
| `event_type` | `text` | Event name (e.g., `page_view`, `add_to_cart`) |
| `event_data` | `jsonb` | Event-specific payload |
| `page_url` | `text` | URL where event occurred |
| `timestamp` | `timestamptz` | When it happened |

### `pageviews` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Internal ID |
| `session_id` | `uuid` FK | Links to sessions |
| `visitor_id` | `text` FK | Links to visitors |
| `page_url` | `text` | Full URL path |
| `page_title` | `text` | Document title |
| `referrer` | `text` | Previous page URL |
| `entered_at` | `timestamptz` | When page was loaded |
| `exited_at` | `timestamptz` | When user left page |
| `time_on_page_seconds` | `integer` | Duration on this page |

### `recordings` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Internal ID |
| `session_id` | `uuid` FK | Links to sessions |
| `visitor_id` | `text` FK | Links to visitors |
| `chunk_index` | `integer` | Ordering of recording chunks |
| `data` | `jsonb` | rrweb event data (compressed) |
| `created_at` | `timestamptz` | When chunk was received |

### `funnels` Table (Ad Spend & Economics)

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Internal ID |
| `date` | `date` | Day |
| `platform` | `text` | Ad platform (e.g., `meta`, `google`, `tiktok`) |
| `ad_spend` | `decimal(10,2)` | Amount spent |
| `revenue` | `decimal(10,2)` | Revenue for the day (auto-calculated or manual) |
| `orders` | `integer` | Number of orders |
| `cogs_per_unit` | `decimal(10,2)` | Cost of goods |
| `shipping_cost` | `decimal(10,2)` | Shipping per order |
| `processing_fee_pct` | `decimal(5,2)` | Payment processing % |
| `refund_rate_pct` | `decimal(5,2)` | Refund rate % |
| `created_at` | `timestamptz` | Record creation time |

---

## API Endpoints (Netlify Functions)

### Data Ingestion

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/.netlify/functions/ingest` | Receives batched events from tracking snippet |
| `POST` | `/.netlify/functions/recordings` | Receives recording chunks |

### Dashboard APIs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/.netlify/functions/api/visitors` | Active visitors list + count |
| `GET` | `/.netlify/functions/api/analytics` | Aggregated analytics with time filtering |
| `GET` | `/.netlify/functions/api/sessions` | Session list with filters and pagination |
| `GET` | `/.netlify/functions/api/sessions/:id` | Single session detail with recording |
| `GET` | `/.netlify/functions/api/funnels` | Funnel step counts and conversion rates |
| `GET` | `/.netlify/functions/api/economics` | Revenue, spend, and economics calculations |
| `POST` | `/.netlify/functions/api/economics` | Submit ad spend data (manual or CSV) |

### Query Parameters (shared across analytics endpoints)

- `period`: `1h`, `6h`, `12h`, `24h`, `7d`, `30d`
- `start`: Custom start date (ISO 8601)
- `end`: Custom end date (ISO 8601)
- `device`: `mobile`, `desktop`
- `source`: UTM source filter
- `abandonment`: `cart`, `checkout`
- `page`: Pagination page number
- `limit`: Results per page (default 50)

---

## Dashboard Views — Wireframe Descriptions

### Live Visitors (Section 4)

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR  │  ┌──────────────────────────────────────────────┐   │
│           │  │  🟢 12 Active Visitors                       │   │
│  Live     │  └──────────────────────────────────────────────┘   │
│  Dashboard│  ┌────────────────────────┐ ┌───────────────────┐   │
│  Sessions │  │  VISITOR LIST           │ │  ACTIVITY FEED    │   │
│  Funnels  │  │  ┌─📱 Visitor #4821   ─┐│ │  4821 added to    │   │
│  Economics│  │  │ /products/bundle    ││ │  cart (3-bottle)  │   │
│  Abandon. │  │  │ Meta Ads · 2m34s   ││ │                   │   │
│           │  │  │ LA, US · 3 pages   ││ │  4819 left        │   │
│           │  │  └────────────────────┘│ │  checkout page    │   │
│           │  │  ┌─🖥 Visitor #4820   ─┐│ │                   │   │
│           │  │  │ /pages/vsl          ││ │  4820 viewing     │   │
│           │  │  │ Google · 5m12s     ││ │  VSL page         │   │
│           │  │  │ NYC, US · 5 pages  ││ │                   │   │
│           │  │  └────────────────────┘│ │  ...              │   │
│           │  └────────────────────────┘ └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Analytics Dashboard (Section 5)

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR  │  [1h] [6h] [12h] [24h] [7d] [30d] [Custom]        │
│           │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│           │  │ 1,247   │ │ 1,891   │ │ 4,523   │ │ 2m 34s  │  │
│           │  │Visitors │ │Sessions │ │Pageviews│ │Avg Dur  │  │
│           │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│           │  ┌─────────┐ ┌───────────────────────────────────┐  │
│           │  │ 34.2%   │ │                                   │  │
│           │  │Bounce   │ │  📈 Traffic Over Time (line chart)│  │
│           │  └─────────┘ │                                   │  │
│           │  ┌─────────┐ └───────────────────────────────────┘  │
│           │  │ 67% New │ ┌──────────────┐ ┌──────────────────┐  │
│           │  │ 33% Ret │ │Traffic Sources│ │Device Breakdown  │  │
│           │  └─────────┘ └──────────────┘ └──────────────────┘  │
│           │  ┌───────────────────────────────────────────────┐   │
│           │  │  FUNNEL: Landing → VSL → Sales → ATC → CO → $│   │
│           │  │  100% ──→ 62% ──→ 41% ──→ 18% ──→ 12% ──→ 8%│   │
│           │  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Funnel Economics (Section 6)

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR  │  [Time Filter Bar]                                  │
│           │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│           │  │ $12,450 │ │ $89.40  │ │ $9.98   │ │ 2.4x    │  │
│           │  │Revenue  │ │  AOV    │ │  RPV    │ │  ROAS   │  │
│           │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│           │  ┌───────────────────────────────────────────────┐   │
│           │  │ FUNNEL ECONOMICS TABLE                        │   │
│           │  │ Step         │ Count │ CVR  │ Cost/Action     │   │
│           │  │ Landing      │ 1,247 │ 100% │ $4.16           │   │
│           │  │ Add to Cart  │  224  │  18% │ $23.17 🟡       │   │
│           │  │ Checkout     │  150  │  12% │ $34.60 🟡       │   │
│           │  │ Purchase     │   99  │   8% │ $52.42 🔴       │   │
│           │  └───────────────────────────────────────────────┘   │
│           │  ┌──────────────────────┐ ┌──────────────────────┐  │
│           │  │ CONTRIBUTION MARGIN  │ │ P&L SUMMARY          │  │
│           │  │ COGS: $12.00        │ │ Revenue:  $12,450     │  │
│           │  │ Ship: $5.50         │ │ Ad Spend: -$5,190     │  │
│           │  │ Proc: 2.9%          │ │ COGS:     -$1,188     │  │
│           │  │ Refund: 3%          │ │ Shipping: -$544       │  │
│           │  │ ─────────────       │ │ Fees:     -$361       │  │
│           │  │ Margin/order: $52   │ │ Refunds:  -$374       │  │
│           │  │ Break-even: $52 CPA │ │ ═════════════════     │  │
│           │  │ Profit/order: -$0.42│ │ Net Profit: $4,793    │  │
│           │  └──────────────────────┘ └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Session Replay (Section 3)

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR  │  ← Back to Sessions                                │
│           │  ┌───────────────────────────────┐ ┌────────────┐   │
│           │  │                               │ │ METADATA   │   │
│           │  │   ┌─────────────────────┐     │ │            │   │
│           │  │   │                     │     │ │ 📱 Mobile  │   │
│           │  │   │   SESSION REPLAY    │     │ │ iOS Safari │   │
│           │  │   │   (rrweb-player)    │     │ │ LA, US     │   │
│           │  │   │                     │     │ │ Meta Ads   │   │
│           │  │   │                     │     │ │ utm: fb_q1 │   │
│           │  │   └─────────────────────┘     │ │            │   │
│           │  │   [0.5x] [1x] [2x] [4x]      │ │ Duration:  │   │
│           │  │   ▶ ──●────────────── 2:34    │ │ 2m 34s     │   │
│           │  │     📄  📄  🛒  ❌            │ │            │   │
│           │  │   (page)(page)(atc)(abandon)  │ │ Pages: 4   │   │
│           │  └───────────────────────────────┘ │ 🔴 Cart    │   │
│           │                                    │ Abandoned   │   │
│           │                                    └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Abandonment Analysis (Section 7)

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR  │  [Time Filter] [Cart ▼] [Device ▼] [Source ▼]      │
│           │  ┌─────────────────┐ ┌─────────────────┐            │
│           │  │ 🔴 72.4%        │ │ 🔴 48.1%        │            │
│           │  │ Cart Abandon    │ │ Checkout Abandon │            │
│           │  │ ↑ 3.2% vs 7d   │ │ ↓ 1.8% vs 7d    │            │
│           │  └─────────────────┘ └─────────────────┘            │
│           │  ┌───────────────────────────────────────────────┐   │
│           │  │ AUTO-FLAGGED RECORDINGS                       │   │
│           │  │ #4821 │ 📱 │ Cart Abandon │ Meta │ 2m34s │ ▶  │   │
│           │  │ #4815 │ 🖥 │ CO Abandon   │ Goog │ 4m12s │ ▶  │   │
│           │  │ #4809 │ 📱 │ Cart Abandon │ Meta │ 1m08s │ ▶  │   │
│           │  └───────────────────────────────────────────────┘   │
│           │  ┌───────────────────────────────────────────────┐   │
│           │  │ EXIT HEATMAP                                  │   │
│           │  │ /products/bundle ████████████████ 34%         │   │
│           │  │ /checkout        ███████████ 22%              │   │
│           │  │ /cart             ████████ 18%                │   │
│           │  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design System

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0f1117` | Main background |
| `--bg-secondary` | `#161822` | Card/panel background |
| `--bg-tertiary` | `#1e2030` | Hover/active states |
| `--border` | `#2a2d3e` | Borders and dividers |
| `--text-primary` | `#f1f5f9` | Primary text |
| `--text-secondary` | `#94a3b8` | Secondary/muted text |
| `--green` | `#22c55e` | Positive metrics, conversions |
| `--red` | `#ef4444` | Drop-offs, abandonment, negative |
| `--blue` | `#3b82f6` | Neutral data, links |
| `--yellow` | `#eab308` | Warnings, caution metrics |
| `--purple` | `#8b5cf6` | Accent, brand |

### Typography

- Font: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', ...`)
- Headings: Semibold, tracking tight
- Body: Regular weight, 14-16px
- Monospace for metrics/numbers: `'JetBrains Mono', 'Fira Code', monospace`

---

## Build Order

1. **Section 1:** Project setup, documentation, schema, Netlify config ← CURRENT
2. **Section 2:** Tracking snippet + serverless ingestion endpoint
3. **Section 3:** Session recording (rrweb) + replay player
4. **Section 4:** Real-time visitors dashboard
5. **Section 5:** Analytics dashboard
6. **Section 6:** Funnel economics dashboard
7. **Section 7:** Abandonment analysis view
