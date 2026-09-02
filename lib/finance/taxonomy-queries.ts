import { createClient } from "@/lib/supabase/server";
import type { TransactionTaxonomy } from "@/lib/finance/taxonomy-types";

const emptyTaxonomy: TransactionTaxonomy = {
  transactionTypes: [],
  categories: [],
  paymentMethods: [],
  accounts: [],
};

export async function getTransactionTaxonomy(): Promise<TransactionTaxonomy> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return emptyTaxonomy;

  const [typesRes, categoriesRes, methodsRes, accountsRes] = await Promise.all([
    supabase
      .from("transaction_types")
      .select("id, code, name")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("finance_categories")
      .select("id, code, name, level, parent_id, transaction_type_id")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("payment_methods")
      .select("id, code, name, level, parent_id")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("financial_accounts")
      .select("id, name, account_type, institution_name")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  if (typesRes.error || methodsRes.error) {
    return emptyTaxonomy;
  }

  return {
    transactionTypes: typesRes.data ?? [],
    categories: categoriesRes.data ?? [],
    paymentMethods: methodsRes.data ?? [],
    accounts: accountsRes.data ?? [],
  };
}

export async function lookupCategoryName(id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("finance_categories").select("name").eq("id", id).maybeSingle();
  return data?.name ?? null;
}

export async function lookupPaymentMethodName(id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("payment_methods").select("name").eq("id", id).maybeSingle();
  return data?.name ?? null;
}
