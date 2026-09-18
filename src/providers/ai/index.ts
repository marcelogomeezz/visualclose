import "server-only";
import { MockAIProvider } from "./mock-ai-provider";
import { OpenAIProvider } from "./openai-provider";
import type { AIProvider } from "./types";

let cached: AIProvider | null = null;

/** Selected by the server environment. Defaults to the mock provider. */
export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const selected = process.env.VISUALCLOSE_AI_PROVIDER ?? "mock";
  cached = selected === "openai" ? new OpenAIProvider() : new MockAIProvider();
  return cached;
}

export type { AIProvider } from "./types";
