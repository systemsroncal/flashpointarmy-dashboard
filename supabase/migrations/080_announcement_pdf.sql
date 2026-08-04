-- Optional PDF attachment on Mission Updates / dashboard notifications.
alter table public.dashboard_announcements
  add column if not exists pdf_url text,
  add column if not exists pdf_file_name text;

comment on column public.dashboard_announcements.pdf_url is
  'HTTPS URL or /uploads/announcement-pdfs/... path for an embedded PDF preview.';
comment on column public.dashboard_announcements.pdf_file_name is
  'Original display name for the attached PDF.';
