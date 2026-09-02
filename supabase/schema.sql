-- FinTrack schema — run in Supabase SQL Editor

-- Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  currency text default 'INR' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Transactions
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  amount numeric(12, 2) not null,
  type text check (type in ('income', 'expense')) not null,
  category text,
  payment_method text default 'UPI',
  transaction_date timestamptz default now() not null,
  created_at timestamptz default now() not null
);

alter table public.transactions enable row level security;
create policy "Users manage own transactions" on public.transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_date_idx on public.transactions (transaction_date desc);

-- Credit cards
create table if not exists public.credit_cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  bank_name text not null,
  card_name text not null,
  last_four text,
  credit_limit numeric(12, 2) default 0,
  outstanding numeric(12, 2) default 0,
  due_day integer check (due_day between 1 and 31),
  created_at timestamptz default now() not null
);

alter table public.credit_cards enable row level security;
create policy "Users manage own cards" on public.credit_cards for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Budgets
create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text,
  amount numeric(12, 2) not null,
  period text check (period in ('monthly', 'annual')) default 'monthly' not null,
  created_at timestamptz default now() not null
);

alter table public.budgets enable row level security;
create policy "Users manage own budgets" on public.budgets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Net worth items
create table if not exists public.networth_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  item_type text check (item_type in ('asset', 'liability')) not null,
  category text,
  value numeric(14, 2) not null,
  created_at timestamptz default now() not null
);

alter table public.networth_items enable row level security;
create policy "Users manage own networth" on public.networth_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
