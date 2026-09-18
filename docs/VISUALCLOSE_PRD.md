# VISUALCLOSE — Product Requirements

> Status: recovered from the founding brief (September 2026). The original
> `docs/VISUALCLOSE_PRD.md` was not present in the repository when Milestone 1
> started; this document records the brief so the product intent is versioned
> with the code. Amend it here, not in chat.

## 1. What VisualClose is

VisualClose is a **private creative AI visualization studio** for physical
products inside real spaces. The closest mental model is
*"Higgsfield for physical products inside real spaces."*

It is operated by one person (the owner) to produce:

- product visualization demos
- personalized sales demonstrations
- Before / After assets
- REALITY visualizations
- ARCHVIZ visualizations
- TECHNICAL placement views
- later, MOTION visualizations

It is **not** a pergola application, a SaaS dashboard, a CRM, or a public
customer platform.

### The equation

```
REAL SPACE + REAL PRODUCT + REAL DIMENSIONS + CONTROLLED PLACEMENT
= VISUALIZED BEFORE INSTALLATION
```

### Product categories

The architecture must support many physical-product categories without
rewriting the application: pergolas, pools, outdoor kitchens, kitchens,
closets, furniture, windows, doors, facades, flooring, wall finishes,
carports, solar structures, jacuzzis, gym equipment, landscaping products,
lighting, commercial installations. Pergolas are only the first sales niche
and the first demo Product Pack.

## 2. First principle

VisualClose must feel like a creative AI studio (Higgsfield, Runway, a
high-end 3D configurator), not a dashboard, wizard, admin panel or forms app.

The workspace revolves around **one large visual canvas**. The canvas is the
hero; everything else exists around it and should hold roughly 65–75% of the
perceived visual attention.

## 3. Workspace composition

Single creative workspace. No conventional per-step pages.

| Region | Content |
| --- | --- |
| Top | Minimal global controls: `VISUALCLOSE` · project name · `PROJECTS` `PRESENT` `DEV` |
| Left | Asset Dock: SPACE, PRODUCT, OPTIONAL REFERENCES |
| Center | Canvas |
| Right | Contextual product / placement controls |
| Bottom | Output Strip |

### Asset Dock

Inputs for the current project. SPACE accepts one primary environment
photograph. PRODUCT accepts 1–8 reference images of the same physical product,
typed as `front | side | rear | detail | installed | material | other`.
Drag-and-drop is central. It must feel like adding assets to a creative
project, not Step 1 / Step 2 forms.

### Product Pack

Generic data structure: id, name, category, reference images, width, depth,
height, units, color, material, finish, installation type, custom
specifications, placement type, notes, future AI Product DNA.

Placement types: `FREESTANDING_STRUCTURE`, `WALL_ATTACHED_STRUCTURE`,
`FLOOR_OBJECT`, `WALL_SURFACE`, `FLOOR_SURFACE`, `OBJECT_REPLACEMENT`,
`ROOM_TRANSFORMATION`, `CUSTOM`. Never hardcode around pergolas.

Four demo packs: Outdoor Structure (Milano X Pergola), Interior Installation
(Linea Kitchen System), Surface Transformation (Travertine Facade System),
Standalone Product (Forma Outdoor Lounge). Assets may be placeholders and must
be replaceable.

## 4. Canvas and view modes

The real uploaded environment photograph stays visually dominant.

| Mode | Meaning |
| --- | --- |
| ORIGINAL | Source photograph, zoom and pan, no decorative motion. |
| FIT | Real React Three Fiber placement layer with a translucent architectural Placement Volume sized from the configured dimensions. Translate, rotate, change width/depth/height. Dimensions are deterministic numeric state; AI is never authoritative for dimensions. |
| TECHNICAL | Photograph + volume + footprint + dimensions + product name + configuration. Not a construction drawing. Note: "Visual placement guide. Verify final installation on site." PNG export. |
| REALITY | "See it as if it were already installed." Environment remains authoritative. |
| ARCHVIZ | "See the architectural vision." Same product, placement and dimensions with refined presentation. Never a recolor of REALITY. |
| MOTION | "See the transformation in motion." EXPERIMENTAL / COMING LATER. |

### Geometric honesty rules

- A single photograph does not produce survey-grade 3D reconstruction and the
  product must never claim it does.
- The placement layer is a **visual placement guide** built on a planar
  ground assumption and operator-authored anchors. Every technical view
  carries the on-site verification note.
- Reference measurement (Point A, Point B, one known distance) is a
  calibration aid. It is stored (image coordinates, distance, units) and
  displayed; it does not silently rewrite dimensions.
- Dimensions are typed numbers entered by the operator. AI may describe, it
  may never measure.
- Compare views only claim registration when the two images share the same
  source framing. If framing differs, say so instead of pretending.

### Placement

Four footprint anchors (FL, FR, BL, BR) in normalized source-image
coordinates, plus an optional wall attachment anchor. LOCK PLACEMENT stores
the configured dimensions, footprint anchors, orientation and reference
measurement, and creates a geometry reference snapshot. The technical view
is always separate from AI imagery.

## 5. Intelligence (structured understanding, not training)

- **LEARN PRODUCT → Product DNA**: product summary, distinctive visual
  features, major structural components, materials, colors, components that
  must not change, product fidelity rules, rendering constraints. UX says
  "PRODUCT DNA CREATED" and never claims model training.
- **ANALYZE SPACE → Scene Lock**: architecture to preserve, doors, windows,
  floor, walls, landscaping, background, important objects, potential
  installation region, visual obstructions. Message: "Keep the real
  environment real."

Both are simulated in Milestone 1 through the same server adapter interface
the real providers will implement.

## 6. Outputs

Output Strip at the bottom: ORIGINAL, TECHNICAL, REALITY 01, REALITY 02,
ARCHVIZ 01, MOTION 01 … as thumbnails. Clicking changes the canvas. Each
output keeps type, source revision, timestamp, thumbnail, full asset,
provider/provenance and settings. Actions: favorite, download, compare,
duplicate settings, delete.

Compare: smooth Before / After slider between compatible outputs (primary:
ORIGINAL ↔ REALITY) using identical viewport transforms.

VISUALIZE is the single prominent action. Milestone 1 shows a premium short
generation transition with restrained status language (no fabricated
percentages) and appends the mock output.

## 7. PRESENT mode

Hides authoring UI and runs a cinematic sequence from the current project:
original real space → product references → configured dimensions → technical
placement → visualization reveal → Before / After → brand frame. Supports
16:9, 9:16 and 1:1 with real recomposition. Optional prospect company name
and logo; final frame `[PROSPECT] × VISUALCLOSE`.

## 8. Art and motion direction

Near-black graphite, warm off-white, ivory, muted warm grey, restrained
champagne accent. No neon, no purple gradients, no generic AI visual
language. Photography provides the color. Modern grotesk typography, large
editorial headings, little body copy. Flat, precise, architectural UI. No
large rounded cards, dashboard widgets, glass everywhere, constant blur or
huge shadows.

Motion should feel expensive: camera pushes, small spatial transitions,
image-plane movement, precise fades, controlled mask reveals. No bouncing,
springs, floating, orbiting or gamified motion. Decorative camera motion
stops when inspecting dimensions; the camera is completely stable during
Before / After.

3D exists to explain spatial installation and supports the photograph.

## 9. Tech and integration constraints

Next.js, TypeScript, React, React Three Fiber, Three.js, drei, GSAP.
Tailwind for layout only. Vercel deployment. Local persistence (IndexedDB)
only in Milestone 1: no accounts, auth, billing, cloud collaboration.

Future providers are connected through server-side adapters only:

- OpenAI (GPT-6 Astra): `analyzeScene`, `analyzeProduct`, `createRenderBrief`,
  `validateResult`.
- Higgsfield: `generateReality`, `generateArchviz`, `generateMotion`.

No live AI calls in the first pass. Never expose provider credentials
client-side. Never invent endpoint URLs or model IDs.

## 10. Milestone 1 acceptance path

open VisualClose → load demo project → inspect real space → inspect Product
Pack → open FIT → modify the 3D placement volume → change exact dimensions →
lock placement → view TECHNICAL → simulate Product DNA → simulate Scene Lock
→ select REALITY → press VISUALIZE → coherent demo result → compare BEFORE /
AFTER → see the output in the Output Strip → enter PRESENT → run the
cinematic demo.

Quality bar at every decision: *"Would this feel credible if Higgsfield
released a specialized tool for physical product visualization?"*
