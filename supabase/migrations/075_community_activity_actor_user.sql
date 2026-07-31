-- Optional actor for Community in Action rows (e.g. member invite link to profile).

alter table public.community_activity
  add column if not exists actor_user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_community_activity_actor
  on public.community_activity (actor_user_id)
  where actor_user_id is not null;
