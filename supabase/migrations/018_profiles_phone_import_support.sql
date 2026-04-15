alter table public.profiles
  add column if not exists phone text;

alter table public.dashboard_users
  add column if not exists phone text;

create index if not exists idx_profiles_phone on public.profiles (phone);
create index if not exists idx_dashboard_users_phone on public.dashboard_users (phone);

create or replace function public.sync_dashboard_users_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fn text;
  ln text;
  combined text;
  disp text;
  chap uuid;
  ph text;
begin
  fn := nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), '');
  ln := nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), '');
  combined := nullif(trim(both ' ' from concat_ws(' ', fn, ln)), '');
  disp := coalesce(combined, split_part(new.email, '@', 1));
  ph := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');

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

  insert into public.dashboard_users (
    id, email, first_name, last_name, display_name, primary_chapter_id, phone, created_at, updated_at
  )
  values (
    new.id,
    new.email,
    fn,
    ln,
    disp,
    chap,
    ph,
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_chapter_id = excluded.primary_chapter_id,
    phone = excluded.phone,
    updated_at = now();

  return new;
end;
$$;

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
  combined := nullif(trim(both ' ' from concat_ws(' ', fn, ln)), '');
  disp := coalesce(combined, split_part(new.email, '@', 1));

  insert into public.profiles (id, first_name, last_name, display_name, primary_chapter_id, phone)
  values (new.id, fn, ln, disp, chap, ph)
  on conflict (id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_chapter_id = excluded.primary_chapter_id,
    phone = excluded.phone;

  select id into rid from public.roles where name = 'member' limit 1;
  if rid is not null then
    insert into public.user_roles (user_id, role_id) values (new.id, rid)
    on conflict (user_id, role_id) do nothing;
  end if;
  return new;
end;
$$;

update public.profiles p
set phone = nullif(trim(coalesce(u.raw_user_meta_data->>'phone', '')), '')
from auth.users u
where p.id = u.id
  and coalesce(p.phone, '') = '';

update public.dashboard_users du
set phone = nullif(trim(coalesce(u.raw_user_meta_data->>'phone', '')), ''),
    updated_at = now()
from auth.users u
where du.id = u.id
  and coalesce(du.phone, '') = '';
