"use client";

import { useActionState } from "react";
import { addCardAction, type ActionState } from "@/lib/finance/actions";

const initial: ActionState = { error: null };

export function CardForm() {
  const [state, action, pending] = useActionState(addCardAction, initial);

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="bank_name" required placeholder="Bank (e.g. HDFC)" className="input-glass" />
        <input name="card_name" required placeholder="Card name" className="input-glass" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input name="last_four" maxLength={4} placeholder="Last 4 digits" className="input-glass" />
        <input name="credit_limit" type="number" min="0" placeholder="Limit ₹" className="input-glass" />
        <input name="outstanding" type="number" min="0" placeholder="Outstanding ₹" className="input-glass" />
        <input name="due_day" type="number" min="1" max="31" placeholder="Due day" className="input-glass" />
      </div>
      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">Card added.</p>}
      <button type="submit" disabled={pending} className="btn-primary sm:w-auto sm:px-8">
        {pending ? "Adding…" : "Add Card"}
      </button>
    </form>
  );
}
