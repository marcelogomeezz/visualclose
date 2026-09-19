"use client";

import { useEffect, useRef } from "react";
import { gsap, EASE } from "@/lib/gsap";
import { useUI } from "@/state/ui-store";

/** Restrained generation transition: a slow light sweep, a hairline, and status words. No percentages. */
export function GenerationOverlay() {
  const generating = useUI((s) => s.generating);
  const sweepRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!generating || !sweepRef.current || !lineRef.current) return;
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(sweepRef.current, { yPercent: -120, opacity: 0 }, { yPercent: 120, opacity: 1, duration: 2.6, ease: EASE.slow })
      .fromTo(lineRef.current, { top: "0%" }, { top: "100%", duration: 2.6, ease: EASE.slow }, 0);
    return () => {
      tl.kill();
    };
  }, [generating]);

  useEffect(() => {
    if (!textRef.current) return;
    gsap.fromTo(textRef.current, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE.out });
  }, [generating?.phase]);

  if (!generating) return null;
  return (
    <div className="absolute inset-0 z-30 overflow-hidden pointer-events-none vc-fade-in">
      <div className="absolute inset-0 bg-white/90" />
      <div ref={sweepRef} className="absolute inset-x-0 h-[38%] bg-gradient-to-b from-transparent via-ink/8 to-transparent" />
      <div ref={lineRef} className="absolute inset-x-0 h-px bg-accent/60" />
      <div className="absolute inset-x-0 bottom-0 pb-8 flex flex-col items-center gap-3">
        <div ref={textRef} className="text-[11px] tracking-[0.24em] uppercase text-ink">
          {generating.phase}
        </div>
        <div className="text-[10px] tracking-[0.18em] uppercase text-muted">{generating.mode}</div>
      </div>
    </div>
  );
}
