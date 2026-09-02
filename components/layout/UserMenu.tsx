"use client";

import { useState } from "react";
import { IconChevronDown } from "@/components/ui/Icons";

type UserMenuProps = {
  userEmail?: string | null;
  userName?: string | null;
};

export function UserMenu({ userEmail, userName }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const displayName = userName || userEmail?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="glass-pill flex items-center gap-2 min-h-[44px] pl-1.5 pr-3 py-1 hover:bg-white/90 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="w-8 h-8 rounded-full bg-[#1a1d23] text-white text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
          {displayName}
        </span>
        <IconChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 glass-panel-strong py-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-black/5">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {displayName}
              </p>
              {userEmail && (
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {userEmail}
                </p>
              )}
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/60 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
