import { Suspense } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ScrollToAddTransaction } from "@/components/finance/ScrollToAddTransaction";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { TransactionList } from "@/components/finance/TransactionList";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { formatINR } from "@/lib/format";
import { getTransactions } from "@/lib/finance/queries";
import { getTransactionTaxonomy } from "@/lib/finance/taxonomy-queries";

export default async function TransactionsPage() {
  const [transactions, taxonomy] = await Promise.all([
    getTransactions(),
    getTransactionTaxonomy(),
  ]);

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <PageLayout
      activeNav="Transactions"
      title="Transactions"
      subtitle="Track money inflow and outflow"
      wide
    >
      <Suspense fallback={null}>
        <ScrollToAddTransaction targetId="add-transaction" />
      </Suspense>

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
        <div id="add-transaction">
          <SettingsSection title="Log Income / Expense" description="Category, payment method, and amount">
            <TransactionForm taxonomy={taxonomy} />
          </SettingsSection>
        </div>

        <SettingsSection title="All Transactions" description={`${transactions.length} entries`}>
          <TransactionList transactions={transactions} taxonomy={taxonomy} />
        </SettingsSection>
      </div>
    </PageLayout>
  );
}
