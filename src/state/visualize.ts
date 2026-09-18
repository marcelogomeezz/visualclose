"use client";

import { createId } from "@/core/ids";
import type { AssetRef, OutputRecord, ProductDNA, SceneLock, ScenePreservationRules } from "@/core/types";
import type { RenderBriefInput } from "@/providers/ai/types";
import type { AssetDescriptor, GenerationResult, RealityEditRequest } from "@/providers/generation/types";
import { composeRealityMock } from "@/lib/reality-composite";
import { estimatePreservation } from "@/lib/preservation";
import { actions, projectStore, solveFor } from "./project-store";
import { persistence } from "./persistence/db";
import { objectUrlFor } from "./persistence/hydrate";
import { ui, uiStore } from "./ui-store";

const PHASES = ["Leyendo tu foto", "Conservando todo lo demás", "Instalando el producto", "Ajustando sombras y contacto"];
const MIN_DURATION_MS = 3400;

function describe(asset: AssetRef): AssetDescriptor {
  return { id: asset.id, name: asset.name, mime: asset.mime, width: asset.width, height: asset.height, url: asset.kind === "url" ? asset.url : undefined, isDemoAsset: asset.kind === "url" };
}

/** What the editor must leave alone: everything the scene analysis found, and everything outside the mask. */
export function preservationRules(sceneLock: SceneLock | null): ScenePreservationRules {
  const preserve = sceneLock
    ? [...sceneLock.preserve.architecture, ...sceneLock.preserve.doors, ...sceneLock.preserve.windows, sceneLock.preserve.floor, ...sceneLock.preserve.walls, ...sceneLock.preserve.landscaping, sceneLock.preserve.background, ...sceneLock.preserve.importantObjects]
    : ["Camera viewpoint and framing", "Architecture, walls, windows, doors", "Floor and landscape", "Sky and background", "Existing objects outside the installation region"];
  return {
    preserve,
    editableRegion: "placement-mask",
    allowedContactEffects: ["shadows", "reflections", "occlusion", "contact", "lighting"],
    notes: ["The original photograph is the source of truth.", "Only the placement mask may change; contact effects stay inside its padding."],
  };
}

/**
 * VISUALIZAR. REALIDAD is an edit of the user's own photograph: the placement mask and reference are
 * generated from the 3D guide, sent to the provider abstraction, and the result is validated against
 * the original outside the mask. With no provider connected the client composes a sample inside the mask.
 */
export async function visualize(mode: "REALITY" | "ARCHVIZ"): Promise<OutputRecord | null> {
  const project0 = projectStore.getState().project;
  if (!project0?.space || uiStore.getState().generating) return null;
  const startedAt = Date.now();
  ui.setMode(mode);
  ui.setCompare(false);
  ui.setGenerating({ mode, startedAt, phase: PHASES[0] });
  const phaseTimer = setInterval(() => {
    const idx = Math.min(PHASES.length - 1, Math.floor((Date.now() - startedAt) / (MIN_DURATION_MS / PHASES.length)));
    ui.setGenerationPhase(PHASES[idx]);
  }, 200);

  try {
    // 1. Placement inputs from the 3D guide (never shown as an output).
    await actions.ensurePlacementAssets();
    const project = projectStore.getState().project;
    if (!project?.space) return null;

    const briefInput: RenderBriefInput = {
      mode,
      pack: project.productPack,
      dimensions: project.dimensions,
      geometryReference: project.geometryReference,
      sceneLock: project.sceneLock,
      productDNA: project.productDNA,
    };
    const request: Omit<RealityEditRequest, "brief"> = {
      originalPhoto: describe(project.space.asset),
      productReferences: project.productPack.references.map((r) => describe(r.asset)),
      productDNA: project.productDNA,
      placementReference: project.placementReference ? describe(project.placementReference) : null,
      placementMask: project.placementMask ? describe(project.placementMask) : null,
      dimensions: project.dimensions,
      scenePreservationRules: preservationRules(project.sceneLock),
      productPackId: project.productPack.id,
    };

    // 2. Provider (server). Descriptors only; pixels stay in the browser until a real provider exists.
    const [res] = await Promise.all([
      fetch(`/api/generate/${mode.toLowerCase()}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ briefInput, request }) }).then(
        (r) => r.json() as Promise<{ result?: GenerationResult; error?: string }>,
      ),
      new Promise((r) => setTimeout(r, MIN_DURATION_MS)),
    ]);
    if (!res.result) {
      ui.toast(res.error ?? "Visualización no disponible");
      return null;
    }

    // 3. Result → output record, with the preservation estimate when the framing matches.
    let record: OutputRecord | null = null;
    if (res.result.kind === "client-composite") {
      const solve = solveFor(project);
      if (!solve) {
        ui.toast("Ajusta primero el producto en el espacio");
        return null;
      }
      const composite = await composeRealityMock(project, solve);
      const id = createId("reality");
      await persistence.putAsset(id, composite.blob, "realidad.jpg", "image/jpeg");
      const asset: AssetRef = { id, kind: "blob", url: objectUrlFor(id, composite.blob), name: "realidad.jpg", mime: "image/jpeg", width: composite.width, height: composite.height };
      const preservation = project.placementMask ? await estimatePreservation(project.space.asset.url, asset.url, project.placementMask.url).catch(() => undefined) : undefined;
      record = await actions.addGeneratedOutput({ type: mode, asset, mime: "image/jpeg", width: composite.width, height: composite.height, provenance: res.result.provenance, registered: true, preservation });
    } else {
      const r = res.result;
      const preservation = r.registered && project.placementMask ? await estimatePreservation(project.space.asset.url, r.assetUrl, project.placementMask.url).catch(() => undefined) : undefined;
      record = await actions.addGeneratedOutput({ type: mode, assetUrl: r.assetUrl, mime: r.mime, width: r.width, height: r.height, provenance: r.provenance, registered: r.registered, preservation });
    }
    if (record) ui.selectOutput(record.id);
    return record;
  } catch (e) {
    ui.toast(e instanceof Error ? e.message : "La visualización ha fallado");
    return null;
  } finally {
    clearInterval(phaseTimer);
    ui.setGenerating(null);
  }
}

export async function learnProduct(): Promise<void> {
  const { project } = projectStore.getState();
  if (!project) return;
  ui.setIntelligence({ learning: true });
  try {
    const [res] = await Promise.all([
      fetch("/api/ai/analyze-product", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pack: project.productPack }) }).then(
        (r) => r.json() as Promise<{ productDNA?: ProductDNA; error?: string }>,
      ),
      new Promise((r) => setTimeout(r, 1800)),
    ]);
    if (res.productDNA) actions.setProductDNA(res.productDNA);
    else ui.toast(res.error ?? "Análisis de producto no disponible");
  } finally {
    ui.setIntelligence({ learning: false });
  }
}

export async function analyzeSpace(): Promise<void> {
  const { project } = projectStore.getState();
  if (!project?.space) return;
  ui.setIntelligence({ analyzing: true });
  try {
    const [res] = await Promise.all([
      fetch("/api/ai/analyze-scene", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          spaceAssetId: project.space.asset.id,
          spaceName: project.space.asset.name,
          imageSize: { width: project.space.width, height: project.space.height },
          productCategory: project.productPack.category,
          placementType: project.productPack.placementType,
        }),
      }).then((r) => r.json() as Promise<{ sceneLock?: SceneLock; error?: string }>),
      new Promise((r) => setTimeout(r, 1800)),
    ]);
    if (res.sceneLock) actions.setSceneLock(res.sceneLock);
    else ui.toast(res.error ?? "Análisis del espacio no disponible");
  } finally {
    ui.setIntelligence({ analyzing: false });
  }
}
