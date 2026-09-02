-- =============================================================================
-- FinTrack — Taxonomy seeds (run after schema.sql)
-- Tables, FK columns, indexes, and RLS are defined in schema.sql.
-- This file seeds master data (transaction types, categories, payment methods).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Transaction types
-- -----------------------------------------------------------------------------
insert into public.transaction_types (code, name, description, sort_order)
values
  ('INCOME', 'Income', 'Money received', 1),
  ('EXPENSE', 'Expense', 'Money spent', 2)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

-- -----------------------------------------------------------------------------
-- Seed helper
-- -----------------------------------------------------------------------------
create or replace function public.seed_finance_category(
  p_type_code text,
  p_code text,
  p_name text,
  p_level integer,
  p_parent_code text default null,
  p_description text default null,
  p_sort_order integer default 0
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_type_id uuid;
  v_parent_id uuid;
  v_id uuid;
begin
  select id into v_type_id from public.transaction_types where code = p_type_code;
  if v_type_id is null then
    raise exception 'Transaction type % does not exist', p_type_code;
  end if;

  if p_parent_code is not null then
    select id into v_parent_id
    from public.finance_categories
    where transaction_type_id = v_type_id and code = p_parent_code;
  end if;

  insert into public.finance_categories (
    transaction_type_id, parent_id, code, name, level, description, sort_order
  )
  values (v_type_id, v_parent_id, p_code, p_name, p_level, p_description, p_sort_order)
  on conflict (transaction_type_id, code) do update set
    name = excluded.name,
    parent_id = excluded.parent_id,
    level = excluded.level,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = true
  returning id into v_id;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Seed payment methods (level 1)
-- -----------------------------------------------------------------------------
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

-- Payment methods (level 2) — UPI
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

-- Card children
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

-- Bank transfer children
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

-- Wallet children
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

-- Auto debit children
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
  sort_order = excluded.sort_order,
  is_active = true;

-- -----------------------------------------------------------------------------
-- 8. Seed finance categories — level 1
-- -----------------------------------------------------------------------------
select public.seed_finance_category('INCOME', 'EMPLOYMENT', 'Employment', 1, null, null, 1);
select public.seed_finance_category('INCOME', 'BUSINESS', 'Business / Professional', 1, null, null, 2);
select public.seed_finance_category('INCOME', 'INVESTMENT', 'Investment Income', 1, null, null, 3);
select public.seed_finance_category('INCOME', 'PROPERTY', 'Property / Rental', 1, null, null, 4);
select public.seed_finance_category('INCOME', 'OTHER', 'Other Income', 1, null, null, 5);

select public.seed_finance_category('EXPENSE', 'HOUSING', 'Housing', 1, null, null, 1);
select public.seed_finance_category('EXPENSE', 'FOOD', 'Food & Groceries', 1, null, null, 2);
select public.seed_finance_category('EXPENSE', 'TRANSPORT', 'Transportation', 1, null, null, 3);
select public.seed_finance_category('EXPENSE', 'HEALTHCARE', 'Healthcare & Medical', 1, null, null, 4);
select public.seed_finance_category('EXPENSE', 'EDUCATION', 'Education', 1, null, null, 5);
select public.seed_finance_category('EXPENSE', 'PERSONAL', 'Personal Care & Lifestyle', 1, null, null, 6);
select public.seed_finance_category('EXPENSE', 'ENTERTAINMENT', 'Entertainment & Recreation', 1, null, null, 7);
select public.seed_finance_category('EXPENSE', 'UTILITIES', 'Utilities & Bills', 1, null, null, 8);
select public.seed_finance_category('EXPENSE', 'DEBT', 'Debt & Credit', 1, null, null, 9);
select public.seed_finance_category('EXPENSE', 'MISC', 'Miscellaneous', 1, null, null, 10);

-- Level 2 — Income
select public.seed_finance_category('INCOME', 'SALARY', 'Salary', 2, 'EMPLOYMENT', null, 1);
select public.seed_finance_category('INCOME', 'BONUS', 'Bonus', 2, 'EMPLOYMENT', null, 2);
select public.seed_finance_category('INCOME', 'FREELANCE', 'Freelance', 2, 'BUSINESS', null, 1);

-- Level 2 — Expense / Food
select public.seed_finance_category('EXPENSE', 'FOOD_GROCERIES', 'Groceries', 2, 'FOOD', null, 1);
select public.seed_finance_category('EXPENSE', 'FOOD_DINING', 'Dining', 2, 'FOOD', null, 2);
select public.seed_finance_category('EXPENSE', 'FOOD_DELIVERY', 'Food Delivery', 2, 'FOOD', null, 3);

-- Level 2 — Housing
select public.seed_finance_category('EXPENSE', 'HOUSING_RENT', 'Rent & Accommodation', 2, 'HOUSING', null, 1);
select public.seed_finance_category('EXPENSE', 'HOUSING_MAINTENANCE', 'Home Maintenance', 2, 'HOUSING', null, 2);

-- Level 2 — Transport
select public.seed_finance_category('EXPENSE', 'TRANSPORT_FUEL', 'Fuel', 2, 'TRANSPORT', null, 1);
select public.seed_finance_category('EXPENSE', 'TRANSPORT_TAXI', 'Taxi & Ride-Hailing', 2, 'TRANSPORT', null, 2);
select public.seed_finance_category('EXPENSE', 'TRANSPORT_PUBLIC', 'Public Transport', 2, 'TRANSPORT', null, 3);

-- Level 3 — Food items
select public.seed_finance_category('EXPENSE', 'FOOD_RESTAURANT', 'Restaurant', 3, 'FOOD_DINING', null, 1);
select public.seed_finance_category('EXPENSE', 'FOOD_SWIGGY', 'Swiggy / Zomato', 3, 'FOOD_DELIVERY', null, 1);
select public.seed_finance_category('EXPENSE', 'FOOD_VEGETABLES', 'Vegetables', 3, 'FOOD_GROCERIES', null, 1);
