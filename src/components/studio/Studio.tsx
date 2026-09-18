"use client";

import { useEffect } from "react";
import { actions, useProjectState } from "@/state/project-store";
import { ui, useUI } from "@/state/ui-store";
import { TopBar } from "./TopBar";
import { AssetDock } from "./dock/AssetDock";
import { StudioCanvas } from "./canvas/StudioCanvas";
import { Inspector } from "./inspector/Inspector";
import { OutputStrip } from "./outputs/OutputStrip";
import { ProjectsSheet } from "./sheets/ProjectsSheet";
import { DevSheet } from "./sheets/DevSheet";
import { PresentMode } from "@/components/present/PresentMode";
import { Toast } from "./Toast";

export function Studio() {
  const ready = useProjectState((s) => s.ready);
  const present = useUI((s) => s.present.active);
  const sheet = useUI((s) => s.sheet);

  useEffect(() => {
    void actions.boot();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (present) ui.exitPresent();
        else if (sheet) ui.closeSheet();
        else ui.setPickTool(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, sheet]);

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center bg-graphite-1">
        <span className="t-label-strong tracking-[0.3em]">VISUALCLOSE</span>
      </div>
    );
  }

  return (
    <div className="h-full bg-graphite-1 text-ivory">
      {!present && (
        <div className="h-full grid grid-rows-[46px_minmax(0,1fr)_118px] grid-cols-[264px_minmax(0,1fr)_304px]">
          <div className="col-span-3">
            <TopBar />
          </div>
          <AssetDock />
          <StudioCanvas />
          <Inspector />
          <div className="col-span-3">
            <OutputStrip />
          </div>
        </div>
      )}
      {sheet === "projects" && <ProjectsSheet />}
      {sheet === "dev" && <DevSheet />}
      {present && <PresentMode />}
      <Toast />
    </div>
  );
}
