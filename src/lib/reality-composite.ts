import { projectVolume, type CameraSolve } from "@/core/geometry/camera";
import { shadowPolygon } from "@/core/geometry/mask";
import type { NormalizedPoint, Project } from "@/core/types";
import { editableRegion } from "./placement-mask";
import { loadImage } from "./image";

const MAX_EDGE = 2400;

/**
 * REALIDAD · muestra. Photographic compositing stand-in for the future AI editor.
 *
 * The original photograph is drawn untouched. A product proxy built from the placement geometry is
 * painted only inside the placement mask (a canvas clip), with a ground shadow and contact shading.
 * By construction every pixel outside the mask equals the original. It stands in for the real
 * product until a provider edits the photograph; it is never a reconstructed scene.
 */
export async function composeRealityMock(project: Project, solve: CameraSolve): Promise<{ blob: Blob; width: number; height: number }> {
  if (!project.space) throw new Error("No space photograph");
  const img = await loadImage(project.space.asset.url);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const W = Math.round(img.naturalWidth * scale);
  const H = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.drawImage(img, 0, 0, W, H);

  const region = editableRegion(solve, project);
  const vol = projectVolume(solve, project.dimensions.width, project.dimensions.depth, project.dimensions.height);
  if (!region || !vol) {
    return { blob: await toBlob(canvas), width: W, height: H };
  }
  const P = (p: NormalizedPoint): [number, number] => [p.x * W, p.y * H];
  const path = (pts: NormalizedPoint[]) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...P(p)) : ctx.moveTo(...P(p))));
    ctx.closePath();
  };

  // Everything below is clipped to the editable region.
  ctx.save();
  path(region);
  ctx.clip();

  const { base: b, top: t } = vol;
  const { placementType } = project.productPack;
  const { width, depth, height } = project.dimensions;
  const structure = placementType === "FREESTANDING_STRUCTURE" || placementType === "WALL_ATTACHED_STRUCTURE" || (placementType === "CUSTOM" && height > 2.2);
  const camRight = solve.position[0] > width / 2;
  const camLeft = solve.position[0] < -width / 2;
  const camFront = solve.position[2] > depth / 2;

  // Ground shadow (soft), then contact darkening at the base.
  const shadow = shadowPolygon(solve, project.dimensions, project.maskSettings.shadowReach);
  if (shadow) {
    ctx.save();
    ctx.filter = `blur(${Math.max(4, W / 160)}px)`;
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    path(shadow);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.filter = `blur(${Math.max(2, W / 400)}px)`;
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  path([b.FL, b.FR, b.BR, b.BL]);
  ctx.fill();
  ctx.restore();

  const faceTop = "#4a4744";
  const faceFront = "#2a2927";
  const faceSide = "#222120";
  const edge = "rgba(255,255,255,0.10)";

  if (structure) {
    // Open frame: four posts and a roof slab with a fascia band.
    const postW = Math.max(3, (Math.hypot(P(b.FR)[0] - P(b.FL)[0], P(b.FR)[1] - P(b.FL)[1]) / Math.max(width, 0.1)) * 0.14);
    const slab = height * 0.09;
    const under = 1 - slab / height;
    const mid = (a: NormalizedPoint, c: NormalizedPoint, k: number): NormalizedPoint => ({ x: a.x + (c.x - a.x) * k, y: a.y + (c.y - a.y) * k });
    const drawPost = (base: NormalizedPoint, top: NormalizedPoint) => {
      const [x1, y1] = P(base);
      const [x2, y2] = P(top);
      ctx.strokeStyle = faceFront;
      ctx.lineWidth = postW;
      ctx.lineCap = "butt";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = edge;
      ctx.lineWidth = Math.max(1, postW * 0.22);
      ctx.beginPath();
      ctx.moveTo(x1 - postW * 0.38, y1);
      ctx.lineTo(x2 - postW * 0.38, y2);
      ctx.stroke();
    };
    // Back posts first (painter's order), then roof, then front posts.
    drawPost(b.BL, t.BL);
    drawPost(b.BR, t.BR);
    // Roof slab: top face, then the visible fascia bands.
    ctx.fillStyle = faceTop;
    path([t.FL, t.FR, t.BR, t.BL]);
    ctx.fill();
    const uFL = mid(b.FL, t.FL, under);
    const uFR = mid(b.FR, t.FR, under);
    const uBL = mid(b.BL, t.BL, under);
    const uBR = mid(b.BR, t.BR, under);
    if (camFront) {
      ctx.fillStyle = faceFront;
      path([uFL, uFR, t.FR, t.FL]);
      ctx.fill();
    }
    if (camRight) {
      ctx.fillStyle = faceSide;
      path([uFR, uBR, t.BR, t.FR]);
      ctx.fill();
    }
    if (camLeft) {
      ctx.fillStyle = faceSide;
      path([uBL, uFL, t.FL, t.BL]);
      ctx.fill();
    }
    // Louver lines on the underside read through the open frame.
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = Math.max(1, W / 1400);
    for (let k = 0.12; k < 0.95; k += 0.09) {
      const a = mid(uFL, uBL, k);
      const c = mid(uFR, uBR, k);
      ctx.beginPath();
      ctx.moveTo(...P(a));
      ctx.lineTo(...P(c));
      ctx.stroke();
    }
    drawPost(b.FL, t.FL);
    drawPost(b.FR, t.FR);
  } else {
    // Solid object: visible faces with simple shading.
    if (camRight) {
      ctx.fillStyle = faceSide;
      path([b.FR, b.BR, t.BR, t.FR]);
      ctx.fill();
    }
    if (camLeft) {
      ctx.fillStyle = faceSide;
      path([b.BL, b.FL, t.FL, t.BL]);
      ctx.fill();
    }
    if (camFront) {
      ctx.fillStyle = faceFront;
      path([b.FL, b.FR, t.FR, t.FL]);
      ctx.fill();
    }
    ctx.fillStyle = faceTop;
    path([t.FL, t.FR, t.BR, t.BL]);
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = Math.max(1, W / 1600);
    path([t.FL, t.FR, t.BR, t.BL]);
    ctx.stroke();
  }
  ctx.restore();

  return { blob: await toBlob(canvas), width: W, height: H };
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Composite export failed"))), "image/jpeg", 0.92));
}
