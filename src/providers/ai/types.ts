import type { Dimensions, GeometryReference, ProductDNA, ProductPack, SceneLock } from "@/core/types";

/** Inputs are descriptive only. Images are referenced by URL/id; nothing is uploaded to a provider in Milestone 1. */
export interface SceneAnalysisInput {
  spaceAssetId: string | null;
  spaceName: string | null;
  imageSize: { width: number; height: number } | null;
  productCategory: string;
  placementType: string;
}

export interface ProductAnalysisInput {
  pack: ProductPack;
}

export interface RenderBriefInput {
  mode: "REALITY" | "ARCHVIZ" | "MOTION";
  pack: ProductPack;
  dimensions: Dimensions;
  geometryReference: GeometryReference | null;
  sceneLock: SceneLock | null;
  productDNA: ProductDNA | null;
}

/** A structured, provider-neutral description of what must be generated. */
export interface RenderBrief {
  mode: RenderBriefInput["mode"];
  environment: { preserve: string[]; installationRegion: string };
  product: { name: string; summary: string; invariants: string[] };
  geometry: { dimensions: Dimensions; footprintDescription: string; locked: boolean };
  constraints: string[];
  createdAt: number;
}

export interface ValidationInput {
  brief: RenderBrief;
  outputAssetUrl: string;
}

export interface ValidationResult {
  passed: boolean;
  checks: { name: string; passed: boolean; note?: string }[];
}

export interface AIProvider {
  readonly id: "mock" | "openai";
  analyzeScene(input: SceneAnalysisInput): Promise<SceneLock>;
  analyzeProduct(input: ProductAnalysisInput): Promise<ProductDNA>;
  createRenderBrief(input: RenderBriefInput): Promise<RenderBrief>;
  validateResult(input: ValidationInput): Promise<ValidationResult>;
}
