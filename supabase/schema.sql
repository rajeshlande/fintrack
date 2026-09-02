-- =============================================================================
-- FinTrack - Supabase Database Schema (single source of truth)
-- =============================================================================
-- Safe to run on fresh OR existing Supabase projects (idempotent).
-- Includes: enums, tables, upgrades, indexes, triggers, views, RPC functions,
-- granular RLS, grants, and master data seeds (transaction types, categories,
-- payment methods).
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

create index if not exists finance_categories_type_level_idx
  on public.finance_categories (transaction_type_id, level, sort_order);

create index if not exists finance_categories_active_idx
  on public.finance_categories (transaction_type_id, is_active, sort_order);

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
  category_id uuid references public.finance_categories (id) on delete set null,
  subcategory_id uuid references public.finance_categories (id) on delete set null,
  item_id uuid references public.finance_categories (id) on delete set null,
  payment_method_id uuid references public.payment_methods (id) on delete restrict,
  account_id uuid references public.financial_accounts (id) on delete set null
);

-- Upgrade existing transactions tables (no-op when columns already exist)
alter table public.transactions
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists merchant text,
  add column if not exists transaction_type_id uuid references public.transaction_types (id) on delete restrict,
  add column if not exists category_id uuid references public.finance_categories (id) on delete set null,
  add column if not exists subcategory_id uuid references public.finance_categories (id) on delete set null,
  add column if not exists item_id uuid references public.finance_categories (id) on delete set null,
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

-- Allow category permanent delete: clear transaction FKs automatically
alter table public.transactions drop constraint if exists transactions_category_id_fkey;
alter table public.transactions
  add constraint transactions_category_id_fkey
  foreign key (category_id) references public.finance_categories (id) on delete set null;

alter table public.transactions drop constraint if exists transactions_subcategory_id_fkey;
alter table public.transactions
  add constraint transactions_subcategory_id_fkey
  foreign key (subcategory_id) references public.finance_categories (id) on delete set null;

alter table public.transactions drop constraint if exists transactions_item_id_fkey;
alter table public.transactions
  add constraint transactions_item_id_fkey
  foreign key (item_id) references public.finance_categories (id) on delete set null;

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
-- Upgrade patch (existing v1 deployments - no-op on fresh installs)
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

drop policy if exists "finance_categories_insert" on public.finance_categories;
create policy "finance_categories_insert" on public.finance_categories
  for insert to authenticated
  with check (is_system = false);

drop policy if exists "finance_categories_update" on public.finance_categories;
create policy "finance_categories_update" on public.finance_categories
  for update to authenticated
  using (true)
  with check (true);

drop policy if exists "finance_categories_delete" on public.finance_categories;
create policy "finance_categories_delete" on public.finance_categories
  for delete to authenticated
  using (true);

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

-- -----------------------------------------------------------------------------
-- Master data seeds (transaction types, payment methods, finance categories)
-- -----------------------------------------------------------------------------

insert into public.transaction_types (code, name, description, sort_order)
values
  ('INCOME', 'Income', 'Money received', 1),
  ('EXPENSE', 'Expense', 'Money spent', 2),
  ('SAVING', 'Saving', 'Money set aside for future use', 3),
  ('INVESTMENT', 'Investment', 'Money invested for future returns', 4),
  ('TRANSFER', 'Transfer', 'Movement of money between accounts', 5)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

-- Drop legacy overloads so CREATE OR REPLACE cannot leave an old signature behind.
drop function if exists public.seed_finance_category(text, text, text, integer, text, text, integer);
drop function if exists public.seed_finance_category(text, text, text, integer, text, text, integer, text, text, text[]);

create or replace function public.seed_finance_category(
  p_type_code text,
  p_category_code text,
  p_name text,
  p_level integer,
  p_parent_code text default null,
  p_description text default null,
  p_sort_order integer default 0,
  p_icon text default null,
  p_color text default null,
  p_keywords text[] default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_transaction_type_id uuid;
  v_parent_id uuid;
  v_category_id uuid;
begin
  if p_level not between 1 and 3 then
    raise exception 'Invalid category level %. Allowed levels are 1, 2, or 3.', p_level;
  end if;

  select tt.id
  into v_transaction_type_id
  from public.transaction_types as tt
  where upper(tt.code) = upper(trim(p_type_code))
  limit 1;

  if v_transaction_type_id is null then
    raise exception 'Transaction type % does not exist.', p_type_code;
  end if;

  if p_parent_code is not null then
    select fc.id
    into v_parent_id
    from public.finance_categories as fc
    where fc.transaction_type_id = v_transaction_type_id
      and upper(fc.code) = upper(trim(p_parent_code))
      and fc.is_active = true
    limit 1;

    if v_parent_id is null then
      raise exception 'Parent category % does not exist for transaction type %.', p_parent_code, p_type_code;
    end if;
  else
    v_parent_id := null;
  end if;

  insert into public.finance_categories (
    transaction_type_id,
    parent_id,
    code,
    name,
    level,
    description,
    icon,
    color,
    keywords,
    sort_order,
    is_active,
    is_system
  )
  values (
    v_transaction_type_id,
    v_parent_id,
    upper(trim(p_category_code)),
    p_name,
    p_level,
    p_description,
    p_icon,
    p_color,
    p_keywords,
    p_sort_order,
    true,
    true
  )
  on conflict (transaction_type_id, code) do update set
    parent_id = excluded.parent_id,
    name = excluded.name,
    level = excluded.level,
    description = excluded.description,
    icon = excluded.icon,
    color = excluded.color,
    keywords = excluded.keywords,
    sort_order = excluded.sort_order,
    is_active = true,
    is_system = true
  returning id into v_category_id;

  return v_category_id;
end;
$$;

grant execute on function public.seed_finance_category(
  text, text, text, integer, text, text, integer, text, text, text[]
) to authenticated, service_role;

-- Payment methods (level 1)
insert into public.payment_methods (code, name, level, description, icon, sort_order)
values
  ('UPI', 'UPI', 1, 'Unified Payments Interface', 'smartphone', 1),
  ('CARD', 'Card', 1, 'Credit, debit and prepaid cards', 'credit-card', 2),
  ('BANK_TRANSFER', 'Bank Transfer', 1, 'Electronic bank-to-bank transfers', 'landmark', 3),
  ('NETBANKING', 'Net Banking', 1, 'Internet banking payment', 'globe', 4),
  ('CASH', 'Cash', 1, 'Physical cash payment', 'banknote', 5),
  ('WALLET', 'Wallet', 1, 'Digital or prepaid wallet', 'wallet', 6),
  ('CHEQUE', 'Cheque', 1, 'Cheque-based payment', 'file-text', 7),
  ('AUTO_DEBIT', 'Auto Debit', 1, 'Recurring or mandate-based payment', 'refresh-cw', 8),
  ('PAYMENT_GATEWAY', 'Payment Gateway', 1, 'Online payment gateway', 'shopping-cart', 9),
  ('OTHER', 'Other', 1, 'Other payment methods', 'more-horizontal', 10)
on conflict (code) do update set
  name = excluded.name,
  level = excluded.level,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = true;

-- Payment methods (level 2)
insert into public.payment_methods (parent_id, code, name, level, description, sort_order)
select p.id, v.code, v.name, 2, v.description, v.sort_order
from public.payment_methods p
cross join (values
  ('UPI_BANK_ACCOUNT', 'UPI - Bank Account', 'UPI payment from bank account', 1),
  ('UPI_LITE', 'UPI Lite', 'UPI Lite payment', 2),
  ('UPI_CREDIT_CARD', 'UPI - Credit Card', 'Credit card via UPI', 3),
  ('UPI_AUTOPAY', 'UPI Autopay', 'Recurring UPI mandate', 4)
) as v(code, name, description, sort_order)
where p.code = 'UPI'
on conflict (code) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.payment_methods (parent_id, code, name, level, description, sort_order)
select p.id, v.code, v.name, 2, v.description, v.sort_order
from public.payment_methods p
cross join (values
  ('CREDIT_CARD', 'Credit Card', 'Credit card payment', 1),
  ('DEBIT_CARD', 'Debit Card', 'Debit card payment', 2),
  ('PREPAID_CARD', 'Prepaid Card', 'Prepaid card payment', 3)
) as v(code, name, description, sort_order)
where p.code = 'CARD'
on conflict (code) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.payment_methods (parent_id, code, name, level, description, sort_order)
select p.id, v.code, v.name, 2, v.description, v.sort_order
from public.payment_methods p
cross join (values
  ('NEFT', 'NEFT', 'National Electronic Funds Transfer', 1),
  ('RTGS', 'RTGS', 'Real Time Gross Settlement', 2),
  ('IMPS', 'IMPS', 'Immediate Payment Service', 3),
  ('BANK_TO_BANK', 'Bank-to-Bank Transfer', 'Other bank transfer', 4)
) as v(code, name, description, sort_order)
where p.code = 'BANK_TRANSFER'
on conflict (code) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.payment_methods (parent_id, code, name, level, description, sort_order)
select p.id, v.code, v.name, 2, v.description, v.sort_order
from public.payment_methods p
cross join (values
  ('DIGITAL_WALLET', 'Digital Wallet', 'Digital wallet payment', 1),
  ('PREPAID_WALLET', 'Prepaid Wallet', 'Prepaid wallet balance', 2)
) as v(code, name, description, sort_order)
where p.code = 'WALLET'
on conflict (code) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.payment_methods (parent_id, code, name, level, description, sort_order)
select p.id, v.code, v.name, 2, v.description, v.sort_order
from public.payment_methods p
cross join (values
  ('NACH', 'NACH', 'National Automated Clearing House', 1),
  ('ECS', 'ECS', 'Electronic Clearing Service', 2),
  ('E_MANDATE', 'e-Mandate', 'Electronic mandate payment', 3)
) as v(code, name, description, sort_order)
where p.code = 'AUTO_DEBIT'
on conflict (code) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;


-- Finance categories (Indian personal budget taxonomy)
-- Requires seed_finance_category() above (run from "drop function if exists public.seed_finance_category" if seeds fail).

select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'EMPLOYMENT', p_name => 'Employment', p_level => 1, p_parent_code => null, p_description => $d$Salary and employment-related income$d$, p_sort_order => 1, p_icon => 'briefcase', p_color => '#16a34a', p_keywords => ARRAY['salary', 'job', 'employment', 'payroll']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'BUSINESS', p_name => 'Business / Professional', p_level => 1, p_parent_code => null, p_description => $d$Business, freelance and professional income$d$, p_sort_order => 2, p_icon => 'building-2', p_color => '#15803d', p_keywords => ARRAY['business', 'freelance', 'professional', 'consulting']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'INVESTMENT', p_name => 'Investment Income', p_level => 1, p_parent_code => null, p_description => $d$Income generated from investments$d$, p_sort_order => 3, p_icon => 'trending-up', p_color => '#059669', p_keywords => ARRAY['investment', 'returns', 'dividend', 'interest']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'PROPERTY', p_name => 'Property / Rental', p_level => 1, p_parent_code => null, p_description => $d$Rental and property income$d$, p_sort_order => 4, p_icon => 'home', p_color => '#0d9488', p_keywords => ARRAY['rent', 'rental', 'property', 'lease']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'RETIREMENT', p_name => 'Pension / Retirement', p_level => 1, p_parent_code => null, p_description => $d$Pension and retirement-related income$d$, p_sort_order => 5, p_icon => 'armchair', p_color => '#047857', p_keywords => ARRAY['pension', 'retirement', 'epf', 'annuity']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'GOVERNMENT', p_name => 'Government / Benefits', p_level => 1, p_parent_code => null, p_description => $d$Government benefits, refunds and subsidies$d$, p_sort_order => 6, p_icon => 'landmark', p_color => '#0f766e', p_keywords => ARRAY['government', 'subsidy', 'refund', 'benefit']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'OTHER', p_name => 'Other Income', p_level => 1, p_parent_code => null, p_description => $d$Other personal income$d$, p_sort_order => 7, p_icon => 'circle-dollar-sign', p_color => '#10b981', p_keywords => ARRAY['other', 'misc', 'gift', 'inheritance']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'SALARY', p_name => 'Salary', p_level => 2, p_parent_code => 'EMPLOYMENT', p_description => $d$Monthly or regular salary$d$, p_sort_order => 1, p_icon => 'wallet', p_color => '#16a34a', p_keywords => ARRAY['salary', 'ctc', 'pay', 'income']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'WAGES', p_name => 'Wages', p_level => 2, p_parent_code => 'EMPLOYMENT', p_description => $d$Hourly or daily wages$d$, p_sort_order => 2, p_icon => 'coins', p_color => '#16a34a', p_keywords => ARRAY['wages', 'daily wage', 'hourly']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'BONUS', p_name => 'Bonus', p_level => 2, p_parent_code => 'EMPLOYMENT', p_description => $d$Performance or festival bonus$d$, p_sort_order => 3, p_icon => 'gift', p_color => '#16a34a', p_keywords => ARRAY['bonus', 'incentive', 'diwali bonus']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'INCENTIVE', p_name => 'Incentive', p_level => 2, p_parent_code => 'EMPLOYMENT', p_description => $d$Sales or performance incentives$d$, p_sort_order => 4, p_icon => 'target', p_color => '#16a34a', p_keywords => ARRAY['incentive', 'commission', 'reward']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'COMMISSION', p_name => 'Commission', p_level => 2, p_parent_code => 'EMPLOYMENT', p_description => $d$Sales or referral commission$d$, p_sort_order => 5, p_icon => 'percent', p_color => '#16a34a', p_keywords => ARRAY['commission', 'sales', 'referral']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'OVERTIME', p_name => 'Overtime', p_level => 2, p_parent_code => 'EMPLOYMENT', p_description => $d$Overtime pay$d$, p_sort_order => 6, p_icon => 'clock', p_color => '#16a34a', p_keywords => ARRAY['overtime', 'ot', 'extra hours']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'ALLOWANCE', p_name => 'Allowances', p_level => 2, p_parent_code => 'EMPLOYMENT', p_description => $d$HRA, travel and other allowances$d$, p_sort_order => 7, p_icon => 'receipt', p_color => '#16a34a', p_keywords => ARRAY['allowance', 'hra', 'lta', 'travel']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'REIMBURSEMENT', p_name => 'Reimbursements', p_level => 2, p_parent_code => 'EMPLOYMENT', p_description => $d$Expense reimbursements from employer$d$, p_sort_order => 8, p_icon => 'rotate-ccw', p_color => '#16a34a', p_keywords => ARRAY['reimbursement', 'claim', 'refund']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'GRATUITY', p_name => 'Gratuity', p_level => 2, p_parent_code => 'EMPLOYMENT', p_description => $d$Gratuity payout on leaving job$d$, p_sort_order => 9, p_icon => 'award', p_color => '#16a34a', p_keywords => ARRAY['gratuity', 'retirement benefit']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'LEAVE_ENCASHMENT', p_name => 'Leave Encashment', p_level => 2, p_parent_code => 'EMPLOYMENT', p_description => $d$Encashed unused leave balance$d$, p_sort_order => 10, p_icon => 'calendar-off', p_color => '#16a34a', p_keywords => ARRAY['leave', 'encashment', 'pl', 'el']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'BUSINESS_INCOME', p_name => 'Business Income', p_level => 2, p_parent_code => 'BUSINESS', p_description => $d$Revenue from business operations$d$, p_sort_order => 1, p_icon => 'store', p_color => '#15803d', p_keywords => ARRAY['business', 'revenue', 'shop', 'sales']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'FREELANCE', p_name => 'Freelance', p_level => 2, p_parent_code => 'BUSINESS', p_description => $d$Freelance project income$d$, p_sort_order => 2, p_icon => 'laptop', p_color => '#15803d', p_keywords => ARRAY['freelance', 'gig', 'upwork', 'fiverr']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'CONSULTING', p_name => 'Consulting', p_level => 2, p_parent_code => 'BUSINESS', p_description => $d$Consulting fees$d$, p_sort_order => 3, p_icon => 'users', p_color => '#15803d', p_keywords => ARRAY['consulting', 'advisory', 'fees']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'PROFESSIONAL_FEES', p_name => 'Professional Fees', p_level => 2, p_parent_code => 'BUSINESS', p_description => $d$Professional service fees$d$, p_sort_order => 4, p_icon => 'file-badge', p_color => '#15803d', p_keywords => ARRAY['professional', 'fees', 'ca', 'lawyer']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'CONTRACT', p_name => 'Contract Income', p_level => 2, p_parent_code => 'BUSINESS', p_description => $d$Contract-based income$d$, p_sort_order => 5, p_icon => 'file-signature', p_color => '#15803d', p_keywords => ARRAY['contract', 'project', 'milestone']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'GIG', p_name => 'Gig Income', p_level => 2, p_parent_code => 'BUSINESS', p_description => $d$Gig economy earnings$d$, p_sort_order => 6, p_icon => 'bike', p_color => '#15803d', p_keywords => ARRAY['gig', 'zomato', 'swiggy', 'uber', 'ola']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'SIDE_HUSTLE', p_name => 'Side Hustle', p_level => 2, p_parent_code => 'BUSINESS', p_description => $d$Part-time side income$d$, p_sort_order => 7, p_icon => 'sparkles', p_color => '#15803d', p_keywords => ARRAY['side hustle', 'part time', 'extra income']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'INTEREST', p_name => 'Interest Income', p_level => 2, p_parent_code => 'INVESTMENT', p_description => $d$General interest income$d$, p_sort_order => 1, p_icon => 'percent', p_color => '#059669', p_keywords => ARRAY['interest', 'returns']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'SAVINGS_INTEREST', p_name => 'Savings Account Interest', p_level => 2, p_parent_code => 'INVESTMENT', p_description => $d$Interest from savings account$d$, p_sort_order => 2, p_icon => 'piggy-bank', p_color => '#059669', p_keywords => ARRAY['savings', 'interest', 'sb account']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'FD_INTEREST', p_name => 'FD Interest', p_level => 2, p_parent_code => 'INVESTMENT', p_description => $d$Fixed deposit interest$d$, p_sort_order => 3, p_icon => 'lock', p_color => '#059669', p_keywords => ARRAY['fd', 'fixed deposit', 'interest']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'RD_INTEREST', p_name => 'RD Interest', p_level => 2, p_parent_code => 'INVESTMENT', p_description => $d$Recurring deposit interest$d$, p_sort_order => 4, p_icon => 'repeat', p_color => '#059669', p_keywords => ARRAY['rd', 'recurring deposit', 'interest']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'BOND_INTEREST', p_name => 'Bond Interest', p_level => 2, p_parent_code => 'INVESTMENT', p_description => $d$Bond coupon or interest$d$, p_sort_order => 5, p_icon => 'file-text', p_color => '#059669', p_keywords => ARRAY['bond', 'coupon', 'interest']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'DIVIDEND', p_name => 'Dividend', p_level => 2, p_parent_code => 'INVESTMENT', p_description => $d$Stock or MF dividend$d$, p_sort_order => 6, p_icon => 'chart-pie', p_color => '#059669', p_keywords => ARRAY['dividend', 'mf', 'stock']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'CAPITAL_GAINS', p_name => 'Capital Gains', p_level => 2, p_parent_code => 'INVESTMENT', p_description => $d$Profit from selling investments$d$, p_sort_order => 7, p_icon => 'line-chart', p_color => '#059669', p_keywords => ARRAY['capital gains', 'ltcg', 'stcg', 'profit']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'RESIDENTIAL_RENT', p_name => 'Residential Rent', p_level => 2, p_parent_code => 'PROPERTY', p_description => $d$Rent from residential property$d$, p_sort_order => 1, p_icon => 'house', p_color => '#0d9488', p_keywords => ARRAY['rent', 'residential', 'flat', 'house']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'COMMERCIAL_RENT', p_name => 'Commercial Rent', p_level => 2, p_parent_code => 'PROPERTY', p_description => $d$Rent from commercial property$d$, p_sort_order => 2, p_icon => 'building', p_color => '#0d9488', p_keywords => ARRAY['commercial', 'shop', 'office rent']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'LEASE', p_name => 'Lease Income', p_level => 2, p_parent_code => 'PROPERTY', p_description => $d$Lease or sub-lease income$d$, p_sort_order => 3, p_icon => 'key', p_color => '#0d9488', p_keywords => ARRAY['lease', 'sublease', 'rental']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'PENSION', p_name => 'Pension', p_level => 2, p_parent_code => 'RETIREMENT', p_description => $d$Monthly pension income$d$, p_sort_order => 1, p_icon => 'armchair', p_color => '#047857', p_keywords => ARRAY['pension', 'govt pension', 'family pension']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'ANNUITY', p_name => 'Annuity', p_level => 2, p_parent_code => 'RETIREMENT', p_description => $d$Annuity payouts$d$, p_sort_order => 2, p_icon => 'calendar-clock', p_color => '#047857', p_keywords => ARRAY['annuity', 'pension plan']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'EPF_WITHDRAWAL', p_name => 'EPF Withdrawal', p_level => 2, p_parent_code => 'RETIREMENT', p_description => $d$EPF partial or full withdrawal$d$, p_sort_order => 3, p_icon => 'landmark', p_color => '#047857', p_keywords => ARRAY['epf', 'pf', 'provident fund']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'RETIREMENT_WITHDRAWAL', p_name => 'Retirement Withdrawal', p_level => 2, p_parent_code => 'RETIREMENT', p_description => $d$Withdrawal from retirement corpus$d$, p_sort_order => 4, p_icon => 'wallet-cards', p_color => '#047857', p_keywords => ARRAY['retirement', 'withdrawal', 'corpus']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'GOVERNMENT_BENEFIT', p_name => 'Government Benefit', p_level => 2, p_parent_code => 'GOVERNMENT', p_description => $d$Government welfare or benefit$d$, p_sort_order => 1, p_icon => 'landmark', p_color => '#0f766e', p_keywords => ARRAY['government', 'benefit', 'welfare', 'pm kisan']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'SUBSIDY', p_name => 'Subsidy', p_level => 2, p_parent_code => 'GOVERNMENT', p_description => $d$Government subsidy received$d$, p_sort_order => 2, p_icon => 'hand-coins', p_color => '#0f766e', p_keywords => ARRAY['subsidy', 'lpg', 'ration']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'SCHOLARSHIP', p_name => 'Scholarship', p_level => 2, p_parent_code => 'GOVERNMENT', p_description => $d$Scholarship or grant$d$, p_sort_order => 3, p_icon => 'graduation-cap', p_color => '#0f766e', p_keywords => ARRAY['scholarship', 'grant', 'stipend']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'TAX_REFUND', p_name => 'Tax Refund', p_level => 2, p_parent_code => 'GOVERNMENT', p_description => $d$Income tax refund$d$, p_sort_order => 4, p_icon => 'file-check', p_color => '#0f766e', p_keywords => ARRAY['tax refund', 'itr', 'tds refund']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'CASHBACK', p_name => 'Cashback', p_level => 2, p_parent_code => 'GOVERNMENT', p_description => $d$Cashback or reward credit$d$, p_sort_order => 5, p_icon => 'rotate-ccw', p_color => '#0f766e', p_keywords => ARRAY['cashback', 'reward', 'offer']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'GIFTS_RECEIVED', p_name => 'Gifts Received', p_level => 2, p_parent_code => 'OTHER', p_description => $d$Gifts received in cash or kind$d$, p_sort_order => 1, p_icon => 'gift', p_color => '#10b981', p_keywords => ARRAY['gift', 'shagun', 'present']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'INHERITANCE', p_name => 'Inheritance', p_level => 2, p_parent_code => 'OTHER', p_description => $d$Inherited money or assets$d$, p_sort_order => 2, p_icon => 'scroll', p_color => '#10b981', p_keywords => ARRAY['inheritance', 'will', 'legacy']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'ROYALTY', p_name => 'Royalties', p_level => 2, p_parent_code => 'OTHER', p_description => $d$Royalty or licensing income$d$, p_sort_order => 3, p_icon => 'copyright', p_color => '#10b981', p_keywords => ARRAY['royalty', 'licensing', 'ip']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'ASSET_SALE', p_name => 'Sale of Personal Asset', p_level => 2, p_parent_code => 'OTHER', p_description => $d$Sale of personal belongings$d$, p_sort_order => 4, p_icon => 'tag', p_color => '#10b981', p_keywords => ARRAY['asset sale', 'olx', 'resale']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'INSURANCE_PROCEEDS', p_name => 'Insurance Proceeds', p_level => 2, p_parent_code => 'OTHER', p_description => $d$Insurance claim payout$d$, p_sort_order => 5, p_icon => 'shield-check', p_color => '#10b981', p_keywords => ARRAY['insurance', 'claim', 'maturity']::text[]);
select public.seed_finance_category(p_type_code => 'INCOME', p_category_code => 'OTHER_INCOME', p_name => 'Other Income', p_level => 2, p_parent_code => 'OTHER', p_description => $d$Uncategorized income$d$, p_sort_order => 6, p_icon => 'circle-help', p_color => '#10b981', p_keywords => ARRAY['other', 'misc', 'unknown']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HOUSING', p_name => 'Housing', p_level => 1, p_parent_code => null, p_description => $d$Rent, home loan and housing costs$d$, p_sort_order => 1, p_icon => 'home', p_color => '#dc2626', p_keywords => ARRAY['housing', 'rent', 'home', 'accommodation']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FOOD', p_name => 'Food & Groceries', p_level => 1, p_parent_code => null, p_description => $d$Groceries, dining and food delivery$d$, p_sort_order => 2, p_icon => 'utensils', p_color => '#ea580c', p_keywords => ARRAY['food', 'groceries', 'dining', 'restaurant']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TRANSPORT', p_name => 'Transportation', p_level => 1, p_parent_code => null, p_description => $d$Travel, fuel and vehicle costs$d$, p_sort_order => 3, p_icon => 'car', p_color => '#d97706', p_keywords => ARRAY['transport', 'fuel', 'vehicle', 'commute']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HEALTHCARE', p_name => 'Healthcare & Medical', p_level => 1, p_parent_code => null, p_description => $d$Medical, pharmacy and wellness$d$, p_sort_order => 4, p_icon => 'heart-pulse', p_color => '#e11d48', p_keywords => ARRAY['health', 'medical', 'doctor', 'hospital']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'INSURANCE', p_name => 'Insurance', p_level => 1, p_parent_code => null, p_description => $d$Health, life and other insurance premiums$d$, p_sort_order => 5, p_icon => 'shield', p_color => '#be123c', p_keywords => ARRAY['insurance', 'premium', 'policy']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'EDUCATION', p_name => 'Education', p_level => 1, p_parent_code => null, p_description => $d$School, coaching and learning$d$, p_sort_order => 6, p_icon => 'graduation-cap', p_color => '#7c3aed', p_keywords => ARRAY['education', 'school', 'college', 'tuition']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'CHILDREN', p_name => 'Children & Dependents', p_level => 1, p_parent_code => null, p_description => $d$Childcare and children expenses$d$, p_sort_order => 7, p_icon => 'baby', p_color => '#a855f7', p_keywords => ARRAY['children', 'kids', 'childcare', 'dependents']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'UTILITIES', p_name => 'Utilities & Bills', p_level => 1, p_parent_code => null, p_description => $d$Electricity, water, gas and broadband$d$, p_sort_order => 8, p_icon => 'zap', p_color => '#ca8a04', p_keywords => ARRAY['utilities', 'bills', 'electricity', 'water']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'PERSONAL', p_name => 'Personal Care & Lifestyle', p_level => 1, p_parent_code => null, p_description => $d$Clothing, grooming and hobbies$d$, p_sort_order => 9, p_icon => 'shirt', p_color => '#db2777', p_keywords => ARRAY['personal', 'clothing', 'grooming', 'lifestyle']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TECHNOLOGY', p_name => 'Communication & Technology', p_level => 1, p_parent_code => null, p_description => $d$Mobile, internet and subscriptions$d$, p_sort_order => 10, p_icon => 'smartphone', p_color => '#2563eb', p_keywords => ARRAY['technology', 'mobile', 'internet', 'subscription']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'ENTERTAINMENT', p_name => 'Entertainment & Recreation', p_level => 1, p_parent_code => null, p_description => $d$Movies, travel and leisure$d$, p_sort_order => 11, p_icon => 'clapperboard', p_color => '#9333ea', p_keywords => ARRAY['entertainment', 'movies', 'travel', 'leisure']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FAMILY_SOCIAL', p_name => 'Family / Social / Religious', p_level => 1, p_parent_code => null, p_description => $d$Family support, events and religious$d$, p_sort_order => 12, p_icon => 'users', p_color => '#c026d3', p_keywords => ARRAY['family', 'social', 'religious', 'donation']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'SHOPPING', p_name => 'Shopping', p_level => 1, p_parent_code => null, p_description => $d$Online and retail shopping$d$, p_sort_order => 13, p_icon => 'shopping-bag', p_color => '#e11d48', p_keywords => ARRAY['shopping', 'amazon', 'flipkart', 'retail']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'DEBT', p_name => 'Debt & Credit', p_level => 1, p_parent_code => null, p_description => $d$Loan EMIs and credit card payments$d$, p_sort_order => 14, p_icon => 'credit-card', p_color => '#b91c1c', p_keywords => ARRAY['debt', 'loan', 'emi', 'credit card']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TAXES', p_name => 'Taxes & Government', p_level => 1, p_parent_code => null, p_description => $d$Income tax and government fees$d$, p_sort_order => 15, p_icon => 'landmark', p_color => '#991b1b', p_keywords => ARRAY['tax', 'income tax', 'gst', 'government']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FEES', p_name => 'Financial Fees & Charges', p_level => 1, p_parent_code => null, p_description => $d$Banking and investment fees$d$, p_sort_order => 16, p_icon => 'receipt', p_color => '#9f1239', p_keywords => ARRAY['fees', 'charges', 'banking', 'brokerage']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'GIFTS', p_name => 'Gifts & Donations', p_level => 1, p_parent_code => null, p_description => $d$Gifts, weddings and charity$d$, p_sort_order => 17, p_icon => 'gift', p_color => '#a21caf', p_keywords => ARRAY['gifts', 'donation', 'charity', 'wedding']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'MAJOR', p_name => 'Major / One-Time', p_level => 1, p_parent_code => null, p_description => $d$Large one-time purchases and events$d$, p_sort_order => 18, p_icon => 'gem', p_color => '#86198f', p_keywords => ARRAY['major', 'one time', 'emergency', 'renovation']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'MISC', p_name => 'Miscellaneous', p_level => 1, p_parent_code => null, p_description => $d$Unclassified and other expenses$d$, p_sort_order => 19, p_icon => 'circle-ellipsis', p_color => '#6b7280', p_keywords => ARRAY['misc', 'other', 'unclassified']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HOUSING_RENT', p_name => 'Rent & Accommodation', p_level => 2, p_parent_code => 'HOUSING', p_description => $d$Monthly rent or PG/hostel$d$, p_sort_order => 1, p_icon => 'key', p_color => '#dc2626', p_keywords => ARRAY['rent', 'pg', 'hostel', 'accommodation']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HOUSING_HOME_LOAN', p_name => 'Home Loan', p_level => 2, p_parent_code => 'HOUSING', p_description => $d$Home loan EMI$d$, p_sort_order => 2, p_icon => 'landmark', p_color => '#dc2626', p_keywords => ARRAY['home loan', 'emi', 'housing loan']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HOUSING_MAINTENANCE', p_name => 'Home Maintenance', p_level => 2, p_parent_code => 'HOUSING', p_description => $d$Repairs and maintenance$d$, p_sort_order => 3, p_icon => 'wrench', p_color => '#dc2626', p_keywords => ARRAY['maintenance', 'repair', 'plumber', 'painter']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HOUSING_HELP', p_name => 'Domestic Help', p_level => 2, p_parent_code => 'HOUSING', p_description => $d$Maid, cook or domestic help$d$, p_sort_order => 4, p_icon => 'user-round', p_color => '#dc2626', p_keywords => ARRAY['maid', 'cook', 'domestic help', 'servant']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HOUSING_PROPERTY_TAX', p_name => 'Property Tax', p_level => 2, p_parent_code => 'HOUSING', p_description => $d$Municipal property tax$d$, p_sort_order => 5, p_icon => 'file-text', p_color => '#dc2626', p_keywords => ARRAY['property tax', 'municipal', 'house tax']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FOOD_GROCERIES', p_name => 'Groceries', p_level => 2, p_parent_code => 'FOOD', p_description => $d$Supermarket and kirana$d$, p_sort_order => 1, p_icon => 'shopping-cart', p_color => '#ea580c', p_keywords => ARRAY['groceries', 'kirana', 'bigbasket', 'blinkit']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FOOD_DINING', p_name => 'Dining & Restaurants', p_level => 2, p_parent_code => 'FOOD', p_description => $d$Restaurant dining$d$, p_sort_order => 2, p_icon => 'utensils-crossed', p_color => '#ea580c', p_keywords => ARRAY['dining', 'restaurant', 'dine out']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FOOD_DELIVERY', p_name => 'Food Delivery', p_level => 2, p_parent_code => 'FOOD', p_description => $d$Swiggy, Zomato and delivery$d$, p_sort_order => 3, p_icon => 'bike', p_color => '#ea580c', p_keywords => ARRAY['swiggy', 'zomato', 'food delivery']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FOOD_CAFE', p_name => 'Cafe & Snacks', p_level => 2, p_parent_code => 'FOOD', p_description => $d$Cafe, tea and snacks$d$, p_sort_order => 4, p_icon => 'coffee', p_color => '#ea580c', p_keywords => ARRAY['cafe', 'tea', 'snacks', 'chai']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TRANSPORT_PUBLIC', p_name => 'Public Transportation', p_level => 2, p_parent_code => 'TRANSPORT', p_description => $d$Bus, metro and train$d$, p_sort_order => 1, p_icon => 'bus', p_color => '#d97706', p_keywords => ARRAY['bus', 'metro', 'train', 'local']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TRANSPORT_TAXI', p_name => 'Taxi & Ride-Hailing', p_level => 2, p_parent_code => 'TRANSPORT', p_description => $d$Uber, Ola and auto$d$, p_sort_order => 2, p_icon => 'car-taxi-front', p_color => '#d97706', p_keywords => ARRAY['uber', 'ola', 'rapido', 'auto']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TRANSPORT_FUEL', p_name => 'Fuel', p_level => 2, p_parent_code => 'TRANSPORT', p_description => $d$Petrol, diesel and CNG$d$, p_sort_order => 3, p_icon => 'fuel', p_color => '#d97706', p_keywords => ARRAY['petrol', 'diesel', 'cng', 'fuel']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TRANSPORT_VEHICLE', p_name => 'Vehicle Purchase / EMI', p_level => 2, p_parent_code => 'TRANSPORT', p_description => $d$Vehicle purchase or EMI$d$, p_sort_order => 4, p_icon => 'car-front', p_color => '#d97706', p_keywords => ARRAY['vehicle', 'car', 'bike', 'emi']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TRANSPORT_MAINTENANCE', p_name => 'Vehicle Maintenance', p_level => 2, p_parent_code => 'TRANSPORT', p_description => $d$Service and repairs$d$, p_sort_order => 5, p_icon => 'wrench', p_color => '#d97706', p_keywords => ARRAY['service', 'repair', 'mechanic']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TRANSPORT_PARKING', p_name => 'Parking & Toll', p_level => 2, p_parent_code => 'TRANSPORT', p_description => $d$Parking fees and tolls$d$, p_sort_order => 6, p_icon => 'parking-circle', p_color => '#d97706', p_keywords => ARRAY['parking', 'toll', 'fastag']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TRANSPORT_INSURANCE', p_name => 'Vehicle Insurance', p_level => 2, p_parent_code => 'TRANSPORT', p_description => $d$Motor insurance premium$d$, p_sort_order => 7, p_icon => 'shield', p_color => '#d97706', p_keywords => ARRAY['vehicle insurance', 'motor', 'car insurance']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HEALTHCARE_MEDICAL', p_name => 'Medical Care', p_level => 2, p_parent_code => 'HEALTHCARE', p_description => $d$Doctor visits and hospital$d$, p_sort_order => 1, p_icon => 'stethoscope', p_color => '#e11d48', p_keywords => ARRAY['doctor', 'hospital', 'clinic', 'medical']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HEALTHCARE_MEDICINES', p_name => 'Medicines & Pharmacy', p_level => 2, p_parent_code => 'HEALTHCARE', p_description => $d$Medicines and pharmacy$d$, p_sort_order => 2, p_icon => 'pill', p_color => '#e11d48', p_keywords => ARRAY['medicine', 'pharmacy', 'apollo', '1mg']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HEALTHCARE_DIAGNOSTICS', p_name => 'Diagnostics & Tests', p_level => 2, p_parent_code => 'HEALTHCARE', p_description => $d$Lab tests and scans$d$, p_sort_order => 3, p_icon => 'microscope', p_color => '#e11d48', p_keywords => ARRAY['lab', 'test', 'diagnostic', 'pathology']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HEALTHCARE_DENTAL', p_name => 'Dental & Optical', p_level => 2, p_parent_code => 'HEALTHCARE', p_description => $d$Dental and eye care$d$, p_sort_order => 4, p_icon => 'eye', p_color => '#e11d48', p_keywords => ARRAY['dental', 'optical', 'spectacles', 'lenskart']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'HEALTHCARE_WELLNESS', p_name => 'Wellness & Fitness', p_level => 2, p_parent_code => 'HEALTHCARE', p_description => $d$Gym, yoga and wellness$d$, p_sort_order => 5, p_icon => 'dumbbell', p_color => '#e11d48', p_keywords => ARRAY['gym', 'yoga', 'fitness', 'wellness']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'INSURANCE_HEALTH', p_name => 'Health Insurance', p_level => 2, p_parent_code => 'INSURANCE', p_description => $d$Health insurance premium$d$, p_sort_order => 1, p_icon => 'heart-pulse', p_color => '#be123c', p_keywords => ARRAY['health insurance', 'mediclaim']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'INSURANCE_LIFE', p_name => 'Life Insurance', p_level => 2, p_parent_code => 'INSURANCE', p_description => $d$Life insurance premium$d$, p_sort_order => 2, p_icon => 'shield-heart', p_color => '#be123c', p_keywords => ARRAY['life insurance', 'term plan', 'lic']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'INSURANCE_ACCIDENT', p_name => 'Personal Accident', p_level => 2, p_parent_code => 'INSURANCE', p_description => $d$Accident insurance$d$, p_sort_order => 3, p_icon => 'shield-alert', p_color => '#be123c', p_keywords => ARRAY['accident insurance', 'pa cover']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'INSURANCE_PROPERTY', p_name => 'Home Insurance', p_level => 2, p_parent_code => 'INSURANCE', p_description => $d$Home or property insurance$d$, p_sort_order => 4, p_icon => 'home', p_color => '#be123c', p_keywords => ARRAY['home insurance', 'property insurance']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'INSURANCE_TRAVEL', p_name => 'Travel Insurance', p_level => 2, p_parent_code => 'INSURANCE', p_description => $d$Travel insurance premium$d$, p_sort_order => 5, p_icon => 'plane', p_color => '#be123c', p_keywords => ARRAY['travel insurance', 'trip cover']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'EDUCATION_SCHOOL', p_name => 'School & College', p_level => 2, p_parent_code => 'EDUCATION', p_description => $d$School or college fees$d$, p_sort_order => 1, p_icon => 'school', p_color => '#7c3aed', p_keywords => ARRAY['school', 'college', 'fees', 'tuition']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'EDUCATION_COACHING', p_name => 'Coaching & Tuition', p_level => 2, p_parent_code => 'EDUCATION', p_description => $d$Coaching classes$d$, p_sort_order => 2, p_icon => 'book-open', p_color => '#7c3aed', p_keywords => ARRAY['coaching', 'tuition', 'jee', 'neet']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'EDUCATION_BOOKS', p_name => 'Books & Stationery', p_level => 2, p_parent_code => 'EDUCATION', p_description => $d$Books and stationery$d$, p_sort_order => 3, p_icon => 'book', p_color => '#7c3aed', p_keywords => ARRAY['books', 'stationery', 'notebook']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'EDUCATION_ONLINE', p_name => 'Online Courses', p_level => 2, p_parent_code => 'EDUCATION', p_description => $d$Online learning platforms$d$, p_sort_order => 4, p_icon => 'monitor-play', p_color => '#7c3aed', p_keywords => ARRAY['coursera', 'udemy', 'online course']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'CHILDREN_CHILDCARE', p_name => 'Childcare', p_level => 2, p_parent_code => 'CHILDREN', p_description => $d$Daycare and babysitting$d$, p_sort_order => 1, p_icon => 'baby', p_color => '#a855f7', p_keywords => ARRAY['childcare', 'daycare', 'nanny']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'CHILDREN_CLOTHING', p_name => 'Children Clothing', p_level => 2, p_parent_code => 'CHILDREN', p_description => $d$Kids clothing and shoes$d$, p_sort_order => 2, p_icon => 'shirt', p_color => '#a855f7', p_keywords => ARRAY['kids clothes', 'children wear']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'CHILDREN_SCHOOL', p_name => 'Children Education', p_level => 2, p_parent_code => 'CHILDREN', p_description => $d$Children school expenses$d$, p_sort_order => 3, p_icon => 'backpack', p_color => '#a855f7', p_keywords => ARRAY['school fees', 'children education']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'CHILDREN_ACTIVITIES', p_name => 'Activities & Hobbies', p_level => 2, p_parent_code => 'CHILDREN', p_description => $d$Kids classes and activities$d$, p_sort_order => 4, p_icon => 'palette', p_color => '#a855f7', p_keywords => ARRAY['activities', 'hobby class', 'sports']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'UTILITY_ELECTRICITY', p_name => 'Electricity', p_level => 2, p_parent_code => 'UTILITIES', p_description => $d$Electricity bill$d$, p_sort_order => 1, p_icon => 'zap', p_color => '#ca8a04', p_keywords => ARRAY['electricity', 'mseb', 'bescom', 'power bill']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'UTILITY_WATER', p_name => 'Water', p_level => 2, p_parent_code => 'UTILITIES', p_description => $d$Water bill$d$, p_sort_order => 2, p_icon => 'droplets', p_color => '#ca8a04', p_keywords => ARRAY['water bill', 'water supply']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'UTILITY_GAS', p_name => 'Gas / LPG', p_level => 2, p_parent_code => 'UTILITIES', p_description => $d$LPG cylinder or piped gas$d$, p_sort_order => 3, p_icon => 'flame', p_color => '#ca8a04', p_keywords => ARRAY['lpg', 'gas', 'indane', 'hp gas']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'UTILITY_INTERNET', p_name => 'Internet / Broadband', p_level => 2, p_parent_code => 'UTILITIES', p_description => $d$Broadband and WiFi$d$, p_sort_order => 4, p_icon => 'wifi', p_color => '#ca8a04', p_keywords => ARRAY['broadband', 'wifi', 'jio fiber', 'airtel']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'UTILITY_DTH', p_name => 'DTH / Cable TV', p_level => 2, p_parent_code => 'UTILITIES', p_description => $d$DTH or cable subscription$d$, p_sort_order => 5, p_icon => 'tv', p_color => '#ca8a04', p_keywords => ARRAY['dth', 'cable', 'tata play', 'dish tv']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'PERSONAL_CLOTHING', p_name => 'Clothing & Shoes', p_level => 2, p_parent_code => 'PERSONAL', p_description => $d$Clothes and footwear$d$, p_sort_order => 1, p_icon => 'shirt', p_color => '#db2777', p_keywords => ARRAY['clothing', 'shoes', 'fashion', 'myntra']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'PERSONAL_GROOMING', p_name => 'Grooming & Salon', p_level => 2, p_parent_code => 'PERSONAL', p_description => $d$Salon and grooming$d$, p_sort_order => 2, p_icon => 'scissors', p_color => '#db2777', p_keywords => ARRAY['salon', 'haircut', 'grooming', 'spa']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'PERSONAL_COSMETICS', p_name => 'Cosmetics & Skincare', p_level => 2, p_parent_code => 'PERSONAL', p_description => $d$Beauty and skincare$d$, p_sort_order => 3, p_icon => 'sparkles', p_color => '#db2777', p_keywords => ARRAY['cosmetics', 'skincare', 'nykaa']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'PERSONAL_HOBBIES', p_name => 'Hobbies & Lifestyle', p_level => 2, p_parent_code => 'PERSONAL', p_description => $d$Hobbies and lifestyle$d$, p_sort_order => 4, p_icon => 'palette', p_color => '#db2777', p_keywords => ARRAY['hobby', 'lifestyle', 'craft']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TECH_MOBILE', p_name => 'Mobile / Telecom', p_level => 2, p_parent_code => 'TECHNOLOGY', p_description => $d$Mobile recharge and plans$d$, p_sort_order => 1, p_icon => 'smartphone', p_color => '#2563eb', p_keywords => ARRAY['mobile', 'recharge', 'jio', 'airtel', 'vi']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TECH_INTERNET', p_name => 'Internet', p_level => 2, p_parent_code => 'TECHNOLOGY', p_description => $d$Internet subscription$d$, p_sort_order => 2, p_icon => 'globe', p_color => '#2563eb', p_keywords => ARRAY['internet', 'broadband']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TECH_SUBSCRIPTIONS', p_name => 'Digital Subscriptions', p_level => 2, p_parent_code => 'TECHNOLOGY', p_description => $d$Netflix, Spotify and apps$d$, p_sort_order => 3, p_icon => 'repeat', p_color => '#2563eb', p_keywords => ARRAY['netflix', 'spotify', 'subscription', 'prime']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TECH_ELECTRONICS', p_name => 'Electronics', p_level => 2, p_parent_code => 'TECHNOLOGY', p_description => $d$Gadgets and electronics$d$, p_sort_order => 4, p_icon => 'laptop', p_color => '#2563eb', p_keywords => ARRAY['electronics', 'gadget', 'laptop', 'phone']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'ENT_MOVIES', p_name => 'Movies & Theatre', p_level => 2, p_parent_code => 'ENTERTAINMENT', p_description => $d$Cinema and theatre$d$, p_sort_order => 1, p_icon => 'film', p_color => '#9333ea', p_keywords => ARRAY['movie', 'pvr', 'inox', 'theatre']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'ENT_GAMING', p_name => 'Gaming', p_level => 2, p_parent_code => 'ENTERTAINMENT', p_description => $d$Games and gaming$d$, p_sort_order => 2, p_icon => 'gamepad-2', p_color => '#9333ea', p_keywords => ARRAY['gaming', 'steam', 'playstation', 'xbox']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'ENT_SPORTS', p_name => 'Sports & Recreation', p_level => 2, p_parent_code => 'ENTERTAINMENT', p_description => $d$Sports and recreation$d$, p_sort_order => 3, p_icon => 'trophy', p_color => '#9333ea', p_keywords => ARRAY['sports', 'cricket', 'badminton', 'recreation']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'ENT_TRAVEL', p_name => 'Travel & Holidays', p_level => 2, p_parent_code => 'ENTERTAINMENT', p_description => $d$Vacation and travel$d$, p_sort_order => 4, p_icon => 'plane', p_color => '#9333ea', p_keywords => ARRAY['travel', 'holiday', 'vacation', 'makemytrip']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FAMILY_SUPPORT', p_name => 'Family Support', p_level => 2, p_parent_code => 'FAMILY_SOCIAL', p_description => $d$Money sent to family$d$, p_sort_order => 1, p_icon => 'users', p_color => '#c026d3', p_keywords => ARRAY['family', 'parents', 'support', 'remittance']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FAMILY_EVENTS', p_name => 'Family Events', p_level => 2, p_parent_code => 'FAMILY_SOCIAL', p_description => $d$Family gatherings and events$d$, p_sort_order => 2, p_icon => 'party-popper', p_color => '#c026d3', p_keywords => ARRAY['family event', 'function', 'gathering']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FAMILY_RELIGIOUS', p_name => 'Religious', p_level => 2, p_parent_code => 'FAMILY_SOCIAL', p_description => $d$Temple, puja and religious$d$, p_sort_order => 3, p_icon => 'church', p_color => '#c026d3', p_keywords => ARRAY['temple', 'puja', 'religious', 'donation']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FAMILY_DONATIONS', p_name => 'Donations & Charity', p_level => 2, p_parent_code => 'FAMILY_SOCIAL', p_description => $d$Charitable donations$d$, p_sort_order => 4, p_icon => 'hand-heart', p_color => '#c026d3', p_keywords => ARRAY['donation', 'charity', 'ngo']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'SHOPPING_ONLINE', p_name => 'Online Shopping', p_level => 2, p_parent_code => 'SHOPPING', p_description => $d$Amazon, Flipkart and online$d$, p_sort_order => 1, p_icon => 'shopping-cart', p_color => '#e11d48', p_keywords => ARRAY['amazon', 'flipkart', 'meesho', 'online']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'SHOPPING_OFFLINE', p_name => 'Retail Shopping', p_level => 2, p_parent_code => 'SHOPPING', p_description => $d$Mall and retail stores$d$, p_sort_order => 2, p_icon => 'store', p_color => '#e11d48', p_keywords => ARRAY['mall', 'retail', 'shopping']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'SHOPPING_ELECTRONICS', p_name => 'Electronics Shopping', p_level => 2, p_parent_code => 'SHOPPING', p_description => $d$Electronics purchase$d$, p_sort_order => 3, p_icon => 'cpu', p_color => '#e11d48', p_keywords => ARRAY['electronics', 'croma', 'reliance digital']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'SHOPPING_HOME', p_name => 'Home & Furniture', p_level => 2, p_parent_code => 'SHOPPING', p_description => $d$Furniture and home decor$d$, p_sort_order => 4, p_icon => 'sofa', p_color => '#e11d48', p_keywords => ARRAY['furniture', 'home decor', 'ikea', 'pepperfry']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'DEBT_HOME_LOAN', p_name => 'Home Loan', p_level => 2, p_parent_code => 'DEBT', p_description => $d$Home loan EMI payment$d$, p_sort_order => 1, p_icon => 'landmark', p_color => '#b91c1c', p_keywords => ARRAY['home loan emi', 'housing loan']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'DEBT_VEHICLE_LOAN', p_name => 'Vehicle Loan', p_level => 2, p_parent_code => 'DEBT', p_description => $d$Car or bike loan EMI$d$, p_sort_order => 2, p_icon => 'car', p_color => '#b91c1c', p_keywords => ARRAY['vehicle loan', 'car loan', 'bike loan']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'DEBT_PERSONAL', p_name => 'Personal Loan', p_level => 2, p_parent_code => 'DEBT', p_description => $d$Personal loan EMI$d$, p_sort_order => 3, p_icon => 'wallet', p_color => '#b91c1c', p_keywords => ARRAY['personal loan', 'emi', 'bajaj']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'DEBT_CREDIT_CARD', p_name => 'Credit Card', p_level => 2, p_parent_code => 'DEBT', p_description => $d$Credit card bill payment$d$, p_sort_order => 4, p_icon => 'credit-card', p_color => '#b91c1c', p_keywords => ARRAY['credit card', 'cc bill', 'hdfc', 'sbi card']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'DEBT_EDUCATION', p_name => 'Education Loan', p_level => 2, p_parent_code => 'DEBT', p_description => $d$Education loan EMI$d$, p_sort_order => 5, p_icon => 'graduation-cap', p_color => '#b91c1c', p_keywords => ARRAY['education loan', 'student loan']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'DEBT_GOLD_LOAN', p_name => 'Gold Loan', p_level => 2, p_parent_code => 'DEBT', p_description => $d$Gold loan repayment$d$, p_sort_order => 6, p_icon => 'gem', p_color => '#b91c1c', p_keywords => ARRAY['gold loan', 'muthoot', 'manappuram']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TAX_INCOME', p_name => 'Income Tax', p_level => 2, p_parent_code => 'TAXES', p_description => $d$Income tax payment$d$, p_sort_order => 1, p_icon => 'file-text', p_color => '#991b1b', p_keywords => ARRAY['income tax', 'advance tax', 'itr']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TAX_CAPITAL_GAINS', p_name => 'Capital Gains Tax', p_level => 2, p_parent_code => 'TAXES', p_description => $d$Capital gains tax$d$, p_sort_order => 2, p_icon => 'trending-up', p_color => '#991b1b', p_keywords => ARRAY['capital gains tax', 'ltcg', 'stcg']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TAX_PROPERTY', p_name => 'Property Tax', p_level => 2, p_parent_code => 'TAXES', p_description => $d$Property tax payment$d$, p_sort_order => 3, p_icon => 'home', p_color => '#991b1b', p_keywords => ARRAY['property tax', 'house tax']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TAX_VEHICLE', p_name => 'Vehicle / Road Tax', p_level => 2, p_parent_code => 'TAXES', p_description => $d$Road tax and RTO fees$d$, p_sort_order => 4, p_icon => 'car', p_color => '#991b1b', p_keywords => ARRAY['road tax', 'rto', 'vehicle tax']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'TAX_GOVERNMENT_FEES', p_name => 'Government Fees', p_level => 2, p_parent_code => 'TAXES', p_description => $d$Government and stamp duty$d$, p_sort_order => 5, p_icon => 'landmark', p_color => '#991b1b', p_keywords => ARRAY['stamp duty', 'registration', 'government fee']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FEES_BANKING', p_name => 'Banking Fees', p_level => 2, p_parent_code => 'FEES', p_description => $d$Bank charges and fees$d$, p_sort_order => 1, p_icon => 'landmark', p_color => '#9f1239', p_keywords => ARRAY['bank fee', 'charges', 'maintenance']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FEES_CARD', p_name => 'Card Fees', p_level => 2, p_parent_code => 'FEES', p_description => $d$Annual card fees$d$, p_sort_order => 2, p_icon => 'credit-card', p_color => '#9f1239', p_keywords => ARRAY['card fee', 'annual fee']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FEES_INVESTMENT', p_name => 'Investment Fees', p_level => 2, p_parent_code => 'FEES', p_description => $d$Brokerage and fund fees$d$, p_sort_order => 3, p_icon => 'chart-line', p_color => '#9f1239', p_keywords => ARRAY['brokerage', 'exit load', 'amc']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'FEES_PROFESSIONAL', p_name => 'Professional Fees', p_level => 2, p_parent_code => 'FEES', p_description => $d$CA, lawyer and consultant fees$d$, p_sort_order => 4, p_icon => 'briefcase', p_color => '#9f1239', p_keywords => ARRAY['ca fees', 'lawyer', 'consultant']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'GIFTS_FAMILY', p_name => 'Family Gifts', p_level => 2, p_parent_code => 'GIFTS', p_description => $d$Gifts for family$d$, p_sort_order => 1, p_icon => 'gift', p_color => '#a21caf', p_keywords => ARRAY['family gift', 'birthday', 'anniversary']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'GIFTS_WEDDING', p_name => 'Wedding & Functions', p_level => 2, p_parent_code => 'GIFTS', p_description => $d$Wedding gifts and shagun$d$, p_sort_order => 2, p_icon => 'rings', p_color => '#a21caf', p_keywords => ARRAY['wedding', 'shagun', 'function']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'GIFTS_FESTIVAL', p_name => 'Festival Gifts', p_level => 2, p_parent_code => 'GIFTS', p_description => $d$Diwali, Holi and festival gifts$d$, p_sort_order => 3, p_icon => 'sparkles', p_color => '#a21caf', p_keywords => ARRAY['diwali', 'holi', 'festival gift']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'GIFTS_DONATION', p_name => 'Charity & Donations', p_level => 2, p_parent_code => 'GIFTS', p_description => $d$Charitable giving$d$, p_sort_order => 4, p_icon => 'hand-heart', p_color => '#a21caf', p_keywords => ARRAY['charity', 'donation', 'daan']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'MAJOR_PURCHASE', p_name => 'Major Purchases', p_level => 2, p_parent_code => 'MAJOR', p_description => $d$Large purchases$d$, p_sort_order => 1, p_icon => 'shopping-bag', p_color => '#86198f', p_keywords => ARRAY['major purchase', 'big ticket']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'MAJOR_HOME', p_name => 'Home Renovation', p_level => 2, p_parent_code => 'MAJOR', p_description => $d$Home renovation and improvement$d$, p_sort_order => 2, p_icon => 'hammer', p_color => '#86198f', p_keywords => ARRAY['renovation', 'interior', 'modular kitchen']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'MAJOR_LIFE_EVENT', p_name => 'Life Events', p_level => 2, p_parent_code => 'MAJOR', p_description => $d$Wedding, birth and milestones$d$, p_sort_order => 3, p_icon => 'calendar-heart', p_color => '#86198f', p_keywords => ARRAY['wedding', 'life event', 'milestone']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'MAJOR_EMERGENCY', p_name => 'Emergency Expenses', p_level => 2, p_parent_code => 'MAJOR', p_description => $d$Unexpected emergency costs$d$, p_sort_order => 4, p_icon => 'alert-triangle', p_color => '#86198f', p_keywords => ARRAY['emergency', 'urgent', 'unexpected']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'MISC_UNCLASSIFIED', p_name => 'Unclassified', p_level => 2, p_parent_code => 'MISC', p_description => $d$Could not be categorized$d$, p_sort_order => 1, p_icon => 'circle-help', p_color => '#6b7280', p_keywords => ARRAY['unclassified', 'unknown']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'MISC_LOSS', p_name => 'Loss / Fraud', p_level => 2, p_parent_code => 'MISC', p_description => $d$Losses or fraud$d$, p_sort_order => 2, p_icon => 'shield-alert', p_color => '#6b7280', p_keywords => ARRAY['fraud', 'loss', 'scam']::text[]);
select public.seed_finance_category(p_type_code => 'EXPENSE', p_category_code => 'MISC_OTHER', p_name => 'Other Expense', p_level => 2, p_parent_code => 'MISC', p_description => $d$Other miscellaneous expense$d$, p_sort_order => 3, p_icon => 'circle-ellipsis', p_color => '#6b7280', p_keywords => ARRAY['other', 'misc']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'BANK_SAVINGS', p_name => 'Bank / Cash Savings', p_level => 1, p_parent_code => null, p_description => $d$Money intentionally set aside as savings$d$, p_sort_order => 1, p_icon => 'piggy-bank', p_color => '#2563eb', p_keywords => ARRAY['savings', 'bank', 'cash reserve']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'DEPOSITS', p_name => 'Deposits', p_level => 1, p_parent_code => null, p_description => $d$Fixed and recurring deposits$d$, p_sort_order => 2, p_icon => 'lock', p_color => '#1d4ed8', p_keywords => ARRAY['fd', 'rd', 'deposit']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'GOAL_SAVINGS', p_name => 'Goal-Based Savings', p_level => 1, p_parent_code => null, p_description => $d$Savings allocated toward financial goals$d$, p_sort_order => 3, p_icon => 'target', p_color => '#1e40af', p_keywords => ARRAY['goal', 'fund', 'sinking fund']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'SAVINGS_ACCOUNT', p_name => 'Savings Account', p_level => 2, p_parent_code => 'BANK_SAVINGS', p_description => $d$Transfer to savings account$d$, p_sort_order => 1, p_icon => 'wallet', p_color => '#2563eb', p_keywords => ARRAY['savings account', 'sb']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'EMERGENCY_FUND', p_name => 'Emergency Fund', p_level => 2, p_parent_code => 'BANK_SAVINGS', p_description => $d$Emergency fund contribution$d$, p_sort_order => 2, p_icon => 'shield', p_color => '#2563eb', p_keywords => ARRAY['emergency fund', 'rainy day']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'CASH_RESERVE', p_name => 'Cash Reserve', p_level => 2, p_parent_code => 'BANK_SAVINGS', p_description => $d$Cash kept aside$d$, p_sort_order => 3, p_icon => 'banknote', p_color => '#2563eb', p_keywords => ARRAY['cash', 'reserve', 'liquidity']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'FIXED_DEPOSIT', p_name => 'Fixed Deposit', p_level => 2, p_parent_code => 'DEPOSITS', p_description => $d$Fixed deposit booking$d$, p_sort_order => 1, p_icon => 'lock', p_color => '#1d4ed8', p_keywords => ARRAY['fd', 'fixed deposit']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'RECURRING_DEPOSIT', p_name => 'Recurring Deposit', p_level => 2, p_parent_code => 'DEPOSITS', p_description => $d$Recurring deposit contribution$d$, p_sort_order => 2, p_icon => 'repeat', p_color => '#1d4ed8', p_keywords => ARRAY['rd', 'recurring deposit']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'VACATION_FUND', p_name => 'Vacation Fund', p_level => 2, p_parent_code => 'GOAL_SAVINGS', p_description => $d$Saving for vacation$d$, p_sort_order => 1, p_icon => 'plane', p_color => '#1e40af', p_keywords => ARRAY['vacation', 'holiday fund', 'travel']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'EDUCATION_FUND', p_name => 'Education Fund', p_level => 2, p_parent_code => 'GOAL_SAVINGS', p_description => $d$Saving for education$d$, p_sort_order => 2, p_icon => 'graduation-cap', p_color => '#1e40af', p_keywords => ARRAY['education fund', 'child education']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'HOME_FUND', p_name => 'Home Purchase Fund', p_level => 2, p_parent_code => 'GOAL_SAVINGS', p_description => $d$Saving for home purchase$d$, p_sort_order => 3, p_icon => 'home', p_color => '#1e40af', p_keywords => ARRAY['home fund', 'down payment']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'WEDDING_FUND', p_name => 'Wedding Fund', p_level => 2, p_parent_code => 'GOAL_SAVINGS', p_description => $d$Saving for wedding$d$, p_sort_order => 4, p_icon => 'rings', p_color => '#1e40af', p_keywords => ARRAY['wedding fund', 'marriage']::text[]);
select public.seed_finance_category(p_type_code => 'SAVING', p_category_code => 'MAJOR_PURCHASE_FUND', p_name => 'Major Purchase Fund', p_level => 2, p_parent_code => 'GOAL_SAVINGS', p_description => $d$Saving for large purchase$d$, p_sort_order => 5, p_icon => 'shopping-bag', p_color => '#1e40af', p_keywords => ARRAY['major purchase', 'goal fund']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'EQUITY', p_name => 'Equity', p_level => 1, p_parent_code => null, p_description => $d$Stocks and equity instruments$d$, p_sort_order => 1, p_icon => 'trending-up', p_color => '#7c3aed', p_keywords => ARRAY['equity', 'stocks', 'shares']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'MUTUAL_FUNDS', p_name => 'Mutual Funds', p_level => 1, p_parent_code => null, p_description => $d$Mutual fund investments$d$, p_sort_order => 2, p_icon => 'chart-pie', p_color => '#6d28d9', p_keywords => ARRAY['mutual fund', 'mf', 'sip']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'FIXED_INCOME', p_name => 'Fixed Income', p_level => 1, p_parent_code => null, p_description => $d$Bonds and fixed income$d$, p_sort_order => 3, p_icon => 'file-text', p_color => '#5b21b6', p_keywords => ARRAY['bonds', 'fixed income', 'debt']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'GOVERNMENT_SCHEMES', p_name => 'Government Schemes', p_level => 1, p_parent_code => null, p_description => $d$PPF, NSC and govt schemes$d$, p_sort_order => 4, p_icon => 'landmark', p_color => '#4c1d95', p_keywords => ARRAY['ppf', 'nsc', 'government scheme']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'RETIREMENT', p_name => 'Retirement Investments', p_level => 1, p_parent_code => null, p_description => $d$EPF, NPS and retirement$d$, p_sort_order => 5, p_icon => 'armchair', p_color => '#581c87', p_keywords => ARRAY['epf', 'nps', 'retirement']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'GOLD', p_name => 'Gold', p_level => 1, p_parent_code => null, p_description => $d$Gold investments$d$, p_sort_order => 6, p_icon => 'gem', p_color => '#a16207', p_keywords => ARRAY['gold', 'sovereign gold bond']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'REAL_ESTATE', p_name => 'Real Estate', p_level => 1, p_parent_code => null, p_description => $d$Property investments$d$, p_sort_order => 7, p_icon => 'building', p_color => '#854d0e', p_keywords => ARRAY['real estate', 'property', 'land']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'ALTERNATIVE', p_name => 'Alternative Investments', p_level => 1, p_parent_code => null, p_description => $d$REITs, InvITs and alternatives$d$, p_sort_order => 8, p_icon => 'layers', p_color => '#713f12', p_keywords => ARRAY['reit', 'invit', 'alternative']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'STOCKS', p_name => 'Stocks', p_level => 2, p_parent_code => 'EQUITY', p_description => $d$Direct stock investment$d$, p_sort_order => 1, p_icon => 'line-chart', p_color => '#7c3aed', p_keywords => ARRAY['stocks', 'shares', 'zerodha', 'groww']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'ETFS', p_name => 'Equity ETFs', p_level => 2, p_parent_code => 'EQUITY', p_description => $d$Exchange traded funds$d$, p_sort_order => 2, p_icon => 'bar-chart', p_color => '#7c3aed', p_keywords => ARRAY['etf', 'nifty etf', 'sensex etf']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'EQUITY_MF', p_name => 'Equity Mutual Funds', p_level => 2, p_parent_code => 'MUTUAL_FUNDS', p_description => $d$Equity mutual funds$d$, p_sort_order => 1, p_icon => 'chart-pie', p_color => '#6d28d9', p_keywords => ARRAY['equity mf', 'large cap', 'mid cap']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'DEBT_MF', p_name => 'Debt Mutual Funds', p_level => 2, p_parent_code => 'MUTUAL_FUNDS', p_description => $d$Debt mutual funds$d$, p_sort_order => 2, p_icon => 'chart-bar', p_color => '#6d28d9', p_keywords => ARRAY['debt mf', 'liquid fund']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'HYBRID_MF', p_name => 'Hybrid Mutual Funds', p_level => 2, p_parent_code => 'MUTUAL_FUNDS', p_description => $d$Balanced and hybrid funds$d$, p_sort_order => 3, p_icon => 'blend', p_color => '#6d28d9', p_keywords => ARRAY['hybrid', 'balanced advantage']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'INDEX_FUNDS', p_name => 'Index Funds', p_level => 2, p_parent_code => 'MUTUAL_FUNDS', p_description => $d$Index tracking funds$d$, p_sort_order => 4, p_icon => 'activity', p_color => '#6d28d9', p_keywords => ARRAY['index fund', 'nifty 50', 'passive']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'SIP', p_name => 'SIP', p_level => 2, p_parent_code => 'MUTUAL_FUNDS', p_description => $d$Systematic investment plan$d$, p_sort_order => 5, p_icon => 'calendar', p_color => '#6d28d9', p_keywords => ARRAY['sip', 'systematic', 'monthly invest']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'BONDS', p_name => 'Bonds', p_level => 2, p_parent_code => 'FIXED_INCOME', p_description => $d$Corporate and govt bonds$d$, p_sort_order => 1, p_icon => 'file-text', p_color => '#5b21b6', p_keywords => ARRAY['bonds', 'corporate bond']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'GOVERNMENT_SECURITIES', p_name => 'Government Securities', p_level => 2, p_parent_code => 'FIXED_INCOME', p_description => $d$G-Secs and T-Bills$d$, p_sort_order => 2, p_icon => 'landmark', p_color => '#5b21b6', p_keywords => ARRAY['g-sec', 't-bill', 'government bond']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'NCD', p_name => 'NCDs', p_level => 2, p_parent_code => 'FIXED_INCOME', p_description => $d$Non-convertible debentures$d$, p_sort_order => 3, p_icon => 'file-badge', p_color => '#5b21b6', p_keywords => ARRAY['ncd', 'debenture']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'PPF', p_name => 'PPF', p_level => 2, p_parent_code => 'GOVERNMENT_SCHEMES', p_description => $d$Public Provident Fund$d$, p_sort_order => 1, p_icon => 'landmark', p_color => '#4c1d95', p_keywords => ARRAY['ppf', 'provident fund']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'NSC', p_name => 'NSC', p_level => 2, p_parent_code => 'GOVERNMENT_SCHEMES', p_description => $d$National Savings Certificate$d$, p_sort_order => 2, p_icon => 'file-check', p_color => '#4c1d95', p_keywords => ARRAY['nsc', 'post office']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'SUKANYA', p_name => 'Sukanya Samriddhi', p_level => 2, p_parent_code => 'GOVERNMENT_SCHEMES', p_description => $d$Sukanya Samriddhi Yojana$d$, p_sort_order => 3, p_icon => 'baby', p_color => '#4c1d95', p_keywords => ARRAY['ssy', 'sukanya', 'girl child']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'KVP', p_name => 'KVP', p_level => 2, p_parent_code => 'GOVERNMENT_SCHEMES', p_description => $d$Kisan Vikas Patra$d$, p_sort_order => 4, p_icon => 'sprout', p_color => '#4c1d95', p_keywords => ARRAY['kvp', 'kisan vikas patra']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'EPF', p_name => 'EPF', p_level => 2, p_parent_code => 'RETIREMENT', p_description => $d$Employee Provident Fund$d$, p_sort_order => 1, p_icon => 'landmark', p_color => '#581c87', p_keywords => ARRAY['epf', 'pf contribution']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'VPF', p_name => 'VPF', p_level => 2, p_parent_code => 'RETIREMENT', p_description => $d$Voluntary Provident Fund$d$, p_sort_order => 2, p_icon => 'plus-circle', p_color => '#581c87', p_keywords => ARRAY['vpf', 'voluntary pf']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'NPS', p_name => 'NPS', p_level => 2, p_parent_code => 'RETIREMENT', p_description => $d$National Pension System$d$, p_sort_order => 3, p_icon => 'armchair', p_color => '#581c87', p_keywords => ARRAY['nps', 'pension', 'tier 1']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'PHYSICAL_GOLD', p_name => 'Physical Gold', p_level => 2, p_parent_code => 'GOLD', p_description => $d$Gold jewellery or coins$d$, p_sort_order => 1, p_icon => 'gem', p_color => '#a16207', p_keywords => ARRAY['gold', 'jewellery', 'coin']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'GOLD_ETF', p_name => 'Gold ETF', p_level => 2, p_parent_code => 'GOLD', p_description => $d$Gold exchange traded fund$d$, p_sort_order => 2, p_icon => 'bar-chart', p_color => '#a16207', p_keywords => ARRAY['gold etf', 'sgb']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'GOLD_FUND', p_name => 'Gold Mutual Fund', p_level => 2, p_parent_code => 'GOLD', p_description => $d$Gold mutual fund$d$, p_sort_order => 3, p_icon => 'chart-pie', p_color => '#a16207', p_keywords => ARRAY['gold fund', 'gold mf']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'RESIDENTIAL_PROPERTY', p_name => 'Residential Property', p_level => 2, p_parent_code => 'REAL_ESTATE', p_description => $d$Residential property investment$d$, p_sort_order => 1, p_icon => 'home', p_color => '#854d0e', p_keywords => ARRAY['residential', 'flat', 'apartment']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'COMMERCIAL_PROPERTY', p_name => 'Commercial Property', p_level => 2, p_parent_code => 'REAL_ESTATE', p_description => $d$Commercial property investment$d$, p_sort_order => 2, p_icon => 'building', p_color => '#854d0e', p_keywords => ARRAY['commercial', 'shop', 'office']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'LAND', p_name => 'Land', p_level => 2, p_parent_code => 'REAL_ESTATE', p_description => $d$Land purchase$d$, p_sort_order => 3, p_icon => 'map', p_color => '#854d0e', p_keywords => ARRAY['land', 'plot']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'REIT', p_name => 'REITs', p_level => 2, p_parent_code => 'ALTERNATIVE', p_description => $d$Real Estate Investment Trust$d$, p_sort_order => 1, p_icon => 'building-2', p_color => '#713f12', p_keywords => ARRAY['reit', 'embassy', 'mindspace']::text[]);
select public.seed_finance_category(p_type_code => 'INVESTMENT', p_category_code => 'INVIT', p_name => 'InvITs', p_level => 2, p_parent_code => 'ALTERNATIVE', p_description => $d$Infrastructure Investment Trust$d$, p_sort_order => 2, p_icon => 'factory', p_color => '#713f12', p_keywords => ARRAY['invit', 'infrastructure']::text[]);
select public.seed_finance_category(p_type_code => 'TRANSFER', p_category_code => 'OWN_ACCOUNT', p_name => 'Own Account Transfer', p_level => 1, p_parent_code => null, p_description => $d$Transfer between accounts owned by the user$d$, p_sort_order => 1, p_icon => 'arrow-left-right', p_color => '#6b7280', p_keywords => ARRAY['own account', 'internal transfer']::text[]);
select public.seed_finance_category(p_type_code => 'TRANSFER', p_category_code => 'FAMILY', p_name => 'Family Transfer', p_level => 1, p_parent_code => null, p_description => $d$Money transferred to or from family$d$, p_sort_order => 2, p_icon => 'users', p_color => '#4b5563', p_keywords => ARRAY['family transfer', 'parents', 'spouse']::text[]);
select public.seed_finance_category(p_type_code => 'TRANSFER', p_category_code => 'SAVINGS_TRANSFER', p_name => 'Savings Transfer', p_level => 1, p_parent_code => null, p_description => $d$Transfer into savings$d$, p_sort_order => 3, p_icon => 'piggy-bank', p_color => '#52525b', p_keywords => ARRAY['savings transfer', 'to savings']::text[]);
select public.seed_finance_category(p_type_code => 'TRANSFER', p_category_code => 'INVESTMENT_TRANSFER', p_name => 'Investment Transfer', p_level => 1, p_parent_code => null, p_description => $d$Transfer into investment account$d$, p_sort_order => 4, p_icon => 'trending-up', p_color => '#3f3f46', p_keywords => ARRAY['investment transfer', 'to demat']::text[]);
select public.seed_finance_category(p_type_code => 'TRANSFER', p_category_code => 'BANK_TO_BANK', p_name => 'Bank to Bank', p_level => 2, p_parent_code => 'OWN_ACCOUNT', p_description => $d$Transfer between bank accounts$d$, p_sort_order => 1, p_icon => 'landmark', p_color => '#6b7280', p_keywords => ARRAY['neft', 'imps', 'rtgs', 'bank transfer']::text[]);
select public.seed_finance_category(p_type_code => 'TRANSFER', p_category_code => 'BANK_TO_WALLET', p_name => 'Bank to Wallet', p_level => 2, p_parent_code => 'OWN_ACCOUNT', p_description => $d$Bank to wallet transfer$d$, p_sort_order => 2, p_icon => 'wallet', p_color => '#6b7280', p_keywords => ARRAY['paytm', 'phonepe', 'wallet load']::text[]);
select public.seed_finance_category(p_type_code => 'TRANSFER', p_category_code => 'WALLET_TO_BANK', p_name => 'Wallet to Bank', p_level => 2, p_parent_code => 'OWN_ACCOUNT', p_description => $d$Wallet to bank withdrawal$d$, p_sort_order => 3, p_icon => 'banknote', p_color => '#6b7280', p_keywords => ARRAY['wallet withdraw', 'to bank']::text[]);
select public.seed_finance_category(p_type_code => 'TRANSFER', p_category_code => 'CREDIT_CARD_PAYMENT', p_name => 'Credit Card Payment', p_level => 2, p_parent_code => 'OWN_ACCOUNT', p_description => $d$Pay credit card bill$d$, p_sort_order => 4, p_icon => 'credit-card', p_color => '#6b7280', p_keywords => ARRAY['cc payment', 'credit card bill']::text[]);
select public.seed_finance_category(p_type_code => 'TRANSFER', p_category_code => 'BANK_TO_SAVINGS', p_name => 'Bank to Savings', p_level => 2, p_parent_code => 'SAVINGS_TRANSFER', p_description => $d$Move money to savings$d$, p_sort_order => 1, p_icon => 'piggy-bank', p_color => '#52525b', p_keywords => ARRAY['to savings', 'savings transfer']::text[]);
select public.seed_finance_category(p_type_code => 'TRANSFER', p_category_code => 'BANK_TO_INVESTMENT', p_name => 'Bank to Investment', p_level => 2, p_parent_code => 'INVESTMENT_TRANSFER', p_description => $d$Fund investment account$d$, p_sort_order => 1, p_icon => 'line-chart', p_color => '#3f3f46', p_keywords => ARRAY['to demat', 'investment funding']::text[]);
