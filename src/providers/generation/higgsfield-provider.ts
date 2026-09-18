import { ProviderNotConfiguredError } from "../errors";
import type { ArchitectureRequest, GenerationProvider, GenerationResult, MotionRequest, RealityEditRequest } from "./types";

/**
 * Placeholder for the verified Higgsfield API integration.
 * REALITY will be an image EDIT: the original photograph plus the placement mask and reference go in,
 * the same photograph with the product installed comes back. Credentials come from the server
 * environment only. Endpoints and model identifiers are intentionally absent until they are
 * confirmed against the official API documentation.
 */
export class HiggsfieldProvider implements GenerationProvider {
  readonly id = "higgsfield" as const;

  constructor(private readonly apiKey: string | undefined = process.env.HIGGSFIELD_API_KEY) {}

  private ensure(): never {
    if (!this.apiKey) throw new ProviderNotConfiguredError("higgsfield");
    throw new ProviderNotConfiguredError("higgsfield (implementation pending)");
  }

  async generateReality(_req: RealityEditRequest): Promise<GenerationResult> {
    return this.ensure();
  }

  async generateArchviz(_req: ArchitectureRequest): Promise<GenerationResult> {
    return this.ensure();
  }

  async generateMotion(_req: MotionRequest): Promise<GenerationResult> {
    return this.ensure();
  }
}
