export type TransactionTypeMaster = {
  id: string;
  code: string;
  name: string;
};

export type FinanceCategory = {
  id: string;
  code: string;
  name: string;
  level: number;
  parent_id: string | null;
  transaction_type_id: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  keywords?: string[] | null;
  sort_order?: number;
  is_system?: boolean;
  is_active?: boolean;
};

export type PaymentMethod = {
  id: string;
  code: string;
  name: string;
  level: number;
  parent_id: string | null;
};

export type FinancialAccount = {
  id: string;
  name: string;
  account_type: string;
  institution_name: string | null;
};

export type TransactionTaxonomy = {
  transactionTypes: TransactionTypeMaster[];
  categories: FinanceCategory[];
  paymentMethods: PaymentMethod[];
  accounts: FinancialAccount[];
};

export function typeCodeToEnum(code: string): "income" | "expense" {
  return code === "INCOME" ? "income" : "expense";
}

export function enumToTypeCode(type: "income" | "expense"): string {
  return type === "income" ? "INCOME" : "EXPENSE";
}

export function buildCategoryLabel(
  categories: FinanceCategory[],
  categoryId?: string | null,
  subcategoryId?: string | null,
  itemId?: string | null
): string | null {
  const parts: string[] = [];
  const byId = new Map(categories.map((c) => [c.id, c]));

  for (const id of [categoryId, subcategoryId, itemId]) {
    if (!id) continue;
    const cat = byId.get(id);
    if (cat) parts.push(cat.name);
  }

  return parts.length > 0 ? parts.join(" → ") : null;
}

export function resolvePaymentSelection(
  methods: PaymentMethod[],
  paymentMethodId?: string | null
): { parentId: string; childId: string } {
  if (!paymentMethodId) return { parentId: "", childId: "" };
  const method = methods.find((m) => m.id === paymentMethodId);
  if (!method) return { parentId: "", childId: "" };
  if (method.parent_id) {
    return { parentId: method.parent_id, childId: method.id };
  }
  return { parentId: method.id, childId: "" };
}

export function resolvePaymentMethodLabel(
  methods: PaymentMethod[],
  paymentMethodId?: string | null
): string {
  if (!paymentMethodId) return "UPI";
  const method = methods.find((m) => m.id === paymentMethodId);
  if (!method) return "UPI";
  if (method.parent_id) {
    const parent = methods.find((m) => m.id === method.parent_id);
    return parent ? `${parent.name} → ${method.name}` : method.name;
  }
  return method.name;
}

export function buildCategoryChildrenMap(categories: FinanceCategory[]) {
  const map = new Map<string | null, FinanceCategory[]>();
  for (const category of categories) {
    const key = category.parent_id;
    const list = map.get(key) ?? [];
    list.push(category);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
  }
  return map;
}
