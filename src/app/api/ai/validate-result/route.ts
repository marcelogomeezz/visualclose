import { NextResponse } from "next/server";
import { getAIProvider } from "@/providers/ai";
import type { ValidationInput } from "@/providers/ai/types";

export async function POST(request: Request) {
  const input = (await request.json()) as ValidationInput;
  try {
    const result = await getAIProvider().validateResult(input);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "La validación ha fallado" }, { status: 503 });
  }
}
