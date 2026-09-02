"use client";

import Link from "next/link";

type SettingsTabsProps = {
  active: "account" | "app";
};

export function SettingsTabs({ active }: SettingsTabsProps) {
  const tabs = [
    { id: "account" as const, label: "Account", href: "/settings?tab=account" },
    { id: "app" as const, label: "App Settings", href: "/settings?tab=app" },
  ];

  return (
    <div className="flex gap-2 p-1 glass-panel mb-5">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`flex-1 text-center py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
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
