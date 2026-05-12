-- Allow group creator to delete their mobilize group (API uses service role or RLS with user JWT).
drop policy if exists "mobilize_groups delete creator" on public.mobilize_groups;
create policy "mobilize_groups delete creator" on public.mobilize_groups
  for delete to authenticated using (created_by = auth.uid());
