-- Auto-follow whitelist for mobilize social.
--
-- Super admins manage this list from /dashboard/mobilize/settings → Auto-follow.
-- When a NEW dashboard user is created (auth.users trigger), they automatically
-- follow every user on this whitelist (mobilize_user_follows).
--
-- Run from Supabase SQL Editor (service role bypasses RLS) or as a migration.
-- Safe to run multiple times.

-- ---------------------------------------------------------------------------
-- Whitelist table
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_auto_follow_targets (
  user_id uuid primary key references public.dashboard_users (id) on delete cascade,
  created_by uuid references public.dashboard_users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.mobilize_auto_follow_targets is
  'Users that new dashboard users automatically follow. Managed in Mobilize settings.';

alter table public.mobilize_auto_follow_targets enable row level security;

-- Reads are open to authenticated (writes go through service-role APIs only).
drop policy if exists "mobilize_auto_follow_targets select authenticated" on public.mobilize_auto_follow_targets;
create policy "mobilize_auto_follow_targets select authenticated" on public.mobilize_auto_follow_targets
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- handle_new_user: also auto-follow whitelisted targets on signup
-- ---------------------------------------------------------------------------
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

  -- Auto-follow: new user follows every whitelisted target (never itself).
  -- Idempotent via on conflict; the check (follower_id <> following_id) is
  -- respected by excluding the new user from targets.
  insert into public.mobilize_user_follows (follower_id, following_id)
  select new.id, t.user_id
  from public.mobilize_auto_follow_targets t
  where t.user_id <> new.id
  on conflict (follower_id, following_id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Seed from the previous hardcoded bulk-follow targets (migration 085) so the
-- whitelist starts with the same users already being followed.
-- ---------------------------------------------------------------------------
insert into public.mobilize_auto_follow_targets (user_id)
select du.id
from public.dashboard_users du
where lower(du.email) in (
  lower('gene@fparmy.com'),
  lower('whutchins@champ.org'),
  lower('ricardo.a@dreamsanimation.com')
)
on conflict (user_id) do nothing;
