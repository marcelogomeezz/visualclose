import type { NormalizedPoint } from "./assets";
import type { Provenance } from "./product-pack";

/** What must stay real when the environment is visualized. */
export interface SceneLock {
  preserve: {
    architecture: string[];
    doors: string[];
    windows: string[];
    floor: string;
    walls: string[];
    landscaping: string[];
    background: string;
    importantObjects: string[];
  };
  installationRegion: {
    description: string;
    /** Optional normalized region of the photograph. */
    rect?: { x: number; y: number; w: number; h: number };
  };
  obstructions: string[];
  lighting: string;
  createdAt: number;
  provenance: Provenance;
}

/**
 * What the REALITY edit may and may not touch. The photograph outside the placement mask is never
 * an editable region; these rules travel with every generation request.
 */
export interface ScenePreservationRules {
  /** Elements that must remain identical (from the scene analysis when available). */
  preserve: string[];
  /** The only region where pixels may change. */
  editableRegion: "placement-mask";
  /** Contact effects the edit is allowed to add inside the mask. */
  allowedContactEffects: ("shadows" | "reflections" | "occlusion" | "contact" | "lighting")[];
  notes: string[];
}

export interface ReferenceMeasurement {
  a: NormalizedPoint;
  b: NormalizedPoint;
  distance: number;
  units: "m" | "cm" | "mm" | "ft" | "in";
  label?: string;
}
