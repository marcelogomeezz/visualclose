"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { CoverImage } from "@/components/present/CoverImage";

/** Scroll- or drag-driven Before / After over two registered photographs. Camera never moves. */
export function BeforeAfter({
  before,
  after,
  width,
  height,
  position,
  onChange,
  focus = { x: 0.5, y: 0.55 },
  labels = ["BEFORE", "AFTER"],
}: {
  before: string;
  after: string;
  width: number;
  height: number;
  position: number;
  onChange?: (p: number) => void;
  focus?: { x: number; y: number };
  labels?: [string, string];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const set = (e: { clientX: number }) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || !onChange) return;
    onChange(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
  };
  const down = (e: ReactPointerEvent) => {
    if (!onChange) return;
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    set(e);
  };
  return (
    <div
      ref={ref}
      className={`absolute inset-0 overflow-hidden ${onChange ? "cursor-ew-resize touch-pan-y" : ""}`}
      onPointerDown={down}
      onPointerMove={(e) => dragging.current && set(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <CoverImage src={before} width={width} height={height} focus={focus} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position * 100}%)` }}>
        <CoverImage src={after} width={width} height={height} focus={focus} />
      </div>
      <div className="absolute top-0 bottom-0 w-px bg-ivory/90 pointer-events-none" style={{ left: `${position * 100}%` }}>
        {onChange && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-ivory/90 bg-graphite-0/70 flex items-center justify-center">
            <span className="block w-3 h-px bg-ivory" />
          </div>
        )}
      </div>
      <span className="absolute top-4 left-4 t-label-strong bg-graphite-0/60 px-2 py-1 pointer-events-none">{labels[0]}</span>
      <span className="absolute top-4 right-4 t-label-strong bg-graphite-0/60 px-2 py-1 pointer-events-none" style={{ opacity: position < 0.98 ? 1 : 0.5 }}>
        {labels[1]}
      </span>
    </div>
  );
}
