import type { ProductPack } from "../types/product-pack";

export const milanoXPergola: ProductPack = {
  id: "pack_milano_x",
  name: "Pérgola Milano X",
  category: "OUTDOOR_STRUCTURE",
  tagline: "Pérgola bioclimática de aluminio con techo de lamas retráctiles",
  references: [
    { id: "ref_mx_front", type: "front", asset: { id: "asset_mx_front", kind: "url", url: "/demo/pergola/ref-front.jpg", name: "milano-x-frontal.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_mx_side", type: "side", asset: { id: "asset_mx_side", kind: "url", url: "/demo/pergola/ref-side.jpg", name: "milano-x-lateral.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_mx_detail", type: "detail", asset: { id: "asset_mx_detail", kind: "url", url: "/demo/pergola/ref-detail.jpg", name: "milano-x-detalle.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_mx_material", type: "material", asset: { id: "asset_mx_material", kind: "url", url: "/demo/pergola/ref-material.jpg", name: "milano-x-material.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
  ],
  dimensions: { width: 5, depth: 4, height: 2.7, units: "m" },
  color: "Negro mate · RAL 9005",
  material: "Aluminio extruido",
  finish: "Lacado en polvo, mate",
  installationType: "Independiente, cuatro postes sobre terraza pavimentada",
  customSpecifications: [
    { label: "Techo", value: "Lamas retráctiles, 0–120°" },
    { label: "Postes", value: "140 × 140 mm" },
    { label: "Drenaje", value: "Integrado en los postes" },
    { label: "Opciones", value: "LED perimetral, paneles laterales" },
  ],
  placementType: "FREESTANDING_STRUCTURE",
  notes: "Muestra: primer Product Pack de demostración. Los dibujos de referencia son ilustrativos, no fotografías.",
  productDNA: null,
  demoOutputs: {
    // Arte ilustrativo solo para la salida secundaria ARQUITECTURA. REALIDAD nunca se pre-renderiza.
    archviz: "/demo/pergola/archviz.jpg",
  },
};
