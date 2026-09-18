"use client";

import { useEffect, useState } from "react";
import { createDemoProject } from "@/core/demo/demo-project";
import { solveFor } from "@/state/project-store";
import { composeRealityMock } from "@/lib/reality-composite";

let cached: string | null = null;
let pending: Promise<string> | null = null;

/**
 * The demo REALIDAD for the Experience, composed in the browser over the PLACEHOLDER demo photograph
 * exactly as the Studio does: only the placement mask changes. Never a pre-rendered scene.
 */
export function useDemoReality(): string | null {
  const [url, setUrl] = useState<string | null>(cached);
  useEffect(() => {
    if (cached) return;
    if (!pending) {
      const project = createDemoProject();
      const solve = solveFor(project);
      pending = solve
        ? composeRealityMock(project, solve).then((r) => {
            cached = URL.createObjectURL(r.blob);
            return cached;
          })
        : Promise.resolve("");
    }
    let alive = true;
    void pending.then((u) => alive && setUrl(u || null));
    return () => {
      alive = false;
    };
  }, []);
  return url;
}
