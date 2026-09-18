"use client";

import { actions, projectStore } from "./project-store";
import { ui, uiStore } from "./ui-store";
import type { RenderBriefInput } from "@/providers/ai/types";
import type { OutputRecord } from "@/core/types";

const PHASES = ["Composing render brief", "Preserving the environment", "Placing the product", "Resolving"];
const MIN_DURATION_MS = 3400;

interface GenerateResponse {
  result?: { assetUrl: string; mime: string; width?: number; height?: number; provenance: OutputRecord["provenance"]; registered: boolean };
  error?: string;
}

/** Runs the VISUALIZE action for REALITY or ARCHVIZ. Milestone 1 returns mock outputs. */
export async function visualize(mode: "REALITY" | "ARCHVIZ"): Promise<OutputRecord | null> {
  const { project } = projectStore.getState();
  if (!project?.space || uiStore.getState().generating) return null;
  const startedAt = Date.now();
  ui.setMode(mode);
  ui.setCompare(false);
  ui.setGenerating({ mode, startedAt, phase: PHASES[0] });

  const phaseTimer = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const idx = Math.min(PHASES.length - 1, Math.floor(elapsed / (MIN_DURATION_MS / PHASES.length)));
    ui.setGenerationPhase(PHASES[idx]);
  }, 200);

  const briefInput: RenderBriefInput = {
    mode,
    pack: project.productPack,
    dimensions: project.dimensions,
    geometryReference: project.geometryReference,
    sceneLock: project.sceneLock,
    productDNA: project.productDNA,
  };

  try {
    const [res] = await Promise.all([
      fetch(`/api/generate/${mode.toLowerCase()}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          briefInput,
          productPackId: project.productPack.id,
          spaceAssetId: project.space.asset.id,
          spaceIsDemoAsset: project.space.asset.kind === "url",
        }),
      }).then((r) => r.json() as Promise<GenerateResponse>),
      new Promise((r) => setTimeout(r, MIN_DURATION_MS)),
    ]);
    if (!res.result) {
      ui.toast(res.error ?? "Visualization unavailable");
      return null;
    }
    const record = await actions.addGeneratedOutput({ type: mode, ...res.result });
    if (record) ui.selectOutput(record.id);
    return record;
  } catch (e) {
    ui.toast(e instanceof Error ? e.message : "Visualization failed");
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
        (r) => r.json() as Promise<{ productDNA?: import("@/core/types").ProductDNA; error?: string }>,
      ),
      new Promise((r) => setTimeout(r, 1800)),
    ]);
    if (res.productDNA) {
      actions.setProductDNA(res.productDNA);
      ui.toast("Product DNA created");
    } else ui.toast(res.error ?? "Product analysis unavailable");
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
      }).then((r) => r.json() as Promise<{ sceneLock?: import("@/core/types").SceneLock; error?: string }>),
      new Promise((r) => setTimeout(r, 1800)),
    ]);
    if (res.sceneLock) {
      actions.setSceneLock(res.sceneLock);
      ui.toast("Scene locked");
    } else ui.toast(res.error ?? "Scene analysis unavailable");
  } finally {
    ui.setIntelligence({ analyzing: false });
  }
}
