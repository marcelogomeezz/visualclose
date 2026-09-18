"use client";

import type { CameraSolve } from "@/core/geometry/camera";
import type { Dimensions } from "@/core/types";
import { VolumeSvg } from "@/components/present/VolumeSvg";
import type { StageInfo } from "./PhotoViewport";

/** REAL PLAN overlay inside the Studio stage: crisp SVG over the original photograph, no WebGL. */
export function PhotoPlanOverlay({ solve, dimensions, imageWidth, imageHeight, stage }: { solve: CameraSolve; dimensions: Dimensions; imageWidth: number; imageHeight: number; stage: StageInfo }) {
  const t = { scale: stage.width / imageWidth, ox: 0, oy: 0, stageW: stage.width, stageH: stage.height };
  return <VolumeSvg solve={solve} dimensions={dimensions} width={imageWidth} height={imageHeight} t={t} />;
}
