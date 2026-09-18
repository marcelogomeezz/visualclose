import type { ProductPack } from "../types/product-pack";

export const milanoXPergola: ProductPack = {
  id: "pack_milano_x",
  name: "Milano X Pergola",
  category: "OUTDOOR_STRUCTURE",
  tagline: "Bioclimatic aluminium pergola with retractable louvered roof",
  references: [
    { id: "ref_mx_front", type: "front", asset: { id: "asset_mx_front", kind: "url", url: "/demo/pergola/ref-front.jpg", name: "milano-x-front.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_mx_side", type: "side", asset: { id: "asset_mx_side", kind: "url", url: "/demo/pergola/ref-side.jpg", name: "milano-x-side.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_mx_detail", type: "detail", asset: { id: "asset_mx_detail", kind: "url", url: "/demo/pergola/ref-detail.jpg", name: "milano-x-detail.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_mx_material", type: "material", asset: { id: "asset_mx_material", kind: "url", url: "/demo/pergola/ref-material.jpg", name: "milano-x-material.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
  ],
  dimensions: { width: 5, depth: 4, height: 2.7, units: "m" },
  color: "Matte black · RAL 9005",
  material: "Extruded aluminium",
  finish: "Powder coated, matte",
  installationType: "Freestanding, four posts on paved terrace",
  customSpecifications: [
    { label: "Roof", value: "Retractable louvered blades, 0–120°" },
    { label: "Posts", value: "140 × 140 mm" },
    { label: "Drainage", value: "Integrated in posts" },
    { label: "Options", value: "Perimeter LED, side screens" },
  ],
  placementType: "FREESTANDING_STRUCTURE",
  notes: "PLACEHOLDER: first demo Product Pack. Reference drawings are synthetic, not photographs.",
  productDNA: null,
  demoOutputs: {
    // PLACEHOLDER synthetic art for the secondary ARQUITECTURA output only. REALIDAD is never pre-rendered.
    archviz: "/demo/pergola/archviz.jpg",
  },
};
