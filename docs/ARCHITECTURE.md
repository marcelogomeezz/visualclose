# VISUALCLOSE — Architecture (Milestone 1)

This is the architecture proposal that Milestone 1 was built against. It
answers the seven pre-coding questions from the brief: project architecture,
main screen composition, state model, 3D architecture, what is mocked,
and risks.

## 1. Project architecture

```
src/
  app/                      Next.js App Router
    page.tsx                → the Experience (public site)
    studio/page.tsx         → the Studio (single workspace)
    layout.tsx, globals.css design tokens, typography
    api/ai/*/route.ts       server routes → AI provider adapter (mock today)
    api/generate/[mode]/route.ts server route → generation provider (mock today)
  core/                     framework-free domain layer
    types/                  ProductPack, Project, Outputs, AI structures
    geometry/               homography camera solve, projection, footprint math
    product-packs/          the four demo packs (data only)
    demo/                   demo project factory
  providers/                server-side adapters (never imported by the client)
    ai/                     AIProvider interface, MockAIProvider, OpenAIProvider (stub)
    generation/             GenerationProvider interface, MockGenerationProvider, HiggsfieldProvider (stub)
  state/                    typed central store + persistence
    project-store.ts        project state + actions
    ui-store.ts             view mode, selection, present, dev
    persistence/            IndexedDB (idb): projects, blobs, meta
  components/
    experience/             Nav, Hero + HeroScene (R3F), scroll sections, CategoryScene (R3F), RealPlanOverlay, TransitionCurtain
    studio/                 TopBar, rail (inputs), canvas, fit (R3F + sticker handles), outputs bar, sheets (Proyectos, Avanzado)
    present/                PresentMode + GSAP sequence + frames
    ui/                     tiny primitive set (Button, Field, Segmented, …)
  lib/                      gsap registration, image helpers, PNG export, formatting
scripts/demo-assets/        renders the placeholder demo images with the same
                            projection math the app uses
public/demo/                placeholder assets (replaceable)
```

Rules:

- `core/` has no React and no browser globals; it is testable in Node.
- `providers/` is server only. Client code talks to `/api/*` routes only.
- Everything product-specific lives in Product Pack data. No component
  branches on "pergola".

## 2. Main screen composition

```
┌──────────────────────────────────────────────────────────────────────────┐
│ VISUALCLOSE            Milano X · Rear garden           PROJECTS PRESENT DEV │
├──────────┬───────────────────────────────────────────────────┬───────────┤
│ ASSET    │ ORIGINAL FIT TECHNICAL REALITY ARCHVIZ MOTION      │ INSPECTOR │
│ DOCK     │                                                   │ (context) │
│          │                                                   │           │
│ SPACE    │               C A N V A S  (photo)                │ Product   │
│ PRODUCT  │        R3F placement layer in FIT / TECHNICAL      │ Dimensions│
│ REFS     │                                                   │ Placement │
│          │                                     [ VISUALIZE ] │ Intel.    │
├──────────┴───────────────────────────────────────────────────┴───────────┤
│ OUTPUT STRIP   ORIGINAL  TECHNICAL  REALITY 01  ARCHVIZ 01  …            │
└──────────────────────────────────────────────────────────────────────────┘
```

Desktop grid: 264px dock · fluid canvas · 300px inspector · 116px strip.
The canvas column is the only region with photography and holds the
visual weight. Panels are flat graphite surfaces separated by hairlines.

## 3. State model

One strongly typed `Project` (see `src/core/types/project.ts`):

```
Project
├─ id, name, createdAt, updatedAt, revision
├─ space: SpaceAsset | null              (AssetRef + pixel size)
├─ productPack: ProductPack              (editable copy; references live here)
├─ dimensions: Dimensions                (authoritative numbers, units)
├─ referenceMeasurement: ReferenceMeasurement | null
├─ placement: Placement                  (footprint FL/FR/BL/BR, wallAnchor, lens, rotation, locked)
├─ geometryReference: GeometryReference | null   (snapshot on LOCK)
├─ sceneLock: SceneLock | null
├─ productDNA: ProductDNA | null
├─ outputs: OutputRecord[]
└─ presentation: { prospectName, prospectLogo, aspect }
```

`revision` increments on every geometric change; outputs remember the
`sourceRevision` they were produced from so stale outputs are identifiable.

UI state (`ui-store.ts`) is separate and not persisted: view mode, selected
output, compare, zoom/pan, generating status, open sheets, present mode.

Persistence: `idb` stores `projects` (JSON), `assets` (Blobs keyed by asset
id) and `meta` (current project id). Blob assets are re-hydrated into object
URLs on load. Demo assets are URL assets under `/demo`.

## 4. 3D architecture (FIT / TECHNICAL)

The photograph is the hero; the 3D layer explains installation. The layer
is a transparent React Three Fiber canvas sized exactly to the displayed
photograph. Its camera is not free: it is **solved from the operator's
footprint anchors**.

1. The four footprint anchors (normalized image coordinates) are matched
   to a true W×D rectangle on the ground plane (y = 0).
2. A planar homography is solved exactly from the four correspondences
   (`core/geometry/homography.ts`).
3. Focal length is estimated from the homography's orthogonality
   constraint when the anchors form a plausible perspective quad (auto lens),
   or taken from the operator's manual lens setting.
4. The homography is decomposed into a camera pose (R, t). That pose drives
   the Three.js PerspectiveCamera. The placement volume is an axis-aligned
   box at the world origin, so its footprint lands on the anchors and its
   height extrudes with correct perspective foreshortening.

Interactions are therefore expressed in world space and re-projected:

- **Translate**: pointer deltas are raycast to the ground plane; corners move
  by a world vector, then are re-projected.
- **Rotate**: the rectangle rotates about its centre in world space.
- **Width / depth**: the rectangle is rebuilt with the new size around its
  centre (wall-attached types keep the back edge).
- **Height**: extrusion only.
- **Anchor drag**: the anchor follows the pointer; on release the four
  anchors snap to the re-projected true rectangle so the state is always a
  real rectangle under a real camera.

The same projection math (`project()`) draws the TECHNICAL PNG in 2D at
source resolution and the present-mode SVG overlay, so all three views agree.

Honesty: single photo, planar ground assumption, operator-authored anchors.
The lens estimate and a "perspective consistency" hint are visible, and the
TECHNICAL view carries the on-site verification note.

## 4b. REALITY pipeline: photo editing, not scene generation

**AI changes the product region. The real photograph remains the source of truth.**

```
originalPhoto ─┐
productRefs ───┤
productDNA ────┤          ┌────────────────────┐
placementRef ──┼────────▶ │ generateReality()  │ ───▶ editedPhoto ──▶ preservation check ──▶ REALIDAD
placementMask ─┤          └────────────────────┘        (outside the mask must match the original)
dimensions ────┤
preservation ──┘
rules
```

- **Placement reference** (`renderPlacementReference`): the original photograph with a clean outline of the
  placement volume. Perspective guidance for the editor. No labels unless requested.
- **Placement mask** (`renderPlacementMask`): white-on-black editable region = convex hull of the projected
  volume and its ground shadow, padded by `maskSettings.paddingPx` for shadows, occlusion and contact.
  Stored separately from the reference (`project.placementMask`, `project.placementReference`).
- **Scene preservation rules** (`ScenePreservationRules`): what must not change (from the scene analysis when
  available) and the single editable region.
- **Validation** (`core/validation/preservation.ts`): compares ORIGINAL vs REALITY outside the mask and reports
  the share of changed pixels. It flags a moved door, a changed floor or a missing plant. It is an estimate
  for internal QA, never a pixel-perfect guarantee.
- **Mock today**: no provider is connected, so `MockGenerationProvider.generateReality` returns
  `client-composite` and the browser composes a product proxy inside the mask over the user's own photograph
  (`lib/reality-composite.ts`). By construction every pixel outside the mask equals the original. The result is
  labelled *muestra*. It is a stand-in for the real product, never a reconstructed scene.
- Three.js is used for placement, dimensions, orientation, perspective guidance, footprint, anchor points and
  the two AI inputs above. It is never shown as REALIDAD or REAL PLAN; REAL PLAN draws its overlay as SVG over
  the photograph.

## 5. Provider adapters

```
AIProvider            { analyzeScene, analyzeProduct, createRenderBrief, validateResult }
GenerationProvider    { generateReality, generateArchviz, generateMotion }
```

`getAIProvider()` / `getGenerationProvider()` select the implementation from
server environment (`VISUALCLOSE_AI_PROVIDER`, `VISUALCLOSE_GENERATION_PROVIDER`).
Today only `mock` is functional; `openai` and `higgsfield` classes exist,
type-check, and throw `ProviderNotConfiguredError`. No endpoint URLs or model
IDs are invented. Credentials never leave the server.

## 6. What is mocked in Milestone 1

| Piece | Milestone 1 | Later |
| --- | --- | --- |
| Product DNA | Deterministic template from Product Pack fields (curated for the demo packs) | `analyzeProduct()` via OpenAI |
| Scene Lock | Deterministic template (curated for the demo space) | `analyzeScene()` via OpenAI |
| REALITY | Client-side composite of a product proxy inside the placement mask over the user's photograph (labelled *muestra*) | Higgsfield image **edit** of the same photograph |
| ARCHVIZ | PLACEHOLDER synthetic art for the demo pack, generic placeholder otherwise | Stylised architectural visualization |
| MOTION | Disabled slot, EXPERIMENTAL | Higgsfield / Genjutsu video |
| Demo photographs | Synthetic placeholder scenes rendered by `scripts/demo-assets` (Higgsfield credits were not available during the build) | Real photography and generated outputs |
| Generation transition | Timed GSAP sequence with restrained status language | Real job status |

## 7. Risks

- **Perspective solve stability**: with degenerate anchors (three collinear,
  self-intersecting quad) the homography is singular. The solver returns
  `null` and the layer keeps the last valid solve; the UI shows a hint.
- **Focal ambiguity**: auto lens can fail on near-parallelogram footprints
  (top-down views). Manual lens is always available.
- **Placeholder credibility**: synthetic demo imagery cannot look like a
  photograph. Replacing `public/demo/pergola/*` with real assets is a
  file swap; anchors for a new photo are set in FIT and saved with the
  project.
- **WebGL and export**: the TECHNICAL PNG is drawn in 2D from the same
  projection so export does not depend on WebGL buffer preservation.
- **Portrait present mode**: landscape photographs are cropped with
  `object-fit: cover`; the crop focus is the footprint centre so the product
  stays in frame.
- **Large uploads**: images are stored as Blobs in IndexedDB; thumbnails are
  generated at 320px to keep the Output Strip light.
