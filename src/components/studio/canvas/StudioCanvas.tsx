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
    <main className="relative bg-graphite-0 h-full min-h-0 overflow-hidden">
      {!space ? (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <DropZone onFiles={(f) => void actions.setSpace(f[0])} className="w-full max-w-[560px]">
            <div className="py-14 text-center">
              <div className="t-editorial text-[30px] md:text-[36px] text-ivory mb-3">Empieza con tu espacio real.</div>
              <div className="text-[12px] text-warm-grey">Arrastra una foto de tu espacio aquí.</div>
            </div>
          </DropZone>
          <button
            type="button"
            className="absolute bottom-6 t-label hover:text-ivory transition-colors"
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
                        <div className="text-center bg-graphite-0/70 border border-line px-6 py-3.5">
                          <Equation />
                          <div className="text-[11px] text-warm-grey mt-1.5">Pulsa VISUALIZAR ✦ y el producto aparecerá en esta misma foto.</div>
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
                    <div className="border border-line-strong px-8 py-6 text-center bg-graphite-0/70">
                      <div className="t-label-strong mb-1">Movimiento</div>
                      <div className="text-[11px] text-warm-grey">Próximamente.</div>
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
          <span className="t-label-strong bg-graphite-0/60 px-2 py-1">{MODE_LABELS[mode]}</span>
          {isVisual && visualOutput?.provenance.provider === "mock" && <span className="t-label text-champagne bg-graphite-0/60 px-2 py-1">muestra</span>}
          <span className="text-[11px] text-warm-grey hidden md:inline">{MODE_COPY[mode]}</span>
        </div>
      )}
      {space && mode === "FIT" && !solve && (
        <div className="absolute bottom-5 left-5 z-20 text-[11px] text-champagne bg-graphite-0/70 px-3 py-1.5 border border-line">Las esquinas están alineadas. Sepáralas para colocar el producto.</div>
      )}
      {space && pickTool && (
        <div className="absolute bottom-5 left-5 z-20 text-[11px] text-ivory bg-graphite-0/70 px-3 py-1.5 border border-line">
          {pickTool === "measure-a" ? "Marca el punto A en la foto" : pickTool === "measure-b" ? "Marca el punto B" : "Marca la línea de pared"}
          <span className="text-warm-grey"> · Esc para cancelar</span>
        </div>
      )}
      {space && zoom > 1 && !pickTool && (
        <div className="absolute bottom-5 left-5 z-20 t-mono text-[10px] text-warm-grey bg-graphite-0/60 px-2 py-1">{Math.round(zoom * 100)}% · doble clic para volver</div>
      )}

      {space && (isVisual || mode === "TECHNICAL") && (
        <div className="absolute top-4 right-5 z-20 flex items-center gap-2">
          {isVisual && visualOutput && canCompare && (
            <button
              type="button"
              onClick={() => ui.setCompare(!compare)}
              className={`h-8 px-3 text-[10.5px] tracking-[0.14em] uppercase border transition-colors ${compare ? "bg-ivory text-graphite-0 border-ivory" : "text-ivory border-line-strong bg-graphite-0/60 hover:bg-graphite-3"}`}
            >
              {compare ? "Salir" : "Antes / Después"}
            </button>
          )}
          {isVisual && visualOutput && !canCompare && <span className="t-label bg-graphite-0/60 px-2 py-1">Muestra · no alineada con tu foto</span>}
          {downloadable && (
            <button
              type="button"
              title="Descargar"
              onClick={() => void downloadAsset(downloadable.asset.url, `${outputLabel(downloadable.type, downloadable.index).toLowerCase().replace(/\s+/g, "-")}.${downloadable.asset.mime === "image/png" ? "png" : "jpg"}`)}
              className="h-8 w-8 flex items-center justify-center border border-line-strong bg-graphite-0/60 text-ivory hover:bg-graphite-3 transition-colors"
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
      <span className="text-ivory">Tu foto</span>
      <span className="text-warm-grey">+</span>
      <span className="text-ivory">Tu producto</span>
      <span className="text-warm-grey">=</span>
      <span className="text-champagne">Tu foto con el producto</span>
    </div>
  );
}
