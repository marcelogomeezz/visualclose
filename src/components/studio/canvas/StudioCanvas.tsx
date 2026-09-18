"use client";

import { useState } from "react";
import { useProject } from "@/state/project-store";
import { ui, useUI } from "@/state/ui-store";
import { originalOutput, useDisplayedOutput, usePlacementSolve } from "@/state/derived";
import { actions } from "@/state/project-store";
import type { NormalizedPoint } from "@/core/types";
import { PhotoViewport } from "./PhotoViewport";
import { ModeBar } from "./ModeBar";
import { VisualizeButton } from "./VisualizeButton";
import { GenerationOverlay } from "./GenerationOverlay";
import { CompareSlider } from "./CompareSlider";
import { TechnicalFrame } from "./TechnicalFrame";
import { FitLayer } from "../fit/FitLayer";
import { FootprintHandles } from "../fit/FootprintHandles";
import { MeasureOverlay } from "../fit/MeasureOverlay";
import { DropZone } from "../dock/DropZone";

export function StudioCanvas() {
  const project = useProject();
  const mode = useUI((s) => s.mode);
  const compare = useUI((s) => s.compare);
  const pickTool = useUI((s) => s.pickTool);
  const viewportZoom = useUI((s) => s.viewport.zoom);
  const solve = usePlacementSolve();
  const displayed = useDisplayedOutput();
  const [pendingA, setPendingA] = useState<NormalizedPoint | null>(null);

  if (!project) return null;
  const space = project.space;

  const onStageClick = (p: NormalizedPoint) => {
    if (!pickTool) return;
    if (pickTool === "measure-a") {
      setPendingA(p);
      ui.setPickTool("measure-b");
    } else if (pickTool === "measure-b" && pendingA) {
      actions.setReferenceMeasurement({
        a: pendingA,
        b: p,
        distance: project.referenceMeasurement?.distance ?? 1,
        units: project.referenceMeasurement?.units ?? project.dimensions.units,
        label: project.referenceMeasurement?.label,
      });
      setPendingA(null);
      ui.setPickTool(null);
      ui.toast("Enter the known distance");
    } else if (pickTool === "wall-anchor") {
      actions.setWallAnchor(p);
      ui.setPickTool(null);
    }
  };

  const original = originalOutput(project);
  const visualOutput = mode === "REALITY" || mode === "ARCHVIZ" ? displayed : null;
  const canCompare = !!visualOutput && !!original && visualOutput.registered;

  return (
    <main className="relative bg-graphite-0 min-h-0 overflow-hidden">
      {!space ? (
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <DropZone onFiles={(f) => void actions.setSpace(f[0])} className="w-full max-w-[560px]">
            <div className="py-16 text-center">
              <div className="t-editorial text-[34px] text-ivory mb-3">Start with the real space.</div>
              <div className="text-[12px] text-warm-grey">Drop one environment photograph here, or load the demo project.</div>
            </div>
          </DropZone>
        </div>
      ) : (
        <PhotoViewport aspect={space.width / space.height} interactive={!compare} onStageClick={onStageClick} className={pickTool ? "cursor-crosshair" : ""}>
          {(stage, toNormalized) => (
            <>
              {/* Base photograph or output */}
              {mode === "REALITY" || mode === "ARCHVIZ" ? (
                visualOutput ? (
                  compare && canCompare && original ? (
                    <CompareSlider beforeUrl={original.asset.url} afterUrl={visualOutput.asset.url} afterLabel={mode} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={visualOutput.id} src={visualOutput.asset.url} alt="" className="absolute inset-0 w-full h-full vc-fade-in" draggable={false} />
                  )
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={space.asset.url} alt="" className="absolute inset-0 w-full h-full opacity-60" draggable={false} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="t-label-strong mb-1">No {mode} output yet</div>
                        <div className="text-[11px] text-warm-grey">Press VISUALIZE.</div>
                      </div>
                    </div>
                  </>
                )
              ) : mode === "MOTION" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={space.asset.url} alt="" className="absolute inset-0 w-full h-full opacity-40" draggable={false} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border border-line-strong px-8 py-6 text-center bg-graphite-0/50">
                      <div className="t-label-strong mb-1">Motion · Experimental</div>
                      <div className="text-[11px] text-warm-grey">Coming later. Video generation slot reserved for the Higgsfield adapter.</div>
                    </div>
                  </div>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={space.asset.url} alt="" className="absolute inset-0 w-full h-full" draggable={false} />
              )}

              {/* 3D placement layer */}
              {(mode === "FIT" || mode === "TECHNICAL") && <FitLayer solve={solve} dimensions={project.dimensions} zoom={stage.zoom} showLabels />}

              {/* Measurement & wall anchor */}
              {(mode === "ORIGINAL" || mode === "FIT" || mode === "TECHNICAL") && (
                <MeasureOverlay stage={stage} measurement={project.referenceMeasurement} pending={pendingA} wallAnchor={project.placement.wallAnchor} pickTool={pickTool} />
              )}

              {/* Anchor handles */}
              {mode === "FIT" && !pickTool && (
                <FootprintHandles footprint={project.placement.footprint} solve={solve} stage={stage} toNormalized={toNormalized} locked={project.placement.locked} />
              )}
            </>
          )}
        </PhotoViewport>
      )}

      {space && mode === "TECHNICAL" && <TechnicalFrame project={project} />}
      {space && mode === "FIT" && !solve && (
        <div className="absolute bottom-5 left-5 z-20 text-[11px] text-champagne bg-graphite-0/70 px-3 py-1.5 border border-line">Anchors are degenerate. Move them apart to solve the placement.</div>
      )}
      {space && pickTool && (
        <div className="absolute bottom-5 left-5 z-20 text-[11px] text-ivory bg-graphite-0/70 px-3 py-1.5 border border-line">
          {pickTool === "measure-a" ? "Click Point A on the photograph" : pickTool === "measure-b" ? "Click Point B" : "Click the wall line where the product attaches"}
          <span className="text-warm-grey"> · Esc to cancel</span>
        </div>
      )}
      {space && viewportZoom > 1 && !pickTool && (
        <div className="absolute bottom-5 left-5 z-20 t-mono text-[10px] text-warm-grey bg-graphite-0/60 px-2 py-1">{Math.round(viewportZoom * 100)}% · double-click to reset</div>
      )}

      <ModeBar disabled={!space} />
      {space && (mode === "REALITY" || mode === "ARCHVIZ") && visualOutput && (
        <div className="absolute top-4 right-5 z-20 flex items-center gap-2">
          {canCompare ? (
            <button
              type="button"
              onClick={() => ui.setCompare(!compare)}
              className={`h-7 px-3 text-[10.5px] tracking-[0.14em] uppercase border transition-colors ${compare ? "bg-ivory text-graphite-0 border-ivory" : "text-ivory border-line-strong hover:bg-graphite-3"}`}
            >
              {compare ? "Exit compare" : "Before / After"}
            </button>
          ) : (
            <span className="t-label bg-graphite-0/60 px-2 py-1">Not registered to this space</span>
          )}
        </div>
      )}
      <GenerationOverlay />
      <VisualizeButton />
    </main>
  );
}
