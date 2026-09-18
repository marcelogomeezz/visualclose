import { ProviderNotConfiguredError } from "../errors";
import type { AIProvider, ProductAnalysisInput, RenderBrief, RenderBriefInput, SceneAnalysisInput, ValidationInput, ValidationResult } from "./types";
import type { ProductDNA, SceneLock } from "@/core/types";

/**
 * Placeholder for the future GPT-6 Astra integration.
 * Reads credentials from the server environment only. No endpoint or model identifiers are assumed here.
 */
export class OpenAIProvider implements AIProvider {
  readonly id = "openai" as const;

  constructor(private readonly apiKey: string | undefined = process.env.OPENAI_API_KEY) {}

  private ensure(): void {
    if (!this.apiKey) throw new ProviderNotConfiguredError("openai");
    throw new ProviderNotConfiguredError("openai (implementation pending)");
  }

  async analyzeScene(_input: SceneAnalysisInput): Promise<SceneLock> {
    this.ensure();
    throw new ProviderNotConfiguredError("openai");
  }

  async analyzeProduct(_input: ProductAnalysisInput): Promise<ProductDNA> {
    this.ensure();
    throw new ProviderNotConfiguredError("openai");
  }

  async createRenderBrief(_input: RenderBriefInput): Promise<RenderBrief> {
    this.ensure();
    throw new ProviderNotConfiguredError("openai");
  }

  async validateResult(_input: ValidationInput): Promise<ValidationResult> {
    this.ensure();
    throw new ProviderNotConfiguredError("openai");
  }
}
