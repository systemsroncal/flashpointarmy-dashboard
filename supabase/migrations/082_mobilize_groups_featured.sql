-- Featured groups appear in every chapter's group list (same row; not duplicated).
alter table public.mobilize_groups
  add column if not exists is_featured boolean not null default false;

create index if not exists mobilize_groups_is_featured_idx
  on public.mobilize_groups (is_featured)
  where is_featured = true and parent_group_id is not null;

comment on column public.mobilize_groups.is_featured is
  'When true, this subgroup is listed under every Mobilize chapter (single shared group).';
