"use client";

import { useUI } from "@/state/ui-store";
import { DimensionsPanel, IntelligencePanel, MeasurementPanel, OutputPanel, PlacementPanel, ProductPanel, ReadinessPanel, SpacePanel, TechnicalPanel } from "./panels";

/** Contextual controls. The mode decides what matters; nothing else is shown. */
export function Inspector() {
  const mode = useUI((s) => s.mode);
  return (
    <aside className="hairline-l bg-graphite-1 overflow-y-auto vc-scroll min-h-0">
      {mode === "ORIGINAL" && (
        <>
          <SpacePanel />
          <MeasurementPanel />
          <IntelligencePanel />
          <ProductPanel />
        </>
      )}
      {mode === "FIT" && (
        <>
          <DimensionsPanel />
          <PlacementPanel />
          <MeasurementPanel />
        </>
      )}
      {mode === "TECHNICAL" && (
        <>
          <TechnicalPanel />
          <DimensionsPanel />
          <ProductPanel editable={false} />
        </>
      )}
      {(mode === "REALITY" || mode === "ARCHVIZ") && (
        <>
          <OutputPanel />
          <ReadinessPanel />
          <IntelligencePanel />
          <ProductPanel />
        </>
      )}
      {mode === "MOTION" && (
        <div className="px-4 py-4">
          <div className="t-label mb-2">Motion</div>
          <div className="text-[11.5px] text-warm-grey leading-snug">
            Experimental. The MOTION slot is reserved for video generation through the Higgsfield adapter. Settings will appear here when the provider is connected.
          </div>
        </div>
      )}
    </aside>
  );
}
