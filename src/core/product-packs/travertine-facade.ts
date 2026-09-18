import type { ProductPack } from "../types/product-pack";

export const travertineFacade: ProductPack = {
  id: "pack_travertine_facade",
  name: "Travertine Facade System",
  category: "SURFACE_TRANSFORMATION",
  tagline: "Ventilated stone cladding for existing facades",
  references: [
    { id: "ref_tf_front", type: "front", asset: { id: "asset_tf_front", kind: "url", url: "/demo/facade/ref-front.jpg", name: "travertine-pattern.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_tf_detail", type: "detail", asset: { id: "asset_tf_detail", kind: "url", url: "/demo/facade/ref-detail.jpg", name: "travertine-section.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
  ],
  dimensions: { width: 9, depth: 0.12, height: 3.2, units: "m" },
  color: "Classic travertine · warm beige",
  material: "Natural travertine, 30 mm panels",
  finish: "Honed, filled",
  installationType: "Ventilated facade on aluminium sub-frame",
  customSpecifications: [
    { label: "Panel", value: "1200 × 800 mm, staggered" },
    { label: "Joint", value: "6 mm open" },
    { label: "Cavity", value: "40 mm ventilated" },
  ],
  placementType: "WALL_SURFACE",
  notes: "Surface transformation demo pack. PLACEHOLDER: reference drawings are synthetic, not photographs.",
  productDNA: null,
};
