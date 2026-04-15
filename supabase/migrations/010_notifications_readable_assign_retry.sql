-- Human-readable notification titles/bodies (no raw JSON). Retry visibility for new auth users before role RPC.

-- --- Notifications: use payload.title / payload.text; never dump full JSON
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
begin
  p := coalesce(new.payload, '{}'::jsonb);

  ntitle := nullif(trim(p->>'title'), '');
  if ntitle is null then
    ntitle := case new.action
      when 'chapter_created' then 'New chapter'
      when 'user_registered' then 'New member registered'
      when 'leader_assigned_to_chapter' then 'Local leader assigned'
      when 'gathering_created' then 'Gathering scheduled'
      when 'location.created' then 'Location created'
      when 'location.updated' then 'Location updated'
      when 'location.deleted' then 'Location deleted'
      when 'local_leader_role_granted' then 'Local leader role granted'
      else initcap(replace(replace(new.action, '_', ' '), '.', ' · '))
    end;
  end if;

  nbody := nullif(
    trim(coalesce(p->>'text', p->>'body', p->>'summary', p->>'note', p->>'name', '')),
    ''
  );
  if nbody is not null and nbody = ntitle then
    nbody := null;
  end if;
  if nbody is not null then
    nbody := left(nbody, 400);
  end if;

  if nbody is null and new.entity_type is not null and new.entity_id is not null then
    nbody := left(new.entity_type || ' · ' || left(new.entity_id::text, 40), 200);
  elsif nbody is null and new.entity_type is not null then
    nbody := new.entity_type;
  end if;

  if nbody is not null and nbody = ntitle then
    nbody := null;
  end if;

  insert into public.notifications (user_id, title, body)
  select du.id,
    left(ntitle, 200),
    case
      when nbody is null or nbody = '' then null
      else left(nbody, 480)
    end
  from public.dashboard_users du;

  return new;
end;
$$;

-- --- Invite role RPC: wait briefly until auth.users row is visible (avoids FK race after signUp)
create or replace function public.assign_invited_user_primary_role(p_user_id uuid, p_role_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  is_admin boolean;
  is_local_leader boolean;
  rid uuid;
  attempts int := 0;
  user_visible boolean;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  if p_role_name not in ('member', 'local_leader') then
    raise exception 'invalid role';
  end if;

  select exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = caller and r.name in ('super_admin', 'admin')
  ) into is_admin;

  select exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = caller and r.name = 'local_leader'
  ) into is_local_leader;

  if not is_admin and not is_local_leader then
    raise exception 'not allowed';
  end if;

  if is_local_leader and not is_admin and p_role_name <> 'member' then
    raise exception 'only admins can assign local_leader';
  end if;

  loop
    select exists (select 1 from auth.users u where u.id = p_user_id) into user_visible;
    exit when user_visible or attempts >= 12;
    perform pg_sleep(0.08);
    attempts := attempts + 1;
  end loop;

  if not user_visible then
    raise exception 'New user is not visible yet; please try again in a moment.';
  end if;

  delete from public.user_roles where user_id = p_user_id;

  select id into rid from public.roles where name = p_role_name limit 1;
  if rid is null then
    raise exception 'role not found';
  end if;

  insert into public.user_roles (user_id, role_id) values (p_user_id, rid);
end;
$$;

grant execute on function public.assign_invited_user_primary_role(uuid, text) to authenticated;
