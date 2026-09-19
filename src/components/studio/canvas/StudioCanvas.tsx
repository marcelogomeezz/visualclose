"use client";

import { useState } from "react";
import { actions, useProject } from "@/state/project-store";
import { ui, useUI, MODE_LABELS, MODE_COPY } from "@/state/ui-store";
import { originalOutput, useDisplayedOutput, usePlacementSolve } from "@/state/derived";
import type { NormalizedPoint } from "@/core/types";
import { downloadAsset } from "@/lib/image";
import { outputLabel } from "@/lib/format";
import { PhotoViewport } from "./PhotoViewport";
import { GenerationOverlay } from "./GenerationOverlay";
import { CompareSlider } from "./CompareSlider";
import { RealPlanFrame } from "./RealPlanFrame";
import { FitLayer } from "../fit/FitLayer";
import { PhotoPlanOverlay } from "./PhotoPlanOverlay";
import { FootprintHandles } from "../fit/FootprintHandles";
import { StickerHandles } from "../fit/StickerHandles";
import { MeasureOverlay } from "../fit/MeasureOverlay";
import { DropZone } from "../dock/DropZone";
import { Icon } from "@/components/ui/icons";

export function StudioCanvas() {
  const project = useProject();
  const mode = useUI((s) => s.mode);
  const compare = useUI((s) => s.compare);
  const pickTool = useUI((s) => s.pickTool);
  const adjustTool = useUI((s) => s.adjustTool);
  const advanced = useUI((s) => s.advancedAdjust);
  const zoom = useUI((s) => s.viewport.zoom);
  const generating = useUI((s) => s.generating);
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
      actions.setReferenceMeasurement({ a: pendingA, b: p, distance: project.referenceMeasurement?.distance ?? 1, units: project.referenceMeasurement?.units ?? project.dimensions.units });
      setPendingA(null);
      ui.setPickTool(null);
      ui.toast("Introduce la distancia conocida");
    } else if (pickTool === "wall-anchor") {
      actions.setWallAnchor(p);
      ui.setPickTool(null);
    }
  };

  const original = originalOutput(project);
  const isVisual = mode === "REALITY" || mode === "ARCHVIZ";
  const visualOutput = isVisual ? displayed : null;
  const canCompare = !!visualOutput && !!original && visualOutput.registered;
  const downloadable = (isVisual && visualOutput) || (mode === "TECHNICAL" && displayed) ? displayed : null;

  return (
    <main className="relative bg-stone h-full min-h-0 overflow-hidden">
      {!space ? (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <DropZone onFiles={(f) => void actions.setSpace(f[0])} className="w-full max-w-[560px] rounded-2xl">
            <div className="py-14 text-center">
              <div className="t-editorial text-[30px] md:text-[36px] text-ink mb-3">Empieza con tu espacio real.</div>
              <div className="text-[12px] text-muted">Arrastra una foto de tu espacio aquí.</div>
            </div>
          </DropZone>
          <button
            type="button"
            className="absolute bottom-6 t-label hover:text-ink transition-colors"
            onClick={() => {
              actions.loadDemoProject();
              ui.resetViewport();
            }}
          >
            o carga la demo
          </button>
        </div>
      ) : (
        <PhotoViewport aspect={space.width / space.height} interactive={!compare} onStageClick={onStageClick} className={pickTool ? "cursor-crosshair" : ""}>
          {(stage, toNormalized) => (
            <>
              {isVisual ? (
                visualOutput ? (
                  compare && canCompare && original ? (
                    <CompareSlider beforeUrl={original.asset.url} afterUrl={visualOutput.asset.url} beforeLabel="Antes" afterLabel="Después" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={visualOutput.id} src={visualOutput.asset.url} alt="" className="absolute inset-0 w-full h-full vc-fade-in" draggable={false} />
                  )
                ) : (
                  <>
                    {/* The original photograph stays on screen: the result appears inside it, same viewport. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={space.asset.url} alt="" className="absolute inset-0 w-full h-full" draggable={false} />
                    {!generating && (
                      <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
                        <div className="text-center bg-white/95 rounded-2xl shadow-md px-6 py-4">
                          <Equation />
                          <div className="text-[11px] text-muted mt-1.5">Pulsa VISUALIZAR ✦ y el producto aparecerá en esta misma foto.</div>
                        </div>
                      </div>
                    )}
                  </>
                )
              ) : mode === "MOTION" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={space.asset.url} alt="" className="absolute inset-0 w-full h-full" draggable={false} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="rounded-2xl shadow-md px-8 py-6 text-center bg-white/95">
                      <div className="t-label-strong mb-1">Movimiento</div>
                      <div className="text-[11px] text-muted">Próximamente.</div>
                    </div>
                  </div>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={space.asset.url} alt="" className="absolute inset-0 w-full h-full" draggable={false} />
              )}

              {mode === "FIT" && <FitLayer solve={solve} dimensions={project.dimensions} zoom={stage.zoom} showLabels />}
              {mode === "TECHNICAL" && solve && <PhotoPlanOverlay solve={solve} dimensions={project.dimensions} imageWidth={space.width} imageHeight={space.height} stage={stage} />}
              {mode === "FIT" && advanced && (
                <MeasureOverlay stage={stage} measurement={project.referenceMeasurement} pending={pendingA} wallAnchor={project.placement.wallAnchor} pickTool={pickTool} />
              )}
              {mode === "FIT" && !pickTool && !advanced && (
                <StickerHandles footprint={project.placement.footprint} dimensions={project.dimensions} solve={solve} stage={stage} tool={adjustTool} toNormalized={toNormalized} />
              )}
              {mode === "FIT" && !pickTool && advanced && (
                <FootprintHandles footprint={project.placement.footprint} solve={solve} stage={stage} toNormalized={toNormalized} locked={false} />
              )}
            </>
          )}
        </PhotoViewport>
      )}

      {space && mode === "TECHNICAL" && <RealPlanFrame project={project} />}
      {space && mode !== "TECHNICAL" && !generating && (
        <div className="absolute top-4 left-5 z-20 pointer-events-none flex items-center gap-2">
          <span className="t-label-strong bg-white/90 rounded-full px-3 py-1.5 shadow-sm">{MODE_LABELS[mode]}</span>
          {isVisual && visualOutput?.provenance.provider === "mock" && <span className="t-label text-accent bg-white/90 rounded-full px-3 py-1.5 shadow-sm">muestra</span>}
          <span className="text-[11px] text-muted hidden md:inline">{MODE_COPY[mode]}</span>
        </div>
      )}
      {space && mode === "FIT" && !solve && (
        <div className="absolute bottom-5 left-5 z-20 text-[11px] text-accent bg-white/95 rounded-xl px-3.5 py-2 shadow-sm">Las esquinas están alineadas. Sepáralas para colocar el producto.</div>
      )}
      {space && pickTool && (
        <div className="absolute bottom-5 left-5 z-20 text-[11px] text-ink bg-white/95 rounded-xl px-3.5 py-2 shadow-sm">
          {pickTool === "measure-a" ? "Marca el punto A en la foto" : pickTool === "measure-b" ? "Marca el punto B" : "Marca la línea de pared"}
          <span className="text-muted"> · Esc para cancelar</span>
        </div>
      )}
      {space && zoom > 1 && !pickTool && (
        <div className="absolute bottom-5 left-5 z-20 t-mono text-[10px] text-muted bg-white/95 rounded-full px-3 py-1.5 shadow-sm">{Math.round(zoom * 100)}% · doble clic para volver</div>
      )}

      {space && (isVisual || mode === "TECHNICAL") && (
        <div className="absolute top-4 right-5 z-20 flex items-center gap-2">
          {isVisual && visualOutput && canCompare && (
            <button
              type="button"
              onClick={() => ui.setCompare(!compare)}
              className={`h-9 px-4 rounded-full text-[11px] font-medium transition-colors shadow-sm ${compare ? "bg-ink text-white" : "text-ink bg-white/95 hover:bg-stone"}`}
            >
              {compare ? "Salir" : "Antes / Después"}
            </button>
          )}
          {isVisual && visualOutput && !canCompare && <span className="t-label bg-white/90 rounded-full px-3 py-1.5 shadow-sm">Muestra · no alineada con tu foto</span>}
          {downloadable && (
            <button
              type="button"
              title="Descargar"
              onClick={() => void downloadAsset(downloadable.asset.url, `${outputLabel(downloadable.type, downloadable.index).toLowerCase().replace(/\s+/g, "-")}.${downloadable.asset.mime === "image/png" ? "png" : "jpg"}`)}
              className="h-9 w-9 rounded-full flex items-center justify-center bg-white/95 text-ink hover:bg-stone transition-colors shadow-sm"
            >
              <Icon.Download />
            </button>
          )}
        </div>
      )}
      <GenerationOverlay />
    </main>
  );
}

/** The whole product in one line. */
export function Equation({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 text-[10.5px] tracking-[0.16em] uppercase ${className}`}>
      <span className="text-ink">Tu foto</span>
      <span className="text-muted">+</span>
      <span className="text-ink">Tu producto</span>
      <span className="text-muted">=</span>
      <span className="text-accent">Tu foto con el producto</span>
    </div>
  );
}
