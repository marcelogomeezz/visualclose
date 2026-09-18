import { lookAtCamera } from "../../src/core/geometry/synthetic";
import { project, rectangleCorners, solveCamera, projectVolume, unprojectToGround, estimateFovDeg } from "../../src/core/geometry/camera";
import { reprojectRectangle, rotateFootprint, translateFootprintOnGround, groundDistance } from "../../src/core/geometry/footprint";
import type { Footprint } from "../../src/core/types/project";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else console.log("ok  :", msg);
}

const aspect = 1.5;
const truth = lookAtCamera([0.8, 1.7, 8.5], [0.2, 1.0, -1], 42, aspect);
const W = 5, D = 4, H = 2.7;
const corners = rectangleCorners(W, D);
const fp = {} as Footprint;
for (const k of Object.keys(corners) as (keyof typeof corners)[]) {
  const p = project(truth, corners[k]);
  if (!p) throw new Error("projection failed");
  fp[k] = p;
}
console.log("footprint", JSON.stringify(fp));
assert(fp.FL.y > fp.BL.y && fp.FR.y > fp.BR.y, "front edge is lower in the image than the back edge");

const est = estimateFovDeg(fp, W, D, aspect);
assert(est !== null && Math.abs(est - 42) < 0.5, `lens estimate recovers fov (${est?.toFixed(2)})`);
const solved = solveCamera({ footprint: fp, width: W, depth: D, aspect, lens: { fovDeg: est ?? 50 } });
assert(!!solved, "solve succeeds");
if (solved) {
  assert(Math.abs(solved.fovDeg - 42) < 0.5, `solve keeps fov (${solved.fovDeg.toFixed(2)})`);
  const dp = Math.hypot(...([0, 1, 2] as const).map((i) => solved.position[i] - truth.position[i]));
  assert(dp < 0.05, `camera position recovered (err ${dp.toFixed(4)})`);
  const re = reprojectRectangle(solved, W, D);
  assert(!!re, "reprojection ok");
  if (re) {
    let maxErr = 0;
    for (const k of Object.keys(re) as (keyof Footprint)[]) {
      maxErr = Math.max(maxErr, Math.hypot(re[k].x - fp[k].x, re[k].y - fp[k].y));
    }
    assert(maxErr < 1e-4, `reprojected anchors match (max err ${maxErr.toExponential(2)})`);
  }
  const vol = projectVolume(solved, W, D, H);
  assert(!!vol && vol.top.FL.y < vol.base.FL.y, "height extrudes upwards in the image");
  const g = unprojectToGround(solved, fp.FL);
  assert(!!g && Math.abs(g[0] + W / 2) < 1e-3 && Math.abs(g[2] - D / 2) < 1e-3, "unproject FL hits (-W/2, 0, D/2)");
  const dist = groundDistance(solved, fp.FL, fp.FR);
  assert(!!dist && Math.abs(dist - W) < 1e-3, `ground distance FL→FR = ${dist?.toFixed(3)}`);
  const rot = rotateFootprint(solved, W, D, 90);
  assert(!!rot, "rotate ok");
  const moved = translateFootprintOnGround(solved, W, D, fp.FL, fp.FR);
  assert(!!moved && Math.hypot(moved.FL.x - fp.FR.x, moved.FL.y - fp.FR.y) < 1e-6, "ground translate moves FL onto old FR");

  // Manual lens with a wrong fov should still produce a solve with non-zero consistency.
  const manual = solveCamera({ footprint: fp, width: W, depth: D, aspect, lens: { fovDeg: 70 } });
  assert(!!manual && manual.consistency > 0.01, `manual wrong lens reports inconsistency (${manual?.consistency.toFixed(3)})`);
}

// Degenerate: collinear
const bad: Footprint = { FL: { x: 0.1, y: 0.5 }, FR: { x: 0.5, y: 0.5 }, BR: { x: 0.9, y: 0.5 }, BL: { x: 0.3, y: 0.2 } };
assert(solveCamera({ footprint: bad, width: 1, depth: 1, aspect, lens: { fovDeg: 50 } }) === null, "collinear anchors → null");

// Top-down-ish parallelogram: estimation fails, but the solve with an explicit fov still works
const para: Footprint = { FL: { x: 0.3, y: 0.8 }, FR: { x: 0.7, y: 0.8 }, BR: { x: 0.7, y: 0.4 }, BL: { x: 0.3, y: 0.4 } };
assert(estimateFovDeg(para, 4, 4, aspect) === null, "parallelogram → no lens estimate");
const ps = solveCamera({ footprint: para, width: 4, depth: 4, aspect, lens: { fovDeg: 50 } });
assert(!!ps, "parallelogram still solves with explicit fov");
