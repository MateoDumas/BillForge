create table tenant (
  id uuid primary key,
  name text not null,
  billing_email text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table app_user (
  id uuid primary key,
  tenant_id uuid not null references tenant(id),
  email text not null unique,
  password_hash text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table user_role (
  id uuid primary key,
  user_id uuid not null references app_user(id),
  tenant_id uuid not null references tenant(id),
  role text not null
);

create table plan (
  id uuid primary key,
  code text not null unique,
  name text not null,
  billing_period text not null,
  base_price_cents integer not null,
  currency text not null,
  is_usage_based boolean not null default false,
  usage_metric text
);

create table subscription (
  id uuid primary key,
  tenant_id uuid not null references tenant(id),
  plan_id uuid not null references plan(id),
  status text not null,
  start_date date not null,
  current_period_start date not null,
  current_period_end date not null,
  cancel_at_period_end boolean not null default false,
  external_customer_id text,
  external_subscription_id text
);

create table invoice (
  id uuid primary key,
  tenant_id uuid not null references tenant(id),
  subscription_id uuid references subscription(id),
  number text not null,
  status text not null,
  issue_date date not null,
  due_date date not null,
  total_cents integer not null,
  currency text not null,
  external_invoice_id text,
  unique (tenant_id, number)
);

create table invoice_line (
  id uuid primary key,
  invoice_id uuid not null references invoice(id),
  description text not null,
  quantity integer not null,
  unit_price_cents integer not null,
  amount_cents integer not null,
  type text not null
);

create table payment (
  id uuid primary key,
  tenant_id uuid not null references tenant(id),
  invoice_id uuid not null references invoice(id),
  status text not null,
  amount_cents integer not null,
  currency text not null,
  external_payment_id text,
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create table usage_record (
  id uuid primary key,
  tenant_id uuid not null references tenant(id),
  subscription_id uuid not null references subscription(id),
  metric text not null,
  quantity integer not null,
  recorded_at timestamptz not null default now(),
  invoiced boolean not null default false
);

create table audit_log (
  id uuid primary key,
  tenant_id uuid not null references tenant(id),
  user_id uuid not null references app_user(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

