import { PageLayout } from "@/components/layout/PageLayout";
import { DeleteNetworthButton } from "@/components/finance/DeleteNetworthButton";
import { NetworthForm } from "@/components/finance/NetworthForm";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { formatINR } from "@/lib/format";
import { getNetworthItems } from "@/lib/finance/queries";

export default async function NetworthPage() {
  const items = await getNetworthItems();
  const assets = items.filter((i) => i.item_type === "asset");
  const liabilities = items.filter((i) => i.item_type === "liability");
  const totalAssets = assets.reduce((s, i) => s + Number(i.value), 0);
  const totalLiabilities = liabilities.reduce((s, i) => s + Number(i.value), 0);
  const networth = totalAssets - totalLiabilities;

  return (
    <PageLayout
      activeNav="Networth"
      title="Net Worth"
      subtitle="Track your assets and liabilities"
      wide
    >
      <div className="rounded-3xl bg-[#1a1d23] text-white p-6 mb-6 shadow-[0_10px_40px_rgba(26,29,35,0.25)]">
        <p className="text-sm text-white/60">Total Net Worth</p>
        <p className="text-3xl font-bold mt-1">{formatINR(networth)}</p>
        <div className="flex gap-6 mt-4 pt-4 border-t border-white/10 text-sm">
          <div>
            <p className="text-white/50 text-xs">Assets</p>
            <p className="font-semibold text-emerald-400">{formatINR(totalAssets)}</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">Liabilities</p>
            <p className="font-semibold text-red-400">{formatINR(totalLiabilities)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <SettingsSection title="Add Asset or Liability">
          <NetworthForm />
        </SettingsSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SettingsSection title="Assets" description={`${assets.length} items`}>
            {assets.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No assets added.</p>
            ) : (
              <div className="space-y-2">
                {assets.map((item) => (
                  <ItemRow key={item.id} item={item} type="asset" />
                ))}
              </div>
            )}
          </SettingsSection>

          <SettingsSection title="Liabilities" description={`${liabilities.length} items`}>
            {liabilities.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No liabilities added.</p>
            ) : (
              <div className="space-y-2">
                {liabilities.map((item) => (
                  <ItemRow key={item.id} item={item} type="liability" />
                ))}
              </div>
            )}
          </SettingsSection>
        </div>
      </div>
    </PageLayout>
  );
}

function ItemRow({
  item,
  type,
}: {
  item: { id: string; name: string; category: string | null; value: number };
  type: "asset" | "liability";
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/50 border border-black/[0.04]">
      <div className="min-w-0">
        <p className="font-semibold text-sm text-gray-800 truncate">{item.name}</p>
        {item.category && <p className="text-xs text-gray-400">{item.category}</p>}
      </div>
      <p className={`font-bold text-sm shrink-0 ${type === "asset" ? "text-emerald-600" : "text-red-500"}`}>
        {formatINR(Number(item.value))}
      </p>
      <DeleteNetworthButton id={item.id} />
    </div>
  );
}
