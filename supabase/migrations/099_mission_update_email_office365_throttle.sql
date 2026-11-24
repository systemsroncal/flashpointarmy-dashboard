-- Global send counters for Mission Update emails (Microsoft 365 / SMTP rate compliance).

create table if not exists public.mission_update_email_send_counters (
  id boolean primary key default true,
  minute_epoch bigint not null default 0,
  sent_in_minute int not null default 0,
  day_utc date not null default ((now() at time zone 'utc')::date),
  sent_today int not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.mission_update_email_send_counters (id, minute_epoch, day_utc)
values (true, 0, (now() at time zone 'utc')::date)
on conflict (id) do nothing;

alter table public.mission_update_email_send_counters enable row level security;

create or replace function public.claim_mission_update_email_send(
  p_max_per_minute int default 28,
  p_max_per_day int default 10000
)
returns table(allowed boolean, wait_seconds int, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_minute bigint := floor(extract(epoch from v_now) / 60);
  v_day date := (v_now at time zone 'utc')::date;
  v_sent_min int;
  v_sent_day int;
begin
  insert into public.mission_update_email_send_counters (id, minute_epoch, sent_in_minute, day_utc, sent_today)
  values (true, v_minute, 0, v_day, 0)
  on conflict (id) do nothing;

  update public.mission_update_email_send_counters
  set
    sent_in_minute = case when minute_epoch = v_minute then sent_in_minute else 0 end,
    minute_epoch = v_minute,
    sent_today = case when day_utc = v_day then sent_today else 0 end,
    day_utc = v_day,
    updated_at = v_now
  where id = true;

  select sent_in_minute, sent_today
  into v_sent_min, v_sent_day
  from public.mission_update_email_send_counters
  where id = true;

  if p_max_per_day > 0 and v_sent_day >= p_max_per_day then
    return query select false, 3600, 'daily_limit'::text;
    return;
  end if;

  if p_max_per_minute > 0 and v_sent_min >= p_max_per_minute then
    return query select false, greatest(1, 60 - mod(floor(extract(epoch from v_now))::int, 60)), 'minute_limit'::text;
    return;
  end if;

  update public.mission_update_email_send_counters
  set
    sent_in_minute = sent_in_minute + 1,
    sent_today = sent_today + 1,
    updated_at = v_now
  where id = true;

  return query select true, 0, null::text;
end;
$$;

revoke all on function public.claim_mission_update_email_send(int, int) from public;
grant execute on function public.claim_mission_update_email_send(int, int) to service_role;