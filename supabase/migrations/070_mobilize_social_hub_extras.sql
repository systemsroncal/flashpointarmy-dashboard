-- Social hub: bookmarks, direct messages.

create table if not exists public.mobilize_social_bookmarks (
  user_id uuid not null references public.dashboard_users (id) on delete cascade,
  post_kind text not null check (post_kind in ('profile_post', 'group_message')),
  post_ref_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, post_kind, post_ref_id)
);

create index if not exists idx_mobilize_social_bookmarks_user_time
  on public.mobilize_social_bookmarks (user_id, created_at desc);

create table if not exists public.mobilize_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.dashboard_users (id) on delete cascade,
  recipient_id uuid not null references public.dashboard_users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists idx_mobilize_direct_messages_recipient_time
  on public.mobilize_direct_messages (recipient_id, created_at desc);

create index if not exists idx_mobilize_direct_messages_sender_time
  on public.mobilize_direct_messages (sender_id, created_at desc);

alter table public.mobilize_social_bookmarks enable row level security;
alter table public.mobilize_direct_messages enable row level security;

drop policy if exists "mobilize_social_bookmarks own rows" on public.mobilize_social_bookmarks;
create policy "mobilize_social_bookmarks own rows" on public.mobilize_social_bookmarks
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "mobilize_direct_messages participant read" on public.mobilize_direct_messages;
create policy "mobilize_direct_messages participant read" on public.mobilize_direct_messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "mobilize_direct_messages sender insert" on public.mobilize_direct_messages;
create policy "mobilize_direct_messages sender insert" on public.mobilize_direct_messages
  for insert to authenticated with check (auth.uid() = sender_id);
