-- Scheduled cleanup: same rules as 026 (last 200 rows within rolling 7 days, per user).
-- Runs every 3 calendar days starting 2026-05-04. A daily job at 07:00 UTC checks the date and only then runs.
--
-- pg_cron: enable in Supabase Dashboard → Database → Extensions → "pg_cron", then re-run this migration
-- or execute the DO block below manually in SQL Editor once.

create or replace function public.cleanup_notifications_retention_scheduled()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  anchor constant date := date '2026-05-04';
begin
  if current_date < anchor then
    return;
  end if;
  if (current_date - anchor) % 3 <> 0 then
    return;
  end if;
  perform public.cleanup_notifications_retention_full();
end;
$$;

do $cron_setup$
declare
  jid bigint;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice '027: Extension pg_cron is not enabled. Dashboard → Database → Extensions → enable pg_cron, then re-apply this migration or run the cron.schedule(...) statement from comments.';
    return;
  end if;

  for jid in select jobid from cron.job where jobname = 'notifications-retention-every-3-days'
  loop
    perform cron.unschedule(jid);
  end loop;

  perform cron.schedule(
    'notifications-retention-every-3-days',
    '0 7 * * *',
    'select public.cleanup_notifications_retention_scheduled()'
  );

  raise notice '027: pg_cron job notifications-retention-every-3-days scheduled (daily check; runs cleanup every 3 days from 2026-05-04).';
end
$cron_setup$;
