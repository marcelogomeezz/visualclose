"use client";

import { MODE_COPY, VIEW_MODES, ui, useUI, type ViewMode } from "@/state/ui-store";

export function ModeBar({ disabled }: { disabled?: boolean }) {
  const mode = useUI((s) => s.mode);
  const generating = useUI((s) => s.generating);
  return (
    <div className="absolute top-4 left-5 z-20 pointer-events-none">
      <div className="flex items-center gap-0.5 pointer-events-auto">
        {VIEW_MODES.map((m, i) => {
          const active = m === mode;
          const isVisual = i >= 3;
          return (
            <span key={m} className="flex items-center">
              {i === 3 && <span className="w-px h-3 bg-line-strong mx-2" />}
              <button
                type="button"
                disabled={disabled || !!generating}
                onClick={() => {
                  ui.setMode(m);
                  ui.selectOutput(null);
                }}
                className={`h-7 px-2.5 text-[10.5px] tracking-[0.16em] uppercase font-medium transition-colors disabled:opacity-40 ${
                  active ? "text-ivory bg-graphite-0/70 border border-line-strong" : "text-warm-grey hover:text-ivory border border-transparent"
                } ${isVisual && !active ? "text-warm-grey" : ""}`}
              >
                {m}
                {m === "MOTION" && <span className="ml-1.5 text-[8.5px] tracking-[0.12em] text-champagne/80">EXP</span>}
              </button>
            </span>
          );
        })}
      </div>
      <div className="mt-2 pl-0.5 text-[11px] text-warm-grey tracking-[0.02em]">{MODE_COPY[mode as ViewMode]}</div>
    </div>
  );
}
