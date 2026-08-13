-- Fix auto-follow for new members / local leaders.
--
-- Bug: handle_new_user (on_auth_user_created) runs BEFORE
-- on_auth_user_sync_dashboard_users (alphabetical trigger order). Inserting
-- into mobilize_user_follows there hits FK follower_id → dashboard_users
-- and either aborts signup or never writes follows.
--
-- Fix: apply auto-follow AFTER a dashboard_users row exists, and never
-- block user creation if follow insert fails.

create or replace function public.apply_mobilize_auto_follow_for_user(p_follower_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  if p_follower_id is null then
    return 0;
  end if;

  if not exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_follower_id
      and r.name in ('member', 'local_leader')
  ) then
    return 0;
  end if;

  insert into public.mobilize_user_follows (follower_id, following_id)
  select p_follower_id, t.user_id
  from public.mobilize_auto_follow_targets t
  where t.user_id <> p_follower_id
    and exists (select 1 from public.dashboard_users d where d.id = t.user_id)
  on conflict (follower_id, following_id) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

comment on function public.apply_mobilize_auto_follow_for_user(uuid) is
  'Make a member/local_leader follow every mobilize_auto_follow_targets user. Idempotent.';

create or replace function public.trg_dashboard_user_auto_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.apply_mobilize_auto_follow_for_user(new.id);
  return new;
exception when others then
  raise warning 'mobilize auto-follow failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_dashboard_user_auto_follow on public.dashboard_users;
create trigger on_dashboard_user_auto_follow
  after insert on public.dashboard_users
  for each row
  execute function public.trg_dashboard_user_auto_follow();

-- Remove the broken follow insert from handle_new_user (keep profile + member role).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
  chap uuid;
  fn text;
  ln text;
  combined text;
  disp text;
  ph text;
  addr_line text;
  city_v text;
  state_v text;
  zip_v text;
begin
  chap := null;
  if (new.raw_user_meta_data->>'primary_chapter_id') is not null then
    begin
      chap := (new.raw_user_meta_data->>'primary_chapter_id')::uuid;
      if not exists (select 1 from public.chapters c where c.id = chap) then
        chap := null;
      end if;
    exception when others then
      chap := null;
    end;
  end if;

  fn := nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), '');
  ln := nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), '');
  ph := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  addr_line := nullif(trim(coalesce(new.raw_user_meta_data->>'address_line', '')), '');
  city_v := nullif(trim(coalesce(new.raw_user_meta_data->>'city', '')), '');
  state_v := nullif(trim(coalesce(new.raw_user_meta_data->>'state', '')), '');
  zip_v := nullif(trim(coalesce(new.raw_user_meta_data->>'zip_code', '')), '');
  combined := nullif(trim(both ' ' from concat_ws(' ', fn, ln)), '');
  disp := coalesce(combined, split_part(new.email, '@', 1));

  insert into public.profiles (
    id, first_name, last_name, display_name, primary_chapter_id, phone,
    address_line, city, state, zip_code
  )
  values (new.id, fn, ln, disp, chap, ph, addr_line, city_v, state_v, zip_v)
  on conflict (id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_chapter_id = excluded.primary_chapter_id,
    phone = excluded.phone,
    address_line = excluded.address_line,
    city = excluded.city,
    state = excluded.state,
    zip_code = excluded.zip_code;

  select id into rid from public.roles where name = 'member' limit 1;
  if rid is not null then
    insert into public.user_roles (user_id, role_id) values (new.id, rid)
    on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;
