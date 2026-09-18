"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { ui, useUI } from "@/state/ui-store";

/** Before / After with identical transforms for both images. The camera never moves here. */
export function CompareSlider({ beforeUrl, afterUrl, beforeLabel = "Before", afterLabel = "After" }: { beforeUrl: string; afterUrl: string; beforeLabel?: string; afterLabel?: string }) {
  const position = useUI((s) => s.comparePosition);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromEvent = (e: { clientX: number }) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    ui.setComparePosition(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
  };

  const onDown = (e: ReactPointerEvent) => {
    e.stopPropagation();
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setFromEvent(e);
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0 cursor-ew-resize"
      onPointerDown={onDown}
      onPointerMove={(e) => dragging.current && setFromEvent(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={beforeUrl} alt="" className="absolute inset-0 w-full h-full" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position * 100}%)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterUrl} alt="" className="absolute inset-0 w-full h-full" draggable={false} />
      </div>
      <div className="absolute top-0 bottom-0 w-px bg-ivory/90 pointer-events-none" style={{ left: `${position * 100}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 border border-ivory/90 bg-graphite-0/70 flex items-center justify-center">
          <span className="block w-2.5 h-px bg-ivory" />
        </div>
      </div>
      <span className="absolute top-3 left-3 t-label-strong bg-graphite-0/60 px-2 py-1 pointer-events-none">{beforeLabel}</span>
      <span className="absolute top-3 right-3 t-label-strong bg-graphite-0/60 px-2 py-1 pointer-events-none">{afterLabel}</span>
    </div>
  );
}
