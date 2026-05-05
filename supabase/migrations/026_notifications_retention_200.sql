-- Notifications retention per user:
-- - Only rows with created_at within the last 7 days are kept.
-- - Within that window, at most the 200 newest rows (by created_at, then id).
-- So: min(7-day window, 200 newest in that window) — nothing older than 7 days; never more than 200 in the window.
--
-- Rationale: audit → notify inserts one row per dashboard user per event; without retention the table grows without bound.

-- Full-table cleanup (same rules). Used on migrate, scheduled job (027), and can be run manually.
create or replace function public.cleanup_notifications_retention_full()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications n
  where n.id not in (
    select id
    from (
      select
        id,
        row_number() over (
          partition by user_id
          order by created_at desc nulls last, id desc
        ) as rn
      from public.notifications
      where created_at >= now() - interval '7 days'
    ) ranked
    where rn <= 200
  );
end;
$$;

-- Do NOT run bulk DELETE here: ~2GB tables hit Supabase statement_timeout during `db push`.
-- After this migration succeeds, run once in SQL Editor (optionally raise timeout for the session):
--   set statement_timeout = '30min';
--   select public.cleanup_notifications_retention_full();
--   reset statement_timeout;

create or replace function public.trim_notifications_after_insert_stmt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications n
  where n.user_id in (
    select distinct user_id from new_notifications
    where user_id is not null
  )
  and n.id not in (
    select id
    from (
      select
        id,
        row_number() over (
          partition by user_id
          order by created_at desc nulls last, id desc
        ) as rn
      from public.notifications
      where created_at >= now() - interval '7 days'
        and user_id in (
          select distinct user_id from new_notifications
          where user_id is not null
        )
    ) ranked
    where rn <= 200
  );
  return null;
end;
$$;

drop trigger if exists trg_notifications_trim_retention on public.notifications;

create trigger trg_notifications_trim_retention
  after insert on public.notifications
  referencing new table as new_notifications
  for each statement
  execute function public.trim_notifications_after_insert_stmt();
