"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { CameraSolve } from "@/core/geometry/camera";
import { footprintCenter } from "@/core/geometry/footprint";
import { ANCHOR_KEYS, type AnchorKey, type Footprint, type NormalizedPoint } from "@/core/types";
import { actions } from "@/state/project-store";
import type { StageInfo } from "../canvas/PhotoViewport";

/** SVG overlay with the four footprint anchors and a centre handle for ground translation. */
export function FootprintHandles({
  footprint,
  solve,
  stage,
  toNormalized,
  locked,
}: {
  footprint: Footprint;
  solve: CameraSolve | null;
  stage: StageInfo;
  toNormalized: (e: { clientX: number; clientY: number }) => NormalizedPoint;
  locked: boolean;
}) {
  const drag = useRef<{ kind: "anchor"; key: AnchorKey } | { kind: "center"; start: NormalizedPoint; solve: CameraSolve } | null>(null);
  const center = footprintCenter(footprint);
  const r = Math.max(5, 7 / stage.zoom);
  const strokeW = Math.max(0.6, 1 / stage.zoom);

  const onAnchorDown = (key: AnchorKey) => (e: ReactPointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    drag.current = { kind: "anchor", key };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };
  const onCenterDown = (e: ReactPointerEvent) => {
    if (!solve) return;
    e.stopPropagation();
    e.preventDefault();
    drag.current = { kind: "center", start: toNormalized(e), solve };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toNormalized(e);
    if (d.kind === "anchor") actions.moveAnchor(d.key, { x: Math.min(1.2, Math.max(-0.2, p.x)), y: Math.min(1.2, Math.max(-0.2, p.y)) });
    else actions.translateOnGround(d.start, p, { solve: d.solve });
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d) actions.commitFootprint();
  };

  const px = (p: NormalizedPoint) => ({ x: p.x * stage.width, y: p.y * stage.height });
  const c = px(center);

  return (
    <svg className="absolute inset-0 w-full h-full overflow-visible" style={{ pointerEvents: "none" }}>
      {/* Front-edge label */}
      {ANCHOR_KEYS.map((k) => {
        const p = px(footprint[k]);
        return (
          <g key={k} style={{ pointerEvents: locked ? "none" : "auto" }} className={locked ? "" : "cursor-move"} onPointerDown={onAnchorDown(k)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <circle cx={p.x} cy={p.y} r={r * 2.2} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={r} fill="rgba(13,13,13,0.85)" stroke="#ece6da" strokeWidth={strokeW} />
            <text x={p.x + r + 4 / stage.zoom} y={p.y - r - 2 / stage.zoom} fill="#ece6da" fontSize={9 / stage.zoom} fontFamily="var(--font-mono)" letterSpacing="0.08em" opacity={0.85}>
              {k}
            </text>
          </g>
        );
      })}
      {!locked && solve && (
        <g style={{ pointerEvents: "auto" }} className="cursor-grab active:cursor-grabbing" onPointerDown={onCenterDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <rect x={c.x - r * 1.6} y={c.y - r * 1.6} width={r * 3.2} height={r * 3.2} fill="transparent" />
          <rect x={c.x - r * 0.9} y={c.y - r * 0.9} width={r * 1.8} height={r * 1.8} fill="rgba(13,13,13,0.85)" stroke="#ece6da" strokeWidth={strokeW} />
          <line x1={c.x - r * 2.4} y1={c.y} x2={c.x + r * 2.4} y2={c.y} stroke="#ece6da" strokeWidth={strokeW} opacity={0.7} />
          <line x1={c.x} y1={c.y - r * 2.4} x2={c.x} y2={c.y + r * 2.4} stroke="#ece6da" strokeWidth={strokeW} opacity={0.7} />
        </g>
      )}
    </svg>
  );
}
