-- Donations: preset amounts, orders, subscriptions + RBAC modules (donations, orders, donate).

insert into public.modules (slug, name, sort_order)
values
  ('donations', 'Donations', 42),
  ('orders', 'Orders', 43),
  ('donate', 'Donate', 12)
on conflict (slug) do nothing;

-- donations + orders: admin / super_admin
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id,
  case when m.slug = 'donations' then true else false end,
  true,
  case when m.slug = 'donations' then true else false end,
  case when m.slug = 'donations' then true else false end
from public.roles r
cross join public.modules m
where r.name in ('super_admin', 'admin')
  and m.slug in ('donations', 'orders')
on conflict (role_id, module_id) do nothing;

-- donate: all roles with dashboard access
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, false, true, false, false
from public.roles r
cross join public.modules m
where m.slug = 'donate'
on conflict (role_id, module_id) do nothing;

create table if not exists public.donation_amount_presets (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  amount_cents integer not null check (amount_cents >= 0),
  is_custom_amount boolean not null default false,
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  allow_one_time boolean not null default true,
  allow_monthly boolean not null default false,
  allow_bimonthly boolean not null default false,
  allow_quarterly boolean not null default false,
  allow_yearly boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists donation_amount_presets_one_custom_idx
  on public.donation_amount_presets ((is_custom_amount))
  where is_custom_amount = true;

create table if not exists public.donation_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  preset_id uuid references public.donation_amount_presets (id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  payment_mode text not null check (payment_mode in ('one_time', 'recurring')),
  recurrence_interval text check (
    recurrence_interval is null
    or recurrence_interval in ('monthly', 'bimonthly', 'quarterly', 'yearly')
  ),
  status text not null default 'pending' check (
    status in ('pending', 'completed', 'failed', 'cancelled')
  ),
  donor_name text,
  donor_email text not null,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.donation_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  order_id uuid references public.donation_orders (id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  recurrence_interval text not null check (
    recurrence_interval in ('monthly', 'bimonthly', 'quarterly', 'yearly')
  ),
  status text not null default 'active' check (
    status in ('active', 'paused', 'cancelled', 'past_due')
  ),
  donor_name text,
  donor_email text not null,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists donation_orders_created_at_idx on public.donation_orders (created_at desc);
create index if not exists donation_orders_status_idx on public.donation_orders (status);
create index if not exists donation_subscriptions_status_idx on public.donation_subscriptions (status);

alter table public.donation_amount_presets enable row level security;
alter table public.donation_orders enable row level security;
alter table public.donation_subscriptions enable row level security;

-- Presets: authenticated read enabled rows; service role / admin via API uses server client with user JWT + elevated checks in app
create policy donation_presets_select_authenticated on public.donation_amount_presets
  for select to authenticated
  using (is_enabled = true);

create policy donation_presets_all_service on public.donation_amount_presets
  for all to service_role
  using (true)
  with check (true);

create policy donation_orders_select_own on public.donation_orders
  for select to authenticated
  using (auth.uid() = user_id);

create policy donation_orders_all_service on public.donation_orders
  for all to service_role
  using (true)
  with check (true);

create policy donation_subscriptions_select_own on public.donation_subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

create policy donation_subscriptions_all_service on public.donation_subscriptions
  for all to service_role
  using (true)
  with check (true);

-- Seed default presets (idempotent by label for fixed amounts)
insert into public.donation_amount_presets (
  label, amount_cents, is_custom_amount, sort_order, is_enabled,
  allow_one_time, allow_monthly, allow_bimonthly, allow_quarterly, allow_yearly
)
select v.label, v.amount_cents, false, v.sort_order, true,
  v.allow_one_time, v.allow_monthly, v.allow_bimonthly, v.allow_quarterly, v.allow_yearly
from (values
  ('$1', 100, 1, true, true, false, false, true),
  ('$5', 500, 2, true, true, false, false, true),
  ('$10', 1000, 3, true, true, true, false, true),
  ('$20', 2000, 4, true, true, true, false, true),
  ('$50', 5000, 5, true, true, true, true, true),
  ('$100', 10000, 6, true, true, true, true, true),
  ('$200', 20000, 7, true, true, true, true, true)
) as v(label, amount_cents, sort_order, allow_one_time, allow_monthly, allow_bimonthly, allow_quarterly, allow_yearly)
where not exists (
  select 1 from public.donation_amount_presets p
  where p.is_custom_amount = false and p.amount_cents = v.amount_cents
);

insert into public.donation_amount_presets (
  label, amount_cents, is_custom_amount, sort_order, is_enabled,
  allow_one_time, allow_monthly, allow_bimonthly, allow_quarterly, allow_yearly
)
select 'Custom amount', 0, true, 99, true, true, true, true, true, true
where not exists (
  select 1 from public.donation_amount_presets where is_custom_amount = true
);
