"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export interface CoverTransform {
  scale: number;
  ox: number;
  oy: number;
  stageW: number;
  stageH: number;
}

/**
 * Cover-fit image with a focus point. Exposes the exact transform so an SVG overlay can be registered
 * to the photograph pixel-for-pixel, whatever the stage aspect.
 */
export function CoverImage({
  src,
  width,
  height,
  focus = { x: 0.5, y: 0.5 },
  className = "",
  style,
  overlay,
  imgStyle,
}: {
  src: string;
  width: number;
  height: number;
  focus?: { x: number; y: number };
  className?: string;
  style?: CSSProperties;
  imgStyle?: CSSProperties;
  overlay?: (t: CoverTransform) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = box.w && box.h ? Math.max(box.w / width, box.h / height) : 1;
  const ox = (box.w - width * scale) * focus.x;
  const oy = (box.h - height * scale) * focus.y;
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover", objectPosition: `${focus.x * 100}% ${focus.y * 100}%`, ...imgStyle }} draggable={false} />
      {overlay && box.w > 0 && overlay({ scale, ox, oy, stageW: box.w, stageH: box.h })}
    </div>
  );
}
