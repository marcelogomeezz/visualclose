import type { NormalizedPoint } from "../types/assets";
import type { AnchorKey, Footprint } from "../types/project";
import type { PlacementType } from "../types/product-pack";
import { project, rectangleCorners, unprojectToGround, type CameraSolve } from "./camera";
import { v3, type Vec3 } from "./vec";

export const ANCHOR_ORDER: AnchorKey[] = ["FL", "FR", "BR", "BL"];

export function footprintCenter(fp: Footprint): NormalizedPoint {
  return {
    x: (fp.FL.x + fp.FR.x + fp.BL.x + fp.BR.x) / 4,
    y: (fp.FL.y + fp.FR.y + fp.BL.y + fp.BR.y) / 4,
  };
}

export function translateFootprint(fp: Footprint, dx: number, dy: number): Footprint {
  const out = {} as Footprint;
  for (const k of Object.keys(fp) as AnchorKey[]) out[k] = { x: fp[k].x + dx, y: fp[k].y + dy };
  return out;
}

export function clampFootprint(fp: Footprint, margin = -0.25): Footprint {
  const out = {} as Footprint;
  for (const k of Object.keys(fp) as AnchorKey[]) {
    out[k] = {
      x: Math.min(1 - margin, Math.max(margin, fp[k].x)),
      y: Math.min(1 - margin, Math.max(margin, fp[k].y)),
    };
  }
  return out;
}

/** True when every anchor lies inside the image (with a small tolerance). */
export function footprintInsideImage(fp: Footprint, tolerance = 0.06): boolean {
  return (Object.keys(fp) as AnchorKey[]).every((k) => fp[k].x >= -tolerance && fp[k].x <= 1 + tolerance && fp[k].y >= -tolerance && fp[k].y <= 1 + tolerance);
}

/** Signed area of the footprint polygon in image space; sign tells winding. */
export function footprintArea(fp: Footprint): number {
  const pts = ANCHOR_ORDER.map((k) => fp[k]);
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/** Re-projects a true rectangle through the solved camera. Used to snap anchors after a solve. */
export function reprojectRectangle(cam: CameraSolve, width: number, depth: number): Footprint | null {
  const corners = rectangleCorners(width, depth);
  const out = {} as Footprint;
  for (const k of Object.keys(corners) as AnchorKey[]) {
    const p = project(cam, corners[k]);
    if (!p) return null;
    out[k] = p;
  }
  return out;
}

function projectWorldRect(cam: CameraSolve, pts: Record<AnchorKey, Vec3>): Footprint | null {
  const out = {} as Footprint;
  for (const k of Object.keys(pts) as AnchorKey[]) {
    const p = project(cam, pts[k]);
    if (!p) return null;
    out[k] = p;
  }
  return out;
}

/** Moves the footprint by a world vector expressed from two image points on the ground plane. */
export function translateFootprintOnGround(
  cam: CameraSolve,
  width: number,
  depth: number,
  from: NormalizedPoint,
  to: NormalizedPoint,
): Footprint | null {
  const a = unprojectToGround(cam, from);
  const b = unprojectToGround(cam, to);
  if (!a || !b) return null;
  const delta = v3.sub(b, a);
  const corners = rectangleCorners(width, depth);
  const moved = {} as Record<AnchorKey, Vec3>;
  for (const k of Object.keys(corners) as AnchorKey[]) moved[k] = v3.add(corners[k], delta);
  return projectWorldRect(cam, moved);
}

/** Rotates the footprint rectangle about its world centre. */
export function rotateFootprint(cam: CameraSolve, width: number, depth: number, deg: number): Footprint | null {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const corners = rectangleCorners(width, depth);
  const rotated = {} as Record<AnchorKey, Vec3>;
  for (const k of Object.keys(corners) as AnchorKey[]) {
    const [x, , z] = corners[k];
    rotated[k] = [x * c - z * s, 0, x * s + z * c];
  }
  return projectWorldRect(cam, rotated);
}

/**
 * Rebuilds the footprint for new dimensions under the current camera.
 * Wall-attached and wall-surface placements keep the back edge; others keep the centre.
 */
export function resizeFootprint(
  cam: CameraSolve,
  newWidth: number,
  newDepth: number,
  oldDepth: number,
  placementType: PlacementType,
): Footprint | null {
  const corners = rectangleCorners(newWidth, newDepth);
  const keepBack = placementType === "WALL_ATTACHED_STRUCTURE" || placementType === "WALL_SURFACE";
  const shift = keepBack ? (newDepth - oldDepth) / 2 : 0;
  const moved = {} as Record<AnchorKey, Vec3>;
  for (const k of Object.keys(corners) as AnchorKey[]) moved[k] = [corners[k][0], 0, corners[k][2] + shift];
  return projectWorldRect(cam, moved);
}

/** Moves the footprint so that the back-edge midpoint lands on the wall anchor. */
export function attachFootprintToWall(
  cam: CameraSolve,
  width: number,
  depth: number,
  wallAnchor: NormalizedPoint,
): Footprint | null {
  const target = unprojectToGround(cam, wallAnchor);
  if (!target) return null;
  const backMid: Vec3 = [0, 0, -depth / 2];
  const delta = v3.sub(target, backMid);
  const corners = rectangleCorners(width, depth);
  const moved = {} as Record<AnchorKey, Vec3>;
  for (const k of Object.keys(corners) as AnchorKey[]) moved[k] = v3.add(corners[k], delta);
  return projectWorldRect(cam, moved);
}

/** Ground distance between two image points under the current solve (calibration feedback). */
export function groundDistance(cam: CameraSolve, a: NormalizedPoint, b: NormalizedPoint): number | null {
  const pa = unprojectToGround(cam, a);
  const pb = unprojectToGround(cam, b);
  if (!pa || !pb) return null;
  return v3.len(v3.sub(pb, pa));
}

/** A plausible default footprint for a fresh photograph: lower-centre trapezoid. */
export function defaultFootprint(): Footprint {
  return {
    FL: { x: 0.28, y: 0.86 },
    FR: { x: 0.72, y: 0.86 },
    BL: { x: 0.36, y: 0.62 },
    BR: { x: 0.64, y: 0.62 },
  };
}

/**
 * Sticker-style resize: drags one footprint corner on the ground while the opposite corner stays fixed.
 * Returns the new dimensions and the re-projected footprint under the current camera.
 */
export function resizeFromCorner(
  cam: CameraSolve,
  key: AnchorKey,
  pointer: NormalizedPoint,
  width: number,
  depth: number,
  minSize = 0.2,
): { width: number; depth: number; footprint: Footprint } | null {
  const g = unprojectToGround(cam, pointer);
  if (!g) return null;
  const sx = key === "FR" || key === "BR" ? 1 : -1; // dragged corner side on X
  const sz = key === "FL" || key === "FR" ? 1 : -1; // dragged corner side on Z (front = +Z)
  const ox = -sx * (width / 2); // opposite corner stays fixed
  const oz = -sz * (depth / 2);
  const newW = Math.max(minSize, (g[0] - ox) * sx);
  const newD = Math.max(minSize, (g[2] - oz) * sz);
  const x0 = Math.min(ox, ox + sx * newW);
  const x1 = Math.max(ox, ox + sx * newW);
  const z0 = Math.min(oz, oz + sz * newD);
  const z1 = Math.max(oz, oz + sz * newD);
  const pts: Record<AnchorKey, Vec3> = { FL: [x0, 0, z1], FR: [x1, 0, z1], BL: [x0, 0, z0], BR: [x1, 0, z0] };
  const footprint = projectWorldRect(cam, pts);
  if (!footprint) return null;
  return { width: newW, depth: newD, footprint };
}

/**
 * Finds the height whose top-front-midpoint projects to the pointer's vertical position (bisection).
 * Used by the height handle. Returns null when the pointer cannot be matched.
 */
export function heightFromPointer(cam: CameraSolve, depth: number, pointer: NormalizedPoint, minH = 0.1, maxH = 30): number | null {
  const yAt = (h: number) => project(cam, [0, h, depth / 2])?.y ?? null;
  const yMin = yAt(minH);
  const yMax = yAt(maxH);
  if (yMin === null || yMax === null) return null;
  if (pointer.y >= yMin) return minH;
  if (pointer.y <= yMax) return maxH;
  let lo = minH;
  let hi = maxH;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const y = yAt(mid);
    if (y === null) return null;
    if (y > pointer.y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** True when the normalized point lies inside the footprint quad (image space). */
export function pointInFootprint(fp: Footprint, p: NormalizedPoint): boolean {
  const pts = ANCHOR_ORDER.map((k) => fp[k]);
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    const intersect = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
}
