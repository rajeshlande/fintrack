"use client";

import Link from "next/link";

export function AddTransactionFab() {
  return (
    <Link
      href="/transactions?add=1"
      className="fixed z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#1a1d23] text-white shadow-[0_8px_30px_rgba(26,29,35,0.35)] hover:opacity-92 active:scale-95 transition-all bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 md:bottom-8 md:right-8"
      aria-label="Add transaction"
    >
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
      </svg>
    </Link>
  );
}
