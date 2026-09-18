"use client";

import { useProject } from "@/state/project-store";
import { ui, useUI } from "@/state/ui-store";
import type { OutputRecord } from "@/core/types";
import { outputLabel, formatTime } from "@/lib/format";
import { Icon } from "@/components/ui/icons";

/** Visual generation history. Clicking an output changes the canvas. */
export function OutputStrip() {
  const project = useProject();
  const selectedId = useUI((s) => s.selectedOutputId);
  const mode = useUI((s) => s.mode);
  const generating = useUI((s) => s.generating);
  if (!project) return null;
  const outputs = project.outputs;

  const open = (o: OutputRecord) => {
    ui.selectOutput(o.id);
    ui.setCompare(false);
    if (o.type === "ORIGINAL") ui.setMode("ORIGINAL");
    else if (o.type === "TECHNICAL") ui.setMode("TECHNICAL");
    else ui.setMode(o.type);
  };

  return (
    <footer className="h-full hairline-t bg-graphite-1 flex items-stretch">
      <div className="w-[264px] shrink-0 hairline-r px-4 flex flex-col justify-center">
        <span className="t-label">Outputs</span>
        <span className="t-mono text-[10px] text-warm-grey-2 mt-1">
          {outputs.length} · rev {project.revision}
        </span>
      </div>
      <div className="flex-1 min-w-0 overflow-x-auto vc-scroll flex items-center gap-2 px-4">
        {outputs.map((o) => {
          const active = o.id === selectedId || (!selectedId && isDefaultForMode(o, outputs, mode));
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => open(o)}
              className={`group relative shrink-0 h-[84px] border transition-colors ${active ? "border-ivory" : "border-line hover:border-line-strong"}`}
              style={{ aspectRatio: "3 / 2" }}
              title={`${outputLabel(o.type, o.index)} · ${formatTime(o.createdAt)}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.thumbnail.url} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              <span className="absolute left-1.5 bottom-1 text-[9px] tracking-[0.14em] uppercase text-ivory bg-graphite-0/70 px-1 py-0.5">{outputLabel(o.type, o.index)}</span>
              {o.favorite && (
                <span className="absolute right-1 top-1 text-champagne">
                  <Icon.Star filled width={11} height={11} />
                </span>
              )}
              {o.sourceRevision !== project.revision && o.type !== "ORIGINAL" && <span className="absolute right-1 bottom-1 w-1.5 h-1.5 bg-champagne" title="Produced from an earlier revision" />}
            </button>
          );
        })}
        {generating && (
          <div className="shrink-0 h-[84px] border border-line-strong relative overflow-hidden" style={{ aspectRatio: "3 / 2" }}>
            <div className="absolute inset-0 bg-graphite-2" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ivory/10 to-transparent vc-sweep" />
            <span className="absolute left-1.5 bottom-1 text-[9px] tracking-[0.14em] uppercase text-warm-grey px-1 py-0.5">{generating.mode} …</span>
          </div>
        )}
        {outputs.length === 0 && !generating && <span className="text-[11px] text-warm-grey">Outputs appear here as you visualize.</span>}
      </div>
    </footer>
  );
}

function isDefaultForMode(o: OutputRecord, outputs: OutputRecord[], mode: string): boolean {
  const type = mode === "ORIGINAL" || mode === "TECHNICAL" || mode === "REALITY" || mode === "ARCHVIZ" || mode === "MOTION" ? mode : null;
  if (!type || o.type !== type) return false;
  const ofType = outputs.filter((x) => x.type === type);
  return ofType[ofType.length - 1]?.id === o.id;
}
