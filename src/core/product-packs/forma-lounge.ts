import type { ProductPack } from "../types/product-pack";

export const formaLounge: ProductPack = {
  id: "pack_forma_lounge",
  name: "Lounge Exterior Forma",
  category: "STANDALONE_PRODUCT",
  tagline: "Sofá lounge bajo de tres plazas en teca y acrílico color arena",
  references: [
    { id: "ref_fl_front", type: "front", asset: { id: "asset_fl_front", kind: "url", url: "/demo/lounge/ref-front.jpg", name: "forma-frontal.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_fl_material", type: "material", asset: { id: "asset_fl_material", kind: "url", url: "/demo/lounge/ref-material.jpg", name: "forma-materiales.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
  ],
  dimensions: { width: 2.4, depth: 0.95, height: 0.72, units: "m" },
  color: "Arena · teca natural",
  material: "Estructura de teca, espuma de secado rápido, acrílico para exterior",
  finish: "Teca aceitada",
  installationType: "Objeto independiente sobre el suelo",
  customSpecifications: [
    { label: "Plazas", value: "3" },
    { label: "Cojines", value: "Desenfundables, resistentes a la intemperie" },
  ],
  placementType: "FLOOR_OBJECT",
  notes: "Muestra de producto independiente. Los dibujos de referencia son ilustrativos, no fotografías.",
  productDNA: null,
};
