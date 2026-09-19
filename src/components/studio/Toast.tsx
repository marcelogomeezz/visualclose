"use client";

import { useUI } from "@/state/ui-store";

export function Toast() {
  const toast = useUI((s) => s.toast);
  if (!toast) return null;
  return (
    <div key={toast.id} className="pointer-events-none fixed top-[58px] left-1/2 -translate-x-1/2 z-50 vc-fade-in">
      <div className="bg-white/90 border border-line px-4 py-2 text-[11px] tracking-[0.12em] uppercase text-ink">{toast.text}</div>
    </div>
  );
}
