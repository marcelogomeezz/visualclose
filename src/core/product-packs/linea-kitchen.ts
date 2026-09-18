import type { ProductPack } from "../types/product-pack";

export const lineaKitchen: ProductPack = {
  id: "pack_linea_kitchen",
  name: "Linea Kitchen System",
  category: "INTERIOR_INSTALLATION",
  tagline: "Wall-run kitchen system with oak uppers and graphite base units",
  references: [
    { id: "ref_lk_front", type: "front", asset: { id: "asset_lk_front", kind: "url", url: "/demo/kitchen/ref-front.jpg", name: "linea-front.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_lk_material", type: "material", asset: { id: "asset_lk_material", kind: "url", url: "/demo/kitchen/ref-material.jpg", name: "linea-materials.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
  ],
  dimensions: { width: 4.2, depth: 0.65, height: 2.4, units: "m" },
  color: "Natural oak · graphite",
  material: "Oak veneer, lacquered MDF, honed limestone",
  finish: "Matte lacquer, oiled veneer",
  installationType: "Wall-attached run against existing wall",
  customSpecifications: [
    { label: "Worktop", value: "Honed limestone, 30 mm" },
    { label: "Handles", value: "Integrated groove" },
    { label: "Appliances", value: "Integrated, panel-ready" },
  ],
  placementType: "WALL_ATTACHED_STRUCTURE",
  notes: "Interior installation demo pack. Assets are placeholders.",
  productDNA: null,
};
