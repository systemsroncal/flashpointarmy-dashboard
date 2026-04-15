-- dashboard_users: mirror first_name, last_name, primary_chapter_id from auth metadata.
-- display_name is always derived server-side from first + last (fallback: email local part).
-- Anonymous signup can list chapters for the registration form.

alter table public.dashboard_users
  add column if not exists first_name text;

alter table public.dashboard_users
  add column if not exists last_name text;

alter table public.dashboard_users
  add column if not exists primary_chapter_id uuid references public.chapters (id) on delete set null;

drop policy if exists "chapters read anon signup" on public.chapters;
create policy "chapters read anon signup" on public.chapters
  for select to anon using (true);

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
begin
  fn := nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), '');
  ln := nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), '');
  combined := nullif(trim(both ' ' from concat_ws(' ', fn, ln)), '');
  disp := coalesce(combined, split_part(new.email, '@', 1));

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
    id, email, first_name, last_name, display_name, primary_chapter_id, created_at, updated_at
  )
  values (
    new.id,
    new.email,
    fn,
    ln,
    disp,
    chap,
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_chapter_id = excluded.primary_chapter_id,
    updated_at = now();

  return new;
end;
$$;

-- Signup profile row: display_name only from first + last (never from client display_name).
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
  disp := coalesce(combined, split_part(new.email, '@', 1));

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

-- Backfill dashboard_users from auth metadata for existing rows.
update public.dashboard_users du
set
  first_name = nullif(trim(coalesce(u.raw_user_meta_data->>'first_name', '')), ''),
  last_name = nullif(trim(coalesce(u.raw_user_meta_data->>'last_name', '')), ''),
  display_name = coalesce(
    nullif(
      trim(both ' ' from concat_ws(
        ' ',
        nullif(trim(coalesce(u.raw_user_meta_data->>'first_name', '')), ''),
        nullif(trim(coalesce(u.raw_user_meta_data->>'last_name', '')), '')
      )),
      ''
    ),
    split_part(u.email, '@', 1)
  ),
  primary_chapter_id = coalesce(
    (
      select c.id
      from public.chapters c
      where u.raw_user_meta_data->>'primary_chapter_id' is not null
        and c.id::text = u.raw_user_meta_data->>'primary_chapter_id'
      limit 1
    ),
    du.primary_chapter_id
  ),
  updated_at = now()
from auth.users u
where du.id = u.id;
