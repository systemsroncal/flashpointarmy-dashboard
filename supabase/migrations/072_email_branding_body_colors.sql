-- Editable body / footer colors for transactional email layout.

alter table public.email_branding_settings
  add column if not exists body_bg_color text not null default '#101215',
  add column if not exists body_text_color text not null default '#e5e7eb',
  add column if not exists body_link_color text not null default '#c9a227',
  add column if not exists footer_text_color text not null default '#a1a1aa';
