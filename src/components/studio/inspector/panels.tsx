"use client";

import { useMemo } from "react";
import { MAX_FOV_DEG, MIN_FOV_DEG } from "@/core/geometry/camera";
import { groundDistance } from "@/core/geometry/footprint";
import { formatDimensions, toMeters, fromMeters } from "@/core/geometry/units";
import { CATEGORY_LABELS, PLACEMENT_TYPES, PLACEMENT_TYPE_LABELS, type PlacementType, type Units } from "@/core/types";
import { actions, useProject } from "@/state/project-store";
import { usePlacementSolve } from "@/state/derived";
import { ui, useUI } from "@/state/ui-store";
import { analyzeSpace, learnProduct } from "@/state/visualize";
import { Button } from "@/components/ui/Button";
import { NumberField } from "@/components/ui/NumberField";
import { Section, Row } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { downloadAsset } from "@/lib/image";
import { formatTime } from "@/lib/format";

const UNITS: Units[] = ["m", "cm", "mm", "ft", "in"];

export function ProductPanel({ editable = true }: { editable?: boolean }) {
  const project = useProject();
  if (!project) return null;
  const pack = project.productPack;
  const field = (label: string, key: "name" | "color" | "material" | "finish" | "installationType") => (
    <label className="block">
      <span className="t-label block mb-1">{label}</span>
      <input className="vc-input" value={pack[key]} disabled={!editable} onChange={(e) => actions.updatePack({ [key]: e.target.value })} />
    </label>
  );
  return (
    <Section title="Product Pack" aside={<span className="t-label">{CATEGORY_LABELS[pack.category]}</span>}>
      <div className="space-y-2.5">
        {field("Name", "name")}
        <label className="block">
          <span className="t-label block mb-1">Placement type</span>
          <select className="vc-input" value={pack.placementType} disabled={!editable} onChange={(e) => actions.updatePack({ placementType: e.target.value as PlacementType })}>
            {PLACEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PLACEMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {field("Color", "color")}
          {field("Finish", "finish")}
        </div>
        {field("Material", "material")}
        {field("Installation", "installationType")}
        {pack.customSpecifications.length > 0 && (
          <div className="pt-1">
            {pack.customSpecifications.map((s) => (
              <Row key={s.label} label={s.label}>
                {s.value}
              </Row>
            ))}
          </div>
        )}
        {pack.notes && <div className="text-[11px] text-warm-grey pt-1">{pack.notes}</div>}
      </div>
    </Section>
  );
}

export function DimensionsPanel() {
  const project = useProject();
  if (!project) return null;
  const { width, depth, height, units } = project.dimensions;
  const step = units === "m" ? 0.05 : units === "ft" ? 0.1 : 1;
  return (
    <Section
      title="Dimensions"
      aside={
        <select className="bg-transparent t-label text-ivory outline-none cursor-pointer" value={units} onChange={(e) => actions.setUnits(e.target.value as Units)}>
          {UNITS.map((u) => (
            <option key={u} value={u} className="bg-graphite-2">
              {u}
            </option>
          ))}
        </select>
      }
    >
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Width" value={width} step={step} suffix={units} onCommit={(v) => actions.setDimensions({ width: v })} />
        <NumberField label="Depth" value={depth} step={step} suffix={units} onCommit={(v) => actions.setDimensions({ depth: v })} />
        <NumberField label="Height" value={height} step={step} suffix={units} onCommit={(v) => actions.setDimensions({ height: v })} />
      </div>
      <div className="t-mono text-[11px] text-warm-grey mt-3">{formatDimensions(width, depth, height, units)}</div>
      <div className="text-[10.5px] text-warm-grey-2 mt-1">Deterministic. AI never sets dimensions.</div>
    </Section>
  );
}

export function PlacementPanel() {
  const project = useProject();
  const solve = usePlacementSolve();
  const pickTool = useUI((s) => s.pickTool);
  if (!project) return null;
  const { placement, productPack } = project;
  const wallRelevant = productPack.placementType === "WALL_ATTACHED_STRUCTURE" || productPack.placementType === "WALL_SURFACE";
  const inconsistent = !!solve && solve.consistency > 0.12;
  return (
    <Section
      title="Placement"
      aside={
        placement.locked ? (
          <span className="t-label text-champagne flex items-center gap-1">
            <Icon.Lock width={11} height={11} /> Locked
          </span>
        ) : (
          <button type="button" className="t-label hover:text-ivory transition-colors" onClick={() => actions.resetPlacement()}>
            Reset
          </button>
        )
      }
    >
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="t-label">Lens</span>
            <button
              type="button"
              className="t-label hover:text-ivory transition-colors"
              onClick={() => {
                const fov = actions.estimateLens();
                ui.toast(fov === null ? "Anchors too parallel to estimate a lens" : `Lens estimated · ${fov.toFixed(1)}°`);
              }}
            >
              Estimate
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              className="vc-range"
              min={MIN_FOV_DEG}
              max={MAX_FOV_DEG}
              step={0.5}
              value={placement.lens.fovDeg}
              onChange={(e) => actions.setLens({ fovDeg: Number(e.target.value), source: "manual" })}
            />
            <span className="t-mono text-[11px] w-14 text-right">{placement.lens.fovDeg.toFixed(1)}°</span>
          </div>
          <div className="t-mono text-[10.5px] text-warm-grey mt-1">
            {placement.lens.source === "estimated" ? "Estimated from anchors" : placement.lens.source === "manual" ? "Set manually" : "Default · estimate or adjust"}
          </div>
          {inconsistent && <div className="text-[10.5px] text-champagne mt-1.5">Perspective does not match a true rectangle. Adjust anchors or lens.</div>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="t-label">Rotation</span>
            <span className="t-mono text-[11px]">{Math.round(placement.rotationDeg)}°</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[-45, -5, 5, 45].map((d) => (
              <button key={d} type="button" disabled={!solve} onClick={() => actions.rotateBy(d)} className="h-7 flex-1 border border-line text-[10.5px] t-mono text-warm-grey hover:text-ivory hover:border-line-strong disabled:opacity-40 transition-colors">
                {d > 0 ? `+${d}` : d}°
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="t-label">Anchors</span>
            <span className="t-label">normalized</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 t-mono text-[10.5px] text-warm-grey">
            {(["FL", "FR", "BL", "BR"] as const).map((k) => (
              <div key={k} className="flex justify-between">
                <span className="text-ivory">{k}</span>
                <span>
                  {placement.footprint[k].x.toFixed(3)}, {placement.footprint[k].y.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {(wallRelevant || placement.wallAnchor) && (
          <div className="flex items-center justify-between">
            <span className="t-label">Wall anchor</span>
            <div className="flex gap-1.5">
              <Button size="sm" variant={pickTool === "wall-anchor" ? "primary" : "outline"} onClick={() => ui.setPickTool(pickTool === "wall-anchor" ? null : "wall-anchor")}>
                {placement.wallAnchor ? "Move" : "Set"}
              </Button>
              {placement.wallAnchor && (
                <Button size="sm" variant="quiet" onClick={() => actions.setWallAnchor(null)}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {placement.locked ? (
          <Button className="w-full" variant="outline" size="lg" onClick={() => actions.unlockPlacement()}>
            <Icon.Unlock /> Unlock placement
          </Button>
        ) : (
          <Button
            className="w-full"
            variant="primary"
            size="lg"
            disabled={!solve}
            onClick={async () => {
              const ok = await actions.lockPlacement();
              if (ok) {
                ui.toast("Placement locked · Technical view created");
                ui.setMode("TECHNICAL");
              }
            }}
          >
            <Icon.Lock /> Lock placement
          </Button>
        )}
        {placement.lockedAt && <div className="t-label text-center">Locked {formatTime(placement.lockedAt)}</div>}
      </div>
    </Section>
  );
}

export function MeasurementPanel() {
  const project = useProject();
  const solve = usePlacementSolve();
  const pickTool = useUI((s) => s.pickTool);
  const m = project?.referenceMeasurement ?? null;
  const implied = useMemo(() => {
    if (!m || !solve) return null;
    const d = groundDistance(solve, m.a, m.b);
    return d === null ? null : fromMeters(d, m.units);
  }, [m, solve]);
  if (!project) return null;
  const picking = pickTool === "measure-a" || pickTool === "measure-b";
  return (
    <Section
      title="Reference measurement"
      aside={
        m && (
          <button type="button" className="t-label hover:text-ivory transition-colors" onClick={() => actions.setReferenceMeasurement(null)}>
            Clear
          </button>
        )
      }
    >
      <div className="space-y-2.5">
        <Button className="w-full" variant={picking ? "primary" : "outline"} onClick={() => ui.setPickTool(picking ? null : "measure-a")}>
          <Icon.Point /> {picking ? "Picking…" : m ? "Re-pick A → B" : "Pick Point A → B"}
        </Button>
        {m && (
          <>
            <div className="grid grid-cols-[1fr_72px] gap-2">
              <NumberField label="Known distance" value={m.distance} step={0.01} min={0.001} onCommit={(v) => actions.setReferenceMeasurement({ ...m, distance: v })} />
              <label className="block">
                <span className="t-label block mb-1">Units</span>
                <select className="vc-input" value={m.units} onChange={(e) => actions.setReferenceMeasurement({ ...m, units: e.target.value as Units })}>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <input className="vc-input" placeholder="Label (optional)" value={m.label ?? ""} onChange={(e) => actions.setReferenceMeasurement({ ...m, label: e.target.value })} />
            <div className="t-mono text-[10.5px] text-warm-grey">
              A {m.a.x.toFixed(3)}, {m.a.y.toFixed(3)} · B {m.b.x.toFixed(3)}, {m.b.y.toFixed(3)}
            </div>
            {implied !== null && (
              <div className="text-[10.5px] text-warm-grey">
                If A–B lies on the ground plane, the current placement implies <span className="text-ivory t-mono">{implied.toFixed(2)} {m.units}</span> ({toMeters(m.distance, m.units) > 0 ? `${Math.round((implied / m.distance) * 100)}%` : "—"}).
              </div>
            )}
          </>
        )}
        <div className="text-[10.5px] text-warm-grey-2">Calibration aid only. One photograph is not a survey.</div>
      </div>
    </Section>
  );
}

export function IntelligencePanel() {
  const project = useProject();
  const intel = useUI((s) => s.intelligence);
  if (!project) return null;
  const dna = project.productDNA;
  const lock = project.sceneLock;
  const list = (items: string[]) =>
    items.length ? (
      <ul className="space-y-0.5">
        {items.map((i) => (
          <li key={i} className="text-[11px] text-ivory/85 leading-snug pl-2.5 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1 before:h-px before:bg-warm-grey">
            {i}
          </li>
        ))}
      </ul>
    ) : null;
  return (
    <>
      <Section title="Product DNA" aside={dna && <span className="t-label text-champagne">Created</span>}>
        {dna ? (
          <div className="space-y-3">
            <p className="text-[11.5px] text-ivory/90 leading-snug">{dna.summary}</p>
            <div>
              <div className="t-label mb-1">Must not change</div>
              {list(dna.invariants)}
            </div>
            <div>
              <div className="t-label mb-1">Distinctive features</div>
              {list(dna.distinctiveFeatures)}
            </div>
            <div>
              <div className="t-label mb-1">Rendering constraints</div>
              {list(dna.renderingConstraints)}
            </div>
            <div className="text-[10.5px] text-warm-grey-2">Structured understanding of the references. No model was trained.</div>
            <Button size="sm" variant="quiet" onClick={() => actions.setProductDNA(null)}>
              Discard
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button className="w-full" variant="outline" disabled={intel.learning || project.productPack.references.length === 0} onClick={() => void learnProduct()}>
              {intel.learning ? "Reading references…" : "Learn product"}
            </Button>
            <div className="text-[10.5px] text-warm-grey-2">Builds a structured description from the reference images and specifications.</div>
          </div>
        )}
      </Section>
      <Section title="Scene Lock" aside={lock && <span className="t-label text-champagne">Locked</span>}>
        {lock ? (
          <div className="space-y-3">
            <div className="text-[11.5px] text-ivory/90">Keep the real environment real.</div>
            <div>
              <div className="t-label mb-1">Preserve</div>
              {list([...lock.preserve.architecture, ...lock.preserve.doors, ...lock.preserve.windows, lock.preserve.floor, ...lock.preserve.landscaping, ...lock.preserve.importantObjects])}
            </div>
            <Row label="Install region">{lock.installationRegion.description}</Row>
            <Row label="Obstructions">{lock.obstructions.join(", ") || "None"}</Row>
            <Row label="Lighting">{lock.lighting}</Row>
            <Button size="sm" variant="quiet" onClick={() => actions.setSceneLock(null)}>
              Discard
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button className="w-full" variant="outline" disabled={intel.analyzing || !project.space} onClick={() => void analyzeSpace()}>
              {intel.analyzing ? "Reading the space…" : "Analyze space"}
            </Button>
            <div className="text-[10.5px] text-warm-grey-2">Identifies what must stay untouched in the photograph.</div>
          </div>
        )}
      </Section>
    </>
  );
}

export function SpacePanel() {
  const project = useProject();
  if (!project?.space) return null;
  const { space } = project;
  return (
    <Section title="Space">
      <Row label="File">{space.asset.name}</Row>
      <Row label="Size">
        <span className="t-mono">
          {space.width} × {space.height}
        </span>
      </Row>
      <Row label="Source">{space.asset.kind === "url" ? "Demo asset" : "Uploaded"}</Row>
    </Section>
  );
}

export function TechnicalPanel() {
  const project = useProject();
  const solve = usePlacementSolve();
  if (!project) return null;
  const g = project.geometryReference;
  return (
    <Section title="Geometry reference" aside={g && <span className="t-mono text-[10px] text-warm-grey">rev {g.revision}</span>}>
      {g ? (
        <div className="space-y-1">
          <Row label="Product">{g.productName}</Row>
          <Row label="Dimensions">
            <span className="t-mono">{formatDimensions(g.dimensions.width, g.dimensions.depth, g.dimensions.height, g.dimensions.units)}</span>
          </Row>
          <Row label="Orientation">
            <span className="t-mono">{Math.round(g.rotationDeg)}°</span>
          </Row>
          <Row label="Lens">
            <span className="t-mono">{g.solvedFovDeg ? `${g.solvedFovDeg.toFixed(1)}°` : "—"}</span>
          </Row>
          <Row label="Reference">{g.referenceMeasurement ? `${g.referenceMeasurement.distance} ${g.referenceMeasurement.units}` : "None"}</Row>
          <Row label="Created">{formatTime(g.createdAt)}</Row>
          {g.revision !== project.revision && <div className="text-[10.5px] text-champagne pt-1">Geometry changed since lock. Re-lock to refresh.</div>}
        </div>
      ) : (
        <div className="text-[11px] text-warm-grey">Not locked. The technical view shows the live draft.</div>
      )}
      <div className="mt-3">
        <Button
          className="w-full"
          variant="outline"
          disabled={!solve}
          onClick={async () => {
            if (!solve) return;
            const { renderTechnicalPng } = await import("@/lib/export-png");
            const png = await renderTechnicalPng(project, solve);
            const url = URL.createObjectURL(png.full);
            const { downloadUrl } = await import("@/lib/image");
            downloadUrl(url, `${project.productPack.name.replace(/\s+/g, "-").toLowerCase()}-technical.png`);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          }}
        >
          <Icon.Download /> Export PNG
        </Button>
      </div>
    </Section>
  );
}

export function ReadinessPanel() {
  const project = useProject();
  if (!project) return null;
  const items: { label: string; ok: boolean }[] = [
    { label: "Space photograph", ok: !!project.space },
    { label: "Product references", ok: project.productPack.references.length > 0 },
    { label: "Placement locked", ok: project.placement.locked },
    { label: "Product DNA", ok: !!project.productDNA },
    { label: "Scene Lock", ok: !!project.sceneLock },
  ];
  return (
    <Section title="Readiness">
      <div className="space-y-1">
        {items.map((i) => (
          <div key={i.label} className="flex items-center justify-between text-[11.5px]">
            <span className={i.ok ? "text-ivory" : "text-warm-grey"}>{i.label}</span>
            <span className={i.ok ? "text-champagne" : "text-warm-grey-2"}>{i.ok ? <Icon.Check width={12} height={12} /> : "—"}</span>
          </div>
        ))}
      </div>
      <div className="text-[10.5px] text-warm-grey-2 mt-2">Not required to visualize. Each one improves fidelity.</div>
    </Section>
  );
}

export function OutputPanel() {
  const project = useProject();
  const selectedId = useUI((s) => s.selectedOutputId);
  const mode = useUI((s) => s.mode);
  const compare = useUI((s) => s.compare);
  if (!project) return null;
  const output = project.outputs.find((o) => o.id === selectedId) ?? null;
  if (!output) return null;
  const canCompare = output.registered && (output.type === "REALITY" || output.type === "ARCHVIZ");
  return (
    <Section title={`${output.type} ${output.type === "ORIGINAL" ? "" : String(output.index).padStart(2, "0")}`} aside={<span className="t-label">{formatTime(output.createdAt)}</span>}>
      <div className="space-y-1">
        <Row label="Provider">{output.provenance.provider}</Row>
        <Row label="Revision">
          <span className="t-mono">
            {output.sourceRevision}
            {output.sourceRevision !== project.revision && <span className="text-champagne"> · stale</span>}
          </span>
        </Row>
        <Row label="Dimensions">
          <span className="t-mono">{formatDimensions(output.settings.dimensions.width, output.settings.dimensions.depth, output.settings.dimensions.height, output.settings.dimensions.units)}</span>
        </Row>
        <Row label="Registered">{output.registered ? "Same framing" : "No"}</Row>
        {output.provenance.note && <div className="text-[10.5px] text-warm-grey pt-1">{output.provenance.note}</div>}
      </div>
      <div className="grid grid-cols-5 gap-1 mt-3">
        <IconAction title="Favorite" active={output.favorite} onClick={() => actions.toggleFavorite(output.id)}>
          <Icon.Star filled={output.favorite} />
        </IconAction>
        <IconAction title="Download" onClick={() => void downloadAsset(output.asset.url, output.asset.name)}>
          <Icon.Download />
        </IconAction>
        <IconAction
          title="Compare"
          disabled={!canCompare}
          active={compare && mode === output.type}
          onClick={() => {
            ui.setMode(output.type as "REALITY" | "ARCHVIZ");
            ui.selectOutput(output.id);
            ui.setCompare(!(compare && mode === output.type));
          }}
        >
          <Icon.Compare />
        </IconAction>
        <IconAction
          title="Duplicate settings"
          onClick={() => {
            actions.duplicateSettings(output.id);
            ui.toast("Settings applied to project");
          }}
        >
          <Icon.Duplicate />
        </IconAction>
        <IconAction
          title="Delete"
          disabled={output.type === "ORIGINAL"}
          onClick={() => {
            actions.deleteOutput(output.id);
            ui.selectOutput(null);
          }}
        >
          <Icon.Trash />
        </IconAction>
      </div>
    </Section>
  );
}

function IconAction({ title, onClick, active, disabled, children }: { title: string; onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`h-8 flex items-center justify-center border transition-colors disabled:opacity-30 ${active ? "border-champagne text-champagne" : "border-line text-warm-grey hover:text-ivory hover:border-line-strong"}`}
    >
      {children}
    </button>
  );
}
