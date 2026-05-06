-- Legacy burst guard targeted public.notifications (indexes + BEFORE INSERT trigger).
-- If that table was dropped in favor of notification_events (030), there is nothing to apply here.
do $body$
begin
  if to_regclass('public.notifications') is null then
    raise notice '029: skip notifications burst guard (public.notifications not present).';
    return;
  end if;

  execute 'create index if not exists idx_notifications_created_at_desc on public.notifications (created_at desc)';
  execute 'create index if not exists idx_notifications_user_title_created_desc on public.notifications (user_id, title, created_at desc)';

  execute $fn$
create or replace function public.notifications_guard_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $tg$
declare
  burst_limit constant integer := 20000;
  burst_window constant interval := interval '10 minutes';
  dedupe_window constant interval := interval '15 minutes';
begin
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
$tg$
  $fn$;

  execute 'drop trigger if exists trg_notifications_guard_before_insert on public.notifications';
  execute 'create trigger trg_notifications_guard_before_insert before insert on public.notifications for each row execute function public.notifications_guard_before_insert()';
end $body$;
