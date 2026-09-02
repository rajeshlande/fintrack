import { createClient } from "@/lib/supabase/server";
import type { FinanceCategory, TransactionTypeMaster } from "@/lib/finance/taxonomy-types";

export type CategoryManagementData = {
  transactionTypes: TransactionTypeMaster[];
  categories: FinanceCategory[];
};

const empty: CategoryManagementData = {
  transactionTypes: [],
  categories: [],
};

export async function getCategoriesForManagement(): Promise<CategoryManagementData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const [typesRes, categoriesRes] = await Promise.all([
    supabase
      .from("transaction_types")
      .select("id, code, name")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("finance_categories")
      .select(
        "id, code, name, level, parent_id, transaction_type_id, description, icon, color, keywords, sort_order, is_system, is_active"
      )
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (typesRes.error || categoriesRes.error) return empty;

  return {
    transactionTypes: typesRes.data ?? [],
    categories: (categoriesRes.data ?? []) as FinanceCategory[],
  };
}
