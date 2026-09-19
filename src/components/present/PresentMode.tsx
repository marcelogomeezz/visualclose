"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap, EASE } from "@/lib/gsap";
import { footprintCenter } from "@/core/geometry/footprint";
import { formatDimensions } from "@/core/geometry/units";
import type { PresentAspect } from "@/core/types";
import { actions, useProject } from "@/state/project-store";
import { usePlacementSolve } from "@/state/derived";
import { ui, useUI } from "@/state/ui-store";
import { Segmented } from "@/components/ui/Segmented";
import { Icon } from "@/components/ui/icons";
import { CoverImage } from "./CoverImage";
import { VolumeSvg } from "./VolumeSvg";
import { TECHNICAL_NOTE } from "@/lib/export-png";

const ASPECTS: { value: PresentAspect; label: string }[] = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
];

/**
 * Cinematic presentation built from the current project.
 * Sequence: brand → real space → references → dimensions → technical placement → reveal → before/after → brand frame.
 */
export function PresentMode() {
  const project = useProject();
  const solve = usePlacementSolve();
  const aspect = useUI((s) => s.present.aspect);
  const stageRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reality = useMemo(() => [...(project?.outputs ?? [])].reverse().find((o) => o.type === "REALITY" && o.registered) ?? null, [project?.outputs]);
  const focus = useMemo(() => {
    if (!project) return { x: 0.5, y: 0.5 };
    const c = footprintCenter(project.placement.footprint);
    // Bias upwards so the product's height survives portrait crops.
    return { x: c.x, y: Math.max(0.3, c.y - 0.16) };
  }, [project]);

  // Stage sizing: fit the aspect inside the viewport.
  useLayoutEffect(() => {
    const compute = () => {
      const vw = window.innerWidth - 48;
      const vh = window.innerHeight - 96;
      const [aw, ah] = aspect === "16:9" ? [16, 9] : aspect === "9:16" ? [9, 16] : [1, 1];
      let w = vw;
      let h = (w * ah) / aw;
      if (h > vh) {
        h = vh;
        w = (h * aw) / ah;
      }
      setStageSize({ w, h });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [aspect]);

  // Timeline
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !project) return;
    const q = gsap.utils.selector(stage);
    const frames = q<HTMLElement>("[data-frame]");
    gsap.set(frames, { autoAlpha: 0 });
    gsap.set(q("[data-caption]"), { autoAlpha: 0, y: 10 });

    const tl = gsap.timeline({
      paused: false,
      onUpdate: () => setProgress(tl.progress()),
      onComplete: () => setPlaying(false),
    });
    const show = (name: string, hold: number, extra?: (t: gsap.core.Timeline, el: HTMLElement) => void) => {
      const el = q<HTMLElement>(`[data-frame="${name}"]`)[0];
      if (!el) return;
      tl.call(() => stage.setAttribute("data-active-frame", name));
      const caps = Array.from(el.querySelectorAll("[data-caption]"));
      tl.addLabel(name);
      tl.to(el, { autoAlpha: 1, duration: 0.9, ease: EASE.inOut }, ">-0.5");
      if (caps.length) tl.to(caps, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: EASE.out }, "<0.3");
      if (extra) extra(tl, el);
      tl.to({}, { duration: hold });
      if (caps.length) tl.to(caps, { autoAlpha: 0, y: -6, duration: 0.4, ease: EASE.inOut });
      tl.to(el, { autoAlpha: 0, duration: 0.7, ease: EASE.inOut }, caps.length ? "<0.1" : ">");
    };

    show("space", 3.2, (t, el) => {
      const img = el.querySelector("img");
      if (img) t.fromTo(img, { scale: 1 }, { scale: 1.06, duration: 6.5, ease: "none", transformOrigin: `${focus.x * 100}% ${focus.y * 100}%` }, "<-1");
    });
    if (project.productPack.references.length) {
      show("references", 3, (t, el) => {
        const tiles = el.querySelectorAll("[data-tile]");
        t.fromTo(tiles, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: EASE.out }, "<");
      });
    }
    show("dimensions", 3.2);
    if (solve) show("technical", 3.6);
    if (reality) {
      show("reveal", 3.2, (t, el) => {
        const after = el.querySelector<HTMLElement>("[data-after]");
        if (after) t.fromTo(after, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 2.4, ease: EASE.inOut }, "<0.4");
      });
      show("compare", 2.2, (t, el) => {
        const after = el.querySelector<HTMLElement>("[data-after]");
        const line = el.querySelector<HTMLElement>("[data-line]");
        if (after && line) {
          const state = { p: 0 };
          const apply = () => {
            after.style.clipPath = `inset(0 0 0 ${state.p * 100}%)`;
            line.style.left = `${state.p * 100}%`;
          };
          apply();
          t.to(state, { p: 1, duration: 2.2, ease: EASE.inOut, onUpdate: apply }, "<0.4");
          t.to(state, { p: 0.5, duration: 1.4, ease: EASE.inOut, onUpdate: apply });
        }
      });
    }
    show("brand", 2.6);
    tlRef.current = tl;
    setPlaying(true);
    return () => {
      tl.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, project?.id, reality?.id, stageSize.w]);

  const togglePlay = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (tl.progress() >= 1) {
      tl.restart();
      setPlaying(true);
      return;
    }
    if (tl.paused()) {
      tl.play();
      setPlaying(true);
    } else {
      tl.pause();
      setPlaying(false);
    }
  };
  const restart = () => {
    tlRef.current?.restart();
    setPlaying(true);
  };

  // Auto-hide controls
  useEffect(() => {
    const onMove = () => {
      setControlsVisible(true);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setControlsVisible(false), 2600);
    };
    onMove();
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "r") restart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });


  if (!project?.space) {
    return (
      <div className="fixed inset-0 z-50 bg-stone flex flex-col items-center justify-center gap-4">
        <span className="t-label-strong">Nada que presentar todavía</span>
        <span className="text-[11px] text-muted">Añade primero la foto de tu espacio.</span>
        <button type="button" className="t-label hover:text-ink" onClick={() => ui.exitPresent()}>
          Salir
        </button>
      </div>
    );
  }

  const { space, productPack, dimensions, presentation } = project;
  const dims = formatDimensions(dimensions.width, dimensions.depth, dimensions.height, dimensions.units);
  // 1 unit ≈ 1% of stage width, boosted for narrow stages so type stays readable in portrait and square.
  const u = (stageSize.w / 100) * (aspect === "9:16" ? 1.6 : aspect === "1:1" ? 1.25 : 1);
  const refs = productPack.references.slice(0, 4);
  const prospect = presentation.prospectName.trim();

  return (
    <div className="fixed inset-0 z-50 bg-stone flex items-center justify-center select-none">
      {/* Controls */}
      <div className={`absolute top-0 inset-x-0 h-14 px-4 flex items-center justify-between transition-opacity duration-500 z-10 bg-white/75 backdrop-blur-md ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="flex items-center gap-3">
          <span className="text-[11px] tracking-[0.3em] text-ink">VISUALCLOSE</span>
          <span className="t-label">Presentar</span>
        </div>
        <div className="flex items-center gap-3">
          <Segmented value={aspect} options={ASPECTS} onChange={(a) => ui.setPresentAspect(a)} />
          <input
            className="vc-input !rounded-full !w-[180px] !py-1.5"
            placeholder="Empresa del cliente"
            value={presentation.prospectName}
            onChange={(e) => actions.setPresentation({ prospectName: e.target.value })}
          />
          <label className="t-label cursor-pointer hover:text-ink px-1">
            {presentation.prospectLogo ? "Logo ✓" : "Logo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => void actions.setProspectLogo(e.target.files?.[0] ?? null)} />
          </label>
          <button type="button" className="w-8 h-8 rounded-full flex items-center justify-center text-ink hover:bg-stone transition-colors" onClick={togglePlay} title="Reproducir o pausar (barra espaciadora)">
            {playing ? <Icon.Pause /> : <Icon.Play />}
          </button>
          <button type="button" className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-stone transition-colors" onClick={restart} title="Reiniciar (r)">
            <Icon.Reset />
          </button>
          <button type="button" className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-stone transition-colors" onClick={() => ui.exitPresent()} title="Salir (esc)">
            <Icon.Close />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div
        ref={stageRef}
        data-aspect={aspect}
        className="present-stage relative overflow-hidden bg-stone"
        style={{ width: stageSize.w, height: stageSize.h, ["--u" as string]: `${u}px` }}
        onClick={togglePlay}
      >
        {/* SPACE */}
        <div data-frame="space" className="absolute inset-0">
          <CoverImage src={space.asset.url} width={space.width} height={space.height} focus={focus} />
          <Caption kicker="Espacio real" title={project.name} aspect={aspect} />
        </div>

        {/* REFERENCES */}
        {refs.length > 0 && (
          <div data-frame="references" className="absolute inset-0 bg-paper">
            <div className={`absolute inset-0 flex gap-[calc(var(--u)*3)] p-[calc(var(--u)*5)] ${aspect === "16:9" ? "flex-row items-center" : "flex-col"}`}>
              <div className={`${aspect === "16:9" ? "w-[36%]" : "w-full"} shrink-0`}>
                <div data-caption className="t-label" style={{ fontSize: "calc(var(--u) * 1.05)" }}>
                  Producto real
                </div>
                <div data-caption className="t-editorial text-ink mt-[calc(var(--u)*1.2)]" style={{ fontSize: `calc(var(--u) * ${aspect === "16:9" ? 4.4 : 5.4})` }}>
                  {productPack.name}
                </div>
                {productPack.tagline && (
                  <div data-caption className="text-muted mt-[calc(var(--u)*1.5)]" style={{ fontSize: "calc(var(--u) * 1.5)" }}>
                    {productPack.tagline}
                  </div>
                )}
              </div>
              <div className={`flex-1 min-h-0 grid content-center gap-[calc(var(--u)*1.5)] ${aspect === "16:9" ? (refs.length > 2 ? "grid-cols-2" : "grid-cols-1") : "grid-cols-2"}`}>
                {refs.map((r) => (
                  <div key={r.id} data-tile className="relative rounded-2xl bg-stone border border-line overflow-hidden aspect-[4/3] shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.asset.url} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                    <span className="absolute left-[calc(var(--u)*1)] bottom-[calc(var(--u)*0.8)] t-label-strong bg-white/90 rounded-full px-[calc(var(--u)*1)] py-[calc(var(--u)*0.35)] shadow-sm" style={{ fontSize: "calc(var(--u) * 0.9)" }}>
                      {r.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DIMENSIONS */}
        <div data-frame="dimensions" className="absolute inset-0 bg-paper">
          <div className="absolute inset-0 p-[calc(var(--u)*6)] flex flex-col justify-center">
            <div data-caption className="t-label" style={{ fontSize: "calc(var(--u) * 1.05)" }}>
              Medidas reales
            </div>
            <div data-caption className="t-editorial t-mono text-ink mt-[calc(var(--u)*2)]" style={{ fontSize: `calc(var(--u) * ${aspect === "9:16" ? 5.6 : 7.2})`, letterSpacing: "-0.02em" }}>
              {aspect === "9:16" ? (
                <>
                  <div>{dimensions.width.toFixed(2)}</div>
                  <div>× {dimensions.depth.toFixed(2)}</div>
                  <div>× {dimensions.height.toFixed(2)}</div>
                  <div className="text-muted" style={{ fontSize: "calc(var(--u) * 2.4)" }}>
                    {dimensions.units}
                  </div>
                </>
              ) : (
                dims
              )}
            </div>
            <div data-caption className="grid gap-[calc(var(--u)*0.6)] mt-[calc(var(--u)*4)] text-ink/85" style={{ fontSize: "calc(var(--u) * 1.5)", gridTemplateColumns: aspect === "16:9" ? "repeat(3, max-content)" : "1fr", columnGap: "calc(var(--u) * 5)" }}>
              <div>
                <span className="t-label block" style={{ fontSize: "calc(var(--u) * 0.9)" }}>
                  Color
                </span>
                {productPack.color}
              </div>
              <div>
                <span className="t-label block" style={{ fontSize: "calc(var(--u) * 0.9)" }}>
                  Material
                </span>
                {productPack.material}
              </div>
              <div>
                <span className="t-label block" style={{ fontSize: "calc(var(--u) * 0.9)" }}>
                  Acabado
                </span>
                {productPack.finish}
              </div>
            </div>
          </div>
        </div>

        {/* TECHNICAL */}
        {solve && (
          <div data-frame="technical" className="absolute inset-0">
            <CoverImage
              src={space.asset.url}
              width={space.width}
              height={space.height}
              focus={focus}
              overlay={(t) => <VolumeSvg solve={solve} dimensions={dimensions} width={space.width} height={space.height} t={t} />}
            />
            <Caption kicker="Plano real" title={dims} sub={TECHNICAL_NOTE} aspect={aspect} />
          </div>
        )}

        {/* REVEAL */}
        {reality && (
          <div data-frame="reveal" className="absolute inset-0">
            <CoverImage src={space.asset.url} width={space.width} height={space.height} focus={focus} />
            <div data-after className="absolute inset-0">
              <CoverImage src={reality.asset.url} width={space.width} height={space.height} focus={focus} />
            </div>
            <Caption kicker="Realidad" title="Míralo antes de instalarlo." aspect={aspect} />
          </div>
        )}

        {/* COMPARE */}
        {reality && (
          <div data-frame="compare" className="absolute inset-0">
            <CoverImage src={space.asset.url} width={space.width} height={space.height} focus={focus} />
            <div data-after className="absolute inset-0">
              <CoverImage src={reality.asset.url} width={space.width} height={space.height} focus={focus} />
            </div>
            <div data-line className="absolute top-0 bottom-0 w-px bg-white/90" style={{ left: "0%" }} />
            <span className="absolute t-label-strong bg-white/90 rounded-full px-[calc(var(--u)*1.2)] py-[calc(var(--u)*0.5)] shadow-sm" style={{ top: "calc(var(--u) * 3)", left: "calc(var(--u) * 3)", fontSize: "calc(var(--u) * 1)" }}>
              Antes
            </span>
            <span className="absolute t-label-strong bg-white/90 rounded-full px-[calc(var(--u)*1.2)] py-[calc(var(--u)*0.5)] shadow-sm" style={{ top: "calc(var(--u) * 3)", right: "calc(var(--u) * 3)", fontSize: "calc(var(--u) * 1)" }}>
              Después
            </span>
          </div>
        )}

        {/* BRAND */}
        <div data-frame="brand" className="absolute inset-0 bg-stone flex flex-col items-center justify-center gap-[calc(var(--u)*5)]">
          <div data-caption className="t-editorial text-ink text-center" style={{ fontSize: `calc(var(--u) * ${aspect === "9:16" ? 7 : 5.6})` }}>
            Míralo antes
            <br />
            de instalarlo.
          </div>
          <div className={`flex items-center ${aspect === "9:16" ? "flex-col gap-[calc(var(--u)*3)]" : "flex-row gap-[calc(var(--u)*4)]"}`}>
            {(prospect || presentation.prospectLogo) && (
              <>
                <div data-caption className="flex items-center justify-center">
                  {presentation.prospectLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={presentation.prospectLogo.url} alt="" style={{ maxHeight: "calc(var(--u) * 10)", maxWidth: "calc(var(--u) * 30)" }} className="object-contain" />
                  ) : (
                    <span className="t-editorial text-ink" style={{ fontSize: "calc(var(--u) * 2.6)" }}>
                      {prospect}
                    </span>
                  )}
                </div>
                <div data-caption className="text-muted" style={{ fontSize: "calc(var(--u) * 1.8)" }}>
                  ×
                </div>
              </>
            )}
            <div data-caption className="text-ink" style={{ fontSize: "calc(var(--u) * 1.6)", letterSpacing: "0.38em" }}>
              VISUALCLOSE
            </div>
          </div>
        </div>

        {/* Progress hairline */}
        <div className="absolute bottom-0 left-0 h-[3px] bg-accent pointer-events-none" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

function Caption({ kicker, title, sub, aspect }: { kicker: string; title: string; sub?: string; aspect: PresentAspect }) {
  return (
    <div
      className="absolute left-0 right-0 bottom-0 pointer-events-none"
      style={{
        paddingLeft: `calc(var(--u) * ${aspect === "9:16" ? 4 : 3.2})`,
        paddingRight: `calc(var(--u) * ${aspect === "9:16" ? 4 : 3.2})`,
        paddingBottom: `calc(var(--u) * ${aspect === "9:16" ? 4 : 3.2})`,
        paddingTop: "calc(var(--u) * 10)",
        background: "linear-gradient(to top, rgba(13,13,13,0.85), rgba(13,13,13,0.35) 55%, transparent)",
      }}
    >
      <div data-caption className="text-[11px] tracking-[0.14em] uppercase text-white/75 font-medium" style={{ fontSize: "calc(var(--u) * 1)" }}>
        {kicker}
      </div>
      <div data-caption className="t-editorial text-white" style={{ fontSize: `calc(var(--u) * ${aspect === "9:16" ? 3.6 : 3})`, marginTop: "calc(var(--u) * 0.8)" }}>
        {title}
      </div>
      {sub && (
        <div data-caption className="text-white/75" style={{ fontSize: "calc(var(--u) * 1.05)", marginTop: "calc(var(--u) * 0.8)", letterSpacing: "0.04em" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
