alter table public.gatherings
  add column if not exists gallery_image_urls text[] not null default '{}',
  add column if not exists is_virtual boolean not null default false,
  add column if not exists virtual_url text;

drop policy if exists "gatherings public read" on storage.objects;
create policy "gatherings public read"
  on storage.objects for select
  to public
  using (bucket_id = 'gatherings');

drop policy if exists "gatherings insert own folder" on storage.objects;
create policy "gatherings insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gatherings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "gatherings update own folder" on storage.objects;
create policy "gatherings update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'gatherings'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'gatherings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "gatherings delete own folder" on storage.objects;
create policy "gatherings delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gatherings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
