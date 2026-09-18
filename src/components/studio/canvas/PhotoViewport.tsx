"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type WheelEvent as ReactWheelEvent } from "react";
import { ui, useUI } from "@/state/ui-store";
import type { NormalizedPoint } from "@/core/types";

export interface StageInfo {
  width: number;
  height: number;
  zoom: number;
}

const PAD = 28;
const MAX_ZOOM = 6;

/**
 * Fits the photograph into the canvas area and applies zoom/pan as a CSS transform on the stage.
 * Children render inside the stage in photograph space; `toNormalized` maps pointer events to image coordinates.
 */
export function PhotoViewport({
  aspect,
  children,
  interactive = true,
  onStageClick,
  className = "",
}: {
  aspect: number;
  children: (stage: StageInfo, toNormalized: (e: { clientX: number; clientY: number }) => NormalizedPoint) => ReactNode;
  interactive?: boolean;
  onStageClick?: (p: NormalizedPoint) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const viewport = useUI((s) => s.viewport);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const availW = Math.max(0, box.w - PAD * 2);
  const availH = Math.max(0, box.h - PAD * 2);
  let sw = availW;
  let sh = sw / aspect;
  if (sh > availH) {
    sh = availH;
    sw = sh * aspect;
  }

  const toNormalized = useCallback((e: { clientX: number; clientY: number }): NormalizedPoint => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  }, []);

  const onWheel = (e: ReactWheelEvent) => {
    if (!interactive) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;
    const factor = Math.exp(-e.deltaY * 0.0016);
    const nz = Math.min(MAX_ZOOM, Math.max(1, viewport.zoom * factor));
    if (nz === 1) {
      ui.resetViewport();
      return;
    }
    const k = nz / viewport.zoom;
    ui.setViewport({ zoom: nz, x: cx - (cx - viewport.x) * k, y: cy - (cy - viewport.y) * k });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", prevent, { passive: false });
    return () => el.removeEventListener("wheel", prevent);
  }, []);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!interactive || e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: viewport.x, vy: viewport.y, moved: false };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 3) return;
    d.moved = true;
    if (viewport.zoom > 1) ui.setViewport({ zoom: viewport.zoom, x: d.vx + dx, y: d.vy + dy });
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d && !d.moved && onStageClick) {
      const p = toNormalized(e);
      if (p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1) onStageClick(p);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden flex items-center justify-center select-none ${viewport.zoom > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""} ${className}`}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
      }}
      onDoubleClick={() => ui.resetViewport()}
    >
      {sw > 0 && (
        <div
          ref={stageRef}
          className="vc-stage relative bg-graphite-0"
          style={{
            width: sw,
            height: sh,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: "center center",
            transition: dragging ? "none" : "transform 120ms ease-out",
            willChange: "transform",
          }}
        >
          {/* toNormalized reads the stage rect only inside event handlers, never during render. */}
          {/* eslint-disable-next-line react-hooks/refs */}
          {children({ width: sw, height: sh, zoom: viewport.zoom }, toNormalized)}
        </div>
      )}
    </div>
  );
}
