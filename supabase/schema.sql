-- KeraClear Analytics — Database Schema
-- Run this in the Supabase SQL Editor to create all tables

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- VISITORS
-- ============================================
create table visitors (
  id uuid default uuid_generate_v4(),
  visitor_id text primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  device_type text,
  browser text,
  os text,
  screen_resolution text,
  country text,
  city text,
  first_referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  is_active boolean not null default false,
  total_sessions integer not null default 0
);

create index idx_visitors_is_active on visitors(is_active) where is_active = true;
create index idx_visitors_last_seen on visitors(last_seen_at desc);
create index idx_visitors_first_seen on visitors(first_seen_at desc);

-- ============================================
-- SESSIONS
-- (id is text because snippet generates string session IDs)
-- ============================================
create table sessions (
  id text primary key,
  visitor_id text not null references visitors(visitor_id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  device_type text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  landing_page text,
  exit_page text,
  page_count integer not null default 0,
  has_recording boolean not null default false,
  abandonment_type text, -- null, 'cart', or 'checkout'
  country text,
  city text,
  ip_hash text
);

create index idx_sessions_visitor_id on sessions(visitor_id);
create index idx_sessions_started_at on sessions(started_at desc);
create index idx_sessions_abandonment on sessions(abandonment_type) where abandonment_type is not null;
create index idx_sessions_device on sessions(device_type);
create index idx_sessions_active on sessions(ended_at) where ended_at is null;

-- ============================================
-- EVENTS
-- ============================================
create table events (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null references sessions(id),
  visitor_id text not null,
  event_type text not null,
  event_data jsonb default '{}',
  page_url text,
  timestamp timestamptz not null default now()
);

create index idx_events_session_id on events(session_id);
create index idx_events_visitor_id on events(visitor_id);
create index idx_events_type on events(event_type);
create index idx_events_timestamp on events(timestamp desc);
create index idx_events_type_timestamp on events(event_type, timestamp desc);

-- ============================================
-- PAGEVIEWS
-- ============================================
create table pageviews (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null references sessions(id),
  visitor_id text not null,
  page_url text not null,
  page_title text,
  referrer text,
  entered_at timestamptz not null default now(),
  exited_at timestamptz,
  time_on_page_seconds integer
);

create index idx_pageviews_session_id on pageviews(session_id);
create index idx_pageviews_visitor_id on pageviews(visitor_id);
create index idx_pageviews_page_url on pageviews(page_url);
create index idx_pageviews_entered_at on pageviews(entered_at desc);

-- ============================================
-- RECORDINGS (rrweb chunks)
-- ============================================
create table recordings (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null references sessions(id),
  visitor_id text not null,
  chunk_index integer not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_recordings_session_id on recordings(session_id);
create index idx_recordings_session_chunk on recordings(session_id, chunk_index);

-- ============================================
-- FUNNELS (Ad Spend & Economics)
-- ============================================
create table funnels (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  platform text not null default 'all',
  ad_spend decimal(10,2) not null default 0,
  revenue decimal(10,2) not null default 0,
  orders integer not null default 0,
  cogs_per_unit decimal(10,2) default 0,
  shipping_cost decimal(10,2) default 0,
  processing_fee_pct decimal(5,2) default 2.9,
  refund_rate_pct decimal(5,2) default 0,
  created_at timestamptz not null default now(),

  unique(date, platform)
);

create index idx_funnels_date on funnels(date desc);
create index idx_funnels_platform on funnels(platform);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Increment visitor session count atomically
create or replace function increment_visitor_sessions(vid text)
returns void as $$
begin
  update visitors
  set total_sessions = total_sessions + 1
  where visitor_id = vid;
end;
$$ language plpgsql;

-- ============================================
-- ENABLE REALTIME
-- ============================================
alter publication supabase_realtime add table visitors;
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table events;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table visitors enable row level security;
alter table sessions enable row level security;
alter table events enable row level security;
alter table pageviews enable row level security;
alter table recordings enable row level security;
alter table funnels enable row level security;

-- Policies: allow all for anon (development — tighten for production)
create policy "Allow all for anon" on visitors for all using (true) with check (true);
create policy "Allow all for anon" on sessions for all using (true) with check (true);
create policy "Allow all for anon" on events for all using (true) with check (true);
create policy "Allow all for anon" on pageviews for all using (true) with check (true);
create policy "Allow all for anon" on recordings for all using (true) with check (true);
create policy "Allow all for anon" on funnels for all using (true) with check (true);
