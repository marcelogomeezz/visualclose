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
  FREESTANDING_STRUCTURE: "Estructura independiente",
  WALL_ATTACHED_STRUCTURE: "Estructura anclada a pared",
  FLOOR_OBJECT: "Objeto de suelo",
  WALL_SURFACE: "Revestimiento de pared",
  FLOOR_SURFACE: "Revestimiento de suelo",
  OBJECT_REPLACEMENT: "Sustitución de objeto",
  ROOM_TRANSFORMATION: "Transformación de estancia",
  CUSTOM: "Personalizado",
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
  OUTDOOR_STRUCTURE: "Estructura exterior",
  INTERIOR_INSTALLATION: "Instalación interior",
  SURFACE_TRANSFORMATION: "Transformación de superficie",
  STANDALONE_PRODUCT: "Producto independiente",
  POOL_AND_WATER: "Piscina y agua",
  OPENINGS: "Ventanas y puertas",
  LANDSCAPE: "Paisajismo",
  COMMERCIAL: "Comercial",
  OTHER: "Otro",
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
  /** PLACEHOLDER art for the secondary ARQUITECTURA mock only. REALIDAD is always an edit of the original photograph. */
  demoOutputs?: {
    archviz?: string;
  };
}
