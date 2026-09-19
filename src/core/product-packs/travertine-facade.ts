import type { ProductPack } from "../types/product-pack";

export const travertineFacade: ProductPack = {
  id: "pack_travertine_facade",
  name: "Sistema de Fachada Travertino",
  category: "SURFACE_TRANSFORMATION",
  tagline: "Revestimiento pétreo ventilado para fachadas existentes",
  references: [
    { id: "ref_tf_front", type: "front", asset: { id: "asset_tf_front", kind: "url", url: "/demo/facade/ref-front.jpg", name: "travertino-patron.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
    { id: "ref_tf_detail", type: "detail", asset: { id: "asset_tf_detail", kind: "url", url: "/demo/facade/ref-detail.jpg", name: "travertino-seccion.jpg", mime: "image/jpeg", width: 1600, height: 1200 } },
  ],
  dimensions: { width: 9, depth: 0.12, height: 3.2, units: "m" },
  color: "Travertino clásico · beige cálido",
  material: "Travertino natural, paneles de 30 mm",
  finish: "Abujardado, relleno",
  installationType: "Fachada ventilada sobre subestructura de aluminio",
  customSpecifications: [
    { label: "Panel", value: "1200 × 800 mm, a matajunta" },
    { label: "Junta", value: "6 mm abierta" },
    { label: "Cámara", value: "40 mm ventilada" },
  ],
  placementType: "WALL_SURFACE",
  notes: "Muestra de transformación de superficie. Los dibujos de referencia son ilustrativos, no fotografías.",
  productDNA: null,
};
