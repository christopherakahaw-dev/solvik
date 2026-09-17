-- Commuter reports.
--
-- Two rules shape this table. Only the service role writes, so a report cannot
-- reach the database without passing triage in api/report.js — a client with a
-- valid JWT still cannot insert one directly. And no photo is stored: the image
-- is checked and discarded, so what persists is the verdict, not the picture.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  station_code text not null,
  station_name text not null default '',
  lat double precision not null,
  lng double precision not null,
  triage jsonb not null default '{}'::jsonb,
  verdict text not null default 'accepted' check (verdict in ('accepted', 'rejected')),
  -- Points are provisional until someone else reports the same thing, or LTA's
  -- own feed catches up. Paying on submission alone pays for spam.
  points_state text not null default 'pending' check (points_state in ('pending', 'confirmed', 'lapsed')),
  points integer not null default 0,
  created_at timestamptz not null default now(),
  -- "4 commuters reported this" has to mean 4 reports that are still current.
  expires_at timestamptz not null default now() + interval '30 minutes'
);

create index if not exists reports_current_idx on public.reports (station_code, kind, expires_at);
create index if not exists reports_reporter_idx on public.reports (reporter, created_at);

alter table public.reports enable row level security;

revoke all on table public.reports from anon, authenticated;
-- Read only, and never the reporter column: a per-person id would let anyone
-- follow one commuter's reports from station to station, which is exactly the
-- movement trace the rest of the app refuses to keep. Policies may still test
-- `reporter` even though the role cannot select it.
grant select (id, kind, station_code, station_name, lat, lng, verdict, points, points_state, created_at, expires_at)
  on table public.reports to authenticated;

-- Current reports are readable by any signed-in commuter: being seen is the
-- entire point of filing one. Expired and rejected rows are not.
create policy "reports_select_current" on public.reports
  for select to authenticated
  using (expires_at > now() and verdict = 'accepted');

-- Your own reports stay readable after they expire, so the wallet can show what
-- is still pending and what was corroborated.
create policy "reports_select_own" on public.reports
  for select to authenticated
  using ((select auth.uid()) = reporter);

-- Counts and tallies without identities. Other commuters learn that four people
-- reported a lift at Bishan, never which four.
create or replace view public.report_groups
with (security_invoker = true) as
  select
    station_code,
    max(station_name) as station_name,
    kind,
    count(*)::int as reports,
    -- Distinct people, not submissions: one commuter filing four times is one
    -- commuter, and counting submissions is how a rewards scheme gets farmed.
    count(distinct reporter)::int as people,
    avg(lat) as lat,
    avg(lng) as lng,
    max(created_at) as last_at
  from public.reports
  where expires_at > now() and verdict = 'accepted'
  group by station_code, kind;

grant select on public.report_groups to authenticated;
