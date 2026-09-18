"use client";

import type { NormalizedPoint, ReferenceMeasurement } from "@/core/types";
import type { StageInfo } from "../canvas/PhotoViewport";
import type { PickTool } from "@/state/ui-store";

/** Reference measurement line, pending pick points, and wall anchor marker. Pure presentation. */
export function MeasureOverlay({
  stage,
  measurement,
  pending,
  wallAnchor,
  pickTool,
}: {
  stage: StageInfo;
  measurement: ReferenceMeasurement | null;
  pending: NormalizedPoint | null;
  wallAnchor: NormalizedPoint | null;
  pickTool: PickTool;
}) {
  const px = (p: NormalizedPoint) => ({ x: p.x * stage.width, y: p.y * stage.height });
  const s = 1 / stage.zoom;
  const font = 9.5 * s;
  return (
    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
      {measurement && (
        <g>
          {(() => {
            const a = px(measurement.a);
            const b = px(measurement.b);
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            return (
              <>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ece6da" strokeWidth={s} strokeDasharray={`${5 * s} ${4 * s}`} opacity={0.8} />
                {[a, b].map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={3.5 * s} fill="none" stroke="#ece6da" strokeWidth={s} />
                    <text x={p.x + 6 * s} y={p.y - 6 * s} fill="#ece6da" fontSize={font} fontFamily="var(--font-mono)" opacity={0.85}>
                      {i === 0 ? "A" : "B"}
                    </text>
                  </g>
                ))}
                <rect x={mx - 30 * s} y={my - 18 * s} width={60 * s} height={14 * s} fill="rgba(13,13,13,0.8)" />
                <text x={mx} y={my - 8 * s} textAnchor="middle" fill="#ece6da" fontSize={font} fontFamily="var(--font-mono)" letterSpacing="0.06em">
                  REF {measurement.distance} {measurement.units}
                </text>
              </>
            );
          })()}
        </g>
      )}
      {pending && pickTool === "measure-b" && (
        <g>
          {(() => {
            const a = px(pending);
            return (
              <>
                <circle cx={a.x} cy={a.y} r={3.5 * s} fill="none" stroke="#c9b48c" strokeWidth={s} />
                <text x={a.x + 6 * s} y={a.y - 6 * s} fill="#c9b48c" fontSize={font} fontFamily="var(--font-mono)">
                  A
                </text>
              </>
            );
          })()}
        </g>
      )}
      {wallAnchor && (
        <g>
          {(() => {
            const p = px(wallAnchor);
            return (
              <>
                <line x1={p.x - 10 * s} y1={p.y} x2={p.x + 10 * s} y2={p.y} stroke="#c9b48c" strokeWidth={s} />
                <line x1={p.x} y1={p.y - 6 * s} x2={p.x} y2={p.y + 6 * s} stroke="#c9b48c" strokeWidth={s} />
                <text x={p.x + 12 * s} y={p.y + 3 * s} fill="#c9b48c" fontSize={font} fontFamily="var(--font-mono)" letterSpacing="0.08em">
                  WALL
                </text>
              </>
            );
          })()}
        </g>
      )}
    </svg>
  );
}
