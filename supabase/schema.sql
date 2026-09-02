-- =============================================================================
-- FinTrack — Supabase Database Schema (single source of truth)
-- =============================================================================
-- Safe to run on fresh OR existing Supabase projects (idempotent).
-- Includes: enums, tables, upgrades, indexes, triggers, views, RPC functions,
-- granular RLS, and grants.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Custom types
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.transaction_type as enum ('income', 'expense');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.budget_period as enum ('monthly', 'annual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.networth_item_type as enum ('asset', 'liability');
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Utility: auto-update updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Extended user profile linked 1:1 with auth.users';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Taxonomy masters (category, payment method, accounts)
-- -----------------------------------------------------------------------------
create table if not exists public.transaction_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  transaction_type_id uuid not null references public.transaction_types (id) on delete restrict,
  parent_id uuid references public.finance_categories (id) on delete restrict,
  code text not null,
  name text not null,
  level integer not null default 1 check (level between 1 and 3),
  description text,
  icon text,
  color text,
  keywords text[],
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  unique (transaction_type_id, code)
);

create index if not exists finance_categories_type_idx
  on public.finance_categories (transaction_type_id);
create index if not exists finance_categories_parent_idx
  on public.finance_categories (parent_id);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.payment_methods (id) on delete restrict,
  code text unique not null,
  name text not null,
  level integer not null default 1 check (level between 1 and 3),
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists payment_methods_parent_idx
  on public.payment_methods (parent_id);

create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  account_type text not null check (
    account_type in ('BANK', 'CASH', 'CREDIT_CARD', 'WALLET', 'BROKERAGE', 'FD', 'RD', 'PPF', 'NPS', 'OTHER')
  ),
  institution_name text,
  currency text not null default 'INR',
  opening_balance numeric(15, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_accounts_user_idx
  on public.financial_accounts (user_id);

drop trigger if exists financial_accounts_set_updated_at on public.financial_accounts;
create trigger financial_accounts_set_updated_at
  before update on public.financial_accounts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Transactions
-- -----------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  amount numeric(12, 2) not null check (amount > 0),
  type public.transaction_type not null,
  category text,
  payment_method text not null default 'UPI',
  notes text,
  merchant text,
  transaction_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  transaction_type_id uuid references public.transaction_types (id) on delete restrict,
  category_id uuid references public.finance_categories (id) on delete restrict,
  subcategory_id uuid references public.finance_categories (id) on delete restrict,
  item_id uuid references public.finance_categories (id) on delete restrict,
  payment_method_id uuid references public.payment_methods (id) on delete restrict,
  account_id uuid references public.financial_accounts (id) on delete set null
);

-- Upgrade existing transactions tables (no-op when columns already exist)
alter table public.transactions
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists merchant text,
  add column if not exists transaction_type_id uuid references public.transaction_types (id) on delete restrict,
  add column if not exists category_id uuid references public.finance_categories (id) on delete restrict,
  add column if not exists subcategory_id uuid references public.finance_categories (id) on delete restrict,
  add column if not exists item_id uuid references public.finance_categories (id) on delete restrict,
  add column if not exists payment_method_id uuid references public.payment_methods (id) on delete restrict,
  add column if not exists account_id uuid references public.financial_accounts (id) on delete set null;

comment on table public.transactions is 'Income and expense ledger entries per user';
comment on column public.transactions.category is 'Denormalized category label for display and legacy budget matching';
comment on column public.transactions.payment_method is 'Denormalized payment method label for display';
comment on column public.transactions.merchant is 'Payee or merchant name (e.g. Swiggy, Amazon)';
comment on column public.transactions.transaction_type_id is 'FK to transaction_types master (INCOME, EXPENSE, etc.)';
comment on column public.transactions.category_id is 'Level-1 finance category';
comment on column public.transactions.subcategory_id is 'Level-2 finance subcategory';
comment on column public.transactions.item_id is 'Level-3 finance item';
comment on column public.transactions.payment_method_id is 'FK to payment_methods master (UPI, Card, NEFT, etc.)';
comment on column public.transactions.account_id is 'FK to user financial account (HDFC Bank, etc.)';

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);

create index if not exists transactions_user_type_date_idx
  on public.transactions (user_id, type, transaction_date desc);

create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category)
  where category is not null;

create index if not exists transactions_payment_method_idx
  on public.transactions (payment_method_id);

create index if not exists transactions_category_idx
  on public.transactions (category_id);

create index if not exists transactions_subcategory_idx
  on public.transactions (subcategory_id);

create index if not exists transactions_item_idx
  on public.transactions (item_id);

create index if not exists transactions_account_idx
  on public.transactions (account_id);

create index if not exists transactions_transaction_type_idx
  on public.transactions (transaction_type_id);

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Credit cards
-- -----------------------------------------------------------------------------
create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bank_name text not null check (char_length(trim(bank_name)) > 0),
  card_name text not null check (char_length(trim(card_name)) > 0),
  last_four text check (last_four ~ '^\d{4}$'),
  credit_limit numeric(12, 2) not null default 0 check (credit_limit >= 0),
  outstanding numeric(12, 2) not null default 0 check (outstanding >= 0),
  due_day smallint check (due_day between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.credit_cards is 'Credit card accounts and balances';

create index if not exists credit_cards_user_created_idx
  on public.credit_cards (user_id, created_at desc);

drop trigger if exists credit_cards_set_updated_at on public.credit_cards;
create trigger credit_cards_set_updated_at
  before update on public.credit_cards
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Budgets
-- -----------------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  category text,
  amount numeric(12, 2) not null check (amount > 0),
  period public.budget_period not null default 'monthly',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.budgets is 'Monthly or annual spending budgets';

create index if not exists budgets_user_created_idx
  on public.budgets (user_id, created_at desc);

create unique index if not exists budgets_user_name_period_uidx
  on public.budgets (user_id, lower(name), period);

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Net worth items
-- -----------------------------------------------------------------------------
create table if not exists public.networth_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  item_type public.networth_item_type not null,
  category text,
  value numeric(14, 2) not null check (value > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.networth_items is 'Assets and liabilities for net worth tracking';

create index if not exists networth_items_user_type_idx
  on public.networth_items (user_id, item_type, created_at desc);

drop trigger if exists networth_items_set_updated_at on public.networth_items;
create trigger networth_items_set_updated_at
  before update on public.networth_items
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Upgrade patch (existing v1 deployments — no-op on fresh installs)
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists timezone text not null default 'Asia/Kolkata';

alter table public.credit_cards
  add column if not exists updated_at timestamptz not null default now();

alter table public.budgets
  add column if not exists updated_at timestamptz not null default now();

alter table public.networth_items
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.transactions
    alter column type type public.transaction_type using type::text::public.transaction_type;
exception when others then null;
end $$;

do $$ begin
  alter table public.budgets
    alter column period type public.budget_period using period::text::public.budget_period;
exception when others then null;
end $$;

do $$ begin
  alter table public.networth_items
    alter column item_type type public.networth_item_type
    using item_type::text::public.networth_item_type;
exception when others then null;
end $$;

-- -----------------------------------------------------------------------------
-- Auth: auto-create profile on signup
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Views (read-optimized, RLS applies via security_invoker)
-- -----------------------------------------------------------------------------
create or replace view public.v_monthly_category_spending
with (security_invoker = true)
as
select
  user_id,
  coalesce(category, 'Other') as category,
  date_trunc('month', transaction_date at time zone 'Asia/Kolkata') as month_start,
  sum(amount)::numeric(12, 2) as total_spent
from public.transactions
where type = 'expense'
group by user_id, coalesce(category, 'Other'), date_trunc('month', transaction_date at time zone 'Asia/Kolkata');

comment on view public.v_monthly_category_spending is 'Monthly expense totals grouped by category';

create or replace view public.v_budget_progress
with (security_invoker = true)
as
select
  b.id,
  b.user_id,
  b.name,
  b.category,
  b.amount as budget_amount,
  b.period,
  b.created_at,
  coalesce(s.total_spent, 0)::numeric(12, 2) as spent_amount,
  case
    when b.amount > 0 then round((coalesce(s.total_spent, 0) / b.amount) * 100, 1)
    else 0
  end as percent_used
from public.budgets b
left join public.v_monthly_category_spending s
  on s.user_id = b.user_id
  and s.category = coalesce(b.category, 'Other')
  and s.month_start = date_trunc('month', now() at time zone 'Asia/Kolkata');

comment on view public.v_budget_progress is 'Current-month budget utilization per budget row';

-- -----------------------------------------------------------------------------
-- RPC: Dashboard summary (1 call replaces 5+ queries)
-- -----------------------------------------------------------------------------
create or replace function public.get_dashboard_summary()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  with
    month_start as (
      select date_trunc('month', now() at time zone 'Asia/Kolkata') as start_at
    ),
    recent_tx as (
      select coalesce(
        json_agg(row_to_json(t) order by t.transaction_date desc),
        '[]'::json
      ) as data
      from (
        select
          tx.id,
          tx.title,
          tx.amount,
          tx.type,
          tx.category,
          tx.payment_method,
          tx.transaction_date
        from public.transactions tx
        where tx.user_id = auth.uid()
        order by tx.transaction_date desc
        limit 5
      ) t
    ),
    month_flow as (
      select
        coalesce(sum(tx.amount) filter (where tx.type = 'income'), 0)::numeric(12, 2) as income,
        coalesce(sum(tx.amount) filter (where tx.type = 'expense'), 0)::numeric(12, 2) as expense
      from public.transactions tx, month_start ms
      where tx.user_id = auth.uid()
        and tx.transaction_date >= ms.start_at
    ),
    counts as (
      select
        (select count(*)::int from public.credit_cards cc where cc.user_id = auth.uid()) as card_count,
        (select count(*)::int from public.budgets b where b.user_id = auth.uid()) as budget_count
    ),
    networth as (
      select
        coalesce(sum(ni.value) filter (where ni.item_type = 'asset'), 0)::numeric(14, 2)
          - coalesce(sum(ni.value) filter (where ni.item_type = 'liability'), 0)::numeric(14, 2) as total
      from public.networth_items ni
      where ni.user_id = auth.uid()
    )
  select json_build_object(
    'recent_transactions', (select data from recent_tx),
    'monthly_income', (select income from month_flow),
    'monthly_expense', (select expense from month_flow),
    'balance', (select income - expense from month_flow),
    'card_count', (select card_count from counts),
    'budget_count', (select budget_count from counts),
    'networth', (select total from networth)
  );
$$;

comment on function public.get_dashboard_summary() is 'Single-call dashboard aggregates and recent transactions';

-- -----------------------------------------------------------------------------
-- RPC: Budgets with current-month spend (1 call replaces 2 queries)
-- -----------------------------------------------------------------------------
create or replace function public.get_budgets_with_spent()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  with
    budget_rows as (
      select coalesce(
        json_agg(row_to_json(b) order by b.created_at desc),
        '[]'::json
      ) as data
      from (
        select b.id, b.name, b.category, b.amount, b.period, b.created_at
        from public.budgets b
        where b.user_id = auth.uid()
        order by b.created_at desc
      ) b
    ),
    spent as (
      select coalesce(
        json_object_agg(s.category, s.total_spent),
        '{}'::json
      ) as data
      from public.v_monthly_category_spending s
      where s.user_id = auth.uid()
        and s.month_start = date_trunc('month', now() at time zone 'Asia/Kolkata')
    )
  select json_build_object(
    'budgets', (select data from budget_rows),
    'spent_by_category', (select data from spent)
  );
$$;

comment on function public.get_budgets_with_spent() is 'Budgets list plus current-month spend by category';

-- -----------------------------------------------------------------------------
-- RPC: Net worth summary (1 call replaces list + client-side aggregation)
-- -----------------------------------------------------------------------------
create or replace function public.get_networth_summary()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  with
    items as (
      select coalesce(
        json_agg(row_to_json(n) order by n.created_at desc),
        '[]'::json
      ) as data
      from (
        select ni.id, ni.name, ni.item_type, ni.category, ni.value, ni.created_at
        from public.networth_items ni
        where ni.user_id = auth.uid()
        order by ni.created_at desc
      ) n
    ),
    totals as (
      select
        coalesce(sum(ni.value) filter (where ni.item_type = 'asset'), 0)::numeric(14, 2) as total_assets,
        coalesce(sum(ni.value) filter (where ni.item_type = 'liability'), 0)::numeric(14, 2) as total_liabilities
      from public.networth_items ni
      where ni.user_id = auth.uid()
    )
  select json_build_object(
    'items', (select data from items),
    'total_assets', (select total_assets from totals),
    'total_liabilities', (select total_liabilities from totals),
    'networth', (select total_assets - total_liabilities from totals)
  );
$$;

comment on function public.get_networth_summary() is 'Net worth items with pre-computed totals';

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.transaction_types enable row level security;
alter table public.finance_categories enable row level security;
alter table public.payment_methods enable row level security;
alter table public.financial_accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.credit_cards enable row level security;
alter table public.budgets enable row level security;
alter table public.networth_items enable row level security;

-- Profiles
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Taxonomy masters (read-only for authenticated; accounts per-user)
drop policy if exists "transaction_types_read" on public.transaction_types;
create policy "transaction_types_read" on public.transaction_types
  for select to authenticated
  using (is_active = true);

drop policy if exists "finance_categories_read" on public.finance_categories;
create policy "finance_categories_read" on public.finance_categories
  for select to authenticated
  using (is_active = true);

drop policy if exists "payment_methods_read" on public.payment_methods;
create policy "payment_methods_read" on public.payment_methods
  for select to authenticated
  using (is_active = true);

drop policy if exists "financial_accounts_select_own" on public.financial_accounts;
create policy "financial_accounts_select_own" on public.financial_accounts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "financial_accounts_insert_own" on public.financial_accounts;
create policy "financial_accounts_insert_own" on public.financial_accounts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "financial_accounts_update_own" on public.financial_accounts;
create policy "financial_accounts_update_own" on public.financial_accounts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "financial_accounts_delete_own" on public.financial_accounts;
create policy "financial_accounts_delete_own" on public.financial_accounts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Transactions
drop policy if exists "Users manage own transactions" on public.transactions;
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Credit cards
drop policy if exists "Users manage own cards" on public.credit_cards;
drop policy if exists "credit_cards_select_own" on public.credit_cards;
create policy "credit_cards_select_own" on public.credit_cards
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "credit_cards_insert_own" on public.credit_cards;
create policy "credit_cards_insert_own" on public.credit_cards
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "credit_cards_update_own" on public.credit_cards;
create policy "credit_cards_update_own" on public.credit_cards
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "credit_cards_delete_own" on public.credit_cards;
create policy "credit_cards_delete_own" on public.credit_cards
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Budgets
drop policy if exists "Users manage own budgets" on public.budgets;
drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own" on public.budgets
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own" on public.budgets
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own" on public.budgets
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own" on public.budgets
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Net worth
drop policy if exists "Users manage own networth" on public.networth_items;
drop policy if exists "networth_select_own" on public.networth_items;
create policy "networth_select_own" on public.networth_items
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "networth_insert_own" on public.networth_items;
create policy "networth_insert_own" on public.networth_items
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "networth_update_own" on public.networth_items;
create policy "networth_update_own" on public.networth_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "networth_delete_own" on public.networth_items;
create policy "networth_delete_own" on public.networth_items
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.v_monthly_category_spending to authenticated;
grant select on public.v_budget_progress to authenticated;

grant execute on function public.get_dashboard_summary() to authenticated;
grant execute on function public.get_budgets_with_spent() to authenticated;
grant execute on function public.get_networth_summary() to authenticated;
