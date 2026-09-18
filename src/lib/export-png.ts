import { projectVolume, type CameraSolve } from "@/core/geometry/camera";
import { formatDimensions } from "@/core/geometry/units";
import type { NormalizedPoint, Project } from "@/core/types";
import { loadImage } from "./image";

const IVORY = "rgba(240, 236, 226, 0.95)";
const IVORY_SOFT = "rgba(240, 236, 226, 0.55)";
const PLANE = "rgba(240, 236, 226, 0.08)";
const FOOTPRINT = "rgba(240, 236, 226, 0.16)";

export const TECHNICAL_NOTE = "Visual placement guide. Verify final installation on site.";

/**
 * Draws the technical view at source resolution with 2D canvas, using the same projection as the 3D layer.
 * Returns the full PNG and a JPEG thumbnail.
 */
export async function renderTechnicalPng(project: Project, solve: CameraSolve): Promise<{ full: Blob; thumb: Blob; width: number; height: number }> {
  if (!project.space) throw new Error("No space photograph");
  const img = await loadImage(project.space.asset.url);
  const maxEdge = 2400;
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const W = Math.round(img.naturalWidth * scale);
  const H = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.drawImage(img, 0, 0, W, H);

  const { width, depth, height, units } = project.dimensions;
  const vol = projectVolume(solve, width, depth, height);
  const P = (p: NormalizedPoint): [number, number] => [p.x * W, p.y * H];
  const lw = Math.max(1, W / 1400);

  if (vol) {
    const b = vol.base;
    const t = vol.top;
    // Footprint fill
    ctx.beginPath();
    ctx.moveTo(...P(b.FL));
    ctx.lineTo(...P(b.FR));
    ctx.lineTo(...P(b.BR));
    ctx.lineTo(...P(b.BL));
    ctx.closePath();
    ctx.fillStyle = FOOTPRINT;
    ctx.fill();
    // Side planes
    const faces: [NormalizedPoint, NormalizedPoint, NormalizedPoint, NormalizedPoint][] = [
      [b.BL, b.BR, t.BR, t.BL],
      [b.FL, b.BL, t.BL, t.FL],
      [b.FR, b.BR, t.BR, t.FR],
      [b.FL, b.FR, t.FR, t.FL],
      [t.FL, t.FR, t.BR, t.BL],
    ];
    ctx.fillStyle = PLANE;
    for (const f of faces) {
      ctx.beginPath();
      ctx.moveTo(...P(f[0]));
      for (let i = 1; i < 4; i++) ctx.lineTo(...P(f[i]));
      ctx.closePath();
      ctx.fill();
    }
    // Edges
    ctx.lineWidth = lw;
    ctx.strokeStyle = IVORY;
    ctx.lineJoin = "round";
    const edges: [NormalizedPoint, NormalizedPoint][] = [
      [b.FL, b.FR], [b.FR, b.BR], [b.BR, b.BL], [b.BL, b.FL],
      [t.FL, t.FR], [t.FR, t.BR], [t.BR, t.BL], [t.BL, t.FL],
      [b.FL, t.FL], [b.FR, t.FR], [b.BR, t.BR], [b.BL, t.BL],
    ];
    for (const [a, c] of edges) {
      ctx.beginPath();
      ctx.moveTo(...P(a));
      ctx.lineTo(...P(c));
      ctx.stroke();
    }
    // Anchor ticks
    ctx.strokeStyle = IVORY;
    ctx.lineWidth = lw * 1.4;
    for (const k of ["FL", "FR", "BL", "BR"] as const) {
      const [x, y] = P(b[k]);
      const r = W * 0.006;
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x + r, y);
      ctx.moveTo(x, y - r);
      ctx.lineTo(x, y + r);
      ctx.stroke();
    }
    // Dimension labels
    const fontPx = Math.round(W / 70);
    ctx.font = `500 ${fontPx}px ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.textBaseline = "middle";
    const label = (a: NormalizedPoint, c: NormalizedPoint, text: string, dx = 0, dy = 0) => {
      const [x1, y1] = P(a);
      const [x2, y2] = P(c);
      const mx = (x1 + x2) / 2 + dx;
      const my = (y1 + y2) / 2 + dy;
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = "rgba(18, 18, 18, 0.72)";
      ctx.fillRect(mx - tw / 2 - fontPx * 0.5, my - fontPx * 0.8, tw + fontPx, fontPx * 1.6);
      ctx.fillStyle = IVORY;
      ctx.textAlign = "center";
      ctx.fillText(text, mx, my);
    };
    const dec = units === "m" || units === "ft" ? 2 : 0;
    label(b.FL, b.FR, `W ${width.toFixed(dec)} ${units}`, 0, fontPx * 1.6);
    label(b.FR, b.BR, `D ${depth.toFixed(dec)} ${units}`, fontPx * 3.2, 0);
    label(b.FL, t.FL, `H ${height.toFixed(dec)} ${units}`, -fontPx * 3.2, 0);
  }

  // Reference measurement
  if (project.referenceMeasurement) {
    const { a, b: bb, distance, units: mu } = project.referenceMeasurement;
    ctx.strokeStyle = IVORY_SOFT;
    ctx.setLineDash([lw * 6, lw * 5]);
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(...P(a));
    ctx.lineTo(...P(bb));
    ctx.stroke();
    ctx.setLineDash([]);
    const fontPx = Math.round(W / 80);
    ctx.font = `500 ${fontPx}px ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.fillStyle = IVORY;
    ctx.textAlign = "center";
    ctx.fillText(`REF ${distance} ${mu}`, (a.x + bb.x) / 2 * W, (a.y + bb.y) / 2 * H - fontPx);
  }

  // Title block
  const pad = W * 0.03;
  const titlePx = Math.round(W / 42);
  const smallPx = Math.round(W / 85);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const blockH = titlePx * 1.5 + smallPx * 4.8;
  const grad = ctx.createLinearGradient(0, H - blockH - pad * 2, 0, H);
  grad.addColorStop(0, "rgba(14,14,14,0)");
  grad.addColorStop(1, "rgba(14,14,14,0.78)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H - blockH - pad * 2, W, blockH + pad * 2);
  ctx.fillStyle = IVORY;
  ctx.font = `500 ${titlePx}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillText(project.productPack.name.toUpperCase(), pad, H - pad - smallPx * 3.6);
  ctx.font = `400 ${smallPx}px ui-monospace, "SF Mono", Menlo, monospace`;
  ctx.fillStyle = IVORY_SOFT;
  const config = [
    formatDimensions(width, depth, height, units),
    project.productPack.color,
    project.productPack.finish,
    project.productPack.installationType,
  ].join("   ·   ");
  ctx.fillText(config, pad, H - pad - smallPx * 1.9);
  ctx.fillText(`TECHNICAL PLACEMENT   ·   ${TECHNICAL_NOTE}`, pad, H - pad - smallPx * 0.3);
  ctx.textAlign = "right";
  ctx.fillStyle = IVORY;
  ctx.font = `500 ${smallPx}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillText("VISUALCLOSE", W - pad, H - pad - smallPx * 0.3);

  const full = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG failed"))), "image/png"));
  const thumbCanvas = document.createElement("canvas");
  const ts = 360 / W;
  thumbCanvas.width = 360;
  thumbCanvas.height = Math.round(H * ts);
  thumbCanvas.getContext("2d")?.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  const thumb = await new Promise<Blob>((resolve, reject) => thumbCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error("thumb failed"))), "image/jpeg", 0.85));
  return { full, thumb, width: W, height: H };
}
