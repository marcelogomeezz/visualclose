import type { ProductPack } from "../types/product-pack";

export const formaLounge: ProductPack = {
  id: "pack_forma_lounge",
  name: "Forma Outdoor Lounge",
  category: "STANDALONE_PRODUCT",
  tagline: "Low three-seat outdoor lounge in teak and sand acrylic",
  references: [
    { id: "ref_fl_front", type: "front", asset: { id: "asset_fl_front", kind: "url", url: "/demo/lounge/ref-front.jpg", name: "forma-front.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_fl_material", type: "material", asset: { id: "asset_fl_material", kind: "url", url: "/demo/lounge/ref-material.jpg", name: "forma-materials.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
  ],
  dimensions: { width: 2.4, depth: 0.95, height: 0.72, units: "m" },
  color: "Sand · natural teak",
  material: "Teak frame, quick-dry foam, outdoor acrylic",
  finish: "Oiled teak",
  installationType: "Freestanding floor object",
  customSpecifications: [
    { label: "Seats", value: "3" },
    { label: "Cushions", value: "Removable, weatherproof" },
  ],
  placementType: "FLOOR_OBJECT",
  notes: "Standalone product demo pack. PLACEHOLDER: reference drawings are synthetic, not photographs.",
  productDNA: null,
};
