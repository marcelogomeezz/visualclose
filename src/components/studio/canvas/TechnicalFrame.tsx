"use client";

import { formatDimensions } from "@/core/geometry/units";
import { TECHNICAL_NOTE } from "@/lib/export-png";
import type { Project } from "@/core/types";

/** DOM title block for the TECHNICAL view. The exported PNG draws the same information. */
export function TechnicalFrame({ project }: { project: Project }) {
  const { width, depth, height, units } = project.dimensions;
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-graphite-0/85 via-graphite-0/40 to-transparent pt-16 pb-4 px-5">
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="text-[18px] tracking-[0.06em] uppercase text-ivory font-medium leading-none mb-2">{project.productPack.name}</div>
            <div className="t-mono text-[11px] text-ivory/80 mb-1">
              {formatDimensions(width, depth, height, units)}
              <span className="text-warm-grey"> · </span>
              {project.productPack.color}
              <span className="text-warm-grey"> · </span>
              {project.productPack.finish}
              <span className="text-warm-grey"> · </span>
              {project.productPack.installationType}
            </div>
            <div className="t-label">
              Technical placement · {TECHNICAL_NOTE}
              {!project.placement.locked && <span className="text-champagne"> · unlocked draft</span>}
            </div>
          </div>
          <div className="t-label-strong shrink-0">VISUALCLOSE</div>
        </div>
      </div>
    </div>
  );
}
