"use client";

import Link from "next/link";

export type SettingsTabId = "account" | "app" | "master";

type SettingsTabsProps = {
  active: SettingsTabId;
};

export function SettingsTabs({ active }: SettingsTabsProps) {
  const tabs: { id: SettingsTabId; label: string; href: string }[] = [
    { id: "account", label: "Account", href: "/settings?tab=account" },
    { id: "master", label: "Master Data", href: "/settings?tab=master" },
    { id: "app", label: "App", href: "/settings?tab=app" },
  ];

  return (
    <div className="flex gap-1.5 p-1 glass-panel mb-5 overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`snap-start shrink-0 min-w-[6.5rem] flex-1 text-center py-2.5 px-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            active === tab.id
              ? "bg-[#1a1d23] text-white shadow-md"
              : "text-gray-500 hover:bg-white/60"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
