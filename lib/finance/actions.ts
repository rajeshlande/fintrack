"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  buildCategoryLabel,
  resolvePaymentMethodLabel,
} from "@/lib/finance/taxonomy-types";
import { getTransactionTaxonomy } from "@/lib/finance/taxonomy-queries";

export type ActionState = { error: string | null; success?: boolean };

async function getUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function addTransactionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Not authenticated." };

  const title = (formData.get("title") as string)?.trim();
  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as "income" | "expense";
  const categoryId = (formData.get("category_id") as string) || null;
  const subcategoryId = (formData.get("subcategory_id") as string) || null;
  const itemId = (formData.get("item_id") as string) || null;
  const paymentMethodId = (formData.get("payment_method_id") as string) || null;
  const accountId = (formData.get("account_id") as string) || null;
  const transactionTypeId = (formData.get("transaction_type_id") as string) || null;
  const merchant = (formData.get("merchant") as string)?.trim() || null;
  const legacyCategory = (formData.get("category") as string)?.trim() || null;
  const legacyPaymentMethod = (formData.get("payment_method") as string) || "UPI";

  if (!title || isNaN(amount) || amount <= 0) {
    return { error: "Title and a valid amount are required." };
  }

  const taxonomy = await getTransactionTaxonomy();
  const categoryLabel =
    buildCategoryLabel(taxonomy.categories, categoryId, subcategoryId, itemId) ??
    legacyCategory;
  const paymentLabel = paymentMethodId
    ? resolvePaymentMethodLabel(taxonomy.paymentMethods, paymentMethodId)
    : legacyPaymentMethod;

  const row: Record<string, unknown> = {
    user_id: userId,
    title,
    amount,
    type,
    category: categoryLabel,
    payment_method: paymentLabel,
    merchant,
    transaction_date: formData.get("transaction_date") || new Date().toISOString(),
  };

  if (transactionTypeId) row.transaction_type_id = transactionTypeId;
  if (categoryId) row.category_id = categoryId;
  if (subcategoryId) row.subcategory_id = subcategoryId;
  if (itemId) row.item_id = itemId;
  if (paymentMethodId) row.payment_method_id = paymentMethodId;
  if (accountId) row.account_id = accountId;

  const { error } = await supabase.from("transactions").insert(row);

  if (error) return { error: error.message };
  revalidatePath("/transactions");
  revalidatePath("/");
  return { error: null, success: true };
}

export async function updateTransactionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Not authenticated." };

  const id = formData.get("id") as string;
  if (!id) return { error: "Transaction not found." };

  const title = (formData.get("title") as string)?.trim();
  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as "income" | "expense";
  const categoryId = (formData.get("category_id") as string) || null;
  const subcategoryId = (formData.get("subcategory_id") as string) || null;
  const itemId = (formData.get("item_id") as string) || null;
  const paymentMethodId = (formData.get("payment_method_id") as string) || null;
  const accountId = (formData.get("account_id") as string) || null;
  const transactionTypeId = (formData.get("transaction_type_id") as string) || null;
  const merchant = (formData.get("merchant") as string)?.trim() || null;
  const legacyCategory = (formData.get("category") as string)?.trim() || null;
  const legacyPaymentMethod = (formData.get("payment_method") as string) || "UPI";
  const transactionDate = (formData.get("transaction_date") as string) || new Date().toISOString();

  if (!title || isNaN(amount) || amount <= 0) {
    return { error: "Title and a valid amount are required." };
  }

  const taxonomy = await getTransactionTaxonomy();
  const categoryLabel =
    buildCategoryLabel(taxonomy.categories, categoryId, subcategoryId, itemId) ??
    legacyCategory;
  const paymentLabel = paymentMethodId
    ? resolvePaymentMethodLabel(taxonomy.paymentMethods, paymentMethodId)
    : legacyPaymentMethod;

  const row: Record<string, unknown> = {
    title,
    amount,
    type,
    category: categoryLabel,
    payment_method: paymentLabel,
    merchant,
    transaction_date: transactionDate,
    transaction_type_id: transactionTypeId || null,
    category_id: categoryId || null,
    subcategory_id: subcategoryId || null,
    item_id: itemId || null,
    payment_method_id: paymentMethodId || null,
    account_id: accountId || null,
  };

  const { error } = await supabase
    .from("transactions")
    .update(row)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  revalidatePath("/transactions");
  revalidatePath("/");
  return { error: null, success: true };
}

export async function deleteTransactionAction(id: string) {
  const { supabase, userId } = await getUserId();
  if (!userId) return;
  await supabase.from("transactions").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function addCardAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Not authenticated." };

  const bank_name = (formData.get("bank_name") as string)?.trim();
  const card_name = (formData.get("card_name") as string)?.trim();
  const last_four = (formData.get("last_four") as string)?.trim() || null;
  const credit_limit = parseFloat(formData.get("credit_limit") as string) || 0;
  const outstanding = parseFloat(formData.get("outstanding") as string) || 0;
  const due_day = parseInt(formData.get("due_day") as string) || null;

  if (!bank_name || !card_name) return { error: "Bank and card name are required." };

  const { error } = await supabase.from("credit_cards").insert({
    user_id: userId,
    bank_name,
    card_name,
    last_four,
    credit_limit,
    outstanding,
    due_day,
  });

  if (error) return { error: error.message };
  revalidatePath("/cards");
  return { error: null, success: true };
}

export async function deleteCardAction(id: string) {
  const { supabase, userId } = await getUserId();
  if (!userId) return;
  await supabase.from("credit_cards").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/cards");
}

export async function addBudgetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Not authenticated." };

  const name = (formData.get("name") as string)?.trim();
  const amount = parseFloat(formData.get("amount") as string);
  const period = (formData.get("period") as string) || "monthly";
  const category = (formData.get("category") as string)?.trim() || null;

  if (!name || isNaN(amount) || amount <= 0) {
    return { error: "Name and a valid amount are required." };
  }

  const { error } = await supabase.from("budgets").insert({
    user_id: userId,
    name,
    amount,
    period,
    category,
  });

  if (error) return { error: error.message };
  revalidatePath("/budgets");
  return { error: null, success: true };
}

export async function deleteBudgetAction(id: string) {
  const { supabase, userId } = await getUserId();
  if (!userId) return;
  await supabase.from("budgets").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/budgets");
}

export async function addNetworthAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Not authenticated." };

  const name = (formData.get("name") as string)?.trim();
  const value = parseFloat(formData.get("value") as string);
  const item_type = formData.get("item_type") as "asset" | "liability";
  const category = (formData.get("category") as string)?.trim() || null;

  if (!name || isNaN(value) || value <= 0) {
    return { error: "Name and a valid value are required." };
  }

  const { error } = await supabase.from("networth_items").insert({
    user_id: userId,
    name,
    value,
    item_type,
    category,
  });

  if (error) return { error: error.message };
  revalidatePath("/networth");
  return { error: null, success: true };
}

export async function deleteNetworthAction(id: string) {
  const { supabase, userId } = await getUserId();
  if (!userId) return;
  await supabase.from("networth_items").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/networth");
}
