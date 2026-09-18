"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, EASE } from "@/lib/gsap";
import { CoverImage } from "@/components/present/CoverImage";
import { DEMO_PERGOLA_FOOTPRINT, DEMO_PERGOLA_FOV_DEG, DEMO_SPACE_SIZE } from "@/core/demo/pergola-placement.generated";
import { HeroScene } from "./HeroScene";
import { CategoryScene, CATEGORY_GROUPS } from "./CategoryScene";
import { BeforeAfter } from "./BeforeAfter";
import { RealPlanOverlay } from "./RealPlanOverlay";
import { useCurtainNavigate } from "./TransitionCurtain";
import { useDemoReality } from "./useDemoReality";

// PLACEHOLDER demo photograph (synthetic). REALIDAD below is composed over it in the browser, never pre-rendered.
const SPACE = "/demo/pergola/space.jpg";
const ARCHVIZ = "/demo/pergola/archviz.jpg";
const DIMS = { width: 5, depth: 4, height: 2.7, units: "m" as const };
const FOCUS = { x: 0.47, y: 0.6 };

/** Progress 0..1 of a tall section whose inner stage is sticky. */
function useScrollProgress(ref: React.RefObject<HTMLElement | null>): number {
  const [p, setP] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setP(self.progress),
    });
    return () => st.kill();
  }, [ref]);
  return p;
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.9, delay, ease: EASE.out, scrollTrigger: { trigger: el, start: "top 88%", once: true } },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- HERO

export function Hero() {
  const go = useCurtainNavigate();
  const copy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!copy.current) return;
    const items = copy.current.querySelectorAll("[data-line]");
    gsap.fromTo(items, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.14, delay: 0.5, ease: EASE.out });
  }, []);
  return (
    <section id="top" className="relative h-[100svh] min-h-[560px] overflow-hidden bg-graphite-0">
      <HeroScene />
      <div className="absolute inset-0 bg-gradient-to-t from-graphite-0/90 via-graphite-0/20 to-transparent pointer-events-none" />
      <div ref={copy} className="absolute inset-x-0 bottom-0 px-5 md:px-8 pb-10 md:pb-14 grid md:grid-cols-[1fr_auto] items-end gap-8">
        <div>
          <h1 data-line className="t-editorial text-ivory" style={{ fontSize: "clamp(44px, 9vw, 128px)" }}>
            SEE IT.
            <br />
            BEFORE IT EXISTS.
          </h1>
          <p data-line className="mt-5 text-[14px] md:text-[16px] text-warm-grey leading-snug max-w-[420px]">
            Real products. Real spaces.
            <br />
            Visualized before installation.
          </p>
          <div data-line className="mt-7 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => go("/studio")} className="h-11 px-6 text-[11px] tracking-[0.2em] uppercase font-medium text-graphite-0 bg-ivory hover:bg-offwhite transition-colors">
              Try VisualClose
            </button>
            <a href="#story" className="h-11 px-6 inline-flex items-center text-[11px] tracking-[0.2em] uppercase font-medium text-ivory border border-line-strong hover:bg-graphite-3 transition-colors">
              See how it works
            </a>
          </div>
        </div>
        <div data-line className="hidden md:block t-label text-right">
          Scroll
          <div className="w-px h-10 bg-line-strong ml-auto mt-2" />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- STORY 1: BEFORE / AFTER

export function StorySection() {
  const ref = useRef<HTMLElement>(null);
  const reality = useDemoReality();
  const progress = useScrollProgress(ref);
  const [manual, setManual] = useState<number | null>(null);
  const reveal = Math.min(1, Math.max(0, (progress - 0.15) / 0.55));
  const position = manual !== null && progress > 0.7 ? manual : 1 - reveal;
  return (
    <section id="story" ref={ref} className="relative h-[240vh] bg-graphite-0">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <BeforeAfter before={SPACE} after={reality ?? SPACE} width={DEMO_SPACE_SIZE.width} height={DEMO_SPACE_SIZE.height} position={position} focus={FOCUS} onChange={progress > 0.7 ? setManual : undefined} />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-0/85 via-transparent to-graphite-0/30 pointer-events-none" />
        <div className="absolute left-5 md:left-8 bottom-10 md:bottom-14 pointer-events-none">
          <div className="t-label mb-3" style={{ opacity: Math.min(1, progress * 4) }}>
            The real space · the real product
          </div>
          <h2 className="t-editorial text-ivory" style={{ fontSize: "clamp(36px, 6.5vw, 96px)", opacity: Math.min(1, progress * 3) }}>
            DON&apos;T IMAGINE IT.
            <br />
            <span style={{ opacity: reveal }}>SEE IT.</span>
          </h2>
          <div className="mt-4 t-label" style={{ opacity: progress > 0.7 ? 1 : 0 }}>
            Drag to compare · same photograph, only the product changes
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- STORY 2: CATEGORIES

export function CategoriesSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useScrollProgress(ref);
  const active = Math.min(CATEGORY_GROUPS.length - 1, Math.floor(progress * CATEGORY_GROUPS.length));
  const group = CATEGORY_GROUPS[active];
  return (
    <section id="use-cases" ref={ref} className="relative bg-graphite-1" style={{ height: `${CATEGORY_GROUPS.length * 100 + 40}vh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden grid grid-rows-[1fr_auto] md:grid-rows-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="order-2 md:order-1 relative z-10 px-5 md:px-8 pb-10 md:pb-0 flex flex-col justify-end md:justify-center">
          <div className="t-label mb-4">Not only pergolas</div>
          <h2 className="t-editorial text-ivory" style={{ fontSize: "clamp(34px, 5vw, 72px)" }}>
            ONE TOOL.
            <br />
            EVERY PHYSICAL PRODUCT.
          </h2>
          <div className="mt-8 md:mt-12 min-h-[150px]">
            <div key={group.key} className="vc-fade-in">
              <div className="text-[12px] tracking-[0.24em] text-champagne mb-3">{group.title}</div>
              <ul className="flex flex-wrap gap-x-5 gap-y-1.5 md:block md:space-y-1.5">
                {group.items.map((item, i) => (
                  <li key={item} className="text-[18px] md:text-[26px] text-ivory/90 leading-tight" style={{ animation: `vc-fade-in 500ms ${i * 70}ms ease both` }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 flex gap-1.5">
            {CATEGORY_GROUPS.map((g, i) => (
              <span key={g.key} className={`h-px transition-all duration-500 ${i === active ? "w-10 bg-ivory" : "w-4 bg-line-strong"}`} />
            ))}
          </div>
        </div>
        <div className="order-1 md:order-2 relative min-h-[42svh]">
          <CategoryScene active={active} />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-graphite-1 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- REAL PLAN

export function RealPlanSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useScrollProgress(ref);
  const draw = Math.min(1, Math.max(0, (progress - 0.1) / 0.6));
  return (
    <section id="real-plan" ref={ref} className="relative h-[220vh] bg-graphite-0">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <CoverImage
          src={SPACE}
          width={DEMO_SPACE_SIZE.width}
          height={DEMO_SPACE_SIZE.height}
          focus={FOCUS}
          overlay={(t) => (
            <RealPlanOverlay footprint={DEMO_PERGOLA_FOOTPRINT} dimensions={DIMS} fovDeg={DEMO_PERGOLA_FOV_DEG} width={DEMO_SPACE_SIZE.width} height={DEMO_SPACE_SIZE.height} t={t} progress={draw} productName="Milano X Pergola" />
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-0/90 via-graphite-0/10 to-graphite-0/40 pointer-events-none" />
        <div className="absolute top-20 md:top-24 left-5 md:left-8 pointer-events-none">
          <div className="t-label mb-3">Real plan</div>
          <h2 className="t-editorial text-ivory" style={{ fontSize: "clamp(30px, 4.6vw, 68px)" }}>
            THE PLAN IS
            <br />
            THE REAL SPACE.
          </h2>
        </div>
        <div className="absolute right-5 md:right-8 bottom-10 md:bottom-14 pointer-events-none max-w-[380px] text-right">
          <p className="text-[16px] md:text-[20px] text-ivory leading-snug" style={{ opacity: Math.min(1, Math.max(0, (progress - 0.45) / 0.3)) }}>
            Real image.
            <br />
            Real dimensions.
            <br />
            Real placement.
          </p>
          <p className="mt-4 text-[12px] text-warm-grey leading-snug" style={{ opacity: Math.min(1, Math.max(0, (progress - 0.6) / 0.3)) }}>
            Not a CAD drawing. The photograph is the plan: placement, width, depth, height, footprint and anchor points, over the space as it really is.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- HOW IT WORKS

export function HowItWorks() {
  const steps = [
    { n: "01", title: "ADD YOUR SPACE", copy: "Upload the real environment." },
    { n: "02", title: "ADD YOUR PRODUCT", copy: "Upload product references. Add dimensions if available." },
    { n: "03", title: "VISUALIZE", copy: "See it inside the real space." },
  ];
  return (
    <section id="how" className="bg-graphite-1 px-5 md:px-8 py-24 md:py-40">
      <Reveal>
        <div className="t-label mb-4">How it works</div>
        <h2 className="t-editorial text-ivory mb-16 md:mb-24" style={{ fontSize: "clamp(32px, 4.5vw, 64px)" }}>
          THREE STEPS. THAT&apos;S IT.
        </h2>
      </Reveal>
      <div className="grid md:grid-cols-3 gap-10 md:gap-8">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.12} className="hairline-t pt-6">
            <div className="t-mono text-[13px] text-champagne mb-6">{s.n}</div>
            <div className="text-[20px] md:text-[24px] tracking-[0.04em] text-ivory font-medium">{s.title}</div>
            <p className="mt-3 text-[14px] text-warm-grey leading-snug max-w-[300px]">{s.copy}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- OUTPUTS

function OutputCard({ kicker, title, copy, children, primary = false }: { kicker: string; title: string; copy: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <div className={`snap-start shrink-0 w-[82vw] md:w-[46vw] lg:w-[38vw] ${primary ? "" : ""}`}>
      <div className="relative aspect-[3/2] bg-graphite-0 border border-line overflow-hidden">{children}</div>
      <div className="mt-4 flex items-baseline gap-3">
        <span className={`text-[12px] tracking-[0.22em] ${primary ? "text-champagne" : "text-warm-grey"}`}>{kicker}</span>
        <span className="text-[18px] md:text-[20px] text-ivory tracking-[0.02em]">{title}</span>
      </div>
      <p className="mt-1.5 text-[13px] text-warm-grey leading-snug max-w-[420px]">{copy}</p>
    </div>
  );
}

export function OutputsSection() {
  const reality = useDemoReality();
  return (
    <section className="bg-graphite-0 py-24 md:py-36 overflow-hidden">
      <div className="px-5 md:px-8">
        <Reveal>
          <div className="t-label mb-4">Outputs</div>
          <h2 className="t-editorial text-ivory" style={{ fontSize: "clamp(32px, 4.5vw, 64px)" }}>
            NOT A RENDER.
            <br />
            YOUR PHOTO, WITH THE PRODUCT IN IT.
          </h2>
        </Reveal>
      </div>
      <div className="mt-12 md:mt-16 flex gap-5 md:gap-8 px-5 md:px-8 overflow-x-auto snap-x snap-mandatory vc-scroll pb-4">
        <OutputCard kicker="01" title="REALITY" copy="Your photograph, edited: the product installed inside it. Everything else stays exactly as it was. The primary output." primary>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {reality && <img src={reality} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        </OutputCard>
        <OutputCard kicker="02" title="REAL PLAN" copy="The real photograph with spatial and dimensional information.">
          <CoverImage
            src={SPACE}
            width={DEMO_SPACE_SIZE.width}
            height={DEMO_SPACE_SIZE.height}
            overlay={(t) => (
              <RealPlanOverlay footprint={DEMO_PERGOLA_FOOTPRINT} dimensions={DIMS} fovDeg={DEMO_PERGOLA_FOV_DEG} width={DEMO_SPACE_SIZE.width} height={DEMO_SPACE_SIZE.height} t={t} progress={1} productName="Milano X Pergola" />
            )}
          />
        </OutputCard>
        <OutputCard kicker="03" title="ARCHITECTURE" copy="A more stylised architectural visualization of the same placement. Secondary.">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ARCHVIZ} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </OutputCard>
        <OutputCard kicker="04" title="MOTION" copy="Future video visualization. Coming later.">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SPACE} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="t-label-strong border border-line-strong px-3 py-1.5 bg-graphite-0/60">Coming later</span>
          </div>
        </OutputCard>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- ABOUT + CTA

export function AboutSection() {
  return (
    <section id="about" className="bg-graphite-1 px-5 md:px-8 py-24 md:py-40">
      <div className="grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10 md:gap-16 items-end">
        <Reveal>
          <div className="t-label mb-4">About</div>
          <h2 className="t-editorial text-ivory" style={{ fontSize: "clamp(32px, 4.8vw, 68px)" }}>
            WE BUILD THE GAP BETWEEN
            <br />
            IMAGINATION AND DECISION.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-[15px] md:text-[17px] text-ivory/85 leading-snug">
            VisualClose combines AI, spatial computing and visual technology to change how physical products are presented and sold. A real space, a real product, real dimensions: seen before anything is built.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function FooterCta() {
  const go = useCurtainNavigate();
  return (
    <section className="bg-graphite-0 px-5 md:px-8 pt-24 md:pt-40 pb-10">
      <Reveal className="hairline-t pt-12 md:pt-20 grid md:grid-cols-[1fr_auto] gap-8 items-end">
        <h2 className="t-editorial text-ivory" style={{ fontSize: "clamp(40px, 8vw, 120px)" }}>
          SEE IT.
          <br />
          BEFORE IT EXISTS.
        </h2>
        <button type="button" onClick={() => go("/studio")} className="h-12 px-7 text-[11px] tracking-[0.22em] uppercase font-medium text-graphite-0 bg-ivory hover:bg-offwhite transition-colors">
          Try VisualClose →
        </button>
      </Reveal>
      <div className="mt-20 flex items-center justify-between t-label">
        <span>VISUALCLOSE</span>
        <span>Demo imagery is placeholder art · Real products · Real spaces</span>
      </div>
    </section>
  );
}
