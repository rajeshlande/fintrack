import { PageLayout } from "@/components/layout/PageLayout";
import { DeleteTransactionButton } from "@/components/finance/DeleteTransactionButton";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { formatDate, formatINR } from "@/lib/format";
import { getTransactions } from "@/lib/finance/queries";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <PageLayout
      activeNav="Transactions"
      title="Transactions"
      subtitle="Track money inflow and outflow"
      wide
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-4">
          <p className="text-xs text-gray-400">Total Income</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">+ {formatINR(income)}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-gray-400">Total Expenses</p>
          <p className="text-xl font-bold text-red-500 mt-1">- {formatINR(expense)}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-gray-400">Net</p>
          <p className="text-xl font-bold text-[#1a1d23] mt-1">{formatINR(income - expense)}</p>
        </div>
      </div>

      <div className="space-y-5">
        <SettingsSection title="Add Transaction" description="Log income or expense">
          <TransactionForm />
        </SettingsSection>

        <SettingsSection title="All Transactions" description={`${transactions.length} entries`}>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/50 border border-black/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-800 truncate">{tx.title}</p>
                      {tx.category && (
                        <span className="text-[10px] font-bold text-gray-400 border border-black/8 rounded px-1.5 py-0.5 shrink-0">
                          {tx.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tx.type === "income" ? "Income" : "Expense"} · {tx.payment_method} · {formatDate(tx.transaction_date)}
                    </p>
                  </div>
                  <p className={`font-bold text-sm shrink-0 ${tx.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                    {tx.type === "income" ? "+" : "-"} {formatINR(Number(tx.amount))}
                  </p>
                  <DeleteTransactionButton id={tx.id} />
                </div>
              ))}
            </div>
          )}
        </SettingsSection>
      </div>
    </PageLayout>
  );
}
