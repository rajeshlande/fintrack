import { PageLayout } from "@/components/layout/PageLayout";
import { BudgetForm } from "@/components/finance/BudgetForm";
import { DeleteBudgetButton } from "@/components/finance/DeleteBudgetButton";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { formatINR } from "@/lib/format";
import { getBudgets } from "@/lib/finance/queries";

export default async function BudgetsPage() {
  const { budgets, spentByCategory } = await getBudgets();

  return (
    <PageLayout
      activeNav="Budgets"
      title="Budgets"
      subtitle="Set and track monthly or annual budgets"
      wide
    >
      <div className="space-y-5">
        <SettingsSection title="Create Budget">
          <BudgetForm />
        </SettingsSection>

        <SettingsSection title="Your Budgets" description={`${budgets.length} budgets`}>
          {budgets.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No budgets set yet.</p>
          ) : (
            <div className="space-y-3">
              {budgets.map((budget) => {
                const spent = budget.category ? (spentByCategory[budget.category] ?? 0) : 0;
                const limit = Number(budget.amount);
                const pct = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
                const isOver = spent > limit;

                return (
                  <div key={budget.id} className="glass-panel p-4">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">{budget.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">
                          {budget.period} · {budget.category ?? "All categories"}
                        </p>
                      </div>
                      <DeleteBudgetButton id={budget.id} />
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className={isOver ? "text-red-500 font-semibold" : "text-gray-600"}>
                        {formatINR(spent)} spent
                      </span>
                      <span className="text-gray-500">of {formatINR(limit)}</span>
                    </div>
                    <div className="h-2 bg-black/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : "bg-[#1a1d23]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{pct}% used</p>
                  </div>
                );
              })}
            </div>
          )}
        </SettingsSection>
      </div>
    </PageLayout>
  );
}
