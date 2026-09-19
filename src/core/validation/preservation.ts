import type { PreservationReport } from "../types/project";

export interface PreservationOptions {
  /** Per-channel colour distance (0..255) above which a pixel counts as changed. */
  pixelTolerance?: number;
  /** Maximum share of changed pixels outside the mask that still passes. */
  maxChangedRatio?: number;
  /** Mask pixels at or above this luminance count as editable. */
  maskThreshold?: number;
}

/**
 * Compares ORIGINAL and edited RGBA buffers outside the editable mask.
 * This is an estimate for internal validation: it flags outputs that changed the environment
 * (a moved door, a missing plant, a different floor) and never claims pixel-perfect preservation.
 */
export function comparePreservation(
  original: Uint8ClampedArray,
  edited: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  options: PreservationOptions = {},
): PreservationReport {
  const tol = options.pixelTolerance ?? 18;
  const maxRatio = options.maxChangedRatio ?? 0.01;
  const maskThreshold = options.maskThreshold ?? 128;
  const n = width * height;
  if (original.length < n * 4 || edited.length < n * 4 || mask.length < n * 4) {
    return { outsideChangedRatio: 1, outsideMeanDiff: 255, threshold: maxRatio, passed: false, note: "Las imágenes no coinciden con el tamaño declarado." };
  }
  let outside = 0;
  let changed = 0;
  let diffSum = 0;
  for (let i = 0; i < n; i++) {
    const m = mask[i * 4];
    if (m >= maskThreshold) continue;
    outside += 1;
    const o = i * 4;
    const d = Math.max(Math.abs(original[o] - edited[o]), Math.abs(original[o + 1] - edited[o + 1]), Math.abs(original[o + 2] - edited[o + 2]));
    diffSum += d;
    if (d > tol) changed += 1;
  }
  if (outside === 0) {
    return { outsideChangedRatio: 0, outsideMeanDiff: 0, threshold: maxRatio, passed: true, note: "The mask covers the whole photograph; nothing to preserve." };
  }
  const ratio = changed / outside;
  const mean = diffSum / outside;
  const passed = ratio <= maxRatio;
  return {
    outsideChangedRatio: ratio,
    outsideMeanDiff: mean,
    threshold: maxRatio,
    passed,
    note: passed ? "El entorno fuera de la zona de colocación se conserva dentro de la tolerancia." : "El entorno cambió fuera de la zona de colocación. Revisa ventanas, puertas, suelo, plantas y fondo.",
  };
}
