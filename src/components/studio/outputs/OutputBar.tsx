"use client";

import { useProject } from "@/state/project-store";
import { ui, useUI, MODE_LABELS, type ViewMode } from "@/state/ui-store";
import type { OutputRecord, OutputType } from "@/core/types";
import { pad2 } from "@/lib/format";

const TABS: ViewMode[] = ["ORIGINAL", "REALITY", "TECHNICAL", "ARCHVIZ", "MOTION"];
const TYPE_FOR_MODE: Partial<Record<ViewMode, OutputType>> = { ORIGINAL: "ORIGINAL", TECHNICAL: "TECHNICAL", REALITY: "REALITY", ARCHVIZ: "ARCHVIZ", MOTION: "MOTION" };

/** ORIGINAL · REALIDAD · REAL PLAN · ARQUITECTURA · MOVIMIENTO. Versions appear as small numbers when there is more than one. */
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
    <footer className="h-full md:hairline-t bg-graphite-1 flex items-center justify-center gap-1 px-3 py-2 md:py-0 overflow-x-auto vc-scroll">
      {TABS.map((m) => {
        const type = TYPE_FOR_MODE[m];
        const outputs = type ? byType(type) : [];
        const active = mode === m;
        const disabled = !project.space || m === "MOTION";
        const hasOutput = outputs.length > 0;
        const busy = generating && ((generating.mode === "REALITY" && m === "REALITY") || (generating.mode === "ARCHVIZ" && m === "ARCHVIZ"));
        const current = outputs.find((o) => o.id === selectedId) ?? outputs[outputs.length - 1];
        return (
          <div key={m} className="flex items-center shrink-0">
            <button
              type="button"
              disabled={disabled && m !== "MOTION"}
              onClick={() => !disabled && open(m, outputs[outputs.length - 1])}
              className={`h-9 px-3 md:px-4 text-[10.5px] tracking-[0.16em] uppercase font-medium transition-colors border-b ${
                active ? "text-ivory border-ivory" : hasOutput ? "text-ivory/70 border-transparent hover:text-ivory" : "text-warm-grey-2 border-transparent hover:text-warm-grey"
              } ${m === "MOTION" ? "cursor-default" : ""}`}
            >
              {MODE_LABELS[m]}
              {m === "MOTION" && <span className="ml-1.5 text-[8.5px] tracking-[0.1em] text-champagne/80">PRÓXIMAMENTE</span>}
              {busy && <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-champagne animate-pulse align-middle" />}
            </button>
            {(m === "REALITY" || m === "ARCHVIZ" || m === "TECHNICAL") && outputs.length > 1 && (
              <span className="flex items-center gap-0.5 mr-2">
                {outputs.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => open(m, o)}
                    className={`h-5 min-w-5 px-1 t-mono text-[9.5px] border transition-colors ${active && current?.id === o.id ? "border-ivory text-ivory" : "border-line text-warm-grey hover:text-ivory"}`}
                  >
                    {pad2(o.index)}
                  </button>
                ))}
              </span>
            )}
          </div>
        );
      })}
    </footer>
  );
}
