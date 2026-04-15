-- Chapter approved → audit + feed + notifications (payload title/text for notify_users_on_audit_log).
-- Email send audit trail (read by admins in dashboard).

create table if not exists public.email_send_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null check (status in ('sent', 'failed')),
  template_key text,
  from_address text,
  to_address text not null,
  subject text,
  body_preview text,
  error_message text,
  triggered_by_user_id uuid references auth.users (id) on delete set null
);

create index if not exists idx_email_send_logs_created on public.email_send_logs (created_at desc);

alter table public.email_send_logs enable row level security;

drop policy if exists "email_send_logs admin read" on public.email_send_logs;
create policy "email_send_logs admin read" on public.email_send_logs
  for select to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  );

-- No insert/update/delete for authenticated — service role bypasses RLS for server-side logging.

create or replace function public.trg_chapters_approved_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  st text;
begin
  if new.status = 'approved'
     and (old.status is distinct from new.status)
     and coalesce(old.status, '') <> 'approved' then
    st := upper(trim(new.state));
    if st is not null and length(st) > 2 then
      st := left(st, 2);
    end if;

    insert into public.audit_logs (user_id, action, entity_type, entity_id, payload)
    values (
      auth.uid(),
      'chapter_approved',
      'chapter',
      new.id::text,
      jsonb_build_object(
        'title', 'Chapter approved',
        'text', format('Chapter "%s" is now approved and active.', new.name)
      )
    );

    insert into public.community_activity (feed_category, title, subtitle, state_code, icon_key)
    values (
      'chapter',
      'Chapter approved',
      new.name,
      nullif(st, ''),
      'location'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_chapters_approved_feed on public.chapters;
create trigger trg_chapters_approved_feed
  after update on public.chapters
  for each row
  execute function public.trg_chapters_approved_feed();
