-- Default Training intro video (Vimeo). Admins can override in dashboard → Training.
insert into public.training_settings (id, intro_video_url, updated_at)
values (
  1,
  'https://player.vimeo.com/video/652235622?badge=0&autopause=0&player_id=0&app_id=58479',
  now()
)
on conflict (id) do update
set
  intro_video_url = excluded.intro_video_url,
  updated_at = excluded.updated_at;
