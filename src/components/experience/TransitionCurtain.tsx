"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, EASE } from "@/lib/gsap";
import { transition, useTransition } from "@/state/transition-store";

/**
 * Continuous hand-off between the Experience and the Studio: a graphite curtain rises with the wordmark,
 * the route changes underneath, and the curtain lifts once the Studio has mounted.
 */
export function TransitionCurtain() {
  const phase = useTransition((s) => s.phase);
  const ref = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    const mark = markRef.current;
    if (!el || !mark) return;
    if (phase === "covering") {
      gsap.set(el, { display: "block", yPercent: 100 });
      gsap.set(mark, { opacity: 0, y: 8 });
      gsap
        .timeline({ onComplete: () => transition.covered() })
        .to(el, { yPercent: 0, duration: 0.6, ease: EASE.inOut })
        .to(mark, { opacity: 1, y: 0, duration: 0.4, ease: EASE.out }, "-=0.2");
    } else if (phase === "revealing") {
      gsap
        .timeline({ onComplete: () => transition.idle() })
        .to(mark, { opacity: 0, duration: 0.25 })
        .to(el, { yPercent: -100, duration: 0.6, ease: EASE.inOut }, "-=0.05")
        .set(el, { display: "none" });
    } else if (phase === "idle") {
      gsap.set(el, { display: "none" });
    }
  }, [phase]);

  // Safety: never leave the curtain stuck.
  useEffect(() => {
    if (phase !== "covered") return;
    const t = setTimeout(() => transition.reveal(), 2500);
    return () => clearTimeout(t);
  }, [phase, pathname]);

  return (
    <div ref={ref} className="fixed inset-0 z-[80] bg-graphite-0 hidden pointer-events-none">
      <div ref={markRef} className="absolute inset-0 flex items-center justify-center">
        <span className="text-[12px] tracking-[0.42em] text-ivory">VISUALCLOSE</span>
      </div>
    </div>
  );
}

/** Navigates through the curtain. */
export function useCurtainNavigate() {
  const router = useRouter();
  return (href: string) => {
    transition.cover();
    setTimeout(() => router.push(href), 650);
  };
}
