import { getProductPack } from "@/core/product-packs";
import type { GenerationProvider, GenerationRequest, GenerationResult } from "./types";

const GENERIC = {
  REALITY: "/demo/generic/reality.jpg",
  ARCHVIZ: "/demo/generic/archviz.jpg",
} as const;

/** Returns pre-rendered placeholder outputs. Never claims to have generated anything. */
export class MockGenerationProvider implements GenerationProvider {
  readonly id = "mock" as const;

  private resolve(kind: "REALITY" | "ARCHVIZ", req: GenerationRequest): GenerationResult {
    const pack = getProductPack(req.productPackId);
    const packAsset = kind === "REALITY" ? pack?.demoOutputs?.reality : pack?.demoOutputs?.archviz;
    const usePackAsset = !!packAsset && req.spaceIsDemoAsset;
    return {
      assetUrl: usePackAsset ? packAsset : GENERIC[kind],
      mime: "image/jpeg",
      width: 1920,
      height: 1280,
      provenance: {
        provider: "mock",
        note: usePackAsset
          ? `Pre-rendered placeholder ${kind.toLowerCase()} for ${pack?.name ?? req.productPackId}`
          : "Generic placeholder. The mock provider cannot render an uploaded space.",
      },
      registered: usePackAsset,
    };
  }

  async generateReality(req: GenerationRequest): Promise<GenerationResult> {
    return this.resolve("REALITY", req);
  }

  async generateArchviz(req: GenerationRequest): Promise<GenerationResult> {
    return this.resolve("ARCHVIZ", req);
  }

  async generateMotion(): Promise<GenerationResult> {
    throw new Error("MOTION is experimental and not available in Milestone 1.");
  }
}
