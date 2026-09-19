"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, EASE } from "@/lib/gsap";
import { CoverImage } from "@/components/present/CoverImage";
import { DEMO_PERGOLA_FOOTPRINT, DEMO_PERGOLA_FOV_DEG, DEMO_SPACE_SIZE } from "@/core/demo/pergola-placement.generated";
import { CategoryScene, CATEGORY_GROUPS } from "./CategoryScene";
import { BeforeAfter } from "./BeforeAfter";
import { RealPlanOverlay } from "./RealPlanOverlay";
import { useCurtainNavigate } from "./TransitionCurtain";
import { useDemoReality } from "./useDemoReality";

// Imágenes de demostración (ilustrativas). REALIDAD se compone en el navegador sobre la foto original,
// nunca se pre-renderiza: ver src/lib/reality-composite.ts.
const SPACE = "/demo/pergola/space.jpg";
const ARCHVIZ = "/demo/pergola/archviz.jpg";
const REF_FRONT = "/demo/pergola/ref-front.jpg";
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

// ---------------------------------------------------------------- small inline icons

function IconSpark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
    </svg>
  );
}
function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
function IconShield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5l7 2.6v5.4c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9V6.1z" />
      <path d="M9 12l2.1 2.1L15.5 9.5" />
    </svg>
  );
}
function IconUpload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 15.5V4M8 8l4-4 4 4" />
      <path d="M4.5 15.5v3a2 2 0 002 2h11a2 2 0 002-2v-3" />
    </svg>
  );
}
function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconEye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}
function IconMove(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v18M3 12h18M6 6L3 3M3 3l3 0M3 3l0 3M18 6l3-3M21 3l-3 0M21 3l0 3M6 18l-3 3M3 21l3 0M3 21l0-3M18 18l3 3M21 21l-3 0M21 21l0-3" />
    </svg>
  );
}
function IconPlay(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

// ---------------------------------------------------------------- HERO

export function Hero() {
  const go = useCurtainNavigate();
  const copy = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!copy.current) return;
    const items = copy.current.querySelectorAll("[data-line]");
    gsap.fromTo(items, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12, delay: 0.35, ease: EASE.out });
    if (photoRef.current) {
      gsap.fromTo(photoRef.current, { scale: 1.06, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.4, ease: EASE.slow });
    }
  }, []);
  // Parallax muy suave: la foto se desplaza ligeramente más lento que el scroll.
  useEffect(() => {
    const onScroll = () => {
      if (!photoRef.current) return;
      const y = Math.min(140, window.scrollY * 0.18);
      photoRef.current.style.transform = `translate3d(0, ${y}px, 0) scale(1.06)`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const benefits: { icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement; label: string }[] = [
    { icon: IconSpark, label: "Sin instalaciones" },
    { icon: IconClock, label: "Resultados en segundos" },
    { icon: IconShield, label: "Para profesionales y particulares" },
  ];

  return (
    <section id="top" className="relative min-h-[92svh] overflow-hidden bg-stone pt-16">
      <div className="absolute inset-0 overflow-hidden">
        <div ref={photoRef} className="absolute inset-0" style={{ willChange: "transform" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ARCHVIZ} alt="Terraza real con la pérgola Milano X instalada" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(1.08) saturate(1.1) contrast(0.98)" }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-paper/90 via-paper/10 to-transparent md:from-paper/70" />
      </div>

      <div className="relative z-10 px-5 md:px-10 pt-10 md:pt-16">
        <div ref={copy} className="max-w-[640px]">
          <div data-line className="t-label text-accent mb-4">
            Espacios reales. Decisiones seguras.
          </div>
          <h1 data-line className="t-display text-ink" style={{ fontSize: "clamp(40px, 7vw, 80px)" }}>
            Míralo antes
            <br />
            de instalarlo.
          </h1>
          <p data-line className="mt-6 text-[15px] md:text-[17px] text-ink-2 leading-relaxed max-w-[460px]">
            Sube una foto de tu espacio, añade tu producto, coloca las medidas y visualiza el resultado antes de tomar la decisión.
          </p>
          <div data-line className="mt-8 flex flex-wrap items-center gap-5">
            <button type="button" onClick={() => go("/studio")} className="h-12 px-7 rounded-full text-[13px] font-medium text-white bg-ink hover:bg-ink-2 transition-colors inline-flex items-center gap-2">
              Probar VisualClose <span aria-hidden>→</span>
            </button>
            <a href="#como-funciona" className="inline-flex items-center gap-2.5 text-[13px] font-medium text-ink-2 hover:text-ink transition-colors">
              <span className="w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center">
                <IconPlay className="w-3.5 h-3.5 text-ink ml-0.5" />
              </span>
              Ver cómo funciona
            </a>
          </div>
          <div data-line className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3">
            {benefits.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 text-[12.5px] text-ink-2">
                <Icon className="w-4 h-4 text-accent shrink-0" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div data-line className="absolute right-5 md:right-10 bottom-8 md:bottom-12 z-10">
        <div className="w-[240px] md:w-[260px] card rounded-2xl p-3.5 lift">
          <div className="text-[10px] text-muted mb-2 -mt-0.5">Tu producto en tu espacio real</div>
          <div className="rounded-xl overflow-hidden aspect-[4/3] bg-stone relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={REF_FRONT} alt="Pérgola Milano X" className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-ink">Pérgola Milano X</div>
              <div className="text-[11px] text-muted t-mono">500 × 400 × 270 cm</div>
            </div>
            <span className="w-8 h-8 rounded-full bg-stone flex items-center justify-center shrink-0">
              <IconMove className="w-4 h-4 text-ink-2" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- STORY 1: ANTES / DESPUÉS

export function StorySection() {
  const ref = useRef<HTMLElement>(null);
  const reality = useDemoReality();
  const progress = useScrollProgress(ref);
  const [manual, setManual] = useState<number | null>(null);
  const reveal = Math.min(1, Math.max(0, (progress - 0.15) / 0.55));
  const position = manual !== null && progress > 0.7 ? manual : 1 - reveal;
  return (
    <section id="antes-despues" ref={ref} className="relative h-[220vh] bg-stone">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <BeforeAfter before={SPACE} after={reality ?? SPACE} width={DEMO_SPACE_SIZE.width} height={DEMO_SPACE_SIZE.height} position={position} focus={FOCUS} onChange={progress > 0.7 ? setManual : undefined} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent pointer-events-none" />
        <div className="absolute left-5 md:left-10 bottom-10 md:bottom-14 pointer-events-none">
          <div className="t-label text-white/80 mb-3" style={{ opacity: Math.min(1, progress * 4) }}>
            Tu espacio · tu producto
          </div>
          <h2 className="t-display text-white" style={{ fontSize: "clamp(32px, 5.5vw, 76px)", opacity: Math.min(1, progress * 3) }}>
            No lo imagines.
            <br />
            <span style={{ opacity: reveal }}>Míralo.</span>
          </h2>
          <div className="mt-4 t-label text-white/75" style={{ opacity: progress > 0.7 ? 1 : 0 }}>
            Arrastra para comparar · la misma foto, solo cambia el producto
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- STORY 2: APLICACIONES

export function CategoriesSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useScrollProgress(ref);
  const active = Math.min(CATEGORY_GROUPS.length - 1, Math.floor(progress * CATEGORY_GROUPS.length));
  const group = CATEGORY_GROUPS[active];
  return (
    <section id="aplicaciones" ref={ref} className="relative bg-paper" style={{ height: `${CATEGORY_GROUPS.length * 100 + 40}vh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden grid grid-rows-[1fr_auto] md:grid-rows-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="order-2 md:order-1 relative z-10 px-5 md:px-10 pb-10 md:pb-0 flex flex-col justify-end md:justify-center">
          <div className="t-label mb-4">No solo pérgolas</div>
          <h2 className="t-display text-ink" style={{ fontSize: "clamp(30px, 4.4vw, 60px)" }}>
            Una herramienta.
            <br />
            Cualquier producto físico.
          </h2>
          <div className="mt-8 md:mt-12 min-h-[150px]">
            <div key={group.key} className="vc-fade-in">
              <div className="text-[12px] tracking-[0.24em] text-accent mb-3">{group.title}</div>
              <ul className="flex flex-wrap gap-x-5 gap-y-1.5 md:block md:space-y-1.5">
                {group.items.map((item, i) => (
                  <li key={item} className="text-[18px] md:text-[26px] text-ink-2 leading-tight" style={{ animation: `vc-fade-in 500ms ${i * 70}ms ease both` }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 flex gap-1.5">
            {CATEGORY_GROUPS.map((g, i) => (
              <span key={g.key} className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-10 bg-ink" : "w-4 bg-line-strong"}`} />
            ))}
          </div>
        </div>
        <div className="order-1 md:order-2 relative min-h-[42svh] bg-stone">
          <CategoryScene active={active} />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-paper via-transparent to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- PLANO REAL

export function RealPlanSection() {
  const ref = useRef<HTMLElement>(null);
  const progress = useScrollProgress(ref);
  const draw = Math.min(1, Math.max(0, (progress - 0.1) / 0.6));
  return (
    <section id="plano-real" ref={ref} className="relative h-[200vh] bg-stone">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <CoverImage
          src={SPACE}
          width={DEMO_SPACE_SIZE.width}
          height={DEMO_SPACE_SIZE.height}
          focus={FOCUS}
          overlay={(t) => (
            <RealPlanOverlay footprint={DEMO_PERGOLA_FOOTPRINT} dimensions={DIMS} fovDeg={DEMO_PERGOLA_FOV_DEG} width={DEMO_SPACE_SIZE.width} height={DEMO_SPACE_SIZE.height} t={t} progress={draw} productName="Pérgola Milano X" />
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/5 to-transparent pointer-events-none" />
        <div className="absolute top-24 md:top-28 left-5 md:left-10 pointer-events-none">
          <div className="t-label text-white/80 mb-3">Plano real</div>
          <h2 className="t-display text-white" style={{ fontSize: "clamp(28px, 4.2vw, 60px)" }}>
            El plano es
            <br />
            el espacio real.
          </h2>
        </div>
        <div className="absolute right-5 md:right-10 bottom-10 md:bottom-14 pointer-events-none max-w-[380px] text-right">
          <p className="text-[16px] md:text-[20px] text-white leading-snug" style={{ opacity: Math.min(1, Math.max(0, (progress - 0.45) / 0.3)) }}>
            Imagen real.
            <br />
            Medidas reales.
            <br />
            Colocación real.
          </p>
          <p className="mt-4 text-[12px] text-white/75 leading-snug" style={{ opacity: Math.min(1, Math.max(0, (progress - 0.6) / 0.3)) }}>
            No es un plano CAD. La fotografía es el plano: colocación, ancho, fondo, alto, contorno y puntos de referencia, sobre el espacio tal como es.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- CÓMO FUNCIONA

export function HowItWorks() {
  const steps: { n: string; title: string; copy: string; image: string; icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement }[] = [
    { n: "1", title: "Tu espacio", copy: "Sube una foto de tu habitación o espacio real.", image: SPACE, icon: IconUpload },
    { n: "2", title: "Tu producto", copy: "Añade una imagen del producto que quieres visualizar.", image: REF_FRONT, icon: IconPlus },
    { n: "3", title: "Visualiza", copy: "Coloca, ajusta y comprueba cómo queda en tu espacio.", image: ARCHVIZ, icon: IconEye },
  ];
  return (
    <section id="como-funciona" className="bg-paper px-5 md:px-10 py-24 md:py-32">
      <Reveal className="max-w-[720px] mb-14 md:mb-20">
        <div className="t-label mb-4">Cómo funciona</div>
        <h2 className="t-display text-ink" style={{ fontSize: "clamp(30px, 4.2vw, 56px)" }}>
          Tres pasos. Así de simple.
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="card rounded-3xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-line grid md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="p-7 md:p-9 flex items-center gap-5">
              <div className="min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-sand-soft border border-line flex items-center justify-center text-[13px] font-semibold text-ink mb-4">{s.n}</div>
                <div className="text-[17px] font-semibold text-ink">{s.title}</div>
                <p className="mt-1.5 text-[13.5px] text-muted leading-snug">{s.copy}</p>
              </div>
              <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-2xl overflow-hidden bg-stone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center shadow-md">
                  <s.icon className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ---------------------------------------------------------------- RESULTADOS

function OutputCard({ kicker, title, copy, children, primary = false }: { kicker: string; title: string; copy: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <div className="snap-start shrink-0 w-[82vw] md:w-[44vw] lg:w-[36vw]">
      <div className={`relative aspect-[3/2] rounded-2xl overflow-hidden bg-stone ${primary ? "lift" : "card"}`}>{children}</div>
      <div className="mt-4 flex items-baseline gap-3">
        <span className={`text-[12px] tracking-[0.18em] ${primary ? "text-accent" : "text-muted"}`}>{kicker}</span>
        <span className="text-[17px] md:text-[19px] text-ink font-medium">{title}</span>
      </div>
      <p className="mt-1.5 text-[13px] text-muted leading-snug max-w-[420px]">{copy}</p>
    </div>
  );
}

export function OutputsSection() {
  const reality = useDemoReality();
  return (
    <section className="bg-stone py-24 md:py-32 overflow-hidden">
      <div className="px-5 md:px-10">
        <Reveal className="max-w-[720px]">
          <div className="t-label mb-4">Resultados</div>
          <h2 className="t-display text-ink" style={{ fontSize: "clamp(30px, 4.2vw, 56px)" }}>
            No es un render.
            <br />
            Tu foto, con el producto dentro.
          </h2>
        </Reveal>
      </div>
      <div className="mt-12 md:mt-16 flex gap-5 md:gap-8 px-5 md:px-10 overflow-x-auto snap-x snap-mandatory vc-scroll pb-4">
        <OutputCard kicker="Principal" title="Realidad" copy="Tu fotografía, editada: el producto instalado dentro de ella. Todo lo demás permanece igual." primary>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {reality && <img src={reality} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        </OutputCard>
        <OutputCard kicker="Espacial" title="Plano real" copy="La fotografía real con información de colocación y medidas.">
          <CoverImage
            src={SPACE}
            width={DEMO_SPACE_SIZE.width}
            height={DEMO_SPACE_SIZE.height}
            overlay={(t) => (
              <RealPlanOverlay footprint={DEMO_PERGOLA_FOOTPRINT} dimensions={DIMS} fovDeg={DEMO_PERGOLA_FOV_DEG} width={DEMO_SPACE_SIZE.width} height={DEMO_SPACE_SIZE.height} t={t} progress={1} productName="Pérgola Milano X" />
            )}
          />
        </OutputCard>
        <OutputCard kicker="Secundario" title="Arquitectura" copy="Una visualización arquitectónica más estilizada de la misma colocación.">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ARCHVIZ} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </OutputCard>
        <OutputCard kicker="Próximamente" title="Movimiento" copy="Visualización en vídeo. Llegará más adelante.">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SPACE} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="t-label-strong rounded-full bg-white/95 px-4 py-2 shadow-sm">Próximamente</span>
          </div>
        </OutputCard>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- NOSOTROS + CIERRE

export function AboutSection() {
  return (
    <section id="nosotros" className="bg-paper px-5 md:px-10 py-24 md:py-32">
      <div className="grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10 md:gap-16 items-end">
        <Reveal>
          <div className="t-label mb-4">Nosotros</div>
          <h2 className="t-display text-ink" style={{ fontSize: "clamp(28px, 4.4vw, 52px)" }}>
            Construimos el puente entre
            <br />
            la imaginación y la decisión.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-[15px] md:text-[16px] text-ink-2 leading-relaxed">
            VisualClose combina inteligencia artificial, computación espacial y tecnología visual para cambiar cómo se presentan y se venden los productos físicos. Un espacio real, un producto real, medidas reales: visto antes de construir nada.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function FooterCta() {
  const go = useCurtainNavigate();
  return (
    <section className="bg-stone px-5 md:px-10 pt-20 md:pt-28 pb-10">
      <Reveal className="hairline-t pt-12 md:pt-16 grid md:grid-cols-[1fr_auto] gap-8 items-end">
        <h2 className="t-display text-ink" style={{ fontSize: "clamp(36px, 7vw, 96px)" }}>
          Míralo antes
          <br />
          de instalarlo.
        </h2>
        <button type="button" onClick={() => go("/studio")} className="h-14 px-8 rounded-full text-[13px] font-medium text-white bg-ink hover:bg-ink-2 transition-colors inline-flex items-center gap-2 w-max">
          Probar VisualClose <span aria-hidden>→</span>
        </button>
      </Reveal>
      <div className="mt-16 flex items-center justify-between t-label">
        <span>VISUALCLOSE</span>
        <span>Las imágenes de demostración son ilustrativas · Productos reales · Espacios reales</span>
      </div>
    </section>
  );
}
