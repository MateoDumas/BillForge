create extension if not exists pgcrypto;

insert into tenant (id, name, billing_email, status)
values (
  '11111111-1111-1111-1111-111111111111',
  'Demo Tenant',
  'demo@example.com',
  'active'
)
on conflict (id) do nothing;

insert into app_user (id, tenant_id, email, password_hash, status)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'owner@example.com',
  'demo-hash',
  'active'
)
on conflict (id) do nothing;

insert into user_role (id, user_id, tenant_id, role)
values (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'owner'
)
on conflict (id) do nothing;

insert into plan (id, code, name, billing_period, base_price_cents, currency, is_usage_based)
values
(
  '44444444-4444-4444-4444-444444444444',
  'standard',
  'Standard',
  'monthly',
  2900,
  'EUR',
  false
),
(
  '55555555-5555-5555-5555-555555555555',
  'premium',
  'Premium',
  'monthly',
  5900,
  'EUR',
  false
)
on conflict (id) do nothing;

insert into subscription (id, tenant_id, plan_id, status, start_date, current_period_start, current_period_end, cancel_at_period_end)
values (
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'active',
  current_date - interval '15 days',
  current_date - interval '15 days',
  current_date + interval '15 days',
  false
)
on conflict (id) do nothing;

-- Invoices
insert into invoice (id, tenant_id, subscription_id, number, status, issue_date, due_date, currency, total_cents)
values 
(
  '77777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  '66666666-6666-6666-6666-666666666666',
  'INV-001',
  'paid',
  current_date - interval '45 days',
  current_date - interval '15 days',
  'EUR',
  2900
),
(
  '88888888-8888-8888-8888-888888888888',
  '11111111-1111-1111-1111-111111111111',
  '66666666-6666-6666-6666-666666666666',
  'INV-002',
  'paid',
  current_date - interval '15 days',
  current_date + interval '15 days',
  'EUR',
  2900
)
on conflict (id) do nothing;

-- Payments
insert into payment (id, tenant_id, invoice_id, amount_cents, currency, status, created_at)
values
(
  '99999999-9999-9999-9999-999999999999',
  '11111111-1111-1111-1111-111111111111',
  '77777777-7777-7777-7777-777777777777',
  2900,
  'EUR',
  'succeeded',
  current_date - interval '40 days'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '88888888-8888-8888-8888-888888888888',
  2900,
  'EUR',
  'succeeded',
  current_date - interval '10 days'
)
on conflict (id) do nothing;

