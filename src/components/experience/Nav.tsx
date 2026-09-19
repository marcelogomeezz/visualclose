"use client";

import { useEffect, useState } from "react";
import { useCurtainNavigate } from "./TransitionCurtain";

export function Nav() {
  const go = useCurtainNavigate();
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const link = (label: string, href: string) => (
    <a href={href} className="text-[13px] text-ink-2 hover:text-ink transition-colors">
      {label}
    </a>
  );
  return (
    <nav className={`fixed top-0 inset-x-0 z-50 h-16 px-5 md:px-8 flex items-center justify-between transition-all duration-300 ${solid ? "bg-paper/90 backdrop-blur-sm hairline-b" : ""}`}>
      <a href="#top" className="text-[15px] tracking-[0.22em] text-ink font-semibold select-none">
        VISUALCLOSE
      </a>
      <div className="hidden md:flex items-center gap-9">
        {link("Cómo funciona", "#como-funciona")}
        {link("Aplicaciones", "#aplicaciones")}
        {link("Plano real", "#plano-real")}
        {link("Nosotros", "#nosotros")}
      </div>
      <button
        type="button"
        onClick={() => go("/studio")}
        className="h-10 px-5 rounded-full text-[13px] font-medium text-white bg-ink hover:bg-ink-2 transition-colors inline-flex items-center gap-1.5"
      >
        Probar VisualClose <span aria-hidden>→</span>
      </button>
    </nav>
  );
}
