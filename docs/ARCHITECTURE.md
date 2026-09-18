# VISUALCLOSE — Architecture (Milestone 1)

This is the architecture proposal that Milestone 1 was built against. It
answers the seven pre-coding questions from the brief: project architecture,
main screen composition, state model, 3D architecture, what is mocked,
and risks.

## 1. Project architecture

```
src/
  app/                      Next.js App Router
    page.tsx                → mounts the Studio (single workspace)
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
    studio/                 TopBar, AssetDock, Canvas, Fit (R3F), Inspector, OutputStrip, sheets
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
| REALITY / ARCHVIZ outputs | Pre-rendered placeholder images per pack; for user-uploaded spaces the mock is flagged *not registered* | Higgsfield image generation with render brief |
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
