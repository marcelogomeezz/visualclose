import { createStore, useStore } from "./store";
import type { PresentAspect } from "@/core/types";

export type ViewMode = "ORIGINAL" | "FIT" | "TECHNICAL" | "REALITY" | "ARCHVIZ" | "MOTION";
export const VIEW_MODES: ViewMode[] = ["ORIGINAL", "FIT", "TECHNICAL", "REALITY", "ARCHVIZ", "MOTION"];

/** Normal Studio labels (Spanish). Internal mode names stay English for persistence and code. */
export const MODE_LABELS: Record<ViewMode, string> = {
  ORIGINAL: "ORIGINAL",
  FIT: "AJUSTAR",
  TECHNICAL: "REAL PLAN",
  REALITY: "REALIDAD",
  ARCHVIZ: "ARQUITECTURA",
  MOTION: "MOVIMIENTO",
};

export const MODE_COPY: Record<ViewMode, string> = {
  ORIGINAL: "Tu espacio, tal cual es.",
  FIT: "Coloca el producto en el espacio.",
  TECHNICAL: "La foto real con medidas y colocación.",
  REALITY: "El producto integrado en tu espacio.",
  ARCHVIZ: "Presentación arquitectónica.",
  MOTION: "Próximamente.",
};

export type PickTool = null | "measure-a" | "measure-b" | "wall-anchor";
export type AdjustTool = "move" | "rotate" | "size";
export type OutputChoice = "REALITY" | "ARCHVIZ";

export interface Viewport {
  zoom: number;
  x: number;
  y: number;
}

export interface GenerationStatus {
  mode: "REALITY" | "ARCHVIZ";
  startedAt: number;
  phase: string;
}

export interface UIState {
  mode: ViewMode;
  selectedOutputId: string | null;
  compare: boolean;
  comparePosition: number;
  viewport: Viewport;
  pickTool: PickTool;
  generating: GenerationStatus | null;
  intelligence: { learning: boolean; analyzing: boolean };
  sheet: null | "projects" | "advanced" | "menu";
  present: { active: boolean; aspect: PresentAspect };
  toast: { id: number; text: string } | null;
  spaceDragOver: boolean;
  /** Sticker-style placement tool while in FIT. */
  adjustTool: AdjustTool;
  /** Shows the four-anchor perspective editor, lens and reference measurement inside FIT. */
  advancedAdjust: boolean;
  /** Which output VISUALIZAR produces. REALIDAD by default. */
  outputChoice: OutputChoice;
  optionsOpen: boolean;
}

export const uiStore = createStore<UIState>({
  mode: "ORIGINAL",
  selectedOutputId: null,
  compare: false,
  comparePosition: 0.5,
  viewport: { zoom: 1, x: 0, y: 0 },
  pickTool: null,
  generating: null,
  intelligence: { learning: false, analyzing: false },
  sheet: null,
  present: { active: false, aspect: "16:9" },
  toast: null,
  spaceDragOver: false,
  adjustTool: "move",
  advancedAdjust: false,
  outputChoice: "REALITY",
  optionsOpen: false,
});

export function useUI<S>(selector: (s: UIState) => S): S {
  return useStore(uiStore, selector);
}

let toastId = 0;

export const ui = {
  setMode(mode: ViewMode) {
    uiStore.setState((s) => ({ ...s, mode, compare: mode === s.mode ? s.compare : false, pickTool: null }));
  },
  selectOutput(id: string | null) {
    uiStore.setState({ selectedOutputId: id });
  },
  setCompare(compare: boolean) {
    uiStore.setState({ compare, comparePosition: 0.5 });
  },
  setComparePosition(comparePosition: number) {
    uiStore.setState({ comparePosition });
  },
  setViewport(viewport: Viewport) {
    uiStore.setState({ viewport });
  },
  resetViewport() {
    uiStore.setState({ viewport: { zoom: 1, x: 0, y: 0 } });
  },
  setPickTool(pickTool: PickTool) {
    uiStore.setState({ pickTool });
  },
  setGenerating(generating: GenerationStatus | null) {
    uiStore.setState({ generating });
  },
  setGenerationPhase(phase: string) {
    uiStore.setState((s) => (s.generating ? { ...s, generating: { ...s.generating, phase } } : s));
  },
  setIntelligence(partial: Partial<UIState["intelligence"]>) {
    uiStore.setState((s) => ({ ...s, intelligence: { ...s.intelligence, ...partial } }));
  },
  openSheet(sheet: UIState["sheet"]) {
    uiStore.setState((s) => ({ ...s, sheet: s.sheet === sheet ? null : sheet }));
  },
  closeSheet() {
    uiStore.setState({ sheet: null });
  },
  enterPresent(aspect?: PresentAspect) {
    uiStore.setState((s) => ({ ...s, sheet: null, present: { active: true, aspect: aspect ?? s.present.aspect } }));
  },
  exitPresent() {
    uiStore.setState((s) => ({ ...s, present: { ...s.present, active: false } }));
  },
  setPresentAspect(aspect: PresentAspect) {
    uiStore.setState((s) => ({ ...s, present: { ...s.present, aspect } }));
  },
  toast(text: string) {
    toastId += 1;
    const id = toastId;
    uiStore.setState({ toast: { id, text } });
    setTimeout(() => {
      uiStore.setState((s) => (s.toast?.id === id ? { ...s, toast: null } : s));
    }, 2600);
  },
  setSpaceDragOver(spaceDragOver: boolean) {
    uiStore.setState({ spaceDragOver });
  },
  setAdjustTool(adjustTool: AdjustTool) {
    uiStore.setState({ adjustTool });
  },
  setAdvancedAdjust(advancedAdjust: boolean) {
    uiStore.setState({ advancedAdjust, pickTool: null });
  },
  setOutputChoice(outputChoice: OutputChoice) {
    uiStore.setState({ outputChoice, optionsOpen: false });
  },
  setOptionsOpen(optionsOpen: boolean) {
    uiStore.setState({ optionsOpen });
  },
};
