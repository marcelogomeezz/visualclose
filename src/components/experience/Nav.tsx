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
    <a href={href} className="text-[10.5px] tracking-[0.18em] uppercase text-warm-grey hover:text-ivory transition-colors">
      {label}
    </a>
  );
  return (
    <nav className={`fixed top-0 inset-x-0 z-50 h-14 px-5 md:px-8 flex items-center justify-between transition-colors duration-300 ${solid ? "bg-graphite-0/85 backdrop-blur-sm hairline-b" : ""}`}>
      <a href="#top" className="text-[11px] tracking-[0.32em] text-ivory font-medium">
        VISUALCLOSE
      </a>
      <div className="hidden md:flex items-center gap-8">
        {link("How it works", "#how")}
        {link("Use cases", "#use-cases")}
        {link("About", "#about")}
      </div>
      <button
        type="button"
        onClick={() => go("/studio")}
        className="h-9 px-4 text-[10.5px] tracking-[0.18em] uppercase font-medium text-graphite-0 bg-ivory hover:bg-offwhite transition-colors"
      >
        Try VisualClose →
      </button>
    </nav>
  );
}
