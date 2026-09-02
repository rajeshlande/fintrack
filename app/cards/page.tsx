import { PageLayout } from "@/components/layout/PageLayout";
import { CardForm } from "@/components/finance/CardForm";
import { DeleteCardButton } from "@/components/finance/DeleteCardButton";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { formatINR } from "@/lib/format";
import { getCreditCards } from "@/lib/finance/queries";

export default async function CardsPage() {
  const cards = await getCreditCards();
  const totalOutstanding = cards.reduce((s, c) => s + Number(c.outstanding), 0);
  const totalLimit = cards.reduce((s, c) => s + Number(c.credit_limit), 0);

  return (
    <PageLayout
      activeNav="Cards"
      title="Credit Cards"
      subtitle="Track all your credit cards in one place"
      wide
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="glass-panel p-4">
          <p className="text-xs text-gray-400">Total Outstanding</p>
          <p className="text-xl font-bold text-red-500 mt-1">{formatINR(totalOutstanding)}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-gray-400">Total Credit Limit</p>
          <p className="text-xl font-bold text-[#1a1d23] mt-1">{formatINR(totalLimit)}</p>
        </div>
      </div>

      <div className="space-y-5">
        <SettingsSection title="Add Credit Card">
          <CardForm />
        </SettingsSection>

        <SettingsSection title="Your Cards" description={`${cards.length} cards`}>
          {cards.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No cards added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cards.map((card) => {
                const used = Number(card.credit_limit) > 0
                  ? Math.round((Number(card.outstanding) / Number(card.credit_limit)) * 100)
                  : 0;
                return (
                  <div key={card.id} className="rounded-2xl bg-[#1a1d23] text-white p-5 relative">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs text-white/50">{card.bank_name}</p>
                        <p className="font-bold text-lg mt-0.5">{card.card_name}</p>
                      </div>
                      <DeleteCardButton id={card.id} />
                    </div>
                    <p className="text-sm text-white/60 font-mono">
                      •••• •••• •••• {card.last_four ?? "****"}
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                      <div>
                        <p className="text-white/50 text-xs">Outstanding</p>
                        <p className="font-semibold">{formatINR(Number(card.outstanding))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/50 text-xs">Limit · {used}% used</p>
                        <p className="font-semibold">{formatINR(Number(card.credit_limit))}</p>
                      </div>
                    </div>
                    {card.due_day && (
                      <p className="text-xs text-white/40 mt-3">Due on {card.due_day}th of month</p>
                    )}
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
