import { NextResponse } from "next/server";
import { getAIProvider } from "@/providers/ai";
import { getGenerationProvider } from "@/providers/generation";
import type { RenderBriefInput } from "@/providers/ai/types";
import type { RealityEditRequest } from "@/providers/generation/types";

/** The client sends descriptors only; pixels stay in the browser until a real provider is connected. */
interface GenerateBody {
  briefInput: RenderBriefInput;
  request: Omit<RealityEditRequest, "brief">;
}

const MODES = new Set(["reality", "archviz", "motion"]);

export async function POST(request: Request, context: { params: Promise<{ mode: string }> }) {
  const { mode } = await context.params;
  if (!MODES.has(mode)) return NextResponse.json({ error: "Modo desconocido" }, { status: 404 });
  const body = (await request.json()) as GenerateBody;
  try {
    const ai = getAIProvider();
    const gen = getGenerationProvider();
    const brief = await ai.createRenderBrief({ ...body.briefInput, mode: mode.toUpperCase() as RenderBriefInput["mode"] });
    const req: RealityEditRequest = { ...body.request, brief };
    const result = mode === "reality" ? await gen.generateReality(req) : mode === "archviz" ? await gen.generateArchviz(req) : await gen.generateMotion(req);
    const validation = result.kind === "edited-photo" ? await ai.validateResult({ brief, outputAssetUrl: result.assetUrl }) : null;
    return NextResponse.json({ result, brief, validation, provider: gen.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "La generación ha fallado" }, { status: 503 });
  }
}
