"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function OfflinePage() {
  return (
    <div className="app-bg relative min-h-dvh flex flex-col items-center justify-center p-6 safe-area-padding">
      <div className="relative z-10 w-full max-w-md text-center">
        <Logo size={56} className="mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-[#1a1d23]">You&apos;re offline</h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          FinTrack needs a connection to sync your latest transactions and balances.
          Previously viewed pages may still be available from cache.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary sm:w-auto sm:px-8"
          >
            Try again
          </button>
          <Link href="/" className="btn-ghost sm:w-auto sm:px-8">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
