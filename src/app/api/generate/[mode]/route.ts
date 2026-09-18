import { NextResponse } from "next/server";
import { getAIProvider } from "@/providers/ai";
import { getGenerationProvider } from "@/providers/generation";
import type { RenderBriefInput } from "@/providers/ai/types";

interface GenerateBody {
  briefInput: RenderBriefInput;
  productPackId: string;
  spaceAssetId: string | null;
  spaceIsDemoAsset: boolean;
  variant?: string;
}

const MODES = new Set(["reality", "archviz", "motion"]);

export async function POST(request: Request, context: { params: Promise<{ mode: string }> }) {
  const { mode } = await context.params;
  if (!MODES.has(mode)) return NextResponse.json({ error: "Unknown mode" }, { status: 404 });
  const body = (await request.json()) as GenerateBody;
  try {
    const ai = getAIProvider();
    const gen = getGenerationProvider();
    const brief = await ai.createRenderBrief({ ...body.briefInput, mode: mode.toUpperCase() as RenderBriefInput["mode"] });
    const req = { brief, productPackId: body.productPackId, spaceAssetId: body.spaceAssetId, spaceIsDemoAsset: body.spaceIsDemoAsset, variant: body.variant };
    const result = mode === "reality" ? await gen.generateReality(req) : mode === "archviz" ? await gen.generateArchviz(req) : await gen.generateMotion(req);
    const validation = await ai.validateResult({ brief, outputAssetUrl: result.assetUrl });
    return NextResponse.json({ result, brief, validation, provider: gen.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 503 });
  }
}
