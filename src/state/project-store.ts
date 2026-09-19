import { createId } from "@/core/ids";
import { createDemoProject, createEmptyProject, migrateProject, DEMO_PROJECT_ID } from "@/core/demo/demo-project";
import { clonePack, getProductPack } from "@/core/product-packs";
import { estimateFovDeg, solveCamera, type CameraSolve } from "@/core/geometry/camera";
import { convertUnits } from "@/core/geometry/units";
import {
  attachFootprintToWall,
  clampFootprint,
  defaultFootprint,
  footprintInsideImage,
  heightFromPointer,
  reprojectRectangle,
  resizeFootprint,
  resizeFromCorner,
  rotateFootprint,
  translateFootprintOnGround,
} from "@/core/geometry/footprint";
import type {
  AnchorKey,
  AssetRef,
  Dimensions,
  Footprint,
  Lens,
  MaskSettings,
  NormalizedPoint,
  OutputRecord,
  OutputType,
  PresentationBranding,
  ProductDNA,
  ProductPack,
  ProductReference,
  Project,
  ProjectSummary,
  ReferenceMeasurement,
  ReferenceType,
  SceneLock,
  Units,
} from "@/core/types";
import { imageSize, makeThumbnail } from "@/lib/image";
import { renderTechnicalPng } from "@/lib/export-png";
import { renderPlacementMask, renderPlacementReference } from "@/lib/placement-mask";
import { persistence } from "./persistence/db";
import { dehydrateProject, hydrateProject, objectUrlFor, revokeObjectUrl } from "./persistence/hydrate";
import { createStore, useStore } from "./store";

export interface ProjectState {
  ready: boolean;
  project: Project | null;
  projects: ProjectSummary[];
}

export const projectStore = createStore<ProjectState>({ ready: false, project: null, projects: [] });

export function useProject(): Project | null {
  return useStore(projectStore, (s) => s.project);
}

export function useProjectState<S>(selector: (s: ProjectState) => S): S {
  return useStore(projectStore, selector);
}

// ---------- persistence plumbing ----------

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(project: Project): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await persistence.saveProject(dehydrateProject(project));
      await persistence.setMeta("currentProjectId", project.id);
      projectStore.setState({ projects: await persistence.listProjects() });
    } catch (e) {
      console.warn("VisualClose: could not persist project", e);
    }
  }, 350);
}

function update(fn: (p: Project) => Project, opts: { geometry?: boolean } = {}): void {
  const { project } = projectStore.getState();
  if (!project) return;
  let next = fn(project);
  if (next === project) return;
  next = { ...next, updatedAt: Date.now(), revision: opts.geometry ? next.revision + 1 : next.revision };
  projectStore.setState({ project: next });
  scheduleSave(next);
}

function setProject(project: Project): void {
  projectStore.setState({ project });
  scheduleSave(project);
}

// ---------- derived ----------

export function solveFor(project: Project): CameraSolve | null {
  if (!project.space) return null;
  const aspect = project.space.width / project.space.height;
  return solveCamera({
    footprint: project.placement.footprint,
    width: project.dimensions.width,
    depth: project.dimensions.depth,
    aspect,
    lens: project.placement.lens,
  });
}

function outputIndex(outputs: OutputRecord[], type: OutputType): number {
  return outputs.filter((o) => o.type === type).length + 1;
}

function originalOutput(project: Project): OutputRecord {
  if (!project.space) throw new Error("No space");
  return {
    id: createId("out"),
    type: "ORIGINAL",
    index: 1,
    sourceRevision: project.revision,
    spaceAssetId: project.space.asset.id,
    createdAt: Date.now(),
    thumbnail: project.space.asset,
    asset: project.space.asset,
    provenance: { provider: "local", note: "Fotografía original" },
    settings: settingsSnapshot(project),
    favorite: false,
    registered: true,
  };
}

export function settingsSnapshot(project: Project): OutputRecord["settings"] {
  return {
    productPackId: project.productPack.id,
    productName: project.productPack.name,
    dimensions: { ...project.dimensions },
    placementLocked: project.placement.locked,
    hadProductDNA: !!project.productDNA,
    hadSceneLock: !!project.sceneLock,
  };
}

async function blobAsset(file: Blob, name: string, prefix: string): Promise<AssetRef> {
  const id = createId(prefix);
  const mime = file.type || "image/jpeg";
  let size: { width?: number; height?: number } = {};
  try {
    size = await imageSize(file);
  } catch {
    size = {};
  }
  await persistence.putAsset(id, file, name, mime);
  return { id, kind: "blob", url: objectUrlFor(id, file), name, mime, ...size };
}

// ---------- actions ----------

export const actions = {
  async boot(): Promise<void> {
    try {
      const projects = await persistence.listProjects();
      const currentId = await persistence.getMeta("currentProjectId");
      let project: Project | null = null;
      if (currentId) {
        const stored = await persistence.loadProject(currentId);
        if (stored) project = await hydrateProject(migrateProject(stored));
      }
      if (!project) {
        project = createDemoProject();
        await persistence.saveProject(dehydrateProject(project));
        await persistence.setMeta("currentProjectId", project.id);
      }
      projectStore.setState({ ready: true, project, projects: projects.length ? projects : await persistence.listProjects() });
    } catch (e) {
      console.warn("VisualClose: persistence unavailable, running in memory", e);
      projectStore.setState({ ready: true, project: createDemoProject(), projects: [] });
    }
  },

  loadDemoProject(): void {
    const project = createDemoProject();
    setProject(project);
  },

  newProject(name?: string): void {
    setProject(createEmptyProject(name));
  },

  async openProject(id: string): Promise<void> {
    const stored = await persistence.loadProject(id);
    if (!stored) return;
    setProject(await hydrateProject(migrateProject(stored)));
  },

  async deleteProject(id: string): Promise<void> {
    await persistence.deleteProject(id);
    const projects = await persistence.listProjects();
    const current = projectStore.getState().project;
    if (current?.id === id) {
      const nextId = projects[0]?.id;
      if (nextId) await actions.openProject(nextId);
      else actions.loadDemoProject();
    }
    projectStore.setState({ projects });
  },

  renameProject(name: string): void {
    update((p) => ({ ...p, name }));
  },

  async setSpace(file: File): Promise<void> {
    const asset = await blobAsset(file, file.name, "space");
    update(
      (p) => {
        const next: Project = {
          ...p,
          space: { asset, width: asset.width ?? 1600, height: asset.height ?? 1067 },
          placement: { ...p.placement, footprint: defaultFootprint(), wallAnchor: null, rotationDeg: 0, locked: false, lockedAt: null },
          geometryReference: null,
          placementReference: null,
          placementMask: null,
          placementAssetsRevision: null,
          sceneLock: null,
          referenceMeasurement: null,
          outputs: [],
        };
        next.outputs = [originalOutput(next)];
        return next;
      },
      { geometry: true },
    );
  },

  clearSpace(): void {
    update(
      (p) => {
        if (p.space?.asset.kind === "blob") revokeObjectUrl(p.space.asset.id);
        return {
          ...p,
          space: null,
          outputs: [],
          geometryReference: null,
          placementReference: null,
          placementMask: null,
          placementAssetsRevision: null,
          sceneLock: null,
          referenceMeasurement: null,
          placement: { ...p.placement, locked: false, lockedAt: null },
        };
      },
      { geometry: true },
    );
  },

  async addProductReferences(files: File[], type: ReferenceType = "other"): Promise<void> {
    const refs: ProductReference[] = [];
    for (const file of files) {
      const asset = await blobAsset(file, file.name, "ref");
      refs.push({ id: createId("ref"), type, asset });
    }
    update((p) => ({
      ...p,
      productPack: { ...p.productPack, references: [...p.productPack.references, ...refs].slice(0, 8) },
      productDNA: null,
    }));
  },

  setReferenceType(id: string, type: ReferenceType): void {
    update((p) => ({
      ...p,
      productPack: { ...p.productPack, references: p.productPack.references.map((r) => (r.id === id ? { ...r, type } : r)) },
    }));
  },

  removeReference(id: string): void {
    update((p) => ({
      ...p,
      productPack: { ...p.productPack, references: p.productPack.references.filter((r) => r.id !== id) },
    }));
  },

  selectProductPack(packId: string): void {
    const pack = getProductPack(packId);
    if (!pack) return;
    update(
      (p) => ({
        ...p,
        productPack: clonePack(pack),
        dimensions: { ...pack.dimensions },
        productDNA: null,
        placement: { ...p.placement, locked: false, lockedAt: null },
        geometryReference: null,
      }),
      { geometry: true },
    );
  },

  updatePack(partial: Partial<ProductPack>): void {
    update((p) => ({ ...p, productPack: { ...p.productPack, ...partial }, productDNA: partial.notes !== undefined && Object.keys(partial).length === 1 ? p.productDNA : null }));
  },

  setDimensions(partial: Partial<Pick<Dimensions, "width" | "depth" | "height">>): void {
    update(
      (p) => {
        const dims: Dimensions = { ...p.dimensions, ...partial };
        for (const k of ["width", "depth", "height"] as const) {
          if (!(dims[k] > 0) || !Number.isFinite(dims[k])) dims[k] = p.dimensions[k];
        }
        let footprint = p.placement.footprint;
        const solve = solveFor(p);
        if (solve && (dims.width !== p.dimensions.width || dims.depth !== p.dimensions.depth)) {
          const resized = resizeFootprint(solve, dims.width, dims.depth, p.dimensions.depth, p.productPack.placementType);
          // Keep the product in frame: if the true-scale resize would leave the photograph, keep the
          // footprint and let the new dimensions re-interpret it. The user then adjusts by hand.
          if (resized && (footprintInsideImage(resized) || !footprintInsideImage(footprint))) footprint = clampFootprint(resized);
        }
        return { ...p, dimensions: dims, placement: { ...p.placement, footprint, locked: false, lockedAt: null } };
      },
      { geometry: true },
    );
  },

  setUnits(units: Units): void {
    update(
      (p) => {
        if (units === p.dimensions.units) return p;
        const c = (v: number) => Number(convertUnits(v, p.dimensions.units, units).toFixed(units === "m" || units === "ft" ? 3 : 1));
        return { ...p, dimensions: { width: c(p.dimensions.width), depth: c(p.dimensions.depth), height: c(p.dimensions.height), units } };
      },
      { geometry: true },
    );
  },

  /** Live anchor move while dragging; no snapping. */
  moveAnchor(key: AnchorKey, point: NormalizedPoint): void {
    update((p) => ({ ...p, placement: { ...p.placement, footprint: { ...p.placement.footprint, [key]: point }, locked: false, lockedAt: null } }));
  },

  /** Snap the four anchors to the true rectangle under the solved camera. */
  commitFootprint(): void {
    update(
      (p) => {
        const solve = solveFor(p);
        if (!solve) return { ...p, revision: p.revision };
        const snapped = reprojectRectangle(solve, p.dimensions.width, p.dimensions.depth);
        if (!snapped) return p;
        return { ...p, placement: { ...p.placement, footprint: clampFootprint(snapped) } };
      },
      { geometry: true },
    );
  },

  setFootprint(footprint: Footprint): void {
    update((p) => ({ ...p, placement: { ...p.placement, footprint: clampFootprint(footprint), locked: false, lockedAt: null } }), { geometry: true });
  },

  /** Sticker-style corner resize: new dimensions and footprint together, under the solve captured at drag start. */
  applyCornerResize(key: AnchorKey, pointer: NormalizedPoint, base: { solve: CameraSolve; width: number; depth: number }): void {
    update((p) => {
      const r = resizeFromCorner(base.solve, key, pointer, base.width, base.depth);
      if (!r) return p;
      const round = (v: number) => Math.round(v * 100) / 100;
      return {
        ...p,
        dimensions: { ...p.dimensions, width: round(r.width), depth: round(r.depth) },
        placement: { ...p.placement, footprint: clampFootprint(r.footprint), locked: false, lockedAt: null },
      };
    });
  },

  /** Height handle: sets height so the handle follows the pointer. */
  applyHeightDrag(pointer: NormalizedPoint, base: { solve: CameraSolve; depth: number }): void {
    update((p) => {
      const h = heightFromPointer(base.solve, base.depth, pointer);
      if (h === null) return p;
      return { ...p, dimensions: { ...p.dimensions, height: Math.round(h * 100) / 100 }, placement: { ...p.placement, locked: false, lockedAt: null } };
    });
  },

  translateOnGround(from: NormalizedPoint, to: NormalizedPoint, base: { solve: CameraSolve }): void {
    update((p) => {
      const moved = translateFootprintOnGround(base.solve, p.dimensions.width, p.dimensions.depth, from, to);
      if (!moved) return p;
      return { ...p, placement: { ...p.placement, footprint: clampFootprint(moved), locked: false, lockedAt: null } };
    });
  },

  rotateBy(deg: number): void {
    update(
      (p) => {
        const solve = solveFor(p);
        if (!solve) return p;
        const rotated = rotateFootprint(solve, p.dimensions.width, p.dimensions.depth, deg);
        if (!rotated) return p;
        return {
          ...p,
          placement: { ...p.placement, footprint: clampFootprint(rotated), rotationDeg: (p.placement.rotationDeg + deg + 360) % 360, locked: false, lockedAt: null },
        };
      },
      { geometry: true },
    );
  },

  setLens(lens: Lens): void {
    update((p) => ({ ...p, placement: { ...p.placement, lens, locked: false, lockedAt: null } }), { geometry: true });
  },

  /** Estimates the lens from the current anchors, then snaps the anchors to the true rectangle under it. */
  estimateLens(): number | null {
    const { project } = projectStore.getState();
    if (!project?.space) return null;
    const fov = estimateFovDeg(project.placement.footprint, project.dimensions.width, project.dimensions.depth, project.space.width / project.space.height);
    if (fov === null) return null;
    update((p) => ({ ...p, placement: { ...p.placement, lens: { fovDeg: Math.round(fov * 10) / 10, source: "estimated" }, locked: false, lockedAt: null } }), { geometry: true });
    actions.commitFootprint();
    return fov;
  },

  setWallAnchor(point: NormalizedPoint | null): void {
    update(
      (p) => {
        let footprint = p.placement.footprint;
        if (point) {
          const solve = solveFor(p);
          const attached = solve ? attachFootprintToWall(solve, p.dimensions.width, p.dimensions.depth, point) : null;
          if (attached) footprint = clampFootprint(attached);
        }
        return { ...p, placement: { ...p.placement, wallAnchor: point, footprint, locked: false, lockedAt: null } };
      },
      { geometry: true },
    );
  },

  resetPlacement(): void {
    update((p) => ({ ...p, placement: { ...p.placement, footprint: defaultFootprint(), wallAnchor: null, rotationDeg: 0, locked: false, lockedAt: null } }), { geometry: true });
  },

  setReferenceMeasurement(m: ReferenceMeasurement | null): void {
    update((p) => ({ ...p, referenceMeasurement: m }));
  },

  /**
   * Builds the two AI inputs from the current placement: PLACEMENT REFERENCE (photo + clean outline)
   * and PLACEMENT MASK (editable region). Stored separately from any user-facing output.
   */
  async ensurePlacementAssets(force = false): Promise<boolean> {
    const { project } = projectStore.getState();
    if (!project?.space) return false;
    if (!force && project.placementMask && project.placementReference && project.placementAssetsRevision === project.revision) return true;
    const solve = solveFor(project);
    if (!solve) return false;
    try {
      const [mask, reference] = await Promise.all([renderPlacementMask(project, solve), renderPlacementReference(project, solve)]);
      const maskId = createId("mask");
      const refId = createId("pref");
      await persistence.putAsset(maskId, mask, "placement-mask.png", "image/png");
      await persistence.putAsset(refId, reference, "placement-reference.png", "image/png");
      const revision = projectStore.getState().project?.revision ?? project.revision;
      update((p) => {
        if (p.placementMask?.kind === "blob") {
          revokeObjectUrl(p.placementMask.id);
          void persistence.deleteAsset(p.placementMask.id);
        }
        if (p.placementReference?.kind === "blob") {
          revokeObjectUrl(p.placementReference.id);
          void persistence.deleteAsset(p.placementReference.id);
        }
        return {
          ...p,
          placementMask: { id: maskId, kind: "blob", url: objectUrlFor(maskId, mask), name: "placement-mask.png", mime: "image/png" },
          placementReference: { id: refId, kind: "blob", url: objectUrlFor(refId, reference), name: "placement-reference.png", mime: "image/png" },
          placementAssetsRevision: revision,
        };
      });
      return true;
    } catch (e) {
      console.warn("VisualClose: placement assets failed", e);
      return false;
    }
  },

  setMaskSettings(partial: Partial<MaskSettings>): void {
    update((p) => ({ ...p, maskSettings: { ...p.maskSettings, ...partial }, placementAssetsRevision: null }));
  },

  async lockPlacement(): Promise<boolean> {
    const { project } = projectStore.getState();
    if (!project?.space) return false;
    const solve = solveFor(project);
    if (!solve) return false;
    const now = Date.now();
    let technical: OutputRecord | null = null;
    try {
      const png = await renderTechnicalPng(project, solve);
      const fullId = createId("tech");
      const thumbId = createId("techthumb");
      await persistence.putAsset(fullId, png.full, "technical.png", "image/png");
      await persistence.putAsset(thumbId, png.thumb, "technical-thumb.jpg", "image/jpeg");
      technical = {
        id: createId("out"),
        type: "TECHNICAL",
        index: outputIndex(project.outputs, "TECHNICAL"),
        sourceRevision: project.revision,
        spaceAssetId: project.space.asset.id,
        createdAt: now,
        asset: { id: fullId, kind: "blob", url: objectUrlFor(fullId, png.full), name: `technical-${project.productPack.name}.png`, mime: "image/png", width: png.width, height: png.height },
        thumbnail: { id: thumbId, kind: "blob", url: objectUrlFor(thumbId, png.thumb), name: "technical-thumb.jpg", mime: "image/jpeg" },
        provenance: { provider: "local", note: "Vista de plano real generada a partir de la colocación guardada" },
        settings: { ...settingsSnapshot(project), placementLocked: true },
        favorite: false,
        registered: true,
      };
    } catch (e) {
      console.warn("VisualClose: technical export failed", e);
    }
    update((p) => ({
      ...p,
      placement: { ...p.placement, locked: true, lockedAt: now },
      geometryReference: {
        id: createId("geo"),
        revision: p.revision,
        createdAt: now,
        spaceAssetId: p.space!.asset.id,
        productPackId: p.productPack.id,
        productName: p.productPack.name,
        dimensions: { ...p.dimensions },
        footprint: structuredClone(p.placement.footprint),
        wallAnchor: p.placement.wallAnchor ? { ...p.placement.wallAnchor } : null,
        rotationDeg: p.placement.rotationDeg,
        lens: { ...p.placement.lens },
        referenceMeasurement: p.referenceMeasurement ? structuredClone(p.referenceMeasurement) : null,
        solvedFovDeg: solve.fovDeg,
      },
      outputs: technical ? [...p.outputs, technical] : p.outputs,
    }));
    await actions.ensurePlacementAssets(true);
    return true;
  },

  unlockPlacement(): void {
    update((p) => ({ ...p, placement: { ...p.placement, locked: false, lockedAt: null } }));
  },

  setProductDNA(dna: ProductDNA | null): void {
    update((p) => ({ ...p, productDNA: dna, productPack: { ...p.productPack, productDNA: dna } }));
  },

  setSceneLock(lock: SceneLock | null): void {
    update((p) => ({ ...p, sceneLock: lock }));
  },

  async addGeneratedOutput(input: {
    type: "REALITY" | "ARCHVIZ" | "MOTION";
    /** Either a static URL or a ready AssetRef (blob composed in the browser). */
    assetUrl?: string;
    asset?: AssetRef;
    mime: string;
    width?: number;
    height?: number;
    provenance: OutputRecord["provenance"];
    registered: boolean;
    variant?: string;
    preservation?: OutputRecord["preservation"];
  }): Promise<OutputRecord | null> {
    const { project } = projectStore.getState();
    if (!project) return null;
    const asset: AssetRef = input.asset ?? {
      id: createId("asset"),
      kind: "url",
      url: input.assetUrl ?? "",
      name: `${input.type.toLowerCase()}.jpg`,
      mime: input.mime,
      width: input.width,
      height: input.height,
    };
    let thumbnail: AssetRef = { id: createId("thumb"), kind: "url", url: asset.url, name: "thumb", mime: input.mime };
    try {
      const t = await makeThumbnail(asset.url, 360);
      const id = createId("thumb");
      await persistence.putAsset(id, t, "thumb.jpg", "image/jpeg");
      thumbnail = { id, kind: "blob", url: objectUrlFor(id, t), name: "thumb.jpg", mime: "image/jpeg" };
    } catch {
      /* keep url thumbnail */
    }
    const record: OutputRecord = {
      id: createId("out"),
      type: input.type,
      index: outputIndex(project.outputs, input.type),
      sourceRevision: project.revision,
      spaceAssetId: project.space?.asset.id ?? null,
      createdAt: Date.now(),
      asset,
      thumbnail,
      provenance: input.provenance,
      settings: { ...settingsSnapshot(project), variant: input.variant },
      favorite: false,
      registered: input.registered,
      preservation: input.preservation,
    };
    update((p) => ({ ...p, outputs: [...p.outputs, record] }));
    return record;
  },

  toggleFavorite(id: string): void {
    update((p) => ({ ...p, outputs: p.outputs.map((o) => (o.id === id ? { ...o, favorite: !o.favorite } : o)) }));
  },

  deleteOutput(id: string): void {
    update((p) => {
      const target = p.outputs.find((o) => o.id === id);
      if (!target || target.type === "ORIGINAL") return p;
      if (target.asset.kind === "blob") {
        revokeObjectUrl(target.asset.id);
        void persistence.deleteAsset(target.asset.id);
      }
      if (target.thumbnail.kind === "blob") {
        revokeObjectUrl(target.thumbnail.id);
        void persistence.deleteAsset(target.thumbnail.id);
      }
      return { ...p, outputs: p.outputs.filter((o) => o.id !== id) };
    });
  },

  /** Applies an output's recorded configuration back to the project. */
  duplicateSettings(id: string): void {
    update(
      (p) => {
        const o = p.outputs.find((x) => x.id === id);
        if (!o) return p;
        const dims = o.settings.dimensions;
        let footprint = p.placement.footprint;
        const solve = solveFor(p);
        if (solve && (dims.width !== p.dimensions.width || dims.depth !== p.dimensions.depth)) {
          const resized = resizeFootprint(solve, dims.width, dims.depth, p.dimensions.depth, p.productPack.placementType);
          if (resized && (footprintInsideImage(resized) || !footprintInsideImage(footprint))) footprint = clampFootprint(resized);
        }
        return { ...p, dimensions: { ...dims }, placement: { ...p.placement, footprint, locked: false, lockedAt: null } };
      },
      { geometry: true },
    );
  },

  setPresentation(partial: Partial<PresentationBranding>): void {
    update((p) => ({ ...p, presentation: { ...p.presentation, ...partial } }));
  },

  async setProspectLogo(file: File | null): Promise<void> {
    if (!file) {
      update((p) => ({ ...p, presentation: { ...p.presentation, prospectLogo: null } }));
      return;
    }
    const asset = await blobAsset(file, file.name, "logo");
    update((p) => ({ ...p, presentation: { ...p.presentation, prospectLogo: asset } }));
  },

  async resetEverything(): Promise<void> {
    await persistence.clearAll();
    actions.loadDemoProject();
  },
};

export { DEMO_PROJECT_ID };
