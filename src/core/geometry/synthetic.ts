import { fovToFocal, type CameraSolve } from "./camera";
import { m3, v3, type Vec3 } from "./vec";

/**
 * Builds a camera solve from an explicit pose. Used by the demo asset renderer and tests,
 * never by the operator-facing FIT flow (which solves from anchors).
 */
export function lookAtCamera(position: Vec3, target: Vec3, fovDeg: number, aspect: number): CameraSolve {
  const forward = v3.norm(v3.sub(target, position)); // camera +z
  const worldUp: Vec3 = [0, 1, 0];
  const right = v3.norm(v3.cross(forward, worldUp)); // camera +x  (z × up = right in a y-down frame? see below)
  // In the CV frame (x right, y down, z forward): x = up × z would give a left-handed set; use right = z × up... verify handedness:
  // For forward = (0,0,-1) (looking along -Z world) and up (0,1,0): cross(forward, up) = (0*0 - (-1)*1, (-1)*0 - 0*0, 0) = (1, 0, 0). Right = +X. ✓
  const down = v3.cross(forward, right); // camera +y (down)
  const R = [right, down, forward] as [Vec3, Vec3, Vec3]; // rows = camera axes in world coords
  const t = v3.scale(m3.mulVec(R, position), -1);
  const f = fovToFocal(fovDeg);
  return { R, t, f, fovDeg, aspect, consistency: 0, position };
}
