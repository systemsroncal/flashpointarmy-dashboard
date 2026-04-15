-- Legacy: rename volunteer -> member (no-op if 001+ already seeds "member")
update public.roles
set name = 'member', description = 'Member'
where name = 'volunteer';

alter table public.profiles
  add column if not exists first_name text;

alter table public.profiles
  add column if not exists last_name text;

-- New users: names from auth metadata, default role member, optional chapter from signup metadata
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
  disp text;
  combined text;
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
  combined := nullif(trim(both ' ' from concat_ws(' ', fn, ln)), '');

  disp := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');
  if disp is null or disp = '' then
    disp := coalesce(combined, split_part(new.email, '@', 1));
  end if;

  insert into public.profiles (id, first_name, last_name, display_name, primary_chapter_id)
  values (new.id, fn, ln, disp, chap);

  select id into rid from public.roles where name = 'member' limit 1;
  if rid is not null then
    insert into public.user_roles (user_id, role_id) values (new.id, rid)
    on conflict (user_id, role_id) do nothing;
  end if;
  return new;
end;
$$;

-- Broader read on user_roles for dashboard lists (leaders/community); self still covered
drop policy if exists "user_roles read self" on public.user_roles;
create policy "user_roles read authenticated" on public.user_roles
  for select to authenticated using (true);

-- Replace single role for invited users (after signUp). Caller must be admin/super_admin, or local_leader (member only).
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

  delete from public.user_roles where user_id = p_user_id;

  select id into rid from public.roles where name = p_role_name limit 1;
  if rid is null then
    raise exception 'role not found';
  end if;

  insert into public.user_roles (user_id, role_id) values (p_user_id, rid);
end;
$$;

grant execute on function public.assign_invited_user_primary_role(uuid, text) to authenticated;

-- local_leader can create rows in Leaders module (invite leaders)
update public.role_permissions rp
set can_create = true
from public.roles r, public.modules m
where rp.role_id = r.id and rp.module_id = m.id
  and r.name = 'local_leader' and m.slug = 'leaders';
