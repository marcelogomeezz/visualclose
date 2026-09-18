"use client";

import { useMemo } from "react";
import { projectVolume, solveCamera } from "@/core/geometry/camera";
import type { Dimensions, Footprint, NormalizedPoint } from "@/core/types";
import type { CoverTransform } from "@/components/present/CoverImage";

/**
 * A photograph becoming a REAL PLAN: footprint, volume, dimensions and anchor points drawn progressively.
 * `progress` 0..1 drives the line drawing and label reveal. Uses the same solver as the Studio.
 */
export function RealPlanOverlay({
  footprint,
  dimensions,
  fovDeg,
  width,
  height,
  t,
  progress,
  productName,
}: {
  footprint: Footprint;
  dimensions: Dimensions;
  fovDeg: number;
  width: number;
  height: number;
  t: CoverTransform;
  progress: number;
  productName: string;
}) {
  const vol = useMemo(() => {
    const solve = solveCamera({ footprint, width: dimensions.width, depth: dimensions.depth, aspect: width / height, lens: { fovDeg } });
    return solve ? projectVolume(solve, dimensions.width, dimensions.depth, dimensions.height) : null;
  }, [footprint, dimensions, fovDeg, width, height]);
  if (!vol) return null;
  const P = (p: NormalizedPoint) => ({ x: p.x * width, y: p.y * height });
  const { base: b, top: tp } = vol;
  const poly = (pts: NormalizedPoint[]) => pts.map((p) => `${P(p).x},${P(p).y}`).join(" ");
  const sw = Math.max(1, width / 1200) / t.scale;
  const font = (width / 68) / t.scale;
  const stage = (v: number, from: number, to: number) => Math.min(1, Math.max(0, (v - from) / (to - from)));
  const pFoot = stage(progress, 0.05, 0.4);
  const pVert = stage(progress, 0.35, 0.65);
  const pTop = stage(progress, 0.55, 0.85);
  const pLabels = stage(progress, 0.7, 1);
  const dash = (len: number, k: number) => ({ strokeDasharray: len, strokeDashoffset: len * (1 - k) });
  const segLen = (a: NormalizedPoint, c: NormalizedPoint) => Math.hypot(P(c).x - P(a).x, P(c).y - P(a).y);
  const footLen = [b.FL, b.FR, b.BR, b.BL].reduce((acc, p, i, arr) => acc + segLen(p, arr[(i + 1) % 4]), 0);
  const topLen = [tp.FL, tp.FR, tp.BR, tp.BL].reduce((acc, p, i, arr) => acc + segLen(p, arr[(i + 1) % 4]), 0);
  const dec = dimensions.units === "m" || dimensions.units === "ft" ? 2 : 0;
  const label = (a: NormalizedPoint, c: NormalizedPoint, text: string, dx = 0, dy = 0, key: string) => {
    const m = { x: (P(a).x + P(c).x) / 2 + dx, y: (P(a).y + P(c).y) / 2 + dy };
    const w = text.length * font * 0.62 + font;
    return (
      <g key={key} opacity={pLabels}>
        <rect x={m.x - w / 2} y={m.y - font * 0.8} width={w} height={font * 1.6} fill="rgba(13,13,13,0.74)" />
        <text x={m.x} y={m.y + font * 0.35} textAnchor="middle" fill="#ece6da" fontSize={font} fontFamily="var(--font-mono)" letterSpacing="0.04em">
          {text}
        </text>
      </g>
    );
  };
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" width={t.stageW} height={t.stageH}>
      <g transform={`translate(${t.ox} ${t.oy}) scale(${t.scale})`}>
        <polygon points={poly([b.FL, b.FR, b.BR, b.BL])} fill="rgba(236,230,218,0.14)" opacity={pFoot} />
        <polygon points={poly([b.FL, b.FR, b.BR, b.BL])} fill="none" stroke="#ece6da" strokeWidth={sw * 1.6} style={dash(footLen, pFoot)} />
        {(["FL", "FR", "BL", "BR"] as const).map((k) => (
          <line key={k} x1={P(b[k]).x} y1={P(b[k]).y} x2={P(tp[k]).x} y2={P(tp[k]).y} stroke="#ece6da" strokeWidth={sw} style={dash(segLen(b[k], tp[k]), pVert)} opacity={0.9} />
        ))}
        <polygon points={poly([tp.FL, tp.FR, tp.BR, tp.BL])} fill="rgba(236,230,218,0.05)" opacity={pTop} />
        <polygon points={poly([tp.FL, tp.FR, tp.BR, tp.BL])} fill="none" stroke="#ece6da" strokeWidth={sw} style={dash(topLen, pTop)} opacity={0.9} />
        {(["FL", "FR", "BL", "BR"] as const).map((k) => {
          const p = P(b[k]);
          const r = width * 0.006;
          return (
            <g key={`a-${k}`} opacity={pFoot}>
              <line x1={p.x - r} y1={p.y} x2={p.x + r} y2={p.y} stroke="#ece6da" strokeWidth={sw * 1.3} />
              <line x1={p.x} y1={p.y - r} x2={p.x} y2={p.y + r} stroke="#ece6da" strokeWidth={sw * 1.3} />
            </g>
          );
        })}
        {label(b.FL, b.FR, `${dimensions.width.toFixed(dec)} ${dimensions.units}`, 0, font * 1.7, "w")}
        {label(b.FR, b.BR, `${dimensions.depth.toFixed(dec)} ${dimensions.units}`, font * 3.4, 0, "d")}
        {label(b.FR, tp.FR, `${dimensions.height.toFixed(dec)} ${dimensions.units}`, -font * 3.4, 0, "h")}
        <g opacity={pLabels}>
          <text x={(P(tp.BL).x + P(tp.BR).x) / 2} y={(P(tp.BL).y + P(tp.BR).y) / 2 - font * 1.1} textAnchor="middle" fill="#ece6da" fontSize={font * 0.95} fontFamily="var(--font-sans)" letterSpacing="0.18em">
            {productName.toUpperCase()}
          </text>
        </g>
      </g>
    </svg>
  );
}
