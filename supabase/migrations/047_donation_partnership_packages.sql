-- Partnership donation packages: SecureGive URLs, display fields, no custom amount on Donate page.

alter table public.donation_amount_presets
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists checkout_url text,
  add column if not exists is_recommended boolean not null default false,
  add column if not exists card_style text not null default 'light';

alter table public.donation_amount_presets
  drop constraint if exists donation_amount_presets_card_style_check;

alter table public.donation_amount_presets
  add constraint donation_amount_presets_card_style_check
  check (card_style in ('light', 'accent', 'dark'));

-- Hide custom amount and legacy Stripe amount chips from the public Donate page.
update public.donation_amount_presets
set is_enabled = false
where is_custom_amount = true;

update public.donation_amount_presets
set is_enabled = false
where is_custom_amount = false
  and coalesce(title, '') = ''
  and label in ('$1', '$5', '$10', '$20', '$50', '$100', '$200');

insert into public.donation_amount_presets (
  label,
  title,
  description,
  amount_cents,
  is_custom_amount,
  sort_order,
  is_enabled,
  allow_one_time,
  allow_monthly,
  allow_bimonthly,
  allow_quarterly,
  allow_yearly,
  checkout_url,
  is_recommended,
  card_style
)
select
  v.label,
  v.title,
  v.description,
  v.amount_cents,
  false,
  v.sort_order,
  true,
  false,
  true,
  false,
  false,
  false,
  v.checkout_url,
  v.is_recommended,
  v.card_style
from (
  values
    (
      '$1',
      'Founding Supporter',
      'For those committed to advancing the Gospel.',
      100,
      1,
      'https://app.securegive.com/FlashpointArmy/Flashpoint/donate/category',
      false,
      'light'
    ),
    (
      '$29',
      'FlashPoint Partner',
      'For those standing guard in this hour.',
      2900,
      2,
      'https://app.securegive.com/FlashpointArmy/Flashpoint/donate/category',
      false,
      'light'
    ),
    (
      '$75',
      'Command Partner',
      'For those investing deeply in the days ahead.',
      7500,
      3,
      'https://app.securegive.com/FlashpointArmy/Flashpoint/donate/category',
      true,
      'accent'
    ),
    (
      '$149',
      'Decorated Partner',
      'For those helping carry the weight of the mission.',
      14900,
      4,
      'https://app.securegive.com/FlashpointArmy/Flashpoint/donate/category',
      false,
      'dark'
    )
) as v(
  label,
  title,
  description,
  amount_cents,
  sort_order,
  checkout_url,
  is_recommended,
  card_style
)
where not exists (
  select 1
  from public.donation_amount_presets p
  where p.is_custom_amount = false
    and p.title = v.title
);

-- Backfill title/description/url on existing partnership rows when columns were added later.
update public.donation_amount_presets p
set
  title = coalesce(p.title, v.title),
  description = coalesce(p.description, v.description),
  checkout_url = coalesce(
    nullif(trim(p.checkout_url), ''),
    v.checkout_url
  ),
  is_recommended = coalesce(p.is_recommended, v.is_recommended),
  card_style = coalesce(nullif(p.card_style, ''), v.card_style),
  is_enabled = true
from (
  values
    ('Founding Supporter', 'For those committed to advancing the Gospel.', 100, 1, 'https://app.securegive.com/FlashpointArmy/Flashpoint/donate/category', false, 'light'),
    ('FlashPoint Partner', 'For those standing guard in this hour.', 2900, 2, 'https://app.securegive.com/FlashpointArmy/Flashpoint/donate/category', false, 'light'),
    ('Command Partner', 'For those investing deeply in the days ahead.', 7500, 3, 'https://app.securegive.com/FlashpointArmy/Flashpoint/donate/category', true, 'accent'),
    ('Decorated Partner', 'For those helping carry the weight of the mission.', 14900, 4, 'https://app.securegive.com/FlashpointArmy/Flashpoint/donate/category', false, 'dark')
) as v(title, description, amount_cents, sort_order, checkout_url, is_recommended, card_style)
where p.is_custom_amount = false
  and p.title = v.title;
