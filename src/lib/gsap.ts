import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// A single, calm easing vocabulary for the whole product.
export const EASE = {
  out: "power2.out",
  inOut: "power2.inOut",
  slow: "power1.inOut",
} as const;

gsap.defaults({ ease: EASE.out, duration: 0.6 });

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
