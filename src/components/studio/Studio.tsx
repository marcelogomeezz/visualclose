"use client";

import { useEffect } from "react";
import { actions, useProjectState } from "@/state/project-store";
import { ui, useUI } from "@/state/ui-store";
import { useAutoAnalysis } from "@/state/auto-analysis";
import { TopBar } from "./TopBar";
import { InputRail } from "./rail/InputRail";
import { StudioCanvas } from "./canvas/StudioCanvas";
import { OutputBar } from "./outputs/OutputBar";
import { ProjectsSheet } from "./sheets/ProjectsSheet";
import { AdvancedSheet } from "./sheets/AdvancedSheet";
import { PresentMode } from "@/components/present/PresentMode";
import { Toast } from "./Toast";
import { transition, transitionStore } from "@/state/transition-store";

/** The Studio: three inputs, one action, one big canvas. Everything technical lives behind Avanzado. */
export function Studio() {
  const ready = useProjectState((s) => s.ready);
  const project = useProjectState((s) => s.project);
  const present = useUI((s) => s.present.active);
  const sheet = useUI((s) => s.sheet);

  useEffect(() => {
    void actions.boot();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (transitionStore.getState().phase !== "idle") {
      const t = setTimeout(() => transition.reveal(), 250);
      return () => clearTimeout(t);
    }
  }, [ready]);

  useAutoAnalysis();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (present) ui.exitPresent();
        else if (sheet) ui.closeSheet();
        else {
          ui.setPickTool(null);
          ui.setOptionsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, sheet]);

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-graphite-1">
        <span className="t-label-strong tracking-[0.3em]">VISUALCLOSE</span>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-graphite-1 text-ivory vc-fade-in overflow-hidden"
      data-test-footprint={project ? JSON.stringify(project.placement.footprint) : undefined}
      data-test-dimensions={project ? JSON.stringify(project.dimensions) : undefined}
    >
      {!present && (
        <div className="h-full grid grid-rows-[52px_minmax(0,1fr)_auto] md:grid-rows-[52px_minmax(0,1fr)_64px] grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)]">
          <div className="md:col-span-2">
            <TopBar />
          </div>
          <div className="order-2 md:order-1 min-h-0 overflow-y-auto vc-scroll">
            <InputRail />
          </div>
          <div className="order-1 md:order-2 min-h-[56vh] md:min-h-0">
            <StudioCanvas />
          </div>
          <div className="order-3 md:col-span-2">
            <OutputBar />
          </div>
        </div>
      )}
      {sheet === "projects" && <ProjectsSheet />}
      {sheet === "advanced" && <AdvancedSheet />}
      {present && <PresentMode />}
      <Toast />
    </div>
  );
}
