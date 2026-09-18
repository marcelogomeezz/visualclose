import type { Dimensions, ProductDNA, Provenance, ScenePreservationRules } from "@/core/types";
import type { RenderBrief } from "../ai/types";

/** A reference to an image the provider will receive. Uploads are transferred when a real provider is connected. */
export interface AssetDescriptor {
  id: string;
  name: string;
  mime: string;
  width?: number;
  height?: number;
  /** Only meaningful for static demo assets. Uploaded files never leave the browser in Milestone 2. */
  url?: string;
  isDemoAsset: boolean;
}

/**
 * REALITY is photographic editing: the original photograph comes back with the product installed
 * inside the placement mask. Nothing outside the mask may change.
 */
export interface RealityEditRequest {
  originalPhoto: AssetDescriptor;
  productReferences: AssetDescriptor[];
  productDNA: ProductDNA | null;
  placementReference: AssetDescriptor | null;
  placementMask: AssetDescriptor | null;
  dimensions: Dimensions;
  scenePreservationRules: ScenePreservationRules;
  brief: RenderBrief;
  productPackId: string;
  variant?: string;
}

/** ARCHITECTURE and MOTION are secondary; they receive the same inputs and may stylise more freely. */
export type ArchitectureRequest = RealityEditRequest;
export type MotionRequest = RealityEditRequest;

export type GenerationResult =
  | {
      /** The provider produced the edited photograph. */
      kind: "edited-photo";
      assetUrl: string;
      mime: string;
      width?: number;
      height?: number;
      provenance: Provenance;
      /** True when the result shares the exact framing of the original photograph. */
      registered: boolean;
    }
  | {
      /** No provider is connected: the client composes a sample inside the mask over the original photograph. */
      kind: "client-composite";
      provenance: Provenance;
    };

export interface GenerationProvider {
  readonly id: "mock" | "higgsfield";
  generateReality(req: RealityEditRequest): Promise<GenerationResult>;
  generateArchviz(req: ArchitectureRequest): Promise<GenerationResult>;
  generateMotion(req: MotionRequest): Promise<GenerationResult>;
}
