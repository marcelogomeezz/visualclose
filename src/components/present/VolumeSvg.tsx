"use client";

import { projectVolume, type CameraSolve } from "@/core/geometry/camera";
import { unitDecimals } from "@/core/geometry/units";
import type { Dimensions, NormalizedPoint } from "@/core/types";
import type { CoverTransform } from "./CoverImage";

/** Crisp SVG rendering of the placement volume, registered to a cover-fitted photograph. */
export function VolumeSvg({ solve, dimensions, width, height, t, labels = true }: { solve: CameraSolve; dimensions: Dimensions; width: number; height: number; t: CoverTransform; labels?: boolean }) {
  const vol = projectVolume(solve, dimensions.width, dimensions.depth, dimensions.height);
  if (!vol) return null;
  const P = (p: NormalizedPoint) => ({ x: p.x * width, y: p.y * height });
  const { base: b, top: tp } = vol;
  const poly = (pts: NormalizedPoint[]) => pts.map((p) => `${P(p).x},${P(p).y}`).join(" ");
  const sw = Math.max(1, width / 1400) / t.scale;
  const font = (width / 70) / t.scale;
  const dec = unitDecimals(dimensions.units);
  const label = (a: NormalizedPoint, c: NormalizedPoint, text: string, dx = 0, dy = 0) => {
    const m = { x: (P(a).x + P(c).x) / 2 + dx, y: (P(a).y + P(c).y) / 2 + dy };
    const w = text.length * font * 0.62 + font;
    return (
      <g key={text}>
        <rect x={m.x - w / 2} y={m.y - font * 0.8} width={w} height={font * 1.6} fill="rgba(13,13,13,0.72)" />
        <text x={m.x} y={m.y + font * 0.35} textAnchor="middle" fill="#ece6da" fontSize={font} fontFamily="var(--font-mono)" letterSpacing="0.04em">
          {text}
        </text>
      </g>
    );
  };
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" width={t.stageW} height={t.stageH}>
      <g transform={`translate(${t.ox} ${t.oy}) scale(${t.scale})`}>
        <polygon points={poly([b.FL, b.FR, b.BR, b.BL])} fill="rgba(236,230,218,0.14)" />
        {[
          [b.BL, b.BR, tp.BR, tp.BL],
          [b.FL, b.BL, tp.BL, tp.FL],
          [b.FR, b.BR, tp.BR, tp.FR],
          [b.FL, b.FR, tp.FR, tp.FL],
          [tp.FL, tp.FR, tp.BR, tp.BL],
        ].map((f, i) => (
          <polygon key={i} points={poly(f)} fill="rgba(236,230,218,0.06)" />
        ))}
        <polygon points={poly([b.FL, b.FR, b.BR, b.BL])} fill="none" stroke="#ece6da" strokeWidth={sw * 1.5} />
        <polygon points={poly([tp.FL, tp.FR, tp.BR, tp.BL])} fill="none" stroke="#ece6da" strokeWidth={sw} opacity={0.9} />
        {(["FL", "FR", "BL", "BR"] as const).map((k) => (
          <line key={k} x1={P(b[k]).x} y1={P(b[k]).y} x2={P(tp[k]).x} y2={P(tp[k]).y} stroke="#ece6da" strokeWidth={sw} opacity={0.9} />
        ))}
        {labels && (
          <>
            {label(b.FL, b.FR, `${dimensions.width.toFixed(dec)} ${dimensions.units}`, 0, font * 1.6)}
            {label(b.FR, b.BR, `${dimensions.depth.toFixed(dec)} ${dimensions.units}`, font * 3.4, 0)}
            {label(b.FL, tp.FL, `${dimensions.height.toFixed(dec)} ${dimensions.units}`, -font * 3.4, 0)}
          </>
        )}
      </g>
    </svg>
  );
}
