"use client";

import { useEffect, useState } from "react";
import { CATEGORY_LABELS, PLACEMENT_TYPES, PLACEMENT_TYPE_LABELS, type PlacementType, type Units } from "@/core/types";
import { formatDimensions } from "@/core/geometry/units";
import { actions, useProject } from "@/state/project-store";
import { usePlacementSolve, useDisplayedOutput } from "@/state/derived";
import { ui, useUI } from "@/state/ui-store";
import { Button } from "@/components/ui/Button";
import { Row, Section } from "@/components/ui/Section";
import { formatTime, outputLabel } from "@/lib/format";
import { Sheet } from "./Sheet";

const UNITS: Units[] = ["m", "cm", "mm", "ft", "in"];

/** Everything an operator does not need day to day: product data, analysis internals, output provenance, developer state. */
export function AdvancedSheet() {
  const project = useProject();
  const solve = usePlacementSolve();
  const displayed = useDisplayedOutput();
  const mode = useUI((s) => s.mode);
  const [fps, setFps] = useState(0);
  const [showState, setShowState] = useState(false);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      frames += 1;
      if (t - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!project) return null;
  const pack = project.productPack;
  const dna = project.productDNA;
  const lock = project.sceneLock;
  const list = (items: string[]) => (
    <ul className="space-y-0.5">
      {items.map((i) => (
        <li key={i} className="text-[11px] text-ivory/85 leading-snug pl-2.5 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1 before:h-px before:bg-warm-grey">
          {i}
        </li>
      ))}
    </ul>
  );
  const field = (label: string, key: "color" | "material" | "finish" | "installationType") => (
    <label className="block">
      <span className="t-label block mb-1">{label}</span>
      <input className="vc-input" value={pack[key]} onChange={(e) => actions.updatePack({ [key]: e.target.value })} />
    </label>
  );

  return (
    <Sheet title="Avanzado" width={560}>
      <Section title="Producto" aside={<span className="t-label">{CATEGORY_LABELS[pack.category]}</span>}>
        <div className="space-y-2.5">
          <label className="block">
            <span className="t-label block mb-1">Tipo de colocación</span>
            <select className="vc-input" value={pack.placementType} onChange={(e) => actions.updatePack({ placementType: e.target.value as PlacementType })}>
              {PLACEMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PLACEMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {field("Color", "color")}
            {field("Acabado", "finish")}
          </div>
          {field("Material", "material")}
          {field("Instalación", "installationType")}
          <label className="block">
            <span className="t-label block mb-1">Unidades</span>
            <select className="vc-input" value={project.dimensions.units} onChange={(e) => actions.setUnits(e.target.value as Units)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          {pack.customSpecifications.map((s) => (
            <Row key={s.label} label={s.label}>
              {s.value}
            </Row>
          ))}
        </div>
      </Section>

      <Section title="Análisis del producto" aside={dna && <span className="t-label text-champagne">listo</span>}>
        {dna ? (
          <div className="space-y-3">
            <p className="text-[11.5px] text-ivory/90 leading-snug">{dna.summary}</p>
            <div>
              <div className="t-label mb-1">No debe cambiar</div>
              {list(dna.invariants)}
            </div>
            <div>
              <div className="t-label mb-1">Rasgos distintivos</div>
              {list(dna.distinctiveFeatures)}
            </div>
            <div>
              <div className="t-label mb-1">Restricciones de render</div>
              {list(dna.renderingConstraints)}
            </div>
            <div className="text-[10.5px] text-warm-grey-2">Comprensión estructurada de las referencias. No se entrena ningún modelo.</div>
            <Button size="sm" variant="quiet" onClick={() => actions.setProductDNA(null)}>
              Volver a analizar
            </Button>
          </div>
        ) : (
          <div className="text-[11px] text-warm-grey">Se ejecuta automáticamente al añadir fotos del producto.</div>
        )}
      </Section>

      <Section title="Análisis del espacio" aside={lock && <span className="t-label text-champagne">listo</span>}>
        {lock ? (
          <div className="space-y-3">
            <div>
              <div className="t-label mb-1">Se conserva</div>
              {list([...lock.preserve.architecture, ...lock.preserve.doors, ...lock.preserve.windows, lock.preserve.floor, ...lock.preserve.landscaping, ...lock.preserve.importantObjects])}
            </div>
            <Row label="Zona de instalación">{lock.installationRegion.description}</Row>
            <Row label="Obstáculos">{lock.obstructions.join(", ") || "Ninguno"}</Row>
            <Row label="Luz">{lock.lighting}</Row>
            <Button size="sm" variant="quiet" onClick={() => actions.setSceneLock(null)}>
              Volver a analizar
            </Button>
          </div>
        ) : (
          <div className="text-[11px] text-warm-grey">Se ejecuta automáticamente al añadir la foto del espacio.</div>
        )}
      </Section>

      <Section title="Región de edición" aside={project.placementAssetsRevision === project.revision ? <span className="t-label text-champagne">al día</span> : <span className="t-label">pendiente</span>}>
        <div className="text-[11px] text-warm-grey mb-3 leading-snug">
          La foto original es la fuente de verdad. La IA solo puede cambiar la máscara; la referencia de colocación guía la perspectiva. Ninguna de las dos es una salida.
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            ["Referencia de colocación", project.placementReference],
            ["Máscara de edición", project.placementMask],
          ].map(([label, asset]) => (
            <div key={label as string}>
              <div className="t-label mb-1">{label as string}</div>
              <div className="aspect-[3/2] bg-graphite-0 border border-line overflow-hidden">
                {asset && typeof asset === "object" && asset.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-warm-grey-2">Se genera al pulsar LISTO</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="t-label w-24">Margen</span>
          <input type="range" className="vc-range" min={0} max={120} step={4} value={project.maskSettings.paddingPx} onChange={(e) => actions.setMaskSettings({ paddingPx: Number(e.target.value) })} />
          <span className="t-mono text-[10.5px] w-12 text-right">{project.maskSettings.paddingPx}px</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="t-label w-24">Sombra</span>
          <input type="range" className="vc-range" min={0} max={2} step={0.1} value={project.maskSettings.shadowReach} onChange={(e) => actions.setMaskSettings({ shadowReach: Number(e.target.value) })} />
          <span className="t-mono text-[10.5px] w-12 text-right">{project.maskSettings.shadowReach.toFixed(1)}×</span>
        </div>
        <Button size="sm" variant="outline" className="mt-3" disabled={!solve} onClick={() => void actions.ensurePlacementAssets(true).then((ok) => ui.toast(ok ? "Máscara y referencia regeneradas" : "No se pudo generar la máscara"))}>
          Regenerar
        </Button>
      </Section>

      {displayed && (
        <Section title={outputLabel(displayed.type, displayed.index)} aside={<span className="t-label">{formatTime(displayed.createdAt)}</span>}>
          <Row label="Proveedor">{displayed.provenance.provider}</Row>
          <Row label="Revisión">
            <span className="t-mono">
              {displayed.sourceRevision}
              {displayed.sourceRevision !== project.revision && <span className="text-champagne"> · anterior</span>}
            </span>
          </Row>
          <Row label="Medidas">
            <span className="t-mono">{formatDimensions(displayed.settings.dimensions.width, displayed.settings.dimensions.depth, displayed.settings.dimensions.height, displayed.settings.dimensions.units)}</span>
          </Row>
          <Row label="Alineado con la foto">{displayed.registered ? "Sí" : "No"}</Row>
          {displayed.preservation && (
            <Row label="Fondo conservado">
              <span className={`t-mono ${displayed.preservation.passed ? "text-champagne" : "text-danger"}`}>
                {(100 - displayed.preservation.outsideChangedRatio * 100).toFixed(2)}% · {displayed.preservation.passed ? "ok" : "revisar"}
              </span>
            </Row>
          )}
          {displayed.preservation && <div className="text-[10.5px] text-warm-grey-2 pt-1">Estimación interna fuera de la máscara. No es una garantía píxel a píxel.</div>}
          {displayed.provenance.note && <div className="text-[10.5px] text-warm-grey pt-1">{displayed.provenance.note}</div>}
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={() => actions.toggleFavorite(displayed.id)}>
              {displayed.favorite ? "Quitar favorito" : "Favorito"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => actions.duplicateSettings(displayed.id)}>
              Reutilizar ajustes
            </Button>
            {displayed.type !== "ORIGINAL" && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  actions.deleteOutput(displayed.id);
                  ui.selectOutput(null);
                }}
              >
                Eliminar
              </Button>
            )}
          </div>
        </Section>
      )}

      <Section title="Geometría">
        <Row label="Modo">{mode}</Row>
        <Row label="Revisión del proyecto">
          <span className="t-mono">{project.revision}</span>
        </Row>
        <Row label="Cámara resuelta">
          <span className="t-mono">{solve ? `${project.placement.lens.source} · ${solve.fovDeg.toFixed(1)}° · Δ ${solve.consistency.toFixed(3)}` : "—"}</span>
        </Row>
        <Row label="Esquinas">
          <span className="t-mono text-[10px]">
            {(["FL", "FR", "BL", "BR"] as const).map((k) => `${k} ${project.placement.footprint[k].x.toFixed(3)},${project.placement.footprint[k].y.toFixed(3)}`).join(" · ")}
          </span>
        </Row>
        {project.geometryReference && (
          <Row label="Colocación guardada">
            rev {project.geometryReference.revision} · {formatTime(project.geometryReference.createdAt)}
          </Row>
        )}
      </Section>

      <Section title="Desarrollo">
        <Row label="Proveedor IA">mock (servidor)</Row>
        <Row label="Proveedor de generación">mock (servidor)</Row>
        <Row label="Frames por segundo">
          <span className="t-mono">{fps}</span>
        </Row>
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={() => setShowState((s) => !s)}>
            {showState ? "Ocultar estado" : "Ver estado"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void actions.resetEverything().then(() => ui.toast("Datos locales borrados"))}>
            Borrar datos locales
          </Button>
        </div>
        {showState && <pre className="mt-3 t-mono text-[10px] text-warm-grey whitespace-pre-wrap break-all leading-relaxed">{JSON.stringify({ ...project, outputs: project.outputs.map((o) => ({ ...o, asset: { ...o.asset, url: "…" }, thumbnail: { ...o.thumbnail, url: "…" } })) }, null, 2)}</pre>}
      </Section>
    </Sheet>
  );
}
