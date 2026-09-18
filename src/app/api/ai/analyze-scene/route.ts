import { NextResponse } from "next/server";
import { getAIProvider } from "@/providers/ai";
import type { SceneAnalysisInput } from "@/providers/ai/types";

export async function POST(request: Request) {
  const input = (await request.json()) as SceneAnalysisInput;
  try {
    const sceneLock = await getAIProvider().analyzeScene(input);
    return NextResponse.json({ sceneLock, provider: getAIProvider().id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scene analysis failed" }, { status: 503 });
  }
}
