import Link from "next/link";
import { AddTransactionFab } from "@/components/finance/AddTransactionFab";
import { PageLayout } from "@/components/layout/PageLayout";
import { formatDate, formatINR } from "@/lib/format";
import { getDashboardData } from "@/lib/finance/queries";

export default async function DashboardPage() {
  const data = await getDashboardData();

  const balance = data?.balance ?? 0;
  const monthlyIncome = data?.monthlyIncome ?? 0;
  const monthlyExpense = data?.monthlyExpense ?? 0;
  const transactions = data?.transactions ?? [];

  return (
    <PageLayout
      activeNav="Dashboard"
      title="Dashboard"
      subtitle="Your financial overview at a glance"
      wide
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <section className="space-y-4">
          <div className="rounded-3xl bg-[#1a1d23] text-white p-6 md:p-7 shadow-[0_10px_40px_rgba(26,29,35,0.25)]">
            <p className="text-sm text-white/60 font-medium">Monthly Cash Flow</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
              {formatINR(balance)}
            </h2>
            <div className="flex justify-between mt-6 pt-5 border-t border-white/10 text-sm">
              <div>
                <p className="text-white/50 text-xs">Income</p>
                <p className="font-semibold mt-0.5 text-emerald-400">+ {formatINR(monthlyIncome)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs">Expenses</p>
                <p className="font-semibold mt-0.5 text-red-400">- {formatINR(monthlyExpense)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/transactions" className="glass-panel p-4 hover:bg-white/90 transition-all">
              <p className="text-xs text-gray-400">Transactions</p>
              <p className="font-bold text-lg text-[#1a1d23] mt-1">Track</p>
              <p className="text-xs text-gray-400 mt-0.5">Income & expenses</p>
            </Link>
            <Link href="/networth" className="glass-panel p-4 hover:bg-white/90 transition-all">
              <p className="text-xs text-gray-400">Net Worth</p>
              <p className="font-bold text-lg text-[#1a1d23] mt-1">{formatINR(data?.networth ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Assets − liabilities</p>
            </Link>
            <Link href="/cards" className="glass-panel p-4 hover:bg-white/90 transition-all">
              <p className="text-xs text-gray-400">Credit Cards</p>
              <p className="font-bold text-lg text-[#1a1d23] mt-1">{data?.cardCount ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">Cards tracked</p>
            </Link>
            <Link href="/budgets" className="glass-panel p-4 hover:bg-white/90 transition-all">
              <p className="text-xs text-gray-400">Budgets</p>
              <p className="font-bold text-lg text-[#1a1d23] mt-1">{data?.budgetCount ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">Active budgets</p>
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1a1d23]">Recent Transactions</h2>
            <Link href="/transactions" className="text-sm font-semibold link-accent">
              View all
            </Link>
          </div>

          <div className="glass-panel-strong p-4 md:p-5">
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No transactions yet.{" "}
                <Link href="/transactions" className="link-accent">Add one</Link>
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-black/[0.04]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{tx.title}</p>
                      <p className="text-xs text-gray-400">
                        {tx.payment_method} · {formatDate(tx.transaction_date)}
                      </p>
                    </div>
                    <p className={`font-bold text-sm shrink-0 ml-3 ${tx.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.type === "income" ? "+" : "-"} {formatINR(Number(tx.amount))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <AddTransactionFab />
    </PageLayout>
  );
}
