import type { ProductPack } from "../types/product-pack";
import { milanoXPergola } from "./milano-x-pergola";
import { lineaKitchen } from "./linea-kitchen";
import { travertineFacade } from "./travertine-facade";
import { formaLounge } from "./forma-lounge";

/** Registry of demo Product Packs. Adding a category is adding a file here. */
export const DEMO_PRODUCT_PACKS: ProductPack[] = [milanoXPergola, lineaKitchen, travertineFacade, formaLounge];

export function getProductPack(id: string): ProductPack | undefined {
  return DEMO_PRODUCT_PACKS.find((p) => p.id === id);
}

export function clonePack(pack: ProductPack): ProductPack {
  return structuredClone(pack);
}

/** A blank pack for new projects: the user brings their own product. */
export function createCustomPack(): ProductPack {
  return {
    id: `pack_custom_${Math.random().toString(36).slice(2, 8)}`,
    name: "Mi producto",
    category: "OTHER",
    references: [],
    dimensions: { width: 2, depth: 1, height: 1, units: "m" },
    color: "",
    material: "",
    finish: "",
    installationType: "",
    customSpecifications: [],
    placementType: "FLOOR_OBJECT",
    notes: "",
    productDNA: null,
  };
}

export { milanoXPergola, lineaKitchen, travertineFacade, formaLounge };
