-- Rolling 7-day dashboard activity (UTC calendar days): one row per user per day.
-- Data older than the 7th day back from today (UTC) is removed by a daily job.
-- "Online now" uses Supabase Realtime Presence in the app (no extra rows per tick).

create table if not exists public.dashboard_presence_daily (
  user_id uuid not null references public.dashboard_users (id) on delete cascade,
  day_utc date not null,
  last_seen_at timestamptz not null default now(),
  pulse_count integer not null default 1,
  primary key (user_id, day_utc)
);

create index if not exists idx_dashboard_presence_daily_day on public.dashboard_presence_daily (day_utc);

alter table public.dashboard_presence_daily enable row level security;

-- No direct client writes; use RPC below.

drop policy if exists "dashboard_presence_daily admin read" on public.dashboard_presence_daily;
create policy "dashboard_presence_daily admin read" on public.dashboard_presence_daily
  for select to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('super_admin', 'admin')
    )
  );

create or replace function public.dashboard_presence_pulse()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (timezone('utc', now()))::date;
  uid uuid := auth.uid();
begin
  if uid is null then
    return;
  end if;
  insert into public.dashboard_presence_daily (user_id, day_utc, last_seen_at, pulse_count)
  values (uid, d, now(), 1)
  on conflict (user_id, day_utc) do update set
    last_seen_at = excluded.last_seen_at,
    pulse_count = public.dashboard_presence_daily.pulse_count + 1;
end;
$$;

revoke all on function public.dashboard_presence_pulse() from public;
grant execute on function public.dashboard_presence_pulse() to authenticated;

-- Keep last 7 UTC calendar days including today: delete rows strictly before (utc_today - 6 days).
create or replace function public.dashboard_presence_cleanup_old()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff date := (timezone('utc', now()))::date - 6;
  deleted integer;
begin
  delete from public.dashboard_presence_daily
  where day_utc < cutoff;
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

revoke all on function public.dashboard_presence_cleanup_old() from public;

do $cron_setup$
declare
  jid bigint;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice '043: pg_cron not enabled. Enable in Dashboard → Database → Extensions, then re-run this migration or schedule: select public.dashboard_presence_cleanup_old();';
    return;
  end if;

  for jid in select jobid from cron.job where jobname = 'dashboard-presence-cleanup-daily'
  loop
    perform cron.unschedule(jid);
  end loop;

  perform cron.schedule(
    'dashboard-presence-cleanup-daily',
    '15 5 * * *',
    'select public.dashboard_presence_cleanup_old()'
  );

  raise notice '043: pg_cron job dashboard-presence-cleanup-daily scheduled (05:15 UTC daily).';
end
$cron_setup$;
