import type { NormalizedPoint } from "../types/assets";
import type { Dimensions } from "../types/product-pack";
import { project, rectangleCorners, type CameraSolve } from "./camera";
import type { Vec3 } from "./vec";

/** Andrew's monotone chain. Returns the hull in counter-clockwise order (image space, y down). */
export function convexHull(points: NormalizedPoint[]): NormalizedPoint[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length < 3) return pts;
  const cross = (o: NormalizedPoint, a: NormalizedPoint, b: NormalizedPoint) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: NormalizedPoint[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: NormalizedPoint[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return [...lower, ...upper];
}

/** Direction the ground shadow falls, in world units per metre of height (default: sun from front-left). */
export const DEFAULT_SHADOW_DIR: [number, number] = [0.55, -0.35];

/**
 * The region of the photograph the installation may change: the projected product volume plus its
 * ground shadow, as a convex polygon in normalized image coordinates. Padding is applied later in pixels.
 */
export function placementMaskPolygon(
  solve: CameraSolve,
  dimensions: Dimensions,
  shadowReach = 0.9,
  shadowDir: [number, number] = DEFAULT_SHADOW_DIR,
): NormalizedPoint[] | null {
  const { width, depth, height } = dimensions;
  const corners = rectangleCorners(width, depth);
  const pts: NormalizedPoint[] = [];
  for (const k of Object.keys(corners) as (keyof typeof corners)[]) {
    const [x, , z] = corners[k];
    const base = project(solve, [x, 0, z]);
    const top = project(solve, [x, height, z]);
    const shadow = project(solve, [x + shadowDir[0] * height * shadowReach, 0, z + shadowDir[1] * height * shadowReach] as Vec3);
    if (!base || !top || !shadow) return null;
    pts.push(base, top, shadow);
  }
  const hull = convexHull(pts);
  return hull.length >= 3 ? hull : null;
}

/** Ground shadow footprint of the volume (roof corners displaced along the shadow direction). */
export function shadowPolygon(solve: CameraSolve, dimensions: Dimensions, shadowReach = 0.9, shadowDir: [number, number] = DEFAULT_SHADOW_DIR): NormalizedPoint[] | null {
  const { width, depth, height } = dimensions;
  const corners = rectangleCorners(width, depth);
  const pts: NormalizedPoint[] = [];
  for (const k of ["FL", "FR", "BR", "BL"] as const) {
    const [x, , z] = corners[k];
    const p = project(solve, [x + shadowDir[0] * height * shadowReach, 0, z + shadowDir[1] * height * shadowReach]);
    if (!p) return null;
    pts.push(p);
  }
  return pts;
}

/** Offsets every vertex away from the polygon centroid by a padding given in normalized units per axis. */
export function padPolygon(poly: NormalizedPoint[], padX: number, padY: number): NormalizedPoint[] {
  const c = poly.reduce((a, p) => ({ x: a.x + p.x / poly.length, y: a.y + p.y / poly.length }), { x: 0, y: 0 });
  return poly.map((p) => {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / len) * padX, y: p.y + (dy / len) * padY };
  });
}

/** Point-in-polygon test (ray casting), normalized coordinates. */
export function pointInPolygon(poly: NormalizedPoint[], p: NormalizedPoint): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
