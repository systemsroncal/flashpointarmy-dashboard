-- Link color for email body (if 072 ran before body_link_color was added).

alter table public.email_branding_settings
  add column if not exists body_link_color text not null default '#c9a227';
