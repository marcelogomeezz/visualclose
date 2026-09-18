"use client";

import { useEffect, useRef } from "react";
import { useProject } from "./project-store";
import { uiStore } from "./ui-store";
import { analyzeSpace, learnProduct } from "./visualize";

/**
 * Runs the (simulated) space and product analyses automatically whenever their inputs change.
 * The user only ever sees "ANALIZANDO…" → "LISTO ✓". The underlying Scene Lock / Product DNA stay internal.
 */
export function useAutoAnalysis(): void {
  const project = useProject();
  const spaceId = project?.space?.asset.id ?? null;
  const hasSceneLock = !!project?.sceneLock;
  const refCount = project?.productPack.references.length ?? 0;
  const packId = project?.productPack.id ?? null;
  const hasDNA = !!project?.productDNA;
  const lastSpace = useRef<string | null>(null);
  const lastProduct = useRef<string | null>(null);

  useEffect(() => {
    if (!spaceId || hasSceneLock) return;
    if (lastSpace.current === spaceId || uiStore.getState().intelligence.analyzing) return;
    lastSpace.current = spaceId;
    void analyzeSpace();
  }, [spaceId, hasSceneLock]);

  useEffect(() => {
    const key = `${packId}:${refCount}`;
    if (!packId || refCount === 0 || hasDNA) return;
    if (lastProduct.current === key || uiStore.getState().intelligence.learning) return;
    lastProduct.current = key;
    void learnProduct();
  }, [packId, refCount, hasDNA]);
}
