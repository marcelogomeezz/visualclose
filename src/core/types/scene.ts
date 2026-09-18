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

export interface ReferenceMeasurement {
  a: NormalizedPoint;
  b: NormalizedPoint;
  distance: number;
  units: "m" | "cm" | "mm" | "ft" | "in";
  label?: string;
}
