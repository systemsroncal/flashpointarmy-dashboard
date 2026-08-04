-- Profile cover image (shared by right sidebar drawer + Mobilize member profile).
alter table public.profiles
  add column if not exists cover_url text;

comment on column public.profiles.cover_url is
  'Banner/cover image for profile drawer and Mobilize member profile.';

-- Durable invite-share tracking (each social/copy press).
create table if not exists public.invite_share_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  channel text not null,
  created_at timestamptz not null default now(),
  constraint invite_share_events_channel_check
    check (channel in ('whatsapp', 'facebook', 'x', 'linkedin', 'telegram', 'email', 'direct_link'))
);

create index if not exists invite_share_events_user_id_idx
  on public.invite_share_events (user_id);

create index if not exists invite_share_events_created_at_idx
  on public.invite_share_events (created_at desc);

alter table public.invite_share_events enable row level security;

drop policy if exists "invite_share_events_select_authenticated" on public.invite_share_events;
create policy "invite_share_events_select_authenticated"
  on public.invite_share_events
  for select
  to authenticated
  using (true);

drop policy if exists "invite_share_events_insert_own" on public.invite_share_events;
create policy "invite_share_events_insert_own"
  on public.invite_share_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);
