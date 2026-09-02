"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navIconMap } from "@/components/layout/nav-icons";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/Icons";
import { isNavActive, navItems } from "@/lib/navigation";

const STORAGE_KEY = "fintrack-sidebar-collapsed";

type SidebarProps = { active?: string };

export function Sidebar({ active }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === "true");
    setMounted(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 py-5 transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-[76px]" : "w-[220px]"
      }`}
    >
      <div
        className={`glass-panel-strong mx-3 flex flex-col flex-1 py-5 ${
          collapsed ? "px-2.5 items-center" : "px-3"
        }`}
      >
        <div className={`flex items-center mb-6 ${collapsed ? "justify-center" : "px-1"}`}>
          <Link href="/" className="flex items-center gap-3 min-w-0" aria-label="FinTrack home">
            <Image
              src="/logo.png"
              alt="FinTrack"
              width={40}
              height={40}
              className="w-10 h-10 shrink-0 rounded-2xl object-cover shadow-lg"
            />
            {!collapsed && (
              <span className="font-bold text-[#1a1d23] text-lg tracking-tight truncate">
                FinTrack
              </span>
            )}
          </Link>
        </div>

        <nav
          className={`flex flex-col gap-1.5 flex-1 w-full ${collapsed ? "items-center" : ""}`}
          aria-label="Main navigation"
        >
          {navItems.map(({ href, label }) => {
            const Icon = navIconMap[label];
            const isActive = active ? label === active : isNavActive(pathname, href);
            return (
              <Link
                key={label}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center rounded-2xl transition-all duration-200 ${
                  collapsed ? "w-11 h-11 justify-center" : "w-full gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-[#1a1d23] text-white shadow-md"
                    : "text-gray-500 hover:bg-white/60 hover:text-gray-800"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && mounted && (
                  <span className="text-sm font-medium truncate">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={toggleCollapsed}
          className={`mt-4 flex items-center rounded-2xl text-gray-500 hover:bg-white/60 hover:text-gray-800 transition-all ${
            collapsed ? "w-11 h-11 justify-center" : "w-full gap-3 px-3 py-2.5"
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <IconChevronRight className="w-5 h-5" /> : (
            <>
              <IconChevronLeft className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
