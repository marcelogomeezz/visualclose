import { comparePreservation } from "@/core/validation/preservation";
import type { PreservationReport } from "@/core/types";
import { loadImage } from "./image";

const SAMPLE_EDGE = 640;

/** Loads three images (original, edited, mask), samples them at the same size and compares outside the mask. */
export async function estimatePreservation(originalUrl: string, editedUrl: string, maskUrl: string): Promise<PreservationReport> {
  const [o, e, m] = await Promise.all([loadImage(originalUrl), loadImage(editedUrl), loadImage(maskUrl)]);
  const scale = Math.min(1, SAMPLE_EDGE / Math.max(o.naturalWidth, o.naturalHeight));
  const W = Math.round(o.naturalWidth * scale);
  const H = Math.round(o.naturalHeight * scale);
  const read = (img: HTMLImageElement) => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D context unavailable");
    ctx.drawImage(img, 0, 0, W, H);
    return ctx.getImageData(0, 0, W, H).data;
  };
  return comparePreservation(read(o), read(e), read(m), W, H, { pixelTolerance: 22, maxChangedRatio: 0.01 });
}
