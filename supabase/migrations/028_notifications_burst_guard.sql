-- Protect notifications from burst storms (millions of rows/hour).
-- Strategy:
-- 1) Fast indexes for burst checks and dedupe checks.
-- 2) BEFORE INSERT guard trigger:
--    - Drops inserts when global recent volume is above threshold.
--    - Drops near-duplicate notifications per user within a short window.

create index if not exists idx_notifications_created_at_desc
  on public.notifications (created_at desc);

create index if not exists idx_notifications_user_title_created_desc
  on public.notifications (user_id, title, created_at desc);

create or replace function public.notifications_guard_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Hard safety valve: if there are already too many recent notifications,
  -- temporarily drop new ones to protect database health.
  burst_limit constant integer := 20000;
  burst_window constant interval := interval '10 minutes';

  -- Near-duplicate guard for repeated fan-out events.
  dedupe_window constant interval := interval '15 minutes';
begin
  -- Fast burst check using OFFSET + LIMIT with created_at index.
  if exists (
    select 1
    from public.notifications n
    where n.created_at >= now() - burst_window
    order by n.created_at desc
    offset (burst_limit - 1)
    limit 1
  ) then
    return null;
  end if;

  -- Drop duplicates for same recipient and same content in a short window.
  if exists (
    select 1
    from public.notifications n
    where n.user_id = new.user_id
      and n.title = new.title
      and coalesce(n.body, '') = coalesce(new.body, '')
      and n.created_at >= now() - dedupe_window
    limit 1
  ) then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notifications_guard_before_insert on public.notifications;

create trigger trg_notifications_guard_before_insert
  before insert on public.notifications
  for each row
  execute function public.notifications_guard_before_insert();

