"use client";

import { useEffect, useState } from "react";
import { actions, useProject } from "@/state/project-store";
import { usePlacementSolve } from "@/state/derived";
import { ui, useUI } from "@/state/ui-store";
import { Button } from "@/components/ui/Button";
import { Row } from "@/components/ui/Section";
import { Sheet } from "./Sheet";

export function DevSheet() {
  const project = useProject();
  const solve = usePlacementSolve();
  const mode = useUI((s) => s.mode);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      frames += 1;
      if (t - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!project) return null;
  const dehydrated = { ...project, outputs: project.outputs.map((o) => ({ ...o, asset: { ...o.asset, url: o.asset.kind === "blob" ? "blob:…" : o.asset.url }, thumbnail: { ...o.thumbnail, url: "…" } })) };
  return (
    <Sheet title="Dev" width={600}>
      <div className="px-5 py-4 hairline-b">
        <Row label="Frame rate">
          <span className="t-mono">{fps} fps</span>
        </Row>
        <Row label="Mode">{mode}</Row>
        <Row label="Revision">
          <span className="t-mono">{project.revision}</span>
        </Row>
        <Row label="AI provider">mock (server)</Row>
        <Row label="Generation provider">mock (server)</Row>
        <Row label="Camera solve">
          <span className="t-mono">
            {solve ? `${project.placement.lens.source} · fov ${solve.fovDeg.toFixed(1)}° · consistency ${solve.consistency.toFixed(3)}` : "none"}
          </span>
        </Row>
        {solve && (
          <Row label="Camera position">
            <span className="t-mono">{solve.position.map((v) => v.toFixed(2)).join(", ")}</span>
          </Row>
        )}
      </div>
      <div className="px-5 py-4 hairline-b flex gap-2">
        <Button variant="outline" size="sm" onClick={() => void actions.resetEverything().then(() => ui.toast("Local data cleared"))}>
          Clear local data
        </Button>
        <Button variant="outline" size="sm" onClick={() => actions.loadDemoProject()}>
          Reload demo
        </Button>
      </div>
      <pre className="px-5 py-4 t-mono text-[10.5px] text-warm-grey whitespace-pre-wrap break-all leading-relaxed">{JSON.stringify(dehydrated, null, 2)}</pre>
    </Sheet>
  );
}
