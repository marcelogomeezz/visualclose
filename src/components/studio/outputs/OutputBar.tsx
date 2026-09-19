"use client";

import { useProject } from "@/state/project-store";
import { ui, useUI, MODE_LABELS, type ViewMode } from "@/state/ui-store";
import type { OutputRecord, OutputType } from "@/core/types";
import { pad2 } from "@/lib/format";

const TABS: ViewMode[] = ["ORIGINAL", "REALITY", "TECHNICAL", "ARCHVIZ", "MOTION"];
const TYPE_FOR_MODE: Partial<Record<ViewMode, OutputType>> = { ORIGINAL: "ORIGINAL", TECHNICAL: "TECHNICAL", REALITY: "REALITY", ARCHVIZ: "ARCHVIZ", MOTION: "MOTION" };

/** Original · Realidad · Plano real · Arquitectura · Movimiento. Versions appear as small chips when there is more than one. */
export function OutputBar() {
  const project = useProject();
  const mode = useUI((s) => s.mode);
  const selectedId = useUI((s) => s.selectedOutputId);
  const generating = useUI((s) => s.generating);
  if (!project) return null;

  const byType = (t: OutputType) => project.outputs.filter((o) => o.type === t);
  const open = (m: ViewMode, o?: OutputRecord) => {
    ui.setMode(m);
    ui.setCompare(false);
    ui.selectOutput(o?.id ?? null);
  };

  return (
    <footer className="h-full md:hairline-t bg-paper flex items-center justify-center px-3 py-2.5 md:py-0 overflow-x-auto vc-scroll">
      <div className="inline-flex items-center gap-1 bg-white rounded-full shadow-sm border border-line p-1">
        {TABS.map((m) => {
          const type = TYPE_FOR_MODE[m];
          const outputs = type ? byType(type) : [];
          const active = mode === m;
          const disabled = !project.space || m === "MOTION";
          const busy = generating && ((generating.mode === "REALITY" && m === "REALITY") || (generating.mode === "ARCHVIZ" && m === "ARCHVIZ"));
          const current = outputs.find((o) => o.id === selectedId) ?? outputs[outputs.length - 1];
          return (
            <div key={m} className="flex items-center shrink-0">
              <button
                type="button"
                disabled={disabled && m !== "MOTION"}
                onClick={() => !disabled && open(m, outputs[outputs.length - 1])}
                className={`h-8 px-3.5 rounded-full text-[11.5px] font-medium transition-colors whitespace-nowrap ${
                  active ? "bg-ink text-white" : "text-ink-2 hover:bg-stone disabled:hover:bg-transparent disabled:text-muted-2 disabled:cursor-default"
                }`}
              >
                {MODE_LABELS[m]}
                {m === "MOTION" && <span className="ml-1.5 text-[8.5px] tracking-[0.08em] text-accent align-middle">PRÓXIMAMENTE</span>}
                {busy && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse align-middle" />}
              </button>
              {(m === "REALITY" || m === "ARCHVIZ" || m === "TECHNICAL") && outputs.length > 1 && (
                <span className="flex items-center gap-0.5 ml-0.5 mr-1">
                  {outputs.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => open(m, o)}
                      className={`h-5 min-w-5 px-1 rounded-full t-mono text-[9.5px] transition-colors ${active && current?.id === o.id ? "bg-sand-soft text-ink" : "text-muted hover:text-ink"}`}
                    >
                      {pad2(o.index)}
                    </button>
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </footer>
  );
}
