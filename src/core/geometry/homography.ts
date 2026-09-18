import type { Mat3 } from "./vec";

export interface Correspondence {
  /** Plane coordinates */
  X: number;
  Z: number;
  /** Image coordinates (any consistent frame) */
  x: number;
  y: number;
}

/** Solves an n×n linear system with partial pivoting. Returns null when singular. */
export function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) return null;
    if (pivot !== col) [M[pivot], M[col]] = [M[col], M[pivot]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

/**
 * Exact planar homography from four correspondences (plane → image), h33 = 1.
 * Returns null for degenerate configurations.
 */
export function solveHomography(points: Correspondence[]): Mat3 | null {
  if (points.length !== 4) return null;
  const A: number[][] = [];
  const b: number[] = [];
  for (const { X, Z, x, y } of points) {
    A.push([X, Z, 1, 0, 0, 0, -x * X, -x * Z]);
    b.push(x);
    A.push([0, 0, 0, X, Z, 1, -y * X, -y * Z]);
    b.push(y);
  }
  const h = solveLinear(A, b);
  if (!h || h.some((v) => !Number.isFinite(v))) return null;
  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ];
}

export function applyHomography(H: Mat3, X: number, Z: number): { x: number; y: number } | null {
  const w = H[2][0] * X + H[2][1] * Z + H[2][2];
  if (Math.abs(w) < 1e-12) return null;
  return {
    x: (H[0][0] * X + H[0][1] * Z + H[0][2]) / w,
    y: (H[1][0] * X + H[1][1] * Z + H[1][2]) / w,
  };
}
