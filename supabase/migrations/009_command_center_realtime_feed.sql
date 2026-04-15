-- Command center: Supabase Realtime tables, audit → notifications, auto feed rows.

-- --- Realtime (Dashboard → Database → Replication; run in Supabase SQL if publication differs)
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.community_activity;
alter publication supabase_realtime add table public.chapters;
alter publication supabase_realtime add table public.gatherings;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.user_roles;
alter publication supabase_realtime add table public.chapter_leaders;
alter publication supabase_realtime add table public.audit_logs;

-- --- One notification per dashboard user on each new audit row
create or replace function public.notify_users_on_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  body_text text;
begin
  body_text := new.action;
  if new.entity_type is not null then
    body_text := body_text || ' · ' || new.entity_type;
  end if;
  if new.entity_id is not null then
    body_text := body_text || ' #' || left(new.entity_id, 36);
  end if;
  if new.payload is not null and new.payload <> '{}'::jsonb then
    body_text := left(body_text || ' · ' || new.payload::text, 480);
  end if;

  insert into public.notifications (user_id, title, body)
  select du.id, new.action, body_text
  from public.dashboard_users du;

  return new;
end;
$$;

drop trigger if exists trg_audit_logs_notify on public.audit_logs;
create trigger trg_audit_logs_notify
  after insert on public.audit_logs
  for each row
  execute function public.notify_users_on_audit_log();

-- --- New chapter → audit + community feed (Happening Now)
create or replace function public.trg_chapter_created_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  st text;
begin
  st := upper(trim(new.state));
  if length(st) > 2 then
    st := left(st, 2);
  end if;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, payload)
  values (
    new.created_by,
    'chapter_created',
    'chapter',
    new.id::text,
    jsonb_build_object(
      'name', new.name,
      'state', new.state,
      'city', new.city,
      'status', new.status
    )
  );

  insert into public.community_activity (feed_category, title, subtitle, state_code, icon_key)
  values (
    'chapter',
    'New chapter: ' || new.name,
    nullif(trim(coalesce(new.city, '')), ''),
    nullif(st, ''),
    'location'
  );

  return new;
end;
$$;

drop trigger if exists trg_chapters_created_feed on public.chapters;
create trigger trg_chapters_created_feed
  after insert on public.chapters
  for each row
  execute function public.trg_chapter_created_feed();

-- --- Chapter leader link → audit + feed
create or replace function public.trg_chapter_leader_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chname text;
  st text;
begin
  select c.name, upper(trim(c.state))
  into chname, st
  from public.chapters c
  where c.id = new.chapter_id;

  if st is not null and length(st) > 2 then
    st := left(st, 2);
  end if;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, payload)
  values (
    new.user_id,
    'leader_assigned_to_chapter',
    'chapter_leader',
    new.chapter_id::text,
    jsonb_build_object('chapter_id', new.chapter_id, 'leader_user_id', new.user_id)
  );

  insert into public.community_activity (feed_category, title, subtitle, state_code, icon_key)
  values (
    'leadership',
    'Local leader assigned',
    coalesce(nullif(trim(chname), ''), 'Chapter'),
    nullif(st, ''),
    'star'
  );

  return new;
end;
$$;

drop trigger if exists trg_chapter_leaders_feed on public.chapter_leaders;
create trigger trg_chapter_leaders_feed
  after insert on public.chapter_leaders
  for each row
  execute function public.trg_chapter_leader_feed();

-- --- New profile (signup) → audit + feed
create or replace function public.trg_profile_created_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  st text;
  full_name text;
begin
  st := null;
  if new.primary_chapter_id is not null then
    select upper(trim(c.state))
    into st
    from public.chapters c
    where c.id = new.primary_chapter_id;
    if st is not null and length(st) > 2 then
      st := left(st, 2);
    end if;
  end if;

  full_name := trim(both ' ' from concat_ws(' ', new.first_name, new.last_name));
  if full_name = '' then
    full_name := coalesce(new.display_name, 'New member');
  end if;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, payload)
  values (
    new.id,
    'user_registered',
    'profile',
    new.id::text,
    jsonb_build_object(
      'first_name', new.first_name,
      'last_name', new.last_name,
      'primary_chapter_id', new.primary_chapter_id
    )
  );

  insert into public.community_activity (feed_category, title, subtitle, state_code, icon_key)
  values (
    'member',
    'New member registered',
    nullif(full_name, ''),
    nullif(st, ''),
    'person'
  );

  return new;
end;
$$;

drop trigger if exists trg_profiles_created_feed on public.profiles;
create trigger trg_profiles_created_feed
  after insert on public.profiles
  for each row
  execute function public.trg_profile_created_feed();

-- --- New gathering → audit + feed
create or replace function public.trg_gathering_created_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  st text;
begin
  st := null;
  if new.chapter_id is not null then
    select upper(trim(c.state))
    into st
    from public.chapters c
    where c.id = new.chapter_id;
    if st is not null and length(st) > 2 then
      st := left(st, 2);
    end if;
  end if;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, payload)
  values (
    new.created_by,
    'gathering_created',
    'gathering',
    new.id::text,
    jsonb_build_object('title', new.title, 'chapter_id', new.chapter_id)
  );

  insert into public.community_activity (feed_category, title, subtitle, state_code, icon_key)
  values (
    'gathering',
    'Gathering scheduled',
    new.title,
    nullif(st, ''),
    'calendar'
  );

  return new;
end;
$$;

drop trigger if exists trg_gatherings_created_feed on public.gatherings;
create trigger trg_gatherings_created_feed
  after insert on public.gatherings
  for each row
  execute function public.trg_gathering_created_feed();
