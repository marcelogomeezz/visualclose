/**
 * End-to-end test of the primary Studio path, driven in Chromium.
 *
 *   BASE_URL=http://localhost:3000 SHOTS_DIR=./shots node scripts/tests/studio-flow.test.mjs
 *
 * Requires a running dev server and Playwright (PLAYWRIGHT_MODULE / CHROMIUM_PATH override the defaults).
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "/opt/node22/lib/node_modules/playwright");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR ? resolve(process.env.SHOTS_DIR) : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const root = resolve(import.meta.dirname, "../..");

let failures = 0;
const check = (cond, msg) => {
  if (cond) console.log("ok  :", msg);
  else {
    failures += 1;
    console.error("FAIL:", msg);
  }
};
const shot = async (page, name) => SHOTS && (await page.screenshot({ path: `${SHOTS}/${name}.png` }));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const wait = (ms) => page.waitForTimeout(ms);
const stageBox = () => page.locator(".vc-stage").boundingBox();
const anchors = () => page.evaluate(() => JSON.parse(document.querySelector("[data-test-footprint]")?.getAttribute("data-test-footprint") ?? "null"));
const dims = () => page.evaluate(() => JSON.parse(document.querySelector("[data-test-dimensions]")?.getAttribute("data-test-dimensions") ?? "null"));

// ---------------------------------------------------------------- fresh start
await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
await page.evaluate(() => indexedDB.deleteDatabase("visualclose"));
await page.reload({ waitUntil: "networkidle" });
await wait(800);
// Start from an empty project so the upload path is exercised.
await page.getByRole("button", { name: "Más", exact: true }).click();
await page.getByRole("button", { name: /Nuevo proyecto/i }).click();
await wait(500);
check(await page.getByText("Arrastra una foto de tu espacio.").first().isVisible(), "empty project shows the space drop copy");

// ---------------------------------------------------------------- 1. upload space
const spaceInput = page.locator('aside input[type="file"]').first();
await spaceInput.setInputFiles(resolve(root, "public/demo/pergola/space.jpg"));
await page.getByText("Espacio listo").waitFor({ timeout: 8000 });
check(true, "space uploaded and analysed automatically (ESPACIO LISTO ✓)");
check((await page.locator("aside img").count()) >= 1, "space thumbnail visible");

// ---------------------------------------------------------------- 2. add product
const before = await page.locator("aside img").count();
const productInput = page.locator('aside input[type="file"][multiple]').first();
await productInput.setInputFiles([resolve(root, "public/demo/pergola/ref-front.jpg"), resolve(root, "public/demo/pergola/ref-side.jpg")]);
await page.waitForFunction((n) => document.querySelectorAll("aside img").length === n, before + 2, { timeout: 8000 });
check(true, "two product references added");
await page.getByText("Producto listo").waitFor({ timeout: 8000 });
check(true, "product analysed automatically (PRODUCTO LISTO ✓)");

// ---------------------------------------------------------------- 3. dimensions
const width = page.getByLabel("Ancho");
await width.fill("6");
await width.press("Enter");
const depth = page.getByLabel("Fondo");
await depth.fill("3.5");
await depth.press("Enter");
await wait(300);
let d = await dims();
check(d && d.width === 6 && d.depth === 3.5, `dimensions set (${d?.width} × ${d?.depth} × ${d?.height})`);

// ---------------------------------------------------------------- 4. adjust
await page.getByRole("button", { name: /Ajustar en el espacio/i }).click();
await wait(700);
check(await page.getByRole("button", { name: /^Mover$/i }).isVisible(), "adjust tools visible (MOVER / GIRAR / TAMAÑO)");
await shot(page, "studio-adjust");
const box = await stageBox();
const fp0 = await anchors();
const center = { x: (fp0.FL.x + fp0.BR.x) / 2, y: (fp0.FL.y + fp0.BR.y) / 2 };
const px = (p) => ({ x: box.x + p.x * box.width, y: box.y + p.y * box.height });
// move: drag the body 80px to the right
let c = px(center);
await page.mouse.move(c.x, c.y);
await page.mouse.down();
await page.mouse.move(c.x + 80, c.y, { steps: 10 });
await page.mouse.up();
await wait(300);
const fp1 = await anchors();
check(fp1.FL.x > fp0.FL.x + 0.02, `MOVER drags the footprint on the ground (FL.x ${fp0.FL.x.toFixed(3)} → ${fp1.FL.x.toFixed(3)})`);
// rotate
await page.getByRole("button", { name: /^Girar$/i }).click();
await page.getByRole("button", { name: "+15°" }).click();
await wait(200);
const fp2 = await anchors();
check(Math.abs(fp2.FR.y - fp1.FR.y) > 0.002 || Math.abs(fp2.FR.x - fp1.FR.x) > 0.002, "GIRAR rotates the footprint");
// size: drag the FR corner outwards
await page.getByRole("button", { name: /^Tamaño$/i }).click();
await wait(200);
const fr = px(fp2.FR);
await page.mouse.move(fr.x, fr.y);
await page.mouse.down();
await page.mouse.move(fr.x + 60, fr.y + 20, { steps: 10 });
await page.mouse.up();
await wait(300);
const d2 = await dims();
check(d2.width !== d.width || d2.depth !== d.depth, `TAMAÑO corner drag changes dimensions (${d.width}×${d.depth} → ${d2.width}×${d2.depth})`);
// done → REAL PLAN
await page.getByRole("button", { name: /Listo/i }).click();
await page.getByText("Real plan", { exact: false }).first().waitFor({ timeout: 8000 });
await wait(800);
check((await page.locator("footer").getByText("REAL PLAN").count()) >= 1, "LISTO ✓ creates the REAL PLAN and opens it");

// ---------------------------------------------------------------- 5. visualize → REALIDAD
await page.getByRole("button", { name: /^Visualizar/i }).click();
await wait(600);
check(await page.getByText("Visualizando…").isVisible(), "generation state shown on the button");
await page.locator("main img.vc-fade-in").first().waitFor({ timeout: 15000 });
await wait(400);
check(await page.locator("footer button", { hasText: "REALIDAD" }).first().evaluate((b) => b.className.includes("border-ivory")), "REALIDAD tab active with the new output");
check(await page.getByText("no alineado con tu foto").isVisible(), "uploaded space: mock output is honestly flagged as not aligned");

// ---------------------------------------------------------------- 6. REAL PLAN view
await page.locator("footer button", { hasText: "REAL PLAN" }).first().click();
await wait(500);
check(await page.getByText("Visualización de referencia").isVisible(), "REAL PLAN view shows the reference note");
check((await page.locator("main canvas").count()) >= 1, "REAL PLAN view renders the 3D placement layer");

// ---------------------------------------------------------------- 7. before / after (needs a registered output → demo project)
await page.getByRole("button", { name: "Más", exact: true }).click();
await page.getByRole("button", { name: /Cargar demo/i }).click();
await wait(800);
await page.getByRole("button", { name: /^Visualizar/i }).click();
await page.locator("main img.vc-fade-in").first().waitFor({ timeout: 15000 });
await wait(400);
await page.getByRole("button", { name: /Antes \/ Después/i }).click();
await wait(400);
const b2 = await stageBox();
await page.mouse.move(b2.x + b2.width * 0.5, b2.y + b2.height * 0.5);
await page.mouse.down();
await page.mouse.move(b2.x + b2.width * 0.7, b2.y + b2.height * 0.5, { steps: 6 });
await page.mouse.up();
await wait(300);
check(await page.getByText("Antes", { exact: true }).isVisible() && (await page.getByText("Después", { exact: true }).isVisible()), "Before / After slider active with labels");
await shot(page, "studio-realidad-compare");
await page.getByRole("button", { name: /^Salir$/i }).click();
await wait(300);
await shot(page, "studio-realidad");
await page.getByRole("button", { name: /Ajustar en el espacio/i }).click();
await wait(400);
await page.getByRole("button", { name: /Listo/i }).click();
await wait(1200);
await shot(page, "studio-realplan");

// ---------------------------------------------------------------- present
await page.getByRole("button", { name: /^Presentar$/i }).click();
const waitFrame = async (n) => {
  await page.waitForFunction((f) => document.querySelector(".present-stage")?.getAttribute("data-active-frame") === f, n, { timeout: 40000 });
  await wait(1500);
};
await page.mouse.move(800, 500);
await waitFrame("reveal");
await shot(page, "present-169");
await page.mouse.move(800, 20);
await wait(200);
await page.getByRole("tab", { name: "9:16" }).click();
await page.mouse.move(800, 500);
await waitFrame("technical");
await shot(page, "present-916");
await page.keyboard.press("Escape");

console.log(errors.length ? `console errors:\n${errors.join("\n")}` : "console errors: none");
await browser.close();
if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log("studio flow: all checks passed");
