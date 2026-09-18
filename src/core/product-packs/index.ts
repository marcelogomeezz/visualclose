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

export { milanoXPergola, lineaKitchen, travertineFacade, formaLounge };
