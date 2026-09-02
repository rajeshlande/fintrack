"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ScrollToAddTransaction({ targetId }: { targetId: string }) {
  const searchParams = useSearchParams();
  const shouldScroll = searchParams.get("add") === "1";

  useEffect(() => {
    if (!shouldScroll) return;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.querySelector<HTMLElement>("input, select, textarea")?.focus();
    }
  }, [shouldScroll, targetId]);

  return null;
}
