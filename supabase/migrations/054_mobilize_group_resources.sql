-- Mobilize group resources (links, documents, videos, text) and who may add them.

alter table public.mobilize_groups
  add column if not exists resources_post_policy text not null default 'all_approved'
  check (resources_post_policy in ('all_approved', 'leaders_only'));

comment on column public.mobilize_groups.resources_post_policy is
  'all_approved: any approved member may add resources; leaders_only: only leaders may add.';

create table if not exists public.mobilize_group_resources (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mobilize_groups (id) on delete cascade,
  author_id uuid not null references public.dashboard_users (id) on delete restrict,
  resource_type text not null check (resource_type in ('link', 'document', 'video', 'text')),
  title text not null,
  body text,
  url text,
  file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mobilize_group_resources_title_nonempty check (char_length(trim(title)) > 0)
);

create index if not exists idx_mobilize_group_resources_group_created
  on public.mobilize_group_resources (group_id, created_at desc);

alter table public.mobilize_group_resources enable row level security;

drop policy if exists "mobilize_group_resources select members" on public.mobilize_group_resources;
create policy "mobilize_group_resources select members" on public.mobilize_group_resources
  for select to authenticated using (
    exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_group_resources.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
    )
  );

drop policy if exists "mobilize_group_resources insert members" on public.mobilize_group_resources;
create policy "mobilize_group_resources insert members" on public.mobilize_group_resources
  for insert to authenticated with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_group_resources.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
    )
  );

drop policy if exists "mobilize_group_resources update scoped" on public.mobilize_group_resources;
create policy "mobilize_group_resources update scoped" on public.mobilize_group_resources
  for update to authenticated using (
    author_id = auth.uid()
    or exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_group_resources.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
        and m.member_role = 'leader'
    )
  );

drop policy if exists "mobilize_group_resources delete scoped" on public.mobilize_group_resources;
create policy "mobilize_group_resources delete scoped" on public.mobilize_group_resources
  for delete to authenticated using (
    author_id = auth.uid()
    or exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_group_resources.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
        and m.member_role = 'leader'
    )
  );
