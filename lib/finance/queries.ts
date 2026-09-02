import { createClient } from "@/lib/supabase/server";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string | null;
  payment_method: string;
  transaction_date: string;
  merchant?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  item_id?: string | null;
  payment_method_id?: string | null;
  account_id?: string | null;
  transaction_type_id?: string | null;
};

export type CreditCard = {
  id: string;
  user_id: string;
  bank_name: string;
  card_name: string;
  last_four: string | null;
  credit_limit: number;
  outstanding: number;
  due_day: number | null;
  created_at: string;
};

export type Budget = {
  id: string;
  name: string;
  category: string | null;
  amount: number;
  period: "monthly" | "annual";
  created_at: string;
};

export type NetworthItem = {
  id: string;
  name: string;
  item_type: "asset" | "liability";
  category: string | null;
  value: number;
  created_at: string;
};

type DashboardSummary = {
  recent_transactions: Transaction[];
  monthly_income: number;
  monthly_expense: number;
  balance: number;
  card_count: number;
  budget_count: number;
  networth: number;
};

type BudgetsWithSpent = {
  budgets: Budget[];
  spent_by_category: Record<string, number>;
};

type NetworthSummary = {
  items: NetworthItem[];
  total_assets: number;
  total_liabilities: number;
  networth: number;
};

/** Fallback when RPC functions are not yet deployed in Supabase. */
async function getDashboardDataLegacy(userId: string) {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [txRes, cardsRes, budgetsRes, networthRes, monthTx] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, title, amount, type, category, payment_method, transaction_date")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .limit(5),
    supabase.from("credit_cards").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("budgets").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("networth_items").select("value, item_type").eq("user_id", userId),
    supabase
      .from("transactions")
      .select("amount, type")
      .eq("user_id", userId)
      .gte("transaction_date", monthStart),
  ]);

  const monthTransactions = monthTx.data ?? [];
  const monthlyIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const monthlyExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const networthItems = networthRes.data ?? [];
  const assets = networthItems
    .filter((i) => i.item_type === "asset")
    .reduce((s, i) => s + Number(i.value), 0);
  const liabilities = networthItems
    .filter((i) => i.item_type === "liability")
    .reduce((s, i) => s + Number(i.value), 0);

  return {
    transactions: (txRes.data ?? []) as Transaction[],
    monthlyIncome,
    monthlyExpense,
    balance: monthlyIncome - monthlyExpense,
    cardCount: cardsRes.count ?? 0,
    budgetCount: budgetsRes.count ?? 0,
    networth: assets - liabilities,
  };
}

export async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_dashboard_summary");

  if (error || !data) {
    return getDashboardDataLegacy(user.id);
  }

  const summary = data as DashboardSummary;
  return {
    transactions: summary.recent_transactions ?? [],
    monthlyIncome: Number(summary.monthly_income ?? 0),
    monthlyExpense: Number(summary.monthly_expense ?? 0),
    balance: Number(summary.balance ?? 0),
    cardCount: Number(summary.card_count ?? 0),
    budgetCount: Number(summary.budget_count ?? 0),
    networth: Number(summary.networth ?? 0),
  };
}

export async function getTransactions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  return (data ?? []) as Transaction[];
}

export async function getCreditCards() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as CreditCard[];
}

async function getBudgetsLegacy(userId: string) {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [budgetsRes, txRes] = await Promise.all([
    supabase.from("budgets").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("category, amount")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("transaction_date", monthStart),
  ]);

  const spentByCategory: Record<string, number> = {};
  for (const tx of txRes.data ?? []) {
    const cat = tx.category ?? "Other";
    spentByCategory[cat] = (spentByCategory[cat] ?? 0) + Number(tx.amount);
  }

  return { budgets: (budgetsRes.data ?? []) as Budget[], spentByCategory };
}

export async function getBudgets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { budgets: [], spentByCategory: {} as Record<string, number> };

  const { data, error } = await supabase.rpc("get_budgets_with_spent");

  if (error || !data) {
    return getBudgetsLegacy(user.id);
  }

  const result = data as BudgetsWithSpent;
  return {
    budgets: (result.budgets ?? []) as Budget[],
    spentByCategory: (result.spent_by_category ?? {}) as Record<string, number>,
  };
}

async function getNetworthLegacy(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("networth_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const items = (data ?? []) as NetworthItem[];
  const totalAssets = items
    .filter((i) => i.item_type === "asset")
    .reduce((s, i) => s + Number(i.value), 0);
  const totalLiabilities = items
    .filter((i) => i.item_type === "liability")
    .reduce((s, i) => s + Number(i.value), 0);

  return {
    items,
    totalAssets,
    totalLiabilities,
    networth: totalAssets - totalLiabilities,
  };
}

export async function getNetworthItems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("get_networth_summary");

  if (error || !data) {
    return (await getNetworthLegacy(user.id)).items;
  }

  const result = data as NetworthSummary;
  return (result.items ?? []) as NetworthItem[];
}

export async function getNetworthSummary() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { items: [], totalAssets: 0, totalLiabilities: 0, networth: 0 };
  }

  const { data, error } = await supabase.rpc("get_networth_summary");

  if (error || !data) {
    return getNetworthLegacy(user.id);
  }

  const result = data as NetworthSummary;
  return {
    items: (result.items ?? []) as NetworthItem[],
    totalAssets: Number(result.total_assets ?? 0),
    totalLiabilities: Number(result.total_liabilities ?? 0),
    networth: Number(result.networth ?? 0),
  };
}
