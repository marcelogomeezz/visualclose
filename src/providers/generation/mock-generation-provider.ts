import { getProductPack } from "@/core/product-packs";
import type { ArchitectureRequest, GenerationProvider, GenerationResult, RealityEditRequest } from "./types";

const GENERIC_ARCHVIZ = "/demo/generic/archviz.jpg";

/**
 * Mock provider. REALITY is delegated to the client compositor so the user's own photograph stays the
 * base image; nothing here reconstructs a scene. ARCHITECTURE returns placeholder art.
 */
export class MockGenerationProvider implements GenerationProvider {
  readonly id = "mock" as const;

  async generateReality(_req: RealityEditRequest): Promise<GenerationResult> {
    return {
      kind: "client-composite",
      provenance: {
        provider: "mock",
        note: "Muestra: producto de referencia compuesto dentro de la máscara sobre tu foto. La IA insertará el producto real en esta zona.",
      },
    };
  }

  async generateArchviz(req: ArchitectureRequest): Promise<GenerationResult> {
    const pack = getProductPack(req.productPackId);
    const packAsset = req.originalPhoto.isDemoAsset ? pack?.demoOutputs?.archviz : undefined;
    return {
      kind: "edited-photo",
      assetUrl: packAsset ?? GENERIC_ARCHVIZ,
      mime: "image/jpeg",
      width: 1920,
      height: 1280,
      provenance: { provider: "mock", note: packAsset ? "PLACEHOLDER · arte sintético de demo, no una foto." : "PLACEHOLDER genérico. El proveedor real producirá la visualización arquitectónica." },
      registered: !!packAsset,
    };
  }

  async generateMotion(): Promise<GenerationResult> {
    throw new Error("MOVIMIENTO llegará más adelante.");
  }
}
