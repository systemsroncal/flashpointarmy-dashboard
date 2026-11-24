-- Mission Update notification emails (queued + batched SMTP sends).

insert into public.email_templates (template_key, subject, body_html)
values
  (
    'mission_update_new',
    'New Mission Update: {mission_update_title}',
    '<p>Hello {user_fullname},</p>
<p>There is a new <strong>Mission Update</strong> in the Command Center.</p>
<p><strong>{mission_update_title}</strong></p>
{mission_update_preview_html}
<p><a href="{mission_update_url}">Read Mission Update</a></p>
<p>If the button does not work, copy and paste this link into your browser:<br/>{mission_update_url}</p>
<p>— {app_name}</p>'
  )
on conflict (template_key) do nothing;

create table if not exists public.dashboard_announcement_email_jobs (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null unique references public.dashboard_announcements (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  total_queued int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  skipped_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists idx_dashboard_announcement_email_jobs_status
  on public.dashboard_announcement_email_jobs (status, created_at);

create table if not exists public.dashboard_announcement_email_queue (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.dashboard_announcement_email_jobs (id) on delete cascade,
  announcement_id uuid not null references public.dashboard_announcements (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (announcement_id, user_id)
);

create index if not exists idx_dashboard_announcement_email_queue_pending
  on public.dashboard_announcement_email_queue (job_id, created_at)
  where status = 'pending';

alter table public.dashboard_announcement_email_jobs enable row level security;
alter table public.dashboard_announcement_email_queue enable row level security;

-- No policies: service role only (enqueue/worker via server).