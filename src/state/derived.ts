"use client";

import { useMemo } from "react";
import { solveFor, useProject } from "./project-store";
import { useUI, type ViewMode } from "./ui-store";
import type { CameraSolve } from "@/core/geometry/camera";
import type { OutputRecord, Project } from "@/core/types";

export function usePlacementSolve(): CameraSolve | null {
  const project = useProject();
  const footprint = project?.placement.footprint;
  const lens = project?.placement.lens;
  const width = project?.dimensions.width;
  const depth = project?.dimensions.depth;
  const sw = project?.space?.width;
  const sh = project?.space?.height;
  return useMemo(() => {
    if (!project || !footprint || !lens || !sw || !sh) return null;
    return solveFor(project);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footprint, lens, width, depth, sw, sh]);
}

export function outputForMode(project: Project | null, mode: ViewMode, selectedId: string | null): OutputRecord | null {
  if (!project) return null;
  const type = mode === "ORIGINAL" ? "ORIGINAL" : mode === "TECHNICAL" ? "TECHNICAL" : mode === "REALITY" ? "REALITY" : mode === "ARCHVIZ" ? "ARCHVIZ" : mode === "MOTION" ? "MOTION" : null;
  if (!type) return null;
  const selected = project.outputs.find((o) => o.id === selectedId);
  if (selected && selected.type === type) return selected;
  const ofType = project.outputs.filter((o) => o.type === type);
  return ofType[ofType.length - 1] ?? null;
}

export function useDisplayedOutput(): OutputRecord | null {
  const project = useProject();
  const mode = useUI((s) => s.mode);
  const selectedId = useUI((s) => s.selectedOutputId);
  return useMemo(() => outputForMode(project, mode, selectedId), [project, mode, selectedId]);
}

export function originalOutput(project: Project | null): OutputRecord | null {
  return project?.outputs.find((o) => o.type === "ORIGINAL") ?? null;
}
