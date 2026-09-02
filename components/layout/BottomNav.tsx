"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navIconMap } from "@/components/layout/nav-icons";
import { isNavActive, navItems } from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="Mobile navigation"
    >
      <div className="glass-panel-strong flex items-center justify-between px-1 py-1.5 overflow-x-auto">
        {navItems.map(({ href, label }) => {
          const Icon = navIconMap[label];
          const isActive = isNavActive(pathname, href);
          return (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[var(--touch-min)] min-h-[var(--touch-min)] py-1 px-1.5 rounded-xl transition-colors shrink-0 ${
                isActive ? "bg-[#1a1d23] text-white shadow-md" : "text-gray-500"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-medium leading-tight text-center">
                {label === "Transactions" ? "Txns" : label === "Networth" ? "Worth" : label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
