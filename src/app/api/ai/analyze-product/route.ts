import { NextResponse } from "next/server";
import { getAIProvider } from "@/providers/ai";
import type { ProductAnalysisInput } from "@/providers/ai/types";

export async function POST(request: Request) {
  const input = (await request.json()) as ProductAnalysisInput;
  try {
    const productDNA = await getAIProvider().analyzeProduct(input);
    return NextResponse.json({ productDNA, provider: getAIProvider().id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "El análisis de producto ha fallado" }, { status: 503 });
  }
}
