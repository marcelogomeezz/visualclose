import type { AssetRef } from "./assets";

export type Units = "m" | "cm" | "mm" | "ft" | "in";

export const PLACEMENT_TYPES = [
  "FREESTANDING_STRUCTURE",
  "WALL_ATTACHED_STRUCTURE",
  "FLOOR_OBJECT",
  "WALL_SURFACE",
  "FLOOR_SURFACE",
  "OBJECT_REPLACEMENT",
  "ROOM_TRANSFORMATION",
  "CUSTOM",
] as const;
export type PlacementType = (typeof PLACEMENT_TYPES)[number];

export const PLACEMENT_TYPE_LABELS: Record<PlacementType, string> = {
  FREESTANDING_STRUCTURE: "Freestanding structure",
  WALL_ATTACHED_STRUCTURE: "Wall-attached structure",
  FLOOR_OBJECT: "Floor object",
  WALL_SURFACE: "Wall surface",
  FLOOR_SURFACE: "Floor surface",
  OBJECT_REPLACEMENT: "Object replacement",
  ROOM_TRANSFORMATION: "Room transformation",
  CUSTOM: "Custom",
};

export const REFERENCE_TYPES = [
  "front",
  "side",
  "rear",
  "detail",
  "installed",
  "material",
  "other",
] as const;
export type ReferenceType = (typeof REFERENCE_TYPES)[number];

export const PRODUCT_CATEGORIES = [
  "OUTDOOR_STRUCTURE",
  "INTERIOR_INSTALLATION",
  "SURFACE_TRANSFORMATION",
  "STANDALONE_PRODUCT",
  "POOL_AND_WATER",
  "OPENINGS",
  "LANDSCAPE",
  "COMMERCIAL",
  "OTHER",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  OUTDOOR_STRUCTURE: "Outdoor structure",
  INTERIOR_INSTALLATION: "Interior installation",
  SURFACE_TRANSFORMATION: "Surface transformation",
  STANDALONE_PRODUCT: "Standalone product",
  POOL_AND_WATER: "Pool & water",
  OPENINGS: "Windows & doors",
  LANDSCAPE: "Landscape",
  COMMERCIAL: "Commercial",
  OTHER: "Other",
};

export interface Dimensions {
  width: number;
  depth: number;
  height: number;
  units: Units;
}

export interface ProductReference {
  id: string;
  type: ReferenceType;
  asset: AssetRef;
}

export interface CustomSpecification {
  label: string;
  value: string;
}

/** Structured understanding of a product. Not a trained model. */
export interface ProductDNA {
  summary: string;
  distinctiveFeatures: string[];
  structuralComponents: string[];
  materials: string[];
  colors: string[];
  /** Components that must not change in any visualization. */
  invariants: string[];
  fidelityRules: string[];
  renderingConstraints: string[];
  createdAt: number;
  provenance: Provenance;
}

export interface Provenance {
  provider: "mock" | "openai" | "higgsfield" | "local";
  model?: string;
  note?: string;
}

export interface ProductPack {
  id: string;
  name: string;
  category: ProductCategory;
  tagline?: string;
  references: ProductReference[];
  /** Default physical dimensions. The project keeps its own editable copy. */
  dimensions: Dimensions;
  color: string;
  material: string;
  finish: string;
  installationType: string;
  customSpecifications: CustomSpecification[];
  placementType: PlacementType;
  notes: string;
  /** Future AI Product DNA. Null until LEARN PRODUCT runs. */
  productDNA: ProductDNA | null;
  /** Placeholder outputs used by the mock generation provider. */
  demoOutputs?: {
    reality?: string;
    archviz?: string;
  };
}
