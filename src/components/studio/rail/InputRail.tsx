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

function RailCard({ icon: RailIcon, title, aside, children }: { icon: (p: { className?: string }) => React.ReactElement; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mx-3 mt-3 card rounded-2xl p-4">
      <header className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-sand-soft flex items-center justify-center shrink-0">
            <RailIcon className="w-3.5 h-3.5 text-ink-2" />
          </span>
          <span className="t-label-strong">{title}</span>
        </span>
        {aside}
      </header>
      {children}
    </section>
  );
}

/** Left rail: TU ESPACIO · TU PRODUCTO · MEDIDAS · AJUSTAR · VISUALIZAR. Nothing else. */
export function InputRail() {
  const project = useProject();
  const mode = useUI((s) => s.mode);
  if (!project) return null;
  return (
    <aside className="bg-paper md:hairline-r min-h-full flex flex-col pb-3">
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
      <span className="t-label text-muted flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        {busyText}
      </span>
    );
  if (ready) return <span className="t-label text-accent">{readyText} ✓</span>;
  return null;
}

function SpaceSection() {
  const project = useProject();
  const analyzing = useUI((s) => s.intelligence.analyzing);
  if (!project) return null;
  const { space } = project;
  return (
    <RailCard
      icon={Icon.Image}
      title="Tu espacio"
      aside={
        space && (
          <button type="button" className="t-label hover:text-ink transition-colors" onClick={() => actions.clearSpace()}>
            Quitar
          </button>
        )
      }
    >
      {space ? (
        <>
          <DropZone onFiles={(f) => void actions.setSpace(f[0])} compact className="!p-0 !border-solid !border-line rounded-xl group">
            <div className="relative overflow-hidden rounded-xl bg-stone" style={{ aspectRatio: `${space.width} / ${space.height}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={space.asset.url} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-white/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="t-label-strong">Cambiar foto</span>
              </div>
            </div>
          </DropZone>
          <div className="mt-2.5 min-h-[16px]">
            <Status busy={analyzing} ready={!!project.sceneLock} busyText="Analizando espacio…" readyText="Espacio listo" />
          </div>
        </>
      ) : (
        <DropZone onFiles={(f) => void actions.setSpace(f[0])} className="rounded-xl">
          <div className="py-6 text-center">
            <div className="text-[12.5px] text-ink">Arrastra una foto de tu espacio.</div>
            <div className="text-[11px] text-muted mt-1">o haz clic para elegirla</div>
          </div>
        </DropZone>
      )}
    </RailCard>
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
    <RailCard
      icon={Icon.Cube}
      title="Tu producto"
      aside={
        <button type="button" className="t-label hover:text-ink transition-colors" onClick={() => setSwitching((s) => !s)}>
          {switching ? "Cerrar" : "Cambiar"}
        </button>
      }
    >
      {switching ? (
        <div className="mb-3 rounded-xl border border-line overflow-hidden">
          {DEMO_PRODUCT_PACKS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                actions.selectProductPack(p.id);
                setSwitching(false);
              }}
              className={`w-full text-left px-3 py-2 text-[12px] hover:bg-stone transition-colors ${p.id === productPack.id ? "text-ink" : "text-muted"}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      ) : (
        <input
          className="bg-transparent text-[12.5px] text-ink outline-none w-full mb-2.5 border-b border-transparent focus:border-line-strong"
          value={productPack.name}
          onChange={(e) => actions.updatePack({ name: e.target.value })}
          aria-label="Nombre del producto"
        />
      )}
      {refs.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {refs.map((r) => (
            <RefThumb key={r.id} reference={r} />
          ))}
        </div>
      )}
      {refs.length < 8 && (
        <DropZone multiple onFiles={(f) => void actions.addProductReferences(f, "front")} compact className="rounded-xl">
          <div className="py-2 text-center">
            <div className="text-[11.5px] text-ink">{refs.length ? "Añadir más fotos" : "Añade fotos del producto."}</div>
            {!refs.length && <div className="text-[10.5px] text-muted mt-0.5">De 1 a 8 imágenes del mismo producto</div>}
          </div>
        </DropZone>
      )}
      <div className="mt-2.5 min-h-[16px]">
        <Status busy={learning} ready={!!project.productDNA && refs.length > 0} busyText="Analizando producto…" readyText="Producto listo" />
      </div>
    </RailCard>
  );
}

function RefThumb({ reference }: { reference: ProductReference }) {
  return (
    <div className="relative group aspect-square rounded-lg bg-stone border border-line overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={reference.asset.url} alt="" className="w-full h-full object-cover" draggable={false} />
      <button
        type="button"
        aria-label="Quitar"
        onClick={() => actions.removeReference(reference.id)}
        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white/90 text-ink opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
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
    <RailCard icon={Icon.Ruler} title="Medidas" aside={<span className="t-label">opcional</span>}>
      <div className="grid grid-cols-3 gap-1.5">
        <NumberField label="Ancho" value={width} step={step} suffix={units} onCommit={(v) => actions.setDimensions({ width: v })} />
        <NumberField label="Fondo" value={depth} step={step} suffix={units} onCommit={(v) => actions.setDimensions({ depth: v })} />
        <NumberField label="Alto" value={height} step={step} suffix={units} onCommit={(v) => actions.setDimensions({ height: v })} />
      </div>
      <div className="text-[10.5px] text-muted mt-2.5 leading-snug">Con medidas reales, la colocación en el espacio es exacta.</div>
    </RailCard>
  );
}

function AdjustEntry() {
  const project = useProject();
  if (!project) return null;
  const locked = project.placement.locked;
  return (
    <RailCard icon={Icon.Move} title="Ajustar en el espacio">
      <button
        type="button"
        disabled={!project.space}
        onClick={() => {
          ui.setMode("FIT");
          ui.selectOutput(null);
          ui.setAdjustTool("move");
        }}
        className="w-full h-11 rounded-xl border border-line-strong text-[12px] font-medium text-ink hover:bg-stone transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Ajustar en el espacio
      </button>
      <div className="text-[10.5px] text-muted mt-2.5 leading-snug">{locked ? "Colocación guardada ✓ · puedes volver a ajustarla." : "Coloca el producto donde irá instalado."}</div>
    </RailCard>
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
    <RailCard
      icon={Icon.Move}
      title="Ajustar"
      aside={
        <button type="button" className="t-label hover:text-ink transition-colors" onClick={() => actions.resetPlacement()}>
          Reiniciar
        </button>
      }
    >
      <div className="grid grid-cols-3 rounded-xl border border-line overflow-hidden">
        {tools.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => ui.setAdjustTool(t.value)}
            className={`h-9 text-[10.5px] tracking-[0.14em] uppercase font-medium transition-colors ${tool === t.value ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="text-[10.5px] text-muted mt-2.5 leading-snug min-h-[28px]">{solve ? TOOL_HINT[tool] : "Separa las esquinas para poder colocar el producto."}</div>
      {tool === "rotate" && (
        <div className="flex items-center gap-1.5 mt-2">
          {[-90, -15, 15, 90].map((d) => (
            <button key={d} type="button" disabled={!solve} onClick={() => actions.rotateBy(d)} className="h-7 flex-1 rounded-lg border border-line text-[10.5px] t-mono text-muted hover:text-ink hover:border-line-strong disabled:opacity-40 transition-colors">
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
            ui.toast("Colocación guardada · Plano real listo · ahora Visualizar");
          }
        }}
        className="mt-3 w-full h-11 rounded-xl bg-ink text-white text-[12px] font-medium hover:bg-ink-2 transition-colors disabled:opacity-40"
      >
        Listo ✓
      </button>
      <button type="button" className="mt-3 t-label hover:text-ink transition-colors flex items-center gap-1" onClick={() => ui.setAdvancedAdjust(!advanced)}>
        <Icon.ChevronRight className={`w-2.5 h-2.5 transition-transform ${advanced ? "rotate-90" : ""}`} /> Avanzado
      </button>
      {advanced && (
        <div className="mt-3 space-y-3 vc-fade-in">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="t-label">Perspectiva · lente</span>
              <button
                type="button"
                className="t-label hover:text-ink"
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
            <div className="text-[10.5px] text-muted mt-1">Las esquinas del suelo se pueden arrastrar una a una.</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="t-label">Referencia de medida</span>
            <button
              type="button"
              className={`t-label ${pickTool === "measure-a" || pickTool === "measure-b" ? "text-accent" : "hover:text-ink"}`}
              onClick={() => ui.setPickTool(pickTool ? null : "measure-a")}
            >
              {project.referenceMeasurement ? "Repetir A → B" : "Marcar A → B"}
            </button>
          </div>
          {project.referenceMeasurement && (
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <NumberField label="Distancia conocida" value={project.referenceMeasurement.distance} step={0.01} min={0.001} suffix={project.referenceMeasurement.units} onCommit={(v) => actions.setReferenceMeasurement({ ...project.referenceMeasurement!, distance: v })} />
              <button type="button" className="t-label hover:text-ink pb-2" onClick={() => actions.setReferenceMeasurement(null)}>
                Quitar
              </button>
            </div>
          )}
        </div>
      )}
    </RailCard>
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
    <RailCard icon={Icon.Eye} title="Visualizar">
      <button
        type="button"
        disabled={disabled}
        onClick={() => void visualize(choice)}
        className={`w-full h-12 rounded-xl text-[13px] font-medium transition-colors ${disabled ? "bg-stone text-muted cursor-not-allowed" : "bg-ink text-white hover:bg-ink-2"}`}
      >
        {generating ? "Visualizando…" : "Visualizar ✦"}
      </button>
      <Equation className="mt-3 !text-[9px] !gap-1.5 flex-wrap" />
      <div className="flex items-center justify-between mt-2.5">
        <span className="t-label">{choice === "REALITY" ? "Realidad" : "Arquitectura"}</span>
        <button type="button" className="t-label hover:text-ink transition-colors" onClick={() => ui.setOptionsOpen(!optionsOpen)}>
          Opciones
        </button>
      </div>
      {optionsOpen && (
        <div className="mt-2 rounded-xl border border-line overflow-hidden vc-fade-in">
          {(["REALITY", "ARCHVIZ"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => ui.setOutputChoice(c)}
              className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-stone transition-colors ${choice === c ? "text-ink" : "text-muted"}`}
            >
              <span className="text-[11px] tracking-[0.12em] uppercase">{c === "REALITY" ? "Realidad" : "Arquitectura"}</span>
              <span className="text-[10px] text-muted">{c === "REALITY" ? "tu foto, editada" : "visualización estilizada"}</span>
            </button>
          ))}
        </div>
      )}
    </RailCard>
  );
}
