"use client";

import { useActionState } from "react";
import { addNetworthAction, type ActionState } from "@/lib/finance/actions";

const initial: ActionState = { error: null };

export function NetworthForm() {
  const [state, action, pending] = useActionState(addNetworthAction, initial);

  return (
    <form action={action} className="space-y-3" suppressHydrationWarning>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          name="name"
          required
          placeholder="Name (e.g. FD, Home Loan)"
          className="input-glass"
          suppressHydrationWarning
        />
        <input
          name="value"
          type="number"
          min="0"
          required
          placeholder="Value ₹"
          className="input-glass"
          suppressHydrationWarning
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select name="item_type" required className="input-glass" suppressHydrationWarning>
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
        </select>
        <input
          name="category"
          placeholder="Category (e.g. Property, Loan)"
          className="input-glass"
          suppressHydrationWarning
        />
      </div>
      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">Item added.</p>}
      <button type="submit" disabled={pending} className="btn-primary sm:w-auto sm:px-8">
        {pending ? "Adding…" : "Add Item"}
      </button>
    </form>
  );
}
