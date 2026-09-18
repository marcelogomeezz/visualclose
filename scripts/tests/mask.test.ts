import { lookAtCamera } from "../../src/core/geometry/synthetic";
import { project } from "../../src/core/geometry/camera";
import { convexHull, placementMaskPolygon, padPolygon, pointInPolygon } from "../../src/core/geometry/mask";
import { comparePreservation } from "../../src/core/validation/preservation";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else console.log("ok  :", msg);
}

const cam = lookAtCamera([0.9, 1.75, 8.6], [0.2, 1.05, -1.2], 42, 1.5);
const dims = { width: 5, depth: 4, height: 2.7, units: "m" as const };

const hull = convexHull([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0.5, y: 0.5 }]);
assert(hull.length === 4, `convex hull drops interior points (${hull.length} vertices)`);

const poly = placementMaskPolygon(cam, dims);
assert(!!poly && poly.length >= 4, `placement mask polygon has ${poly?.length} vertices`);
if (poly) {
  const top = project(cam, [0, dims.height, 0]);
  const base = project(cam, [0, 0, 0]);
  const far = { x: 0.02, y: 0.05 };
  assert(!!top && pointInPolygon(poly, top), "volume centre-top is inside the mask");
  assert(!!base && pointInPolygon(poly, base), "footprint centre is inside the mask");
  assert(!pointInPolygon(poly, far), "far corner of the photo is outside the mask");
  const padded = padPolygon(poly, 0.02, 0.03);
  assert(padded.every((p, i) => Math.hypot(p.x - poly[i].x, p.y - poly[i].y) > 0.019), "padding pushes every vertex outwards");
}

// Preservation: identical outside the mask → passes; a changed pixel outside → flagged.
const w = 4;
const h = 4;
const n = w * h;
const original = new Uint8ClampedArray(n * 4).fill(100);
const edited = new Uint8ClampedArray(original);
const mask = new Uint8ClampedArray(n * 4);
// mask covers the right half
for (let y = 0; y < h; y++) for (let x = 2; x < w; x++) mask.set([255, 255, 255, 255], (y * w + x) * 4);
// edit inside the mask heavily
for (let y = 0; y < h; y++) for (let x = 2; x < w; x++) edited.set([20, 20, 20, 255], (y * w + x) * 4);
let r = comparePreservation(original, edited, mask, w, h);
assert(r.passed && r.outsideChangedRatio === 0, "edits inside the mask do not affect preservation");
edited.set([220, 100, 100, 255], 0); // pixel (0,0) is outside the mask
r = comparePreservation(original, edited, mask, w, h);
assert(!r.passed && r.outsideChangedRatio === 1 / 8, `a change outside the mask is flagged (ratio ${r.outsideChangedRatio})`);
