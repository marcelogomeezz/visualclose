import type { AssetRef, NormalizedPoint } from "./assets";
import type { Dimensions, ProductDNA, ProductPack, Provenance } from "./product-pack";
import type { ReferenceMeasurement, SceneLock } from "./scene";

export interface SpaceAsset {
  asset: AssetRef;
  width: number;
  height: number;
}

export type AnchorKey = "FL" | "FR" | "BL" | "BR";
export const ANCHOR_KEYS: AnchorKey[] = ["FL", "FR", "BL", "BR"];

export type Footprint = Record<AnchorKey, NormalizedPoint>;

export interface Lens {
  /** Vertical field of view in degrees. Always explicit; estimation is an operator action, never live. */
  fovDeg: number;
  source: "estimated" | "manual" | "default";
}

export interface Placement {
  footprint: Footprint;
  wallAnchor: NormalizedPoint | null;
  /** Cumulative yaw applied to the footprint, informational. */
  rotationDeg: number;
  lens: Lens;
  locked: boolean;
  lockedAt: number | null;
}

/** Frozen snapshot created by LOCK PLACEMENT. Never derived from AI. */
export interface GeometryReference {
  id: string;
  revision: number;
  createdAt: number;
  spaceAssetId: string;
  productPackId: string;
  productName: string;
  dimensions: Dimensions;
  footprint: Footprint;
  wallAnchor: NormalizedPoint | null;
  rotationDeg: number;
  lens: Lens;
  referenceMeasurement: ReferenceMeasurement | null;
  solvedFovDeg: number | null;
}

export type OutputType = "ORIGINAL" | "TECHNICAL" | "REALITY" | "ARCHVIZ" | "MOTION";

export interface OutputSettings {
  productPackId: string;
  productName: string;
  dimensions: Dimensions;
  placementLocked: boolean;
  hadProductDNA: boolean;
  hadSceneLock: boolean;
  variant?: string;
}

export interface OutputRecord {
  id: string;
  type: OutputType;
  /** 1-based index within its type, for "REALITY 02". */
  index: number;
  sourceRevision: number;
  spaceAssetId: string | null;
  createdAt: number;
  thumbnail: AssetRef;
  asset: AssetRef;
  provenance: Provenance;
  settings: OutputSettings;
  favorite: boolean;
  /** True when the output shares the exact framing of the source photograph. */
  registered: boolean;
  /** Background preservation estimate for REALITY outputs, when it could be computed. */
  preservation?: PreservationReport;
}

/** How the editable region is derived from the placement volume. */
export interface MaskSettings {
  /** Extra room around the product for shadows, occlusion and contact, in source-image pixels. */
  paddingPx: number;
  /** Ground shadow reach as a fraction of the product height. */
  shadowReach: number;
}

/** Internal estimate of how much of the photograph outside the mask changed. Never a pixel-perfect guarantee. */
export interface PreservationReport {
  /** Share of pixels outside the mask whose colour moved beyond the tolerance. 0 = untouched. */
  outsideChangedRatio: number;
  /** Mean absolute colour difference outside the mask (0..255). */
  outsideMeanDiff: number;
  threshold: number;
  passed: boolean;
  note: string;
}

export type PresentAspect = "16:9" | "9:16" | "1:1";

export interface PresentationBranding {
  prospectName: string;
  prospectLogo: AssetRef | null;
  aspect: PresentAspect;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** Increments on every geometric or asset change. */
  revision: number;
  space: SpaceAsset | null;
  productPack: ProductPack;
  dimensions: Dimensions;
  referenceMeasurement: ReferenceMeasurement | null;
  placement: Placement;
  geometryReference: GeometryReference | null;
  /** Original photograph with a clean placement outline. An AI input, never a user-facing output. */
  placementReference: AssetRef | null;
  /** White-on-black editable region derived from the placement volume. An AI input. */
  placementMask: AssetRef | null;
  /** Revision the placement assets were generated from. */
  placementAssetsRevision: number | null;
  maskSettings: MaskSettings;
  sceneLock: SceneLock | null;
  productDNA: ProductDNA | null;
  outputs: OutputRecord[];
  presentation: PresentationBranding;
}

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
  productName: string;
  thumbnailUrl: string | null;
}
