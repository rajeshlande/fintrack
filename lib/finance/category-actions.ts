"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CategoryActionState = { error: string | null; success?: boolean };

function slugifyCode(name: string) {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/gi, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base || "CATEGORY"}_${suffix}`;
}

function parseKeywords(raw: string | null): string[] | null {
  if (!raw?.trim()) return null;
  const items = raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

async function getAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

async function getParentLevel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parentId: string | null
) {
  if (!parentId) return 0;
  const { data } = await supabase
    .from("finance_categories")
    .select("level")
    .eq("id", parentId)
    .maybeSingle();
  return data?.level ?? 0;
}

export async function saveCategoryAction(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const { supabase, userId } = await getAuthedClient();
  if (!userId) return { error: "Not authenticated." };

  const id = (formData.get("id") as string) || null;
  const name = (formData.get("name") as string)?.trim();
  const codeInput = (formData.get("code") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const icon = (formData.get("icon") as string)?.trim() || null;
  const color = (formData.get("color") as string)?.trim() || null;
  const keywords = parseKeywords(formData.get("keywords") as string);
  const transactionTypeId = formData.get("transaction_type_id") as string;
  const parentId = (formData.get("parent_id") as string) || null;
  const level = parseInt(formData.get("level") as string, 10);
  const sortOrder = parseInt(formData.get("sort_order") as string, 10) || 0;
  const isActive = formData.get("is_active") !== "false";

  if (!name) return { error: "Category name is required." };
  if (!transactionTypeId) return { error: "Transaction type is required." };
  if (level < 1 || level > 3) return { error: "Invalid category level." };

  if (parentId) {
    const parentLevel = await getParentLevel(supabase, parentId);
    if (parentLevel !== level - 1) {
      return { error: "Parent category does not match the selected level." };
    }
  } else if (level !== 1) {
    return { error: "Level 2 and 3 categories require a parent." };
  }

  const row = {
    transaction_type_id: transactionTypeId,
    parent_id: parentId,
    name,
    description,
    icon,
    color,
    keywords,
    level,
    sort_order: sortOrder,
    is_active: isActive,
  };

  if (id) {
    const { data: existing } = await supabase
      .from("finance_categories")
      .select("code, is_system")
      .eq("id", id)
      .maybeSingle();

    if (!existing) return { error: "Category not found." };

    const { error } = await supabase
      .from("finance_categories")
      .update({
        ...row,
        code: codeInput ? codeInput.toUpperCase() : existing.code,
      })
      .eq("id", id);

    if (error) return { error: error.message };
  } else {
    const code = (codeInput || slugifyCode(name)).toUpperCase();
    const { error } = await supabase.from("finance_categories").insert({
      ...row,
      code,
      is_system: false,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/transactions");
  return { error: null, success: true };
}

export async function hideCategoryAction(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const { supabase, userId } = await getAuthedClient();
  if (!userId) return { error: "Not authenticated." };

  const id = formData.get("id") as string;
  if (!id) return { error: "Category not found." };

  const { count: childCount } = await supabase
    .from("finance_categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id)
    .eq("is_active", true);

  if (childCount && childCount > 0) {
    return { error: "Hide or delete subcategories first." };
  }

  const { data: category } = await supabase
    .from("finance_categories")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!category) return { error: "Category not found." };

  const { error } = await supabase
    .from("finance_categories")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/transactions");
  return { error: null, success: true };
}

export async function deleteCategoryAction(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const { supabase, userId } = await getAuthedClient();
  if (!userId) return { error: "Not authenticated." };

  const id = formData.get("id") as string;
  if (!id) return { error: "Category not found." };

  const { data: category } = await supabase
    .from("finance_categories")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!category) return { error: "Category not found." };

  const { count: childCount } = await supabase
    .from("finance_categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);

  if (childCount && childCount > 0) {
    return { error: "Delete subcategories first." };
  }

  const { error } = await supabase.from("finance_categories").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { error: "Cannot delete this category because it is still referenced. Try Hide instead." };
    }
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/transactions");
  return { error: null, success: true };
}
