import type { Provenance } from "@/core/types";
import type { RenderBrief } from "../ai/types";

export interface GenerationRequest {
  brief: RenderBrief;
  productPackId: string;
  /** Static demo assets are identified by id; uploaded spaces are not available to the mock provider. */
  spaceAssetId: string | null;
  spaceIsDemoAsset: boolean;
  variant?: string;
}

export interface GenerationResult {
  /** URL of the produced asset. */
  assetUrl: string;
  mime: string;
  width?: number;
  height?: number;
  provenance: Provenance;
  /** True when the result shares the exact framing of the source photograph. */
  registered: boolean;
}

export interface GenerationProvider {
  readonly id: "mock" | "higgsfield";
  generateReality(req: GenerationRequest): Promise<GenerationResult>;
  generateArchviz(req: GenerationRequest): Promise<GenerationResult>;
  generateMotion(req: GenerationRequest): Promise<GenerationResult>;
}
