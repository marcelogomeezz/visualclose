"use client";

import { formatDimensions } from "@/core/geometry/units";
import { TECHNICAL_NOTE } from "@/lib/export-png";
import type { Project } from "@/core/types";

/** REAL PLAN title block: the real photograph stays the plan; this only adds the product facts. */
export function RealPlanFrame({ project }: { project: Project }) {
  const { width, depth, height, units } = project.dimensions;
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-5 flex items-center gap-2">
        <span className="t-label-strong bg-white/90 rounded-full px-3 py-1.5 shadow-sm">Plano real</span>
        {!project.placement.locked && <span className="t-label text-accent bg-white/90 rounded-full px-3 py-1.5 shadow-sm">borrador</span>}
      </div>
      <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-ink/45 via-ink/10 to-transparent pt-14 pb-4 px-5">
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="text-[17px] tracking-[0.04em] uppercase text-ink font-medium leading-none mb-1.5">{project.productPack.name}</div>
            <div className="t-mono text-[11px] text-ink/85 mb-1">
              {formatDimensions(width, depth, height, units)}
              <span className="text-muted"> · </span>
              {project.productPack.color}
              <span className="text-muted"> · </span>
              {project.productPack.finish}
            </div>
            <div className="text-[10px] text-muted">{TECHNICAL_NOTE}</div>
          </div>
          <div className="t-label-strong shrink-0">VISUALCLOSE</div>
        </div>
      </div>
    </div>
  );
}
