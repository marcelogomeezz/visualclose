"use client";

import { useProject } from "@/state/project-store";
import { useUI } from "@/state/ui-store";
import { visualize } from "@/state/visualize";

export function VisualizeButton() {
  const project = useProject();
  const mode = useUI((s) => s.mode);
  const generating = useUI((s) => s.generating);
  const disabled = !project?.space || !!generating || mode === "MOTION";
  const target = mode === "ARCHVIZ" ? "ARCHVIZ" : "REALITY";
  return (
    <div className="absolute bottom-5 right-5 z-20 flex items-center gap-3">
      <span className="t-label hidden xl:inline">{generating ? "Working" : mode === "MOTION" ? "Experimental" : target}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => void visualize(target)}
        className={`h-11 px-7 text-[12px] tracking-[0.22em] uppercase font-medium transition-all duration-200 ${
          disabled ? "bg-graphite-3 text-warm-grey cursor-not-allowed" : "bg-ivory text-graphite-0 hover:bg-offwhite hover:tracking-[0.26em]"
        }`}
      >
        Visualize
      </button>
    </div>
  );
}
