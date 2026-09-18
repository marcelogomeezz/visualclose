"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { project as projectPoint, type CameraSolve } from "@/core/geometry/camera";
import { ANCHOR_ORDER } from "@/core/geometry/footprint";
import type { AnchorKey, Dimensions, Footprint, NormalizedPoint } from "@/core/types";
import { actions } from "@/state/project-store";
import type { AdjustTool } from "@/state/ui-store";
import type { StageInfo } from "../canvas/PhotoViewport";

type Drag =
  | { kind: "move"; start: NormalizedPoint; solve: CameraSolve }
  | { kind: "rotate"; lastX: number }
  | { kind: "corner"; key: AnchorKey; solve: CameraSolve; width: number; depth: number }
  | { kind: "height"; solve: CameraSolve; depth: number };

/**
 * Sticker-style placement: drag the product to move it, drag corners to resize, drag sideways to rotate.
 * Real dimensions and the homography camera stay underneath; the user never sees them.
 */
export function StickerHandles({
  footprint,
  dimensions,
  solve,
  stage,
  tool,
  toNormalized,
}: {
  footprint: Footprint;
  dimensions: Dimensions;
  solve: CameraSolve | null;
  stage: StageInfo;
  tool: AdjustTool;
  toNormalized: (e: { clientX: number; clientY: number }) => NormalizedPoint;
}) {
  const drag = useRef<Drag | null>(null);
  const px = (p: NormalizedPoint) => ({ x: p.x * stage.width, y: p.y * stage.height });
  const s = 1 / stage.zoom;
  const handle = Math.max(5, 7 * s);
  const stroke = Math.max(0.6, 1 * s);
  const poly = ANCHOR_ORDER.map((k) => px(footprint[k]))
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
  const top = solve ? projectPoint(solve, [0, dimensions.height, dimensions.depth / 2]) : null;

  const capture = (e: ReactPointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };
  const onBodyDown = (e: ReactPointerEvent) => {
    if (!solve) return;
    capture(e);
    drag.current = tool === "rotate" ? { kind: "rotate", lastX: toNormalized(e).x } : { kind: "move", start: toNormalized(e), solve };
  };
  const onCornerDown = (key: AnchorKey) => (e: ReactPointerEvent) => {
    if (!solve) return;
    capture(e);
    drag.current = { kind: "corner", key, solve, width: dimensions.width, depth: dimensions.depth };
  };
  const onHeightDown = (e: ReactPointerEvent) => {
    if (!solve) return;
    capture(e);
    drag.current = { kind: "height", solve, depth: dimensions.depth };
  };
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toNormalized(e);
    if (d.kind === "move") actions.translateOnGround(d.start, p, { solve: d.solve });
    else if (d.kind === "rotate") {
      const delta = (p.x - d.lastX) * 240;
      if (Math.abs(delta) >= 0.5) {
        actions.rotateBy(delta);
        d.lastX = p.x;
      }
    } else if (d.kind === "corner") actions.applyCornerResize(d.key, p, { solve: d.solve, width: d.width, depth: d.depth });
    else if (d.kind === "height") actions.applyHeightDrag(p, { solve: d.solve, depth: d.depth });
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && d.kind !== "rotate") actions.commitFootprint();
  };

  const cursor = tool === "rotate" ? "ew-resize" : "move";
  return (
    <svg className="absolute inset-0 w-full h-full overflow-visible" style={{ pointerEvents: "none" }}>
      {/* Product body: move or rotate */}
      <polygon
        points={poly}
        fill="rgba(236,230,218,0.001)"
        style={{ pointerEvents: "auto", cursor }}
        onPointerDown={onBodyDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      {tool === "size" &&
        ANCHOR_ORDER.map((k) => {
          const p = px(footprint[k]);
          return (
            <g key={k} style={{ pointerEvents: "auto", cursor: "nwse-resize" }} onPointerDown={onCornerDown(k)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
              <rect x={p.x - handle * 2} y={p.y - handle * 2} width={handle * 4} height={handle * 4} fill="transparent" />
              <rect x={p.x - handle} y={p.y - handle} width={handle * 2} height={handle * 2} fill="#0d0d0d" stroke="#ece6da" strokeWidth={stroke} />
            </g>
          );
        })}
      {tool === "size" && top && (
        <g style={{ pointerEvents: "auto", cursor: "ns-resize" }} onPointerDown={onHeightDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {(() => {
            const p = px(top);
            return (
              <>
                <circle cx={p.x} cy={p.y} r={handle * 2.2} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={handle} fill="#0d0d0d" stroke="#ece6da" strokeWidth={stroke} />
                <line x1={p.x} y1={p.y - handle * 2.6} x2={p.x} y2={p.y + handle * 2.6} stroke="#ece6da" strokeWidth={stroke} opacity={0.6} />
              </>
            );
          })()}
        </g>
      )}
      {tool === "rotate" && (
        <g pointerEvents="none">
          {(() => {
            const c = ANCHOR_ORDER.map((k) => px(footprint[k])).reduce((a, p) => ({ x: a.x + p.x / 4, y: a.y + p.y / 4 }), { x: 0, y: 0 });
            const r = handle * 5;
            return (
              <>
                <ellipse cx={c.x} cy={c.y} rx={r * 1.6} ry={r * 0.6} fill="none" stroke="#ece6da" strokeWidth={stroke} strokeDasharray={`${3 * s} ${4 * s}`} opacity={0.7} />
                <line x1={c.x - r * 2.2} y1={c.y} x2={c.x + r * 2.2} y2={c.y} stroke="#ece6da" strokeWidth={stroke} opacity={0.35} />
              </>
            );
          })()}
        </g>
      )}
    </svg>
  );
}
