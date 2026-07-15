-- Mobilize social feed: rich HTML posts, threaded comments, reactions, follows, profile wall.

-- ---------------------------------------------------------------------------
-- profiles: visibility + bio for social wall
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists profile_visibility text not null default 'public',
  add column if not exists bio text;

alter table public.profiles drop constraint if exists profiles_profile_visibility_check;
alter table public.profiles
  add constraint profiles_profile_visibility_check
  check (profile_visibility in ('public', 'private'));

comment on column public.profiles.profile_visibility is
  'public: any authenticated mobilize user may view wall; private: owner + followers only.';
comment on column public.profiles.bio is 'Short bio shown on mobilize member profile.';

-- ---------------------------------------------------------------------------
-- group wall: optional HTML body (plain content kept for search/fallback)
-- ---------------------------------------------------------------------------
alter table public.mobilize_group_messages
  add column if not exists content_html text;

comment on column public.mobilize_group_messages.content_html is
  'Sanitized HTML from rich text editor; content column stores plain-text fallback.';

-- ---------------------------------------------------------------------------
-- mobilize_message_comments (max depth 3)
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_message_comments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.mobilize_group_messages (id) on delete cascade,
  author_id uuid not null references public.dashboard_users (id) on delete cascade,
  parent_id uuid references public.mobilize_message_comments (id) on delete cascade,
  depth smallint not null check (depth between 1 and 3),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_mobilize_message_comments_message
  on public.mobilize_message_comments (message_id, created_at);

create index if not exists idx_mobilize_message_comments_parent
  on public.mobilize_message_comments (parent_id);

-- ---------------------------------------------------------------------------
-- mobilize_message_reactions (like | love, one per user per message)
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_message_reactions (
  message_id uuid not null references public.mobilize_group_messages (id) on delete cascade,
  user_id uuid not null references public.dashboard_users (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'love')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists idx_mobilize_message_reactions_user
  on public.mobilize_message_reactions (user_id);

-- ---------------------------------------------------------------------------
-- mobilize_message_comment_reactions
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_message_comment_reactions (
  comment_id uuid not null references public.mobilize_message_comments (id) on delete cascade,
  user_id uuid not null references public.dashboard_users (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'love')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- ---------------------------------------------------------------------------
-- mobilize_user_follows
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_user_follows (
  follower_id uuid not null references public.dashboard_users (id) on delete cascade,
  following_id uuid not null references public.dashboard_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists idx_mobilize_user_follows_following
  on public.mobilize_user_follows (following_id);

-- ---------------------------------------------------------------------------
-- mobilize_profile_posts (personal wall)
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_profile_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.dashboard_users (id) on delete cascade,
  content text not null default '',
  content_html text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_mobilize_profile_posts_author_time
  on public.mobilize_profile_posts (author_id, created_at desc);

-- ---------------------------------------------------------------------------
-- mobilize_profile_post_comments (max depth 3)
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_profile_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.mobilize_profile_posts (id) on delete cascade,
  author_id uuid not null references public.dashboard_users (id) on delete cascade,
  parent_id uuid references public.mobilize_profile_post_comments (id) on delete cascade,
  depth smallint not null check (depth between 1 and 3),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_mobilize_profile_post_comments_post
  on public.mobilize_profile_post_comments (post_id, created_at);

-- ---------------------------------------------------------------------------
-- mobilize_profile_post_reactions
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_profile_post_reactions (
  post_id uuid not null references public.mobilize_profile_posts (id) on delete cascade,
  user_id uuid not null references public.dashboard_users (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'love')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ---------------------------------------------------------------------------
-- mobilize_profile_comment_reactions
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_profile_comment_reactions (
  comment_id uuid not null references public.mobilize_profile_post_comments (id) on delete cascade,
  user_id uuid not null references public.dashboard_users (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'love')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- ---------------------------------------------------------------------------
-- RLS (baseline; APIs use service role — policies for future direct client access)
-- ---------------------------------------------------------------------------
alter table public.mobilize_message_comments enable row level security;
alter table public.mobilize_message_reactions enable row level security;
alter table public.mobilize_message_comment_reactions enable row level security;
alter table public.mobilize_user_follows enable row level security;
alter table public.mobilize_profile_posts enable row level security;
alter table public.mobilize_profile_post_comments enable row level security;
alter table public.mobilize_profile_post_reactions enable row level security;
alter table public.mobilize_profile_comment_reactions enable row level security;

drop policy if exists "mobilize_message_comments authenticated all" on public.mobilize_message_comments;
create policy "mobilize_message_comments authenticated all" on public.mobilize_message_comments
  for all to authenticated using (true) with check (auth.uid() = author_id);

drop policy if exists "mobilize_message_reactions authenticated all" on public.mobilize_message_reactions;
create policy "mobilize_message_reactions authenticated all" on public.mobilize_message_reactions
  for all to authenticated using (true) with check (auth.uid() = user_id);

drop policy if exists "mobilize_message_comment_reactions authenticated all" on public.mobilize_message_comment_reactions;
create policy "mobilize_message_comment_reactions authenticated all" on public.mobilize_message_comment_reactions
  for all to authenticated using (true) with check (auth.uid() = user_id);

drop policy if exists "mobilize_user_follows authenticated all" on public.mobilize_user_follows;
create policy "mobilize_user_follows authenticated all" on public.mobilize_user_follows
  for all to authenticated using (true) with check (auth.uid() = follower_id);

drop policy if exists "mobilize_profile_posts authenticated all" on public.mobilize_profile_posts;
create policy "mobilize_profile_posts authenticated all" on public.mobilize_profile_posts
  for all to authenticated using (true) with check (auth.uid() = author_id);

drop policy if exists "mobilize_profile_post_comments authenticated all" on public.mobilize_profile_post_comments;
create policy "mobilize_profile_post_comments authenticated all" on public.mobilize_profile_post_comments
  for all to authenticated using (true) with check (auth.uid() = author_id);

drop policy if exists "mobilize_profile_post_reactions authenticated all" on public.mobilize_profile_post_reactions;
create policy "mobilize_profile_post_reactions authenticated all" on public.mobilize_profile_post_reactions
  for all to authenticated using (true) with check (auth.uid() = user_id);

drop policy if exists "mobilize_profile_comment_reactions authenticated all" on public.mobilize_profile_comment_reactions;
create policy "mobilize_profile_comment_reactions authenticated all" on public.mobilize_profile_comment_reactions
  for all to authenticated using (true) with check (auth.uid() = user_id);
