alter table public.gatherings
  add column if not exists status text not null default 'draft',
  add column if not exists slug text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gatherings_status_check'
  ) then
    alter table public.gatherings
      add constraint gatherings_status_check
      check (status in ('draft', 'published', 'trash'));
  end if;
end $$;

create unique index if not exists idx_gatherings_slug_unique
  on public.gatherings (slug)
  where slug is not null;

create index if not exists idx_gatherings_status
  on public.gatherings (status);

insert into storage.buckets (id, name, public)
values ('gatherings', 'gatherings', true)
on conflict (id) do nothing;
