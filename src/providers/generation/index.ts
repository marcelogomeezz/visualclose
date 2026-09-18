import "server-only";
import { HiggsfieldProvider } from "./higgsfield-provider";
import { MockGenerationProvider } from "./mock-generation-provider";
import type { GenerationProvider } from "./types";

let cached: GenerationProvider | null = null;

export function getGenerationProvider(): GenerationProvider {
  if (cached) return cached;
  const selected = process.env.VISUALCLOSE_GENERATION_PROVIDER ?? "mock";
  cached = selected === "higgsfield" ? new HiggsfieldProvider() : new MockGenerationProvider();
  return cached;
}

export type { GenerationProvider } from "./types";
