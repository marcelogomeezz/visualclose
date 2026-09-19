/**
 * Placeholder demo scene, drawn as SVG through the same projection math the app uses.
 * Everything here is a stand-in for real photography and real provider outputs.
 */
import { lookAtCamera } from "../../src/core/geometry/synthetic";
import { project, rectangleCorners, type CameraSolve } from "../../src/core/geometry/camera";
import type { Vec3 } from "../../src/core/geometry/vec";
import type { Footprint } from "../../src/core/types/project";

export const IMG_W = 1920;
export const IMG_H = 1280;
export const ASPECT = IMG_W / IMG_H;

export const CAMERA: CameraSolve = lookAtCamera([0.9, 1.75, 8.6], [0.2, 1.05, -1.2], 42, ASPECT);
export const PERGOLA = { w: 5, d: 4, h: 2.7 };

export function px(p: Vec3): [number, number] {
  const n = project(CAMERA, p);
  if (!n) return [NaN, NaN];
  return [n.x * IMG_W, n.y * IMG_H];
}

function pts(points: Vec3[]): string {
  return points
    .map((p) => px(p))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

export function poly(points: Vec3[], attrs: string): string {
  return `<polygon points="${pts(points)}" ${attrs}/>`;
}

export function line(a: Vec3, b: Vec3, attrs: string): string {
  const [x1, y1] = px(a);
  const [x2, y2] = px(b);
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" ${attrs}/>`;
}

export function footprintForDemo(): Footprint {
  const c = rectangleCorners(PERGOLA.w, PERGOLA.d);
  const out = {} as Footprint;
  for (const k of Object.keys(c) as (keyof Footprint)[]) {
    const p = project(CAMERA, c[k]);
    if (!p) throw new Error("demo footprint projection failed");
    out[k] = { x: Number(p.x.toFixed(5)), y: Number(p.y.toFixed(5)) };
  }
  return out;
}

type Style = "reality" | "archviz";

const palette = {
  reality: {
    skyTop: "#8fa3b8",
    skyBottom: "#e3ded2",
    wall: "#e6ddcc",
    wallShade: "#cfc3ac",
    fascia: "#3a3835",
    glass: "#33403f",
    frame: "#2a2a2c",
    paving: "#c2b9a6",
    pavingLight: "#d1c8b4",
    lawn: "#7c9457",
    lawnDark: "#61793f",
    hedge: "#5a7245",
    fence: "#96826a",
    fenceDark: "#77644e",
    tree: "#6b8150",
    ao: "#000",
  },
  archviz: {
    skyTop: "#6b7b93",
    skyBottom: "#ecd2ab",
    wall: "#e9dcc8",
    wallShade: "#cdbda3",
    fascia: "#2e2b28",
    glass: "#4a3d33",
    frame: "#1f1e1e",
    paving: "#bdaf99",
    pavingLight: "#cfc0a9",
    lawn: "#83925a",
    lawnDark: "#63753f",
    hedge: "#5c723f",
    fence: "#a08768",
    fenceDark: "#7d684f",
    tree: "#71804c",
    ao: "#2a1a0a",
  },
} as const;

function defs(style: Style): string {
  const p = palette[style];
  return `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.skyTop}"/>
      <stop offset="1" stop-color="${p.skyBottom}"/>
    </linearGradient>
    <linearGradient id="wallg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${p.wallShade}"/>
      <stop offset="0.35" stop-color="${p.wall}"/>
      <stop offset="1" stop-color="${p.wall}"/>
    </linearGradient>
    <linearGradient id="pav" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.paving}"/>
      <stop offset="1" stop-color="${p.pavingLight}"/>
    </linearGradient>
    <linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.lawnDark}"/>
      <stop offset="1" stop-color="${p.lawn}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.glass}"/>
      <stop offset="1" stop-color="#151a1c"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="${style === "archviz" ? 0.3 : 0.18}"/>
    </radialGradient>
    <linearGradient id="ao" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.ao}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${p.ao}" stop-opacity="0"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="soft2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.055"/></feComponentTransfer>
    </filter>
    ${
      style === "archviz"
        ? `<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffd9a3" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd9a3" stop-opacity="0"/></radialGradient>`
        : ""
    }
  </defs>`;
}

function environment(style: Style): string {
  const p = palette[style];
  const parts: string[] = [];
  // Sky
  parts.push(`<rect width="${IMG_W}" height="${IMG_H}" fill="url(#sky)"/>`);
  // Distant trees behind house
  const canopies: [number, number, number, number][] = [
    [-6, 4.6, -9, 2.8],
    [-2.5, 5.2, -10, 3.2],
    [2, 4.9, -9.5, 3.0],
    [6, 5.4, -9, 3.4],
    [9.5, 4.4, -8.5, 2.6],
  ];
  for (const [x, y, z, r] of canopies) {
    const [cx, cy] = px([x, y, z]);
    const [rx] = px([x + r, y, z]);
    const rad = rx - cx;
    // Layered canopy: a darker back mass, the main foliage tone, and a soft sunlit highlight — reads as massed trees, not a flat blob.
    parts.push(`<ellipse cx="${(cx - rad * 0.16).toFixed(1)}" cy="${(cy + rad * 0.14).toFixed(1)}" rx="${(rad * 1.08).toFixed(1)}" ry="${(rad * 0.86).toFixed(1)}" fill="${p.hedge}" opacity="0.55" filter="url(#soft)"/>`);
    parts.push(`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rad.toFixed(1)}" ry="${(rad * 0.78).toFixed(1)}" fill="${p.tree}" opacity="0.88" filter="url(#soft)"/>`);
    parts.push(`<ellipse cx="${(cx + rad * 0.24).toFixed(1)}" cy="${(cy - rad * 0.2).toFixed(1)}" rx="${(rad * 0.58).toFixed(1)}" ry="${(rad * 0.44).toFixed(1)}" fill="${p.lawn}" opacity="0.45" filter="url(#soft)"/>`);
  }
  // House rear wall
  const wz = -4.6;
  parts.push(poly([[-11, 0, wz], [11, 0, wz], [11, 3.3, wz], [-11, 3.3, wz]], `fill="url(#wallg)"`));
  parts.push(poly([[-11, 3.3, wz], [11, 3.3, wz], [11, 3.6, wz], [-11, 3.6, wz]], `fill="${p.fascia}"`));
  // Sliding door
  parts.push(poly([[-1.7, 0, wz + 0.02], [1.7, 0, wz + 0.02], [1.7, 2.35, wz + 0.02], [-1.7, 2.35, wz + 0.02]], `fill="${p.frame}"`));
  parts.push(poly([[-1.62, 0.05, wz + 0.03], [-0.04, 0.05, wz + 0.03], [-0.04, 2.28, wz + 0.03], [-1.62, 2.28, wz + 0.03]], `fill="url(#glass)"`));
  parts.push(poly([[0.04, 0.05, wz + 0.03], [1.62, 0.05, wz + 0.03], [1.62, 2.28, wz + 0.03], [0.04, 2.28, wz + 0.03]], `fill="url(#glass)"`));
  // Windows
  for (const [x0, x1] of [[-6.2, -4.2], [3.8, 5.8]] as const) {
    parts.push(poly([[x0, 1.0, wz + 0.02], [x1, 1.0, wz + 0.02], [x1, 2.3, wz + 0.02], [x0, 2.3, wz + 0.02]], `fill="${p.frame}"`));
    parts.push(poly([[x0 + 0.07, 1.07, wz + 0.03], [x1 - 0.07, 1.07, wz + 0.03], [x1 - 0.07, 2.23, wz + 0.03], [x0 + 0.07, 2.23, wz + 0.03]], `fill="url(#glass)"`));
  }
  // Right fence
  const fx = 7.6;
  parts.push(poly([[fx, 0, wz], [fx, 0, 7.4], [fx, 1.8, 7.4], [fx, 1.8, wz]], `fill="${p.fence}"`));
  for (let z = wz; z < 7.4; z += 0.15) {
    parts.push(line([fx, 0, z], [fx, 1.8, z], `stroke="${p.fenceDark}" stroke-width="1.2" opacity="0.7"`));
  }
  // Left hedge
  const hx = -7.8;
  parts.push(poly([[hx, 0, wz], [hx, 0, 7.4], [hx, 1.6, 7.4], [hx, 1.6, wz]], `fill="${p.hedge}"`));
  parts.push(poly([[hx - 0.2, 1.5, wz], [hx - 0.2, 1.5, 7.4], [hx - 0.2, 1.75, 7.4], [hx - 0.2, 1.75, wz]], `fill="${p.hedge}" filter="url(#soft2)"`));
  // Ground: paving then lawn in front
  parts.push(poly([[-12, 0, wz], [12, 0, wz], [12, 0, 7.6], [-12, 0, 7.6]], `fill="url(#lawn)"`));
  parts.push(poly([[-7.6, 0, wz], [7.6, 0, wz], [7.6, 0, 4.2], [-7.6, 0, 4.2]], `fill="url(#pav)"`));
  // Paving joints
  for (let x = -7.2; x <= 7.2; x += 0.8) parts.push(line([x, 0, wz], [x, 0, 4.2], `stroke="#8f8a80" stroke-width="1" opacity="0.5"`));
  for (let z = wz + 0.8; z < 4.2; z += 0.8) parts.push(line([-7.6, 0, z], [7.6, 0, z], `stroke="#8f8a80" stroke-width="1" opacity="0.45"`));
  // Wall base ambient occlusion
  parts.push(poly([[-11, 0, wz], [11, 0, wz], [11, 0, wz + 1.4], [-11, 0, wz + 1.4]], `fill="url(#ao)"`));
  // Small planter near the door for scale
  parts.push(box([2.4, 0, -4.1], 0.5, 0.5, 0.55, "#3b3a37", "#2c2b29", "#4a4946"));
  {
    const [bx, by] = px([2.65, 0.95, -3.85]);
    parts.push(`<ellipse cx="${(bx - 10).toFixed(1)}" cy="${(by + 6).toFixed(1)}" rx="40" ry="26" fill="${p.hedge}" opacity="0.7" filter="url(#soft2)"/>`);
    parts.push(`<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="42" ry="27" fill="${p.tree}" opacity="0.92" filter="url(#soft2)"/>`);
    parts.push(`<ellipse cx="${(bx + 12).toFixed(1)}" cy="${(by - 9).toFixed(1)}" rx="20" ry="13" fill="${p.lawn}" opacity="0.55" filter="url(#soft2)"/>`);
  }
  return parts.join("\n");
}

/** Axis-aligned box drawn as three visible faces (front, right, top). */
export function box(origin: Vec3, w: number, d: number, h: number, front: string, side: string, top: string): string {
  const [x, y, z] = origin;
  const parts: string[] = [];
  parts.push(poly([[x, y, z + d], [x + w, y, z + d], [x + w, y + h, z + d], [x, y + h, z + d]], `fill="${front}"`));
  parts.push(poly([[x + w, y, z + d], [x + w, y, z], [x + w, y + h, z], [x + w, y + h, z + d]], `fill="${side}"`));
  parts.push(poly([[x, y, z], [x + w, y, z], [x + w, y, z + d], [x, y, z + d]], `fill="${side}"`)); // bottom (unseen mostly)
  parts.push(poly([[x, y + h, z], [x + w, y + h, z], [x + w, y + h, z + d], [x, y + h, z + d]], `fill="${top}"`));
  parts.push(poly([[x, y, z], [x, y, z + d], [x, y + h, z + d], [x, y + h, z]], `fill="${side}"`));
  return parts.join("\n");
}

function pergola(style: Style, louverOpen: number): string {
  const { w, d, h } = PERGOLA;
  const hw = w / 2;
  const hd = d / 2;
  const post = 0.14;
  const beamH = 0.24;
  const black = style === "archviz" ? "#232221" : "#1d1d1d";
  const blackSide = style === "archviz" ? "#3a3836" : "#2d2d2d";
  const blackTop = style === "archviz" ? "#4a4744" : "#3a3a3a";
  const parts: string[] = [];
  // Shadow (sun from upper-left-front)
  const sun: Vec3 = [1.1, 0, -0.7];
  const sh = (p: Vec3): Vec3 => [p[0] + sun[0] * (p[1] / 2.2), 0, p[2] + sun[2] * (p[1] / 2.2)];
  const roofTop: Vec3[] = [[-hw, h, -hd], [hw, h, -hd], [hw, h, hd], [-hw, h, hd]];
  parts.push(poly(roofTop.map(sh), `fill="#000" opacity="${style === "archviz" ? 0.32 : 0.26}" filter="url(#soft2)"`));
  for (let z = -hd + 0.25; z < hd; z += 0.28) {
    parts.push(
      poly([sh([-hw, h, z]), sh([hw, h, z]), sh([hw, h, z + 0.14 * (1 - louverOpen)]), sh([-hw, h, z + 0.14 * (1 - louverOpen)])], `fill="#000" opacity="0.18"`),
    );
  }
  // Back posts first
  for (const [x, z] of [[-hw, -hd], [hw - post, -hd]] as const) parts.push(box([x, 0, z], post, post, h, black, blackSide, blackTop));
  // Roof frame: back beam, louver blades, side beams, front beam (painter's order from the camera)
  parts.push(box([-hw, h - beamH, -hd], w, 0.2, beamH, black, blackSide, blackTop)); // back beam
  let i = 0;
  for (let z = -hd + 0.22; z < hd - 0.22; z += 0.28) {
    const blade = 0.22 + 0.06 * (1 - louverOpen);
    const lift = 0.14 * louverOpen;
    const tone = i % 2 === 0 ? blackSide : black;
    parts.push(poly([[-hw + 0.2, h - 0.08, z], [hw - 0.2, h - 0.08, z], [hw - 0.2, h - 0.08 + lift, z + blade], [-hw + 0.2, h - 0.08 + lift, z + blade]], `fill="${tone}"`));
    parts.push(line([-hw + 0.2, h - 0.08, z], [hw - 0.2, h - 0.08, z], `stroke="#4a4846" stroke-width="1" opacity="0.6"`));
    i += 1;
  }
  parts.push(box([-hw, h - beamH, -hd], 0.2, d, beamH, black, blackSide, blackTop)); // left beam
  parts.push(box([hw - 0.2, h - beamH, -hd], 0.2, d, beamH, black, blackSide, blackTop)); // right beam
  parts.push(box([-hw, h - beamH, hd - 0.2], w, 0.2, beamH, black, blackSide, blackTop)); // front beam
  // Front posts
  for (const [x, z] of [[-hw, hd - post], [hw - post, hd - post]] as const) parts.push(box([x, 0, z], post, post, h, black, blackSide, blackTop));
  // Subtle edge highlights on front beam
  parts.push(line([-hw, h, hd], [hw, h, hd], `stroke="#6a6866" stroke-width="1.2" opacity="0.7"`));
  return parts.join("\n");
}

function archvizFurniture(): string {
  const parts: string[] = [];
  // Low sofa, table and two planters under the structure
  parts.push(box([-1.9, 0, -1.3], 2.6, 0.9, 0.42, "#cfc4b1", "#b7ab97", "#ddd3c2"));
  parts.push(box([-1.9, 0.42, -1.3], 2.6, 0.25, 0.4, "#c2b6a2", "#ab9f8b", "#cfc4b1"));
  parts.push(box([-0.9, 0, 0.4], 1.2, 0.7, 0.36, "#2a2826", "#1f1e1c", "#3d3a36"));
  parts.push(box([1.6, 0, -1.4], 0.6, 0.6, 0.7, "#3b3936", "#2c2b29", "#4a4946"));
  {
    const [bx, by] = px([1.9, 1.05, -1.1]);
    parts.push(`<ellipse cx="${(bx - 14).toFixed(1)}" cy="${(by + 8).toFixed(1)}" rx="62" ry="38" fill="${palette.archviz.hedge}" opacity="0.65" filter="url(#soft2)"/>`);
    parts.push(`<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="66" ry="41" fill="${palette.archviz.tree}" opacity="0.92" filter="url(#soft2)"/>`);
    parts.push(`<ellipse cx="${(bx + 18).toFixed(1)}" cy="${(by - 12).toFixed(1)}" rx="30" ry="18" fill="${palette.archviz.lawn}" opacity="0.5" filter="url(#soft2)"/>`);
  }
  // Warm light pool under the roof
  const [cx, cy] = px([0, 0, 0]);
  parts.push(`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="520" ry="150" fill="url(#glow)"/>`);
  // Light strip on front beam underside
  parts.push(line([-2.3, PERGOLA.h - 0.24, PERGOLA.d / 2 - 0.1], [2.3, PERGOLA.h - 0.24, PERGOLA.d / 2 - 0.1], `stroke="#ffd9a3" stroke-width="3" opacity="0.9"`));
  return parts.join("\n");
}

export function sceneSvg(kind: "space" | "reality" | "archviz"): string {
  const style: Style = kind === "archviz" ? "archviz" : "reality";
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${IMG_W}" height="${IMG_H}" viewBox="0 0 ${IMG_W} ${IMG_H}">`);
  parts.push(defs(style));
  parts.push(environment(style));
  if (kind === "archviz") parts.push(archvizFurniture());
  if (kind !== "space") parts.push(pergola(style, kind === "archviz" ? 0.6 : 0.35));
  parts.push(`<rect width="${IMG_W}" height="${IMG_H}" fill="url(#vig)"/>`);
  parts.push(`<rect width="${IMG_W}" height="${IMG_H}" filter="url(#grain)" opacity="0.32"/>`);
  parts.push(`</svg>`);
  return parts.join("\n");
}
