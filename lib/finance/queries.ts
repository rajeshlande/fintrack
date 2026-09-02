import { createClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [txRes, cardsRes, budgetsRes, networthRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(5),
    supabase.from("credit_cards").select("*").eq("user_id", user.id),
    supabase.from("budgets").select("*").eq("user_id", user.id),
    supabase.from("networth_items").select("*").eq("user_id", user.id),
  ]);

  const monthTx = await supabase
    .from("transactions")
    .select("amount, type")
    .eq("user_id", user.id)
    .gte("transaction_date", monthStart);

  const transactions = txRes.data ?? [];
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
    transactions,
    monthlyIncome,
    monthlyExpense,
    balance: monthlyIncome - monthlyExpense,
    cardCount: cardsRes.data?.length ?? 0,
    budgetCount: budgetsRes.data?.length ?? 0,
    networth: assets - liabilities,
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

  return data ?? [];
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

  return data ?? [];
}

export async function getBudgets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { budgets: [], spentByCategory: {} as Record<string, number> };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [budgetsRes, txRes] = await Promise.all([
    supabase.from("budgets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("category, amount")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("transaction_date", monthStart),
  ]);

  const spentByCategory: Record<string, number> = {};
  for (const tx of txRes.data ?? []) {
    const cat = tx.category ?? "Other";
    spentByCategory[cat] = (spentByCategory[cat] ?? 0) + Number(tx.amount);
  }

  return { budgets: budgetsRes.data ?? [], spentByCategory };
}

export async function getNetworthItems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("networth_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}
