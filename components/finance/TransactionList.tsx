"use client";

import { useCallback, useState } from "react";
import { deleteTransactionAction } from "@/lib/finance/actions";
import type { Transaction } from "@/lib/finance/queries";
import type { TransactionTaxonomy } from "@/lib/finance/taxonomy-types";
import { formatDate, formatDateShort, formatINR } from "@/lib/format";
import { TransactionForm } from "@/components/finance/TransactionForm";

type TransactionListProps = {
  transactions: Transaction[];
  taxonomy: TransactionTaxonomy;
};

function TypeIcon({ type }: { type: Transaction["type"] }) {
  const isIncome = type === "income";
  return (
    <div
      className={`flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 ${
        isIncome ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
      }`}
      aria-hidden="true"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {isIncome ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7 7 7-7" />
        )}
      </svg>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  variant,
  disabled,
}: {
  label: string;
  onClick: () => void;
  variant: "edit" | "delete";
  disabled?: boolean;
}) {
  const styles =
    variant === "edit"
      ? "text-gray-600 hover:text-[#1a1d23] hover:bg-black/5"
      : "text-red-500 hover:text-red-700 hover:bg-red-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex items-center justify-center gap-1.5 min-h-[var(--touch-min)] min-w-[var(--touch-min)] px-3 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${styles}`}
    >
      {variant === "edit" ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6h12z" />
        </svg>
      )}
      <span className="md:hidden">{label}</span>
    </button>
  );
}

export function TransactionList({ transactions, taxonomy }: TransactionListProps) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const closeEdit = useCallback(() => setEditing(null), []);

  async function handleDelete(tx: Transaction) {
    if (!window.confirm(`Delete "${tx.title}"? This cannot be undone.`)) return;
    setDeletingId(tx.id);
    try {
      await deleteTransactionAction(tx.id);
    } finally {
      setDeletingId(null);
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-white/40 px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-500">No transactions yet</p>
        <p className="text-xs text-gray-400 mt-1">Log your first income or expense above.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table header */}
      <div className="hidden md:grid md:grid-cols-[5.5rem_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_7rem_6.5rem] gap-3 px-4 pb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
        <span>Date</span>
        <span>Description</span>
        <span>Category</span>
        <span>Payment</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Actions</span>
      </div>

      <ul className="space-y-2 md:space-y-1">
        {transactions.map((tx) => {
          const isIncome = tx.type === "income";
          const amountClass = isIncome ? "text-emerald-600" : "text-red-500";
          const isDeleting = deletingId === tx.id;

          return (
            <li
              key={tx.id}
              className="rounded-2xl bg-white/60 border border-black/[0.05] hover:bg-white/80 transition-colors overflow-hidden"
            >
              {/* Mobile layout */}
              <div className="md:hidden p-3.5">
                <div className="flex items-start gap-3">
                  <TypeIcon type={tx.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-gray-900 truncate">{tx.title}</p>
                      <p className={`font-bold text-sm shrink-0 ${amountClass}`}>
                        {isIncome ? "+" : "−"} {formatINR(Number(tx.amount))}
                      </p>
                    </div>
                    {tx.category && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{tx.category}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateShort(tx.transaction_date)} · {tx.payment_method}
                      {tx.merchant ? ` · ${tx.merchant}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-black/[0.04]">
                  <ActionButton label="Edit" variant="edit" onClick={() => setEditing(tx)} />
                  <ActionButton
                    label="Delete"
                    variant="delete"
                    disabled={isDeleting}
                    onClick={() => handleDelete(tx)}
                  />
                </div>
              </div>

              {/* Desktop row */}
              <div className="hidden md:grid md:grid-cols-[5.5rem_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_7rem_6.5rem] md:items-center gap-3 px-4 py-3">
                <p className="text-xs font-medium text-gray-500">{formatDateShort(tx.transaction_date)}</p>
                <div className="min-w-0 flex items-center gap-3">
                  <TypeIcon type={tx.type} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{tx.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {isIncome ? "Income" : "Expense"}
                      {tx.merchant ? ` · ${tx.merchant}` : ""}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate">{tx.category ?? "—"}</p>
                <p className="text-xs text-gray-500 truncate">{tx.payment_method}</p>
                <p className={`text-sm font-bold text-right ${amountClass}`}>
                  {isIncome ? "+" : "−"} {formatINR(Number(tx.amount))}
                </p>
                <div className="flex items-center justify-end gap-0.5">
                  <ActionButton label="Edit" variant="edit" onClick={() => setEditing(tx)} />
                  <ActionButton
                    label="Delete"
                    variant="delete"
                    disabled={isDeleting}
                    onClick={() => handleDelete(tx)}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-transaction-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            aria-label="Close edit dialog"
            onClick={closeEdit}
          />
          <div className="relative w-full md:max-w-lg max-h-[92vh] md:max-h-[85vh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-white shadow-2xl border border-black/5">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-black/5 bg-white/95 backdrop-blur-sm rounded-t-3xl md:rounded-t-3xl">
              <div>
                <h2 id="edit-transaction-title" className="text-lg font-bold text-[#1a1d23]">
                  Edit transaction
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(editing.transaction_date)}</p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-black/5"
                aria-label="Close"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="p-5 pb-8">
              <TransactionForm
                key={editing.id}
                taxonomy={taxonomy}
                transaction={editing}
                onComplete={closeEdit}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
