-- Per-user dismissals for computed social alerts (follows, likes, comments, followed posts).
-- Alert ids are stable composite strings from load-social-alerts.ts (not UUIDs).

create table if not exists public.mobilize_social_alert_dismissed (
  user_id uuid not null references auth.users (id) on delete cascade,
  alert_id text not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, alert_id),
  constraint mobilize_social_alert_dismissed_alert_id_len check (char_length(alert_id) between 1 and 200)
);

create index if not exists idx_mobilize_social_alert_dismissed_user
  on public.mobilize_social_alert_dismissed (user_id);

alter table public.mobilize_social_alert_dismissed enable row level security;

drop policy if exists "mobilize_social_alert_dismissed own" on public.mobilize_social_alert_dismissed;
create policy "mobilize_social_alert_dismissed own" on public.mobilize_social_alert_dismissed
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
