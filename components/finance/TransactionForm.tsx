"use client";

import { useActionState } from "react";
import { addTransactionAction, type ActionState } from "@/lib/finance/actions";

const initial: ActionState = { error: null };

export function TransactionForm() {
  const [state, action, pending] = useActionState(addTransactionAction, initial);

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="title" required placeholder="Title (e.g. Swiggy)" className="input-glass" />
        <input name="amount" type="number" step="0.01" min="0" required placeholder="Amount ₹" className="input-glass" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select name="type" required className="input-glass">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input name="category" placeholder="Category" className="input-glass" />
        <select name="payment_method" className="input-glass">
          <option value="UPI">UPI</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </div>
      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">Transaction added.</p>}
      <button type="submit" disabled={pending} className="btn-primary sm:w-auto sm:px-8">
        {pending ? "Adding…" : "Add Transaction"}
      </button>
    </form>
  );
}
