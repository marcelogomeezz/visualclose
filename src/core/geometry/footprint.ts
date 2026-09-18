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
