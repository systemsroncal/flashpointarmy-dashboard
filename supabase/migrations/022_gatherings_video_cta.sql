alter table public.gatherings
  add column if not exists video_url text,
  add column if not exists cta_url text,
  add column if not exists cta_button_label text not null default 'REGISTER NOW',
  add column if not exists cta_button_visible boolean not null default false;

comment on column public.gatherings.video_url is 'Promo / trailer URL (YouTube, Vimeo, MP4, embed, etc.) shown in Plyr dialog on view.';
comment on column public.gatherings.cta_url is 'External registration or action link.';
comment on column public.gatherings.cta_button_label is 'Label for the CTA button (default REGISTER NOW).';
comment on column public.gatherings.cta_button_visible is 'When true and cta_url is set, show CTA after description on dashboard and public event pages.';
