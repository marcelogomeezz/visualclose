import type { ProductPack } from "../types/product-pack";

export const lineaKitchen: ProductPack = {
  id: "pack_linea_kitchen",
  name: "Sistema de Cocina Linea",
  category: "INTERIOR_INSTALLATION",
  tagline: "Cocina lineal en pared con muebles altos de roble y base grafito",
  references: [
    { id: "ref_lk_front", type: "front", asset: { id: "asset_lk_front", kind: "url", url: "/demo/kitchen/ref-front.jpg", name: "linea-frontal.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_lk_material", type: "material", asset: { id: "asset_lk_material", kind: "url", url: "/demo/kitchen/ref-material.jpg", name: "linea-materiales.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
  ],
  dimensions: { width: 4.2, depth: 0.65, height: 2.4, units: "m" },
  color: "Roble natural · grafito",
  material: "Chapa de roble, MDF lacado, piedra caliza abujardada",
  finish: "Lacado mate, chapa aceitada",
  installationType: "Módulo en pared, adosado a pared existente",
  customSpecifications: [
    { label: "Encimera", value: "Piedra caliza abujardada, 30 mm" },
    { label: "Tiradores", value: "Uña integrada" },
    { label: "Electrodomésticos", value: "Integrados, preparados para panelar" },
  ],
  placementType: "WALL_ATTACHED_STRUCTURE",
  notes: "Muestra de instalación interior. Los dibujos de referencia son ilustrativos, no fotografías.",
  productDNA: null,
};
