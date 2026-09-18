import { projectVolume, type CameraSolve } from "@/core/geometry/camera";
import { padPolygon, placementMaskPolygon } from "@/core/geometry/mask";
import type { MaskSettings, NormalizedPoint, Project } from "@/core/types";
import { loadImage } from "./image";

const MAX_EDGE = 2400;

function targetSize(w: number, h: number) {
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  return { W: Math.round(w * scale), H: Math.round(h * scale) };
}

/** The editable region for the photograph, in normalized coordinates, with padding applied. */
export function editableRegion(solve: CameraSolve, project: Project, settings: MaskSettings = project.maskSettings): NormalizedPoint[] | null {
  if (!project.space) return null;
  const poly = placementMaskPolygon(solve, project.dimensions, settings.shadowReach);
  if (!poly) return null;
  return padPolygon(poly, settings.paddingPx / project.space.width, settings.paddingPx / project.space.height);
}

/**
 * PLACEMENT MASK: white where the installation may change the photograph, black elsewhere.
 * Same pixel size as the placement reference. No labels, no photograph.
 */
export async function renderPlacementMask(project: Project, solve: CameraSolve, settings: MaskSettings = project.maskSettings): Promise<Blob> {
  if (!project.space) throw new Error("No space photograph");
  const { W, H } = targetSize(project.space.width, project.space.height);
  const poly = editableRegion(solve, project, settings);
  if (!poly) throw new Error("Placement cannot be projected");
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  poly.forEach((p, i) => (i ? ctx.lineTo(p.x * W, p.y * H) : ctx.moveTo(p.x * W, p.y * H)));
  ctx.closePath();
  ctx.fill();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Mask export failed"))), "image/png"));
}

/**
 * PLACEMENT REFERENCE: the original photograph with a clean outline of the placement volume.
 * Perspective guidance for the editor. No dimension labels unless explicitly requested.
 */
export async function renderPlacementReference(project: Project, solve: CameraSolve, options: { labels?: boolean } = {}): Promise<Blob> {
  if (!project.space) throw new Error("No space photograph");
  const img = await loadImage(project.space.asset.url);
  const { W, H } = targetSize(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.drawImage(img, 0, 0, W, H);
  const vol = projectVolume(solve, project.dimensions.width, project.dimensions.depth, project.dimensions.height);
  if (vol) {
    const P = (p: NormalizedPoint): [number, number] => [p.x * W, p.y * H];
    const { base: b, top: t } = vol;
    ctx.lineWidth = Math.max(1.5, W / 900);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
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
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(...P(b.FL));
    ctx.lineTo(...P(b.FR));
    ctx.lineTo(...P(b.BR));
    ctx.lineTo(...P(b.BL));
    ctx.closePath();
    ctx.fill();
    if (options.labels) {
      const { width, depth, height, units } = project.dimensions;
      const fontPx = Math.round(W / 70);
      ctx.font = `500 ${fontPx}px ui-monospace, Menlo, monospace`;
      ctx.fillStyle = "#fff";
      ctx.fillText(`${width} × ${depth} × ${height} ${units}`, P(b.FL)[0], P(b.FL)[1] + fontPx * 1.6);
    }
  }
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Reference export failed"))), "image/png"));
}
