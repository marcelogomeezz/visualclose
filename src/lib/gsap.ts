import gsap from "gsap";

// A single, calm easing vocabulary for the whole product.
export const EASE = {
  out: "power2.out",
  inOut: "power2.inOut",
  slow: "power1.inOut",
} as const;

gsap.defaults({ ease: EASE.out, duration: 0.6 });

export { gsap };
