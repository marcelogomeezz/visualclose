# Milestone 1 — Status

Verified end to end in Chromium (desktop 1600×950, and Present mode at 16:9, 9:16 and 1:1) with a scripted run of the
full acceptance path: open → load demo → inspect space → inspect Product Pack → FIT → modify volume → change
dimensions → lock placement → TECHNICAL → Product DNA → Scene Lock → REALITY → VISUALIZE → Before/After → Output Strip
→ PRESENT. Production build, lint and typecheck are clean. The only console message is a Three.js deprecation warning
emitted by React Three Fiber itself.

## What works

- **Single creative workspace**: Asset Dock · Canvas · contextual Inspector · Output Strip · minimal top bar.
- **Asset Dock**: drag-and-drop space photograph (replace / remove), 1–8 typed product references, optional context references, Product Pack selector, LOAD DEMO PROJECT.
- **Canvas modes**: ORIGINAL (zoom / pan, no decorative motion), FIT, TECHNICAL, REALITY, ARCHVIZ, MOTION (disabled, EXPERIMENTAL).
- **FIT**: real React Three Fiber layer. The camera is solved from the four footprint anchors by planar homography; the volume is a true W×D×H box so height foreshortens correctly. Anchor drag, ground-plane translate (centre handle), rotate, width / depth / height, units, lens slider, one-shot lens estimation from anchors, wall anchor, reset.
- **Reference measurement**: Point A / Point B pick, known distance and units, label. Shows what the current placement would imply for that distance on the ground plane as calibration feedback.
- **LOCK PLACEMENT**: freezes dimensions, anchors, orientation, lens and reference measurement into a geometry reference and renders a TECHNICAL output (PNG at source resolution, drawn in 2D with the same projection). Export PNG is available at any time.
- **TECHNICAL view**: photograph + volume + footprint + dimension labels + product name + configuration + the on-site verification note.
- **Product DNA / Scene Lock**: LEARN PRODUCT and ANALYZE SPACE run through the server AI adapter (mock) and show structured results with honest wording ("no model was trained", "keep the real environment real").
- **VISUALIZE**: single prominent action, restrained generation transition (sweep, hairline, status words, no percentages), appends REALITY / ARCHVIZ outputs through the server generation adapter (mock).
- **Output Strip**: ORIGINAL, TECHNICAL nn, REALITY nn, ARCHVIZ nn with thumbnails, favorite marker, stale-revision marker. Clicking changes the canvas. Favorite, download, compare, duplicate settings, delete live in the inspector for the selected output.
- **Compare**: Before / After slider with identical transforms. Disabled with an explicit "not registered to this space" note when framing differs.
- **PRESENT**: hides all authoring UI and runs a GSAP sequence: brand → space (slow push) → references → dimensions (static) → technical placement (SVG overlay registered to the photo) → REALITY reveal (mask wipe) → ARCHVIZ (if present) → Before/After (camera fixed) → `[PROSPECT] × VISUALCLOSE`. 16:9, 9:16 and 1:1 actually recompose. Prospect name and logo. Space / R / Esc keys, auto-hiding controls.
- **Persistence**: projects, uploaded files and rendered technical PNGs in IndexedDB; multiple projects via the PROJECTS sheet. DEV sheet shows the solve, frame rate, provider selection and state JSON.

## What is mocked

| Area | Milestone 1 |
| --- | --- |
| Demo photograph and REALITY / ARCHVIZ outputs | Synthetic placeholder scenes rendered by `scripts/demo-assets`, drawn with the same camera the app solves, so the demo is geometrically coherent. They are not photographs. Higgsfield credits were not available during the build, so no generated imagery was used. |
| Product DNA | Deterministic template from the Product Pack (curated text for Milano X) via `MockAIProvider.analyzeProduct`. |
| Scene Lock | Deterministic template via `MockAIProvider.analyzeScene`. |
| Render brief / validation | Structured but mock. |
| REALITY / ARCHVIZ for uploaded photos | Generic placeholder flagged `registered: false`; compare is disabled for it. |
| MOTION | Disabled slot. |
| Generation transition | Timed, not tied to a real job. |
| Other three Product Packs | Reference drawings only; no dedicated outputs (they fall back to the generic placeholder). |

## What needs refinement

- Anchor snapping after a drag is exact only when the quad is consistent with the current lens; with a mismatched lens the four anchors settle a few pixels from where they were released. A least-squares pose fit would soften this.
- The centre handle translates on the ground plane; there is no keyboard nudge yet.
- Wall anchor only aligns the back edge; it does not constrain rotation to the wall line.
- Reference measurement is a calibration aid, as specified; it does not yet offer a one-click "scale placement to this distance".
- Present mode uses the live project state; a locked geometry reference is not required to present.
- Placeholder art direction: the synthetic scene is clean but obviously vector. Real photography and real provider outputs are a file swap.
- No mobile / touch layout for the studio (Present mode works at any viewport).

## Performance

- The FIT layer uses `frameloop="demand"`; nothing renders unless state changes. Idle CPU is near zero.
- Anchor drags re-solve an 8×8 linear system per pointer move; negligible.
- Zooming raises the WebGL canvas device-pixel ratio up to 3× so lines stay crisp; on very large photos at high zoom this is the main GPU cost.
- IndexedDB writes are debounced (350 ms). Technical PNG export is capped at 2400 px on the long edge.
- Image assets: demo JPEGs are 110–200 KB each. Uploaded photos are stored as-is; thumbnails are 360 px.

## File architecture

See `docs/ARCHITECTURE.md` §1. Key entry points:

- `src/components/studio/Studio.tsx` — workspace shell
- `src/components/studio/canvas/StudioCanvas.tsx` — mode composition over the photograph
- `src/components/studio/fit/FitLayer.tsx` — React Three Fiber placement volume + solved camera
- `src/core/geometry/camera.ts` — homography solve, focal estimation, projection
- `src/state/project-store.ts` — typed project state and all actions
- `src/providers/ai`, `src/providers/generation` — server adapters (mock, OpenAI stub, Higgsfield stub)
- `src/components/present/PresentMode.tsx` — cinematic sequence

## Next recommended milestone

**Milestone 2 — Real inputs, real outputs.**

1. Connect the Higgsfield generation adapter for REALITY (image edit with the source photograph, render brief and locked geometry as inputs), keeping the mock as fallback. Add job status to the generation overlay.
2. Connect the OpenAI adapter for `analyzeProduct` and `analyzeScene` with the same response shapes already used by the UI.
3. Replace demo placeholders with real photography and a real generated pair; re-set the demo anchors in FIT and commit them.
4. Placement robustness: least-squares pose refinement, keyboard nudges, wall-line rotation constraint.
5. Output provenance: store the render brief with each output and expose it in the inspector.
