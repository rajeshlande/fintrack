"use client";

import { useActionState } from "react";
import { addBudgetAction, type ActionState } from "@/lib/finance/actions";

const initial: ActionState = { error: null };

export function BudgetForm() {
  const [state, action, pending] = useActionState(addBudgetAction, initial);

  return (
    <form action={action} className="space-y-3" suppressHydrationWarning>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          name="name"
          required
          placeholder="Budget name"
          className="input-glass"
          suppressHydrationWarning
        />
        <input
          name="amount"
          type="number"
          min="0"
          required
          placeholder="Amount ₹"
          className="input-glass"
          suppressHydrationWarning
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          name="category"
          placeholder="Category (e.g. Food)"
          className="input-glass"
          suppressHydrationWarning
        />
        <select name="period" className="input-glass" suppressHydrationWarning>
          <option value="monthly">Monthly</option>
          <option value="annual">Annual</option>
        </select>
      </div>
      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">Budget created.</p>}
      <button type="submit" disabled={pending} className="btn-primary sm:w-auto sm:px-8">
        {pending ? "Adding…" : "Add Budget"}
      </button>
    </form>
  );
}
