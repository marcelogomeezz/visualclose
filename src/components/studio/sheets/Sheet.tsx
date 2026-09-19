"use client";

import type { ReactNode } from "react";
import { ui } from "@/state/ui-store";
import { Icon } from "@/components/ui/icons";

export function Sheet({ title, children, width = 520 }: { title: string; children: ReactNode; width?: number }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={() => ui.closeSheet()}>
      <div className="absolute inset-0 bg-white/90 vc-fade-in" />
      <div className="relative h-full bg-paper hairline-l overflow-y-auto vc-scroll vc-fade-in w-full" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <header className="h-[46px] px-5 flex items-center justify-between hairline-b sticky top-0 bg-paper z-10">
          <span className="t-label-strong">{title}</span>
          <button type="button" className="text-muted hover:text-ink" onClick={() => ui.closeSheet()}>
            <Icon.Close />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
