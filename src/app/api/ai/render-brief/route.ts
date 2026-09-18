import { NextResponse } from "next/server";
import { getAIProvider } from "@/providers/ai";
import type { RenderBriefInput } from "@/providers/ai/types";

export async function POST(request: Request) {
  const input = (await request.json()) as RenderBriefInput;
  try {
    const brief = await getAIProvider().createRenderBrief(input);
    return NextResponse.json({ brief });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Brief creation failed" }, { status: 503 });
  }
}
