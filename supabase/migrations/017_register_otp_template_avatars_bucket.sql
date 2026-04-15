-- Editable branded template for registration OTP (shortcodes: {otp}, {user_email}, {user_fullname}, {app_name}, {current_year}).
insert into public.email_templates (template_key, subject, body_html)
values (
  'register_otp',
  '{app_name} — verification code',
  '<p>Hello,</p><p>Your verification code for <strong>{app_name}</strong> is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:16px 0">{otp}</p><p>This code expires in 10 minutes.</p><p style="color:#666;font-size:14px">If you did not request this, you can ignore this message.</p>'
)
on conflict (template_key) do nothing;

-- Public avatar files (max 1 MB); path must be `{auth.uid()}/avatar.{ext}`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "avatars insert own folder" on storage.objects;
create policy "avatars insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "avatars update own folder" on storage.objects;
create policy "avatars update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "avatars delete own folder" on storage.objects;
create policy "avatars delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
