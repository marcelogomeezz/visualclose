"use client";

import { useState } from "react";
import { DEMO_PRODUCT_PACKS } from "@/core/product-packs";
import { MAX_FOV_DEG, MIN_FOV_DEG } from "@/core/geometry/camera";
import type { ProductReference } from "@/core/types";
import { actions, useProject } from "@/state/project-store";
import { ui, useUI, type AdjustTool } from "@/state/ui-store";
import { usePlacementSolve } from "@/state/derived";
import { visualize } from "@/state/visualize";
import { DropZone } from "../dock/DropZone";
import { Equation } from "../canvas/StudioCanvas";
import { NumberField } from "@/components/ui/NumberField";
import { Icon } from "@/components/ui/icons";

const TOOL_HINT: Record<AdjustTool, string> = {
  move: "Arrastra el producto para moverlo por el suelo.",
  rotate: "Arrastra a izquierda o derecha para girarlo.",
  size: "Tira de las esquinas para cambiar ancho y fondo. El punto superior cambia el alto.",
};

/** Left rail: TU ESPACIO · TU PRODUCTO · MEDIDAS · AJUSTAR · VISUALIZAR. Nothing else. */
export function InputRail() {
  const project = useProject();
  const mode = useUI((s) => s.mode);
  if (!project) return null;
  return (
    <aside className="bg-graphite-1 md:hairline-r min-h-full flex flex-col">
      <SpaceSection />
      <ProductSection />
      <MeasuresSection />
      {mode === "FIT" ? <AdjustPanel /> : <AdjustEntry />}
      <VisualizeSection />
    </aside>
  );
}

function Status({ busy, ready, busyText, readyText }: { busy: boolean; ready: boolean; busyText: string; readyText: string }) {
  if (busy)
    return (
      <span className="t-label text-warm-grey flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 bg-champagne animate-pulse" />
        {busyText}
      </span>
    );
  if (ready) return <span className="t-label text-champagne">{readyText} ✓</span>;
  return null;
}

function SpaceSection() {
  const project = useProject();
  const analyzing = useUI((s) => s.intelligence.analyzing);
  if (!project) return null;
  const { space } = project;
  return (
    <section className="px-4 pt-4 pb-4 hairline-b">
      <header className="flex items-center justify-between mb-2.5">
        <span className="t-label-strong">Tu espacio</span>
        {space && (
          <button type="button" className="t-label hover:text-ivory transition-colors" onClick={() => actions.clearSpace()}>
            Quitar
          </button>
        )}
      </header>
      {space ? (
        <>
          <DropZone onFiles={(f) => void actions.setSpace(f[0])} compact className="!p-0 !border-solid !border-line group">
            <div className="relative overflow-hidden bg-graphite-0" style={{ aspectRatio: `${space.width} / ${space.height}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={space.asset.url} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-graphite-0/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="t-label-strong">Cambiar foto</span>
              </div>
            </div>
          </DropZone>
          <div className="mt-2 min-h-[16px]">
            <Status busy={analyzing} ready={!!project.sceneLock} busyText="Analizando espacio…" readyText="Espacio listo" />
          </div>
        </>
      ) : (
        <DropZone onFiles={(f) => void actions.setSpace(f[0])}>
          <div className="py-6 text-center">
            <div className="text-[12.5px] text-ivory">Arrastra una foto de tu espacio.</div>
            <div className="text-[11px] text-warm-grey mt-1">o haz clic para elegirla</div>
          </div>
        </DropZone>
      )}
    </section>
  );
}

function ProductSection() {
  const project = useProject();
  const learning = useUI((s) => s.intelligence.learning);
  const [switching, setSwitching] = useState(false);
  if (!project) return null;
  const { productPack } = project;
  const refs = productPack.references;
  return (
    <section className="px-4 pt-4 pb-4 hairline-b">
      <header className="flex items-center justify-between mb-2.5">
        <span className="t-label-strong">Tu producto</span>
        <button type="button" className="t-label hover:text-ivory transition-colors" onClick={() => setSwitching((s) => !s)}>
          {switching ? "Cerrar" : "Cambiar"}
        </button>
      </header>
      {switching ? (
        <div className="mb-3 border border-line">
          {DEMO_PRODUCT_PACKS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                actions.selectProductPack(p.id);
                setSwitching(false);
              }}
              className={`w-full text-left px-3 py-2 text-[12px] hover:bg-graphite-3 transition-colors ${p.id === productPack.id ? "text-ivory" : "text-warm-grey"}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      ) : (
        <input
          className="bg-transparent text-[12.5px] text-ivory outline-none w-full mb-2.5 border-b border-transparent focus:border-line-strong"
          value={productPack.name}
          onChange={(e) => actions.updatePack({ name: e.target.value })}
          aria-label="Nombre del producto"
        />
      )}
      {refs.length > 0 && (
        <div className="grid grid-cols-4 gap-1 mb-2">
          {refs.map((r) => (
            <RefThumb key={r.id} reference={r} />
          ))}
        </div>
      )}
      {refs.length < 8 && (
        <DropZone multiple onFiles={(f) => void actions.addProductReferences(f, "front")} compact>
          <div className="py-2 text-center">
            <div className="text-[11.5px] text-ivory">{refs.length ? "Añadir más fotos" : "Añade fotos del producto."}</div>
            {!refs.length && <div className="text-[10.5px] text-warm-grey mt-0.5">De 1 a 8 imágenes del mismo producto</div>}
          </div>
        </DropZone>
      )}
      <div className="mt-2 min-h-[16px]">
        <Status busy={learning} ready={!!project.productDNA && refs.length > 0} busyText="Analizando producto…" readyText="Producto listo" />
      </div>
    </section>
  );
}

function RefThumb({ reference }: { reference: ProductReference }) {
  return (
    <div className="relative group aspect-square bg-graphite-0 border border-line overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={reference.asset.url} alt="" className="w-full h-full object-cover" draggable={false} />
      <button
        type="button"
        aria-label="Quitar"
        onClick={() => actions.removeReference(reference.id)}
        className="absolute top-0.5 right-0.5 w-4 h-4 bg-graphite-0/80 text-ivory opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <Icon.Close width={9} height={9} />
      </button>
    </div>
  );
}

function MeasuresSection() {
  const project = useProject();
  if (!project) return null;
  const { width, depth, height, units } = project.dimensions;
  const step = units === "m" ? 0.05 : units === "ft" ? 0.1 : 1;
  return (
    <section className="px-4 pt-4 pb-4 hairline-b">
      <header className="flex items-center justify-between mb-2.5">
        <span className="t-label-strong">Medidas</span>
        <span className="t-label">opcional</span>
      </header>
      <div className="grid grid-cols-3 gap-1.5">
        <NumberField label="Ancho" value={width} step={step} suffix={units} onCommit={(v) => actions.setDimensions({ width: v })} />
        <NumberField label="Fondo" value={depth} step={step} suffix={units} onCommit={(v) => actions.setDimensions({ depth: v })} />
        <NumberField label="Alto" value={height} step={step} suffix={units} onCommit={(v) => actions.setDimensions({ height: v })} />
      </div>
      <div className="text-[10.5px] text-warm-grey mt-2 leading-snug">Con medidas reales, la colocación en el espacio es exacta.</div>
    </section>
  );
}

function AdjustEntry() {
  const project = useProject();
  if (!project) return null;
  const locked = project.placement.locked;
  return (
    <section className="px-4 pt-4 pb-4 hairline-b">
      <button
        type="button"
        disabled={!project.space}
        onClick={() => {
          ui.setMode("FIT");
          ui.selectOutput(null);
          ui.setAdjustTool("move");
        }}
        className="w-full h-10 border border-line-strong text-[11px] tracking-[0.16em] uppercase font-medium text-ivory hover:bg-graphite-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Ajustar en el espacio
      </button>
      <div className="text-[10.5px] text-warm-grey mt-2 leading-snug">{locked ? "Colocación guardada ✓ · puedes volver a ajustarla." : "Coloca el producto donde irá instalado."}</div>
    </section>
  );
}

function AdjustPanel() {
  const project = useProject();
  const solve = usePlacementSolve();
  const tool = useUI((s) => s.adjustTool);
  const advanced = useUI((s) => s.advancedAdjust);
  const pickTool = useUI((s) => s.pickTool);
  if (!project) return null;
  const { placement } = project;
  const tools: { value: AdjustTool; label: string }[] = [
    { value: "move", label: "Mover" },
    { value: "rotate", label: "Girar" },
    { value: "size", label: "Tamaño" },
  ];
  return (
    <section className="px-4 pt-4 pb-4 hairline-b bg-graphite-2/60">
      <header className="flex items-center justify-between mb-2.5">
        <span className="t-label-strong">Ajustar</span>
        <button type="button" className="t-label hover:text-ivory transition-colors" onClick={() => actions.resetPlacement()}>
          Reiniciar
        </button>
      </header>
      <div className="grid grid-cols-3 border border-line">
        {tools.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => ui.setAdjustTool(t.value)}
            className={`h-9 text-[10.5px] tracking-[0.14em] uppercase font-medium transition-colors ${tool === t.value ? "bg-ivory text-graphite-0" : "text-warm-grey hover:text-ivory"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="text-[10.5px] text-warm-grey mt-2 leading-snug min-h-[28px]">{solve ? TOOL_HINT[tool] : "Separa las esquinas para poder colocar el producto."}</div>
      {tool === "rotate" && (
        <div className="flex items-center gap-1.5 mt-2">
          {[-90, -15, 15, 90].map((d) => (
            <button key={d} type="button" disabled={!solve} onClick={() => actions.rotateBy(d)} className="h-7 flex-1 border border-line text-[10.5px] t-mono text-warm-grey hover:text-ivory hover:border-line-strong disabled:opacity-40 transition-colors">
              {d > 0 ? `+${d}` : d}°
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={!solve}
        onClick={async () => {
          const ok = await actions.lockPlacement();
          if (ok) {
            ui.setMode("ORIGINAL");
            ui.selectOutput(null);
            ui.toast("Colocación guardada · REAL PLAN listo · ahora VISUALIZAR ✦");
          }
        }}
        className="mt-3 w-full h-10 bg-ivory text-graphite-0 text-[11px] tracking-[0.16em] uppercase font-medium hover:bg-offwhite transition-colors disabled:opacity-40"
      >
        Listo ✓
      </button>
      <button type="button" className="mt-3 t-label hover:text-ivory transition-colors flex items-center gap-1.5" onClick={() => ui.setAdvancedAdjust(!advanced)}>
        <span className={`inline-block transition-transform ${advanced ? "rotate-90" : ""}`}>›</span> Avanzado
      </button>
      {advanced && (
        <div className="mt-3 space-y-3 vc-fade-in">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="t-label">Perspectiva · lente</span>
              <button
                type="button"
                className="t-label hover:text-ivory"
                onClick={() => {
                  const fov = actions.estimateLens();
                  ui.toast(fov === null ? "No se puede estimar con estas esquinas" : `Lente estimada · ${fov.toFixed(1)}°`);
                }}
              >
                Estimar
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input type="range" className="vc-range" min={MIN_FOV_DEG} max={MAX_FOV_DEG} step={0.5} value={placement.lens.fovDeg} onChange={(e) => actions.setLens({ fovDeg: Number(e.target.value), source: "manual" })} />
              <span className="t-mono text-[10.5px] w-12 text-right">{placement.lens.fovDeg.toFixed(1)}°</span>
            </div>
            <div className="text-[10.5px] text-warm-grey mt-1">Las esquinas del suelo se pueden arrastrar una a una.</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="t-label">Referencia de medida</span>
            <button
              type="button"
              className={`t-label ${pickTool === "measure-a" || pickTool === "measure-b" ? "text-champagne" : "hover:text-ivory"}`}
              onClick={() => ui.setPickTool(pickTool ? null : "measure-a")}
            >
              {project.referenceMeasurement ? "Repetir A → B" : "Marcar A → B"}
            </button>
          </div>
          {project.referenceMeasurement && (
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <NumberField label="Distancia conocida" value={project.referenceMeasurement.distance} step={0.01} min={0.001} suffix={project.referenceMeasurement.units} onCommit={(v) => actions.setReferenceMeasurement({ ...project.referenceMeasurement!, distance: v })} />
              <button type="button" className="t-label hover:text-ivory pb-2" onClick={() => actions.setReferenceMeasurement(null)}>
                Quitar
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function VisualizeSection() {
  const project = useProject();
  const generating = useUI((s) => s.generating);
  const choice = useUI((s) => s.outputChoice);
  const optionsOpen = useUI((s) => s.optionsOpen);
  if (!project) return null;
  const disabled = !project.space || !!generating;
  return (
    <section className="px-4 pt-4 pb-5 mt-auto">
      <button
        type="button"
        disabled={disabled}
        onClick={() => void visualize(choice)}
        className={`w-full h-12 text-[12px] tracking-[0.22em] uppercase font-medium transition-colors ${disabled ? "bg-graphite-3 text-warm-grey cursor-not-allowed" : "bg-ivory text-graphite-0 hover:bg-offwhite"}`}
      >
        {generating ? "Visualizando…" : "Visualizar ✦"}
      </button>
      <Equation className="mt-3 !text-[9px] !gap-1.5 flex-wrap" />
      <div className="flex items-center justify-between mt-2">
        <span className="t-label">{choice === "REALITY" ? "Realidad" : "Arquitectura"}</span>
        <button type="button" className="t-label hover:text-ivory transition-colors" onClick={() => ui.setOptionsOpen(!optionsOpen)}>
          Opciones
        </button>
      </div>
      {optionsOpen && (
        <div className="mt-2 border border-line vc-fade-in">
          {(["REALITY", "ARCHVIZ"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => ui.setOutputChoice(c)}
              className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-graphite-3 transition-colors ${choice === c ? "text-ivory" : "text-warm-grey"}`}
            >
              <span className="text-[11px] tracking-[0.12em] uppercase">{c === "REALITY" ? "Realidad" : "Arquitectura"}</span>
              <span className="text-[10px] text-warm-grey">{c === "REALITY" ? "tu foto, editada" : "visualización estilizada"}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
