import type { NormalizedPoint } from "../types/assets";
import type { AnchorKey, Footprint, Lens } from "../types/project";
import { solveHomography } from "./homography";
import { m3, v3, type Mat3, type Vec3 } from "./vec";

/**
 * Camera frame convention inside this module (computer-vision style):
 *   x → right, y → down, z → forward (into the scene).
 * Canonical image coordinates: x ∈ [-aspect/2, aspect/2], y ∈ [-0.5, 0.5], y down.
 * World: ground plane y = 0, +Y up. The footprint rectangle is centred at the origin,
 * X across width, Z across depth, the front edge at +Z (towards the viewer).
 */

export interface CameraSolve {
  /** World → camera rotation (rows are camera axes expressed in world coordinates). */
  R: Mat3;
  t: Vec3;
  /** Vertical field of view in degrees. */
  fovDeg: number;
  /** Focal length in canonical units (image height = 1). */
  f: number;
  aspect: number;
  /** 0 = perfect rectangle under this lens; grows with inconsistency. */
  consistency: number;
  /** Camera position in world coordinates. */
  position: Vec3;
}

export const DEFAULT_FOV_DEG = 50;
export const MIN_FOV_DEG = 20;
export const MAX_FOV_DEG = 100;

export function toCanonical(p: NormalizedPoint, aspect: number): { x: number; y: number } {
  return { x: (p.x - 0.5) * aspect, y: p.y - 0.5 };
}

export function fromCanonical(x: number, y: number, aspect: number): NormalizedPoint {
  return { x: x / aspect + 0.5, y: y + 0.5 };
}

export function fovToFocal(fovDeg: number): number {
  return 0.5 / Math.tan((fovDeg * Math.PI) / 360);
}

export function focalToFov(f: number): number {
  return (Math.atan(0.5 / f) * 360) / Math.PI;
}

/** World-space corner positions of a W×D rectangle centred at the origin. */
export function rectangleCorners(width: number, depth: number): Record<AnchorKey, Vec3> {
  const hw = width / 2;
  const hd = depth / 2;
  return {
    FL: [-hw, 0, hd],
    FR: [hw, 0, hd],
    BL: [-hw, 0, -hd],
    BR: [hw, 0, -hd],
  };
}

/** Estimates the focal length from a ground-plane homography with the principal point at the centre. */
export function estimateFocal(H: Mat3): number | null {
  const [a1, b1, c1] = m3.column(H, 0);
  const [a2, b2, c2] = m3.column(H, 1);
  const denom = c1 * c2;
  if (Math.abs(denom) < 1e-9) return null;
  const f2 = -(a1 * a2 + b1 * b2) / denom;
  if (!(f2 > 0)) return null;
  const f = Math.sqrt(f2);
  const fov = focalToFov(f);
  if (fov < MIN_FOV_DEG || fov > MAX_FOV_DEG) return null;
  return f;
}

function decompose(H: Mat3, f: number): { R: Mat3; t: Vec3; consistency: number } | null {
  // M = K^-1 H
  const M: Mat3 = [
    [H[0][0] / f, H[0][1] / f, H[0][2] / f],
    [H[1][0] / f, H[1][1] / f, H[1][2] / f],
    [H[2][0], H[2][1], H[2][2]],
  ];
  let r1 = m3.column(M, 0);
  let r2 = m3.column(M, 1);
  let t = m3.column(M, 2);
  const l1 = v3.len(r1);
  const l2 = v3.len(r2);
  if (l1 < 1e-9 || l2 < 1e-9) return null;
  const lambda = 2 / (l1 + l2);
  r1 = v3.scale(r1, lambda);
  r2 = v3.scale(r2, lambda);
  t = v3.scale(t, lambda);
  // Plane must be in front of the camera.
  if (t[2] < 0) {
    r1 = v3.scale(r1, -1);
    r2 = v3.scale(r2, -1);
    t = v3.scale(t, -1);
  }
  const consistency = Math.abs(v3.dot(v3.norm(r1), v3.norm(r2))) + Math.abs(l1 - l2) / (l1 + l2);
  // Orthonormalise (symmetric-ish Gram-Schmidt).
  const rY = v3.norm(v3.cross(r2, r1)); // world up in camera frame
  const r1n = v3.norm(r1);
  const r2n = v3.norm(v3.cross(r1n, rY));
  const R = m3.fromColumns(r1n, rY, r2n);
  return { R, t, consistency };
}

export interface SolveInput {
  footprint: Footprint;
  width: number;
  depth: number;
  aspect: number;
  lens: Pick<Lens, "fovDeg">;
}

function footprintHomography(footprint: Footprint, width: number, depth: number, aspect: number): Mat3 | null {
  const corners = rectangleCorners(width, depth);
  const keys: AnchorKey[] = ["FL", "FR", "BL", "BR"];
  return solveHomography(
    keys.map((k) => {
      const c = toCanonical(footprint[k], aspect);
      return { X: corners[k][0], Z: corners[k][2], x: c.x, y: c.y };
    }),
  );
}

/**
 * Estimates the vertical field of view from the four anchors alone (single-plane focal estimation).
 * Returns null when the anchors are near-parallel or degenerate. An operator action, not a live mode.
 */
export function estimateFovDeg(footprint: Footprint, width: number, depth: number, aspect: number): number | null {
  if (!(width > 0) || !(depth > 0) || !(aspect > 0)) return null;
  const H = footprintHomography(footprint, width, depth, aspect);
  if (!H) return null;
  const f = estimateFocal(H);
  return f === null ? null : focalToFov(f);
}

/**
 * Solves the camera that sees a true width×depth rectangle at the four footprint anchors.
 * Returns null when the anchors are degenerate.
 */
/** The image-space footprint must be a strictly convex quad with the expected winding; anything else cannot be a rectangle seen from above. */
export function isFootprintConvex(footprint: Footprint, aspect: number): boolean {
  const order: AnchorKey[] = ["FL", "FR", "BR", "BL"];
  const pts = order.map((k) => toCanonical(footprint[k], aspect));
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const c = pts[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 1e-5) return false;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

export function solveCamera(input: SolveInput): CameraSolve | null {
  const { footprint, width, depth, aspect, lens } = input;
  if (!(width > 0) || !(depth > 0) || !(aspect > 0)) return null;
  if (!isFootprintConvex(footprint, aspect)) return null;
  const corners = rectangleCorners(width, depth);
  const keys: AnchorKey[] = ["FL", "FR", "BL", "BR"];
  const H = footprintHomography(footprint, width, depth, aspect);
  if (!H) return null;

  const f = fovToFocal(Math.min(MAX_FOV_DEG, Math.max(MIN_FOV_DEG, lens.fovDeg)));
  const d = decompose(H, f);
  if (!d) return null;
  // All corners must be in front of the camera.
  for (const k of keys) {
    const p = worldToCamera(d.R, d.t, corners[k]);
    if (p[2] <= 0.01) return null;
  }
  const Rt = m3.transpose(d.R);
  const position = v3.scale(m3.mulVec(Rt, d.t), -1);
  return {
    R: d.R,
    t: d.t,
    f,
    fovDeg: focalToFov(f),
    aspect,
    consistency: d.consistency,
    position,
  };
}

export function worldToCamera(R: Mat3, t: Vec3, p: Vec3): Vec3 {
  return v3.add(m3.mulVec(R, p), t);
}

/** Projects a world point to normalized image coordinates. Null when behind the camera. */
export function project(cam: CameraSolve, p: Vec3): NormalizedPoint | null {
  const c = worldToCamera(cam.R, cam.t, p);
  if (c[2] <= 1e-6) return null;
  return fromCanonical((cam.f * c[0]) / c[2], (cam.f * c[1]) / c[2], cam.aspect);
}

/** Intersects the viewing ray through an image point with the ground plane (y = 0). */
export function unprojectToGround(cam: CameraSolve, p: NormalizedPoint): Vec3 | null {
  const c = toCanonical(p, cam.aspect);
  const dirCam: Vec3 = v3.norm([c.x / cam.f, c.y / cam.f, 1]);
  const Rt = m3.transpose(cam.R);
  const dirWorld = m3.mulVec(Rt, dirCam);
  const origin = cam.position;
  if (Math.abs(dirWorld[1]) < 1e-9) return null;
  const s = -origin[1] / dirWorld[1];
  if (s <= 0) return null;
  return v3.add(origin, v3.scale(dirWorld, s));
}

/** Projects the eight corners of the placement volume. */
export function projectVolume(
  cam: CameraSolve,
  width: number,
  depth: number,
  height: number,
): { base: Record<AnchorKey, NormalizedPoint>; top: Record<AnchorKey, NormalizedPoint> } | null {
  const corners = rectangleCorners(width, depth);
  const base = {} as Record<AnchorKey, NormalizedPoint>;
  const top = {} as Record<AnchorKey, NormalizedPoint>;
  for (const k of Object.keys(corners) as AnchorKey[]) {
    const b = project(cam, corners[k]);
    const t = project(cam, [corners[k][0], height, corners[k][2]]);
    if (!b || !t) return null;
    base[k] = b;
    top[k] = t;
  }
  return { base, top };
}
