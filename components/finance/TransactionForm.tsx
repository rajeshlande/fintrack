"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import {
  addTransactionAction,
  updateTransactionAction,
  type ActionState,
} from "@/lib/finance/actions";
import type { Transaction } from "@/lib/finance/queries";
import type { TransactionTaxonomy } from "@/lib/finance/taxonomy-types";
import { resolvePaymentSelection } from "@/lib/finance/taxonomy-types";
import { toDateInputValue } from "@/lib/format";

const initial: ActionState = { error: null };

type TransactionFormProps = {
  taxonomy: TransactionTaxonomy;
  transaction?: Transaction | null;
  onComplete?: () => void;
};

export function TransactionForm({ taxonomy, transaction, onComplete }: TransactionFormProps) {
  const isEdit = Boolean(transaction);
  const [state, action, pending] = useActionState(
    isEdit ? updateTransactionAction : addTransactionAction,
    initial
  );
  const hasTaxonomy = taxonomy.paymentMethods.length > 0;

  const [typeCode, setTypeCode] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [itemId, setItemId] = useState("");
  const [paymentParentId, setPaymentParentId] = useState("");
  const [paymentChildId, setPaymentChildId] = useState("");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (!transaction) return;
    setTypeCode(transaction.type === "income" ? "INCOME" : "EXPENSE");
    setCategoryId(transaction.category_id ?? "");
    setSubcategoryId(transaction.subcategory_id ?? "");
    setItemId(transaction.item_id ?? "");
    const payment = resolvePaymentSelection(
      taxonomy.paymentMethods,
      transaction.payment_method_id
    );
    setPaymentParentId(payment.parentId);
    setPaymentChildId(payment.childId);
    setAccountId(transaction.account_id ?? "");
  }, [transaction, taxonomy.paymentMethods]);

  useEffect(() => {
    if (state?.success && onComplete) onComplete();
  }, [state?.success, onComplete]);

  const typeId = taxonomy.transactionTypes.find((t) => t.code === typeCode)?.id;

  const level1Categories = useMemo(
    () =>
      taxonomy.categories.filter(
        (c) => c.level === 1 && c.transaction_type_id === typeId
      ),
    [taxonomy.categories, typeId]
  );

  const level2Categories = useMemo(
    () =>
      taxonomy.categories.filter(
        (c) => c.level === 2 && c.parent_id === categoryId
      ),
    [taxonomy.categories, categoryId]
  );

  const level3Categories = useMemo(
    () =>
      taxonomy.categories.filter(
        (c) => c.level === 3 && c.parent_id === subcategoryId
      ),
    [taxonomy.categories, subcategoryId]
  );

  const paymentParents = useMemo(
    () => taxonomy.paymentMethods.filter((m) => m.level === 1),
    [taxonomy.paymentMethods]
  );

  const paymentChildren = useMemo(
    () =>
      taxonomy.paymentMethods.filter(
        (m) => m.level === 2 && m.parent_id === paymentParentId
      ),
    [taxonomy.paymentMethods, paymentParentId]
  );

  const resolvedPaymentMethodId = paymentChildId || paymentParentId || "";

  function onTypeChange(next: "INCOME" | "EXPENSE") {
    setTypeCode(next);
    setCategoryId("");
    setSubcategoryId("");
    setItemId("");
  }

  function onCategoryChange(id: string) {
    setCategoryId(id);
    setSubcategoryId("");
    setItemId("");
  }

  function onSubcategoryChange(id: string) {
    setSubcategoryId(id);
    setItemId("");
  }

  function onPaymentParentChange(id: string) {
    setPaymentParentId(id);
    setPaymentChildId("");
  }

  if (!hasTaxonomy) {
    return (
      <LegacyTransactionForm
        transaction={transaction}
        state={state}
        action={action}
        pending={pending}
        isEdit={isEdit}
      />
    );
  }

  return (
    <form action={action} className="space-y-4" suppressHydrationWarning>
      {isEdit && transaction && <input type="hidden" name="id" value={transaction.id} />}
      <input type="hidden" name="type" value={typeCode === "INCOME" ? "income" : "expense"} />
      <input type="hidden" name="transaction_type_id" value={typeId ?? ""} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="subcategory_id" value={subcategoryId} />
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="payment_method_id" value={resolvedPaymentMethodId} />

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Transaction type</p>
        <div className="grid grid-cols-2 gap-2">
          {(["EXPENSE", "INCOME"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onTypeChange(code)}
              className={`min-h-[var(--touch-min)] rounded-xl text-sm font-semibold border transition-colors ${
                typeCode === code
                  ? "bg-[#1a1d23] text-white border-[#1a1d23]"
                  : "bg-white/70 text-gray-600 border-black/5 hover:bg-white"
              }`}
            >
              {code === "INCOME" ? "Income" : "Expense"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={isEdit ? "edit-title" : "title"} className="block text-sm font-medium text-gray-700 mb-1.5">
            Title / Merchant
          </label>
          <input
            id={isEdit ? "edit-title" : "title"}
            name="title"
            required
            defaultValue={transaction?.title ?? ""}
            placeholder="e.g. Swiggy, Salary"
            className="input-glass"
            suppressHydrationWarning
          />
        </div>
        <div>
          <label htmlFor={isEdit ? "edit-amount" : "amount"} className="block text-sm font-medium text-gray-700 mb-1.5">
            Amount
          </label>
          <input
            id={isEdit ? "edit-amount" : "amount"}
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={transaction?.amount ?? ""}
            placeholder="Amount ₹"
            className="input-glass"
            suppressHydrationWarning
          />
        </div>
      </div>

      <div>
        <label htmlFor={isEdit ? "edit-date" : "transaction_date"} className="block text-sm font-medium text-gray-700 mb-1.5">
          Date
        </label>
        <input
          id={isEdit ? "edit-date" : "transaction_date"}
          name="transaction_date"
          type="date"
          required
          defaultValue={
            transaction
              ? toDateInputValue(transaction.transaction_date)
              : toDateInputValue(new Date().toISOString())
          }
          className="input-glass"
          suppressHydrationWarning
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor={isEdit ? "edit-category" : "category"} className="block text-sm font-medium text-gray-700 mb-1.5">
            Category
          </label>
          <select
            id={isEdit ? "edit-category" : "category"}
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="input-glass"
            suppressHydrationWarning
          >
            <option value="">Select category</option>
            {level1Categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={isEdit ? "edit-subcategory" : "subcategory"} className="block text-sm font-medium text-gray-700 mb-1.5">
            Subcategory
          </label>
          <select
            id={isEdit ? "edit-subcategory" : "subcategory"}
            value={subcategoryId}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            disabled={!categoryId || level2Categories.length === 0}
            className="input-glass disabled:opacity-50"
            suppressHydrationWarning
          >
            <option value="">Optional</option>
            {level2Categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={isEdit ? "edit-item" : "item"} className="block text-sm font-medium text-gray-700 mb-1.5">
            Item
          </label>
          <select
            id={isEdit ? "edit-item" : "item"}
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            disabled={!subcategoryId || level3Categories.length === 0}
            className="input-glass disabled:opacity-50"
            suppressHydrationWarning
          >
            <option value="">Optional</option>
            {level3Categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={isEdit ? "edit-payment-parent" : "payment_parent"} className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment method
          </label>
          <select
            id={isEdit ? "edit-payment-parent" : "payment_parent"}
            value={paymentParentId}
            onChange={(e) => onPaymentParentChange(e.target.value)}
            className="input-glass"
            suppressHydrationWarning
          >
            <option value="">Select method</option>
            {paymentParents.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={isEdit ? "edit-payment-child" : "payment_child"} className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment source
          </label>
          <select
            id={isEdit ? "edit-payment-child" : "payment_child"}
            value={paymentChildId}
            onChange={(e) => setPaymentChildId(e.target.value)}
            disabled={!paymentParentId || paymentChildren.length === 0}
            className="input-glass disabled:opacity-50"
            suppressHydrationWarning
          >
            <option value="">
              {paymentChildren.length === 0 ? "Not required" : "Select source"}
            </option>
            {paymentChildren.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {taxonomy.accounts.length > 0 && (
        <div>
          <label htmlFor={isEdit ? "edit-account_id" : "account_id"} className="block text-sm font-medium text-gray-700 mb-1.5">
            Account <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            id={isEdit ? "edit-account_id" : "account_id"}
            name="account_id"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="input-glass"
            suppressHydrationWarning
          >
            <option value="">No account linked</option>
            {taxonomy.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}{a.institution_name ? ` · ${a.institution_name}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor={isEdit ? "edit-merchant" : "merchant"} className="block text-sm font-medium text-gray-700 mb-1.5">
          Payee / Merchant <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id={isEdit ? "edit-merchant" : "merchant"}
          name="merchant"
          defaultValue={transaction?.merchant ?? ""}
          placeholder="e.g. Swiggy, Amazon"
          className="input-glass"
          suppressHydrationWarning
        />
      </div>

      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && !onComplete && (
        <p className="alert-success">{isEdit ? "Transaction updated." : "Transaction added."}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary sm:w-auto sm:px-8">
        {pending
          ? isEdit
            ? "Saving…"
            : "Adding…"
          : isEdit
            ? "Save changes"
            : `Log ${typeCode === "INCOME" ? "Income" : "Expense"}`}
      </button>
    </form>
  );
}

function LegacyTransactionForm({
  transaction,
  state,
  action,
  pending,
  isEdit,
}: {
  transaction?: Transaction | null;
  state: ActionState;
  action: (payload: FormData) => void;
  pending: boolean;
  isEdit: boolean;
}) {
  return (
    <form action={action} className="space-y-3" suppressHydrationWarning>
      {isEdit && transaction && <input type="hidden" name="id" value={transaction.id} />}
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        Run <code className="text-xs">supabase/taxonomy.sql</code> in Supabase to enable category and payment method masters.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          name="title"
          required
          defaultValue={transaction?.title ?? ""}
          placeholder="Title (e.g. Swiggy)"
          className="input-glass"
          suppressHydrationWarning
        />
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={transaction?.amount ?? ""}
          placeholder="Amount ₹"
          className="input-glass"
          suppressHydrationWarning
        />
      </div>
      <input
        name="transaction_date"
        type="date"
        required
        defaultValue={
          transaction
            ? toDateInputValue(transaction.transaction_date)
            : toDateInputValue(new Date().toISOString())
        }
        className="input-glass"
        suppressHydrationWarning
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          name="type"
          required
          defaultValue={transaction?.type ?? "expense"}
          className="input-glass"
          suppressHydrationWarning
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input
          name="category"
          defaultValue={transaction?.category ?? ""}
          placeholder="Category"
          className="input-glass"
          suppressHydrationWarning
        />
        <select
          name="payment_method"
          defaultValue={transaction?.payment_method ?? "UPI"}
          className="input-glass"
          suppressHydrationWarning
        >
          <option value="UPI">UPI</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </div>
      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">{isEdit ? "Transaction updated." : "Transaction added."}</p>}
      <button type="submit" disabled={pending} className="btn-primary sm:w-auto sm:px-8">
        {pending ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save changes" : "Add Transaction"}
      </button>
    </form>
  );
}
