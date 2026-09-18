# Milestone 2 — Product simplification, UX redesign, 3D Experience

Branch `claude/visualclose-architecture-setup-0lg68y`. Builds on Milestone 1 without touching the geometry engine,
persistence, alignment, compare logic, provider adapters or the present-mode engine. The audit that preceded the
work is in `docs/UX_AUDIT.md`.

## Information architecture

| Route | What it is |
| --- | --- |
| `/` | **VisualClose Experience.** Cinematic, scroll-controlled product site: hero (React Three Fiber scene), Before / After story, category dioramas, REAL PLAN, How it works, Outputs, About, closing CTA. English copy. |
| `/studio` | **VisualClose Studio.** Three inputs, one action, one big canvas. Spanish UI. |

`TRY VISUALCLOSE →` raises a graphite curtain with the wordmark, changes route underneath and lifts once the Studio is mounted, so the two feel like one product. The Studio wordmark links back to the Experience.

## Studio (what the user sees)

- **Left rail:** TU ESPACIO · TU PRODUCTO · MEDIDAS (opcional) · AJUSTAR EN EL ESPACIO · VISUALIZAR ✦. Nothing else.
- Uploading a space runs the (simulated) analysis automatically: `ANALIZANDO ESPACIO…` → `ESPACIO LISTO ✓`. Same for the product: `ANALIZANDO PRODUCTO…` → `PRODUCTO LISTO ✓`. Scene Lock / Product DNA are never named.
- **AJUSTAR:** the product is a sticker with real dimensions behind it. MOVER drags it on the ground plane, GIRAR rotates (drag sideways or ±15° / ±90°), TAMAÑO exposes four corner handles for width / depth and a top handle for height. LISTO ✓ saves the placement and creates the REAL PLAN. The homography camera, lens, four-anchor perspective editing and the reference measurement are still there, under `› Avanzado` inside the adjust panel.
- **REAL PLAN** (formerly TECHNICAL): real photograph + footprint + volume + measurements + product name + configuration, with the small disclaimer *Visualización de referencia. Verificar medidas finales antes de instalación.* Exported PNG uses the same wording.
- **VISUALIZAR ✦** defaults to REALIDAD; `Opciones` switches to ARQUITECTURA.
- **Bottom bar:** ORIGINAL · REALIDAD · REAL PLAN · ARQUITECTURA · MOVIMIENTO (PRÓXIMAMENTE). Version chips (01, 02…) appear only when a type has more than one output.
- **Canvas:** ANTES / DESPUÉS on registered REALIDAD / ARQUITECTURA outputs, one download button. Uploaded spaces get the honest note *Resultado de muestra · no alineado con tu foto* because the mock provider cannot render them.
- **···** menu: Proyectos, Nuevo proyecto, Cargar demo, Avanzado. **Avanzado** holds product data, analysis internals, output provenance (provider, revision, alignment, favorite, reuse settings, delete), geometry readouts and developer state.
- **PRESENTAR:** REAL SPACE → REAL PRODUCT → REAL DIMENSIONS → REAL PLAN → REALITY → BEFORE / AFTER → `SEE IT. BEFORE IT EXISTS.` with `[PROSPECT] × VISUALCLOSE`. 16:9, 9:16, 1:1.
- **Mobile:** the Studio stacks canvas above the rail; the Experience is fully responsive (hero, dioramas and REAL PLAN verified at 390 px).

## Experience (what a visitor sees)

1. **Hero:** graphite architectural ground with a faint grid, the ivory placement volume, and the first product materialising inside it. Slow camera drift, faint mouse parallax, scroll push-in. Copy: SEE IT. / BEFORE IT EXISTS.
2. **Don't imagine it. See it.** Sticky Before / After driven by scroll, then draggable.
3. **One tool. Every physical product.** Four sticky groups (OUTDOOR, INTERIOR, ARCHITECTURE, COMMERCIAL) with matte dioramas built from primitives that swap spatially as the camera turns.
4. **REAL PLAN:** the demo photograph becomes a plan as you scroll: footprint, verticals, top, anchor ticks, then labels and product name. Same solver as the Studio.
5. **How it works:** 01 ADD YOUR SPACE · 02 ADD YOUR PRODUCT · 03 VISUALIZE.
6. **Outputs:** REALITY (primary), REAL PLAN, ARCHITECTURE, MOTION (coming later).
7. **About** and closing CTA.

## Engineering notes

- New geometry helpers only: `resizeFromCorner`, `heightFromPointer`, `pointInFootprint`, `footprintInsideImage` (`src/core/geometry/footprint.ts`).
- New store actions only: `applyCornerResize`, `applyHeightDrag`. Dimension changes that would push the product out of the photograph now keep the footprint and re-interpret it (found by the e2e test).
- New projects start with a blank product (`createCustomPack`) instead of the demo pack.
- Output type `TECHNICAL` is unchanged in state and persistence; it is labelled REAL PLAN everywhere.
- GSAP ScrollTrigger is registered in `src/lib/gsap.ts`. Both R3F scenes on the Experience run at capped device-pixel ratio.

## Tests

- `npm run test:geometry` — 20 checks (homography round-trip, lens estimation, convexity guard, sticker handles).
- `npm run test:e2e` — Chromium run of the primary Studio path against a dev server: upload space → auto analysis → add product → dimensions → AJUSTAR (move, rotate, corner resize) → LISTO → REAL PLAN → VISUALIZAR → REALIDAD → REAL PLAN view → Before / After (on the demo project, since uploaded spaces have no registered mock output). 18 checks, no console errors.

## Correction: REALITY is photographic editing

> **AI changes the product region. The real photograph remains the source of truth.**

- REALIDAD is no longer a pre-rendered scene. `public/demo/pergola/reality.jpg` is gone. The mock provider
  returns `client-composite` and the browser paints a product proxy **only inside the placement mask** over the
  user's own photograph. Every pixel outside the mask is the original; the output is labelled *muestra*.
- Uploaded photographs now get a registered REALIDAD (it is their own photo), so ANTES / DESPUÉS works for
  them too, in the same viewport.
- LISTO ✓ hides the 3D guide and returns to the clean original photograph. REAL PLAN is available in the bottom
  bar and draws its overlay as SVG over the photograph; no WebGL in any output.
- New per-project AI inputs: `placementReference` and `placementMask` (regenerated on LISTO and before every
  VISUALIZAR when the geometry changed), with `maskSettings` (padding, shadow reach) in Avanzado.
- New validation interface: `comparePreservation()` and `estimatePreservation()` report the share of changed
  pixels outside the mask. Shown in Avanzado as *Fondo conservado*, clearly marked as an estimate.
- Provider abstraction now speaks edit: `RealityEditRequest` → `editedPhoto` (`GenerationResult`). No Higgsfield
  endpoint is invented.
- Demo imagery is explicitly PLACEHOLDER (synthetic drawings). A real photographic pair (same camera, crop,
  background, architecture; only the product differs) is required before REALIDAD has a visual target.

## Still mocked / still open

- Everything AI: analyses and outputs are the same mock providers as Milestone 1. Uploaded spaces cannot get a registered REALIDAD until a provider is connected.
- Demo imagery is still synthetic placeholder art.
- Category dioramas are abstract primitives, not product photography.
- Sticker resize commits the true rectangle on release; with a poorly matched lens the handles settle a few pixels from the drop point (same limitation as Milestone 1, now hidden behind Avanzado).
