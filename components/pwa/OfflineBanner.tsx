"use client";

import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-50 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none"
    >
      <div className="mx-auto max-w-lg glass-panel-strong px-4 py-3 flex items-center justify-between gap-3 pointer-events-auto">
        <p className="text-sm font-medium text-gray-700">You&apos;re offline</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-sm font-semibold link-accent shrink-0"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
