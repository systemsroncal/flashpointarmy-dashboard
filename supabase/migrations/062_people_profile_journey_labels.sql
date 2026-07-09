-- Profile demographics, journey first-visit flags, and human-readable label updates.

-- ---------------------------------------------------------------------------
-- profiles: date of birth + gender (user-editable; nullable)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists gender text;

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles
  add constraint profiles_gender_check
  check (gender is null or gender in ('male', 'female'));

-- ---------------------------------------------------------------------------
-- First-visit / welcome milestones (mission briefing + missions)
-- ---------------------------------------------------------------------------
create table if not exists public.member_journey_milestones (
  user_id uuid primary key references auth.users (id) on delete cascade,
  mission_briefing_welcome_seen_at timestamptz,
  missions_welcome_seen_at timestamptz,
  mission_briefing_started_notified_at timestamptz,
  missions_started_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_journey_milestones enable row level security;

drop policy if exists "member_journey_milestones_select_own" on public.member_journey_milestones;
create policy "member_journey_milestones_select_own"
  on public.member_journey_milestones for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "member_journey_milestones_insert_own" on public.member_journey_milestones;
create policy "member_journey_milestones_insert_own"
  on public.member_journey_milestones for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "member_journey_milestones_update_own" on public.member_journey_milestones;
create policy "member_journey_milestones_update_own"
  on public.member_journey_milestones for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "member_journey_milestones_select_staff" on public.member_journey_milestones;
create policy "member_journey_milestones_select_staff"
  on public.member_journey_milestones for select to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('admin', 'super_admin', 'sub_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Rename feed titles going forward (preserve original column shapes)
-- ---------------------------------------------------------------------------
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
    'Chapter request: ' || new.name,
    nullif(trim(coalesce(new.city, '')), ''),
    nullif(st, ''),
    'location'
  );

  return new;
end;
$$;

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
    'Local leader application',
    coalesce(nullif(trim(chname), ''), 'Chapter'),
    nullif(st, ''),
    'star'
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Notification titles: Chapter request / Local leader application
-- ---------------------------------------------------------------------------
create or replace function public.notify_users_on_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ntitle text;
  nbody text;
  p jsonb;
  lid uuid;
  cid uuid;
  fn text;
  ln text;
  short_name text;
  chname text;
  chap_id uuid;
  gtitle text;
  ch_city text;
  ch_state text;
  ch_name text;
  reg_fn text;
  reg_ln text;
  loc_name text;
  loc_region text;
begin
  p := coalesce(new.payload, '{}'::jsonb);

  ntitle := nullif(trim(p->>'title'), '');
  if ntitle is null then
    ntitle := case new.action
      when 'chapter_created' then 'Chapter request'
      when 'user_registered' then 'New member registered'
      when 'leader_assigned_to_chapter' then 'Local leader application'
      when 'gathering_created' then 'Gathering scheduled'
      when 'location.created' then 'Location created'
      when 'location.updated' then 'Location updated'
      when 'location.deleted' then 'Location deleted'
      when 'local_leader_role_granted' then 'Local leader role granted'
      when 'chapter_approved' then 'Chapter approved'
      when 'certificate_request_submitted' then 'Certificate request'
      else initcap(replace(replace(new.action, '_', ' '), '.', ' · '))
    end;
  end if;

  if ntitle = 'New chapter' then ntitle := 'Chapter request'; end if;
  if ntitle = 'Local leader assigned' then ntitle := 'Local leader application'; end if;

  nbody := nullif(trim(coalesce(p->>'text', p->>'body', p->>'summary', p->>'note', '')), '');
  if nbody is null then
    case new.action
      when 'leader_assigned_to_chapter' then
        lid := null;
        cid := null;
        begin
          if p ? 'leader_user_id' and nullif(trim(p->>'leader_user_id'), '') is not null then
            lid := (trim(p->>'leader_user_id'))::uuid;
          end if;
        exception when others then
          lid := null;
        end;
        begin
          if p ? 'chapter_id' and nullif(trim(p->>'chapter_id'), '') is not null then
            cid := (trim(p->>'chapter_id'))::uuid;
          end if;
        exception when others then
          cid := null;
        end;
        if cid is null and new.entity_id is not null then
          begin
            cid := trim(new.entity_id)::uuid;
          exception when others then
            cid := null;
          end;
        end if;
        fn := null;
        ln := null;
        if lid is not null then
          select pr.first_name, pr.last_name into fn, ln from public.profiles pr where pr.id = lid limit 1;
          if fn is null and ln is null then
            select du.first_name, du.last_name into fn, ln from public.dashboard_users du where du.id = lid limit 1;
          end if;
        end if;
        fn := nullif(trim(coalesce(fn, '')), '');
        ln := nullif(trim(coalesce(ln, '')), '');
        if fn is not null and ln is not null and length(ln) > 0 then
          short_name := fn || ' ' || upper(left(ln, 1)) || '.';
        elsif fn is not null then
          short_name := fn;
        elsif ln is not null then
          short_name := ln;
        else
          short_name := 'A member';
        end if;
        chname := null;
        if cid is not null then
          select c.name into chname from public.chapters c where c.id = cid limit 1;
        end if;
        chname := coalesce(nullif(trim(chname), ''), 'their chapter');
        nbody := short_name || ' submitted a Local leader application for ' || chname || '.';
      when 'chapter_created' then
        ch_name := nullif(trim(p->>'name'), '');
        ch_city := nullif(trim(p->>'city'), '');
        ch_state := nullif(trim(p->>'state'), '');
        if ch_name is not null then
          if ch_city is not null and ch_state is not null then
            nbody := 'Chapter request "' || ch_name || '" was submitted in ' || ch_city || ', ' || ch_state || '.';
          elsif ch_state is not null then
            nbody := 'Chapter request "' || ch_name || '" was submitted (' || ch_state || ').';
          else
            nbody := 'Chapter request "' || ch_name || '" was submitted.';
          end if;
        else
          nbody := 'A chapter request was submitted.';
        end if;
      when 'user_registered' then
        reg_fn := nullif(trim(p->>'first_name'), '');
        reg_ln := nullif(trim(p->>'last_name'), '');
        chap_id := null;
        begin
          if p ? 'primary_chapter_id' and nullif(trim(p->>'primary_chapter_id'), '') is not null then
            chap_id := (trim(p->>'primary_chapter_id'))::uuid;
          end if;
        exception when others then
          chap_id := null;
        end;
        chname := null;
        if chap_id is not null then
          select c.name into chname from public.chapters c where c.id = chap_id limit 1;
        end if;
        chname := nullif(trim(coalesce(chname, '')), '');
        if reg_fn is not null and reg_ln is not null and length(reg_ln) > 0 then
          short_name := reg_fn || ' ' || upper(left(reg_ln, 1)) || '.';
        elsif reg_fn is not null then
          short_name := reg_fn;
        elsif reg_ln is not null then
          short_name := reg_ln;
        else
          short_name := 'A new member';
        end if;
        if chname is not null then
          nbody := short_name || ' registered and joined ' || chname || '.';
        else
          nbody := short_name || ' registered and joined the community.';
        end if;
      when 'gathering_created' then
        gtitle := nullif(trim(p->>'title'), '');
        chap_id := null;
        begin
          if p ? 'chapter_id' and nullif(trim(p->>'chapter_id'), '') is not null then
            chap_id := (trim(p->>'chapter_id'))::uuid;
          end if;
        exception when others then
          chap_id := null;
        end;
        chname := null;
        if chap_id is not null then
          select c.name into chname from public.chapters c where c.id = chap_id limit 1;
        end if;
        chname := coalesce(nullif(trim(chname), ''), 'the chapter');
        if gtitle is not null then
          nbody := 'Gathering "' || gtitle || '" was scheduled for ' || chname || '.';
        else
          nbody := 'A new gathering was scheduled for ' || chname || '.';
        end if;
      when 'location.created' then
        loc_name := nullif(trim(p->>'name'), '');
        loc_region := nullif(trim(p->>'region'), '');
        if loc_name is not null and loc_region is not null then
          nbody := 'Location "' || loc_name || '" (' || loc_region || ') was created.';
        elsif loc_name is not null then
          nbody := 'Location "' || loc_name || '" was created.';
        else
          nbody := 'A new location was created.';
        end if;
      when 'location.updated' then
        loc_name := nullif(trim(p->>'name'), '');
        loc_region := nullif(trim(p->>'region'), '');
        if loc_name is not null and loc_region is not null then
          nbody := 'Location "' || loc_name || '" (' || loc_region || ') was updated.';
        elsif loc_name is not null then
          nbody := 'Location "' || loc_name || '" was updated.';
        else
          nbody := 'A location was updated.';
        end if;
      when 'location.deleted' then
        nbody := 'A location was removed.';
      when 'local_leader_role_granted' then
        lid := null;
        begin
          if new.entity_id is not null and length(trim(new.entity_id)) >= 32 then
            lid := trim(new.entity_id)::uuid;
          end if;
        exception when others then
          lid := null;
        end;
        if lid is null and p ? 'user_id' then
          begin
            lid := (trim(p->>'user_id'))::uuid;
          exception when others then
            lid := null;
          end;
        end if;
        fn := null;
        ln := null;
        if lid is not null then
          select pr.first_name, pr.last_name into fn, ln from public.profiles pr where pr.id = lid limit 1;
          if fn is null and ln is null then
            select du.first_name, du.last_name into fn, ln from public.dashboard_users du where du.id = lid limit 1;
          end if;
        end if;
        fn := nullif(trim(coalesce(fn, '')), '');
        ln := nullif(trim(coalesce(ln, '')), '');
        if fn is not null and ln is not null and length(ln) > 0 then
          short_name := fn || ' ' || upper(left(ln, 1)) || '.';
        elsif fn is not null then
          short_name := fn;
        elsif ln is not null then
          short_name := ln;
        else
          short_name := 'A member';
        end if;
        nbody := short_name || ' was granted the Local Leader role.';
      when 'certificate_request_submitted' then
        nbody := coalesce(
          nullif(trim(p->>'text'), ''),
          'A member submitted an external certificate request.'
        );
      else
        nbody := null;
    end case;
  end if;

  if nbody is null then
    nbody := nullif(trim(p->>'name'), '');
  end if;
  if nbody is not null and nbody = ntitle then
    nbody := null;
  end if;
  if nbody is not null then
    nbody := left(nbody, 400);
  end if;

  insert into public.notification_events (title, body)
  values (
    left(coalesce(ntitle, 'Notification'), 200),
    case when nbody is null or nbody = '' then null else left(nbody, 480) end
  );

  return new;
end;
$$;

-- Remap existing rows for display consistency
update public.notification_events
set title = 'Chapter request'
where title = 'New chapter' or title like 'New chapter:%';

update public.notification_events
set title = 'Local leader application'
where title = 'Local leader assigned';

update public.community_activity
set title = regexp_replace(title, '^New chapter:', 'Chapter request:')
where title like 'New chapter:%';

update public.community_activity
set title = 'Local leader application'
where title = 'Local leader assigned';
