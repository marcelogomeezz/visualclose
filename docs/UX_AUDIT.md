# UX audit before the Milestone 2 redesign

Scope: the Milestone 1 studio as shipped on `claude/visualclose-architecture-setup-0lg68y` (commit 0102988).
Goal of the redesign: a two-part product (immersive Experience site + radically simplified Studio) on top of the
existing engineering, with no rewrite of geometry, state, persistence, alignment, compare or provider layers.

## 1. What creates unnecessary cognitive load

| Element | Why it hurts |
| --- | --- |
| Six top-level modes (ORIGINAL · FIT · TECHNICAL · REALITY · ARCHVIZ · MOTION) | Two of them are tools (FIT), not outputs. The user has to understand the difference before doing anything. |
| Permanent right inspector with 4–6 stacked panels | Reads as CAD / dashboard. Panels change with mode, so the user never learns where things are. |
| Placement panel: lens (vertical FOV), estimate, rotation buttons, normalized anchor coordinates, wall anchor | Camera-solver vocabulary leaks into the primary workflow. Nobody selling a pergola needs "vertical FOV". |
| Four labelled corner anchors (FL / FR / BL / BR) as the only way to move the volume | Correct for a surveyor, wrong for "positioning a sticker". |
| Reference measurement panel with A/B coordinates, units, implied distance percentage | Useful calibration aid, but it competes with the three real inputs for attention. |
| Readiness checklist (space, references, placement locked, DNA, scene lock) | Presents internal preconditions as a to-do list. It makes the product feel unfinished before the first click. |
| Product DNA / Scene Lock as visible panels with lists of invariants and constraints | They are pipeline internals. The user only needs "listo". |
| Output metadata: provider, revision, stale marker, registered | Engineering provenance. Valuable for debugging, noise for a demo. |
| Output strip with per-output favorite / download / compare / duplicate / delete icon row | Five icon actions for a first-time user with one output. |
| Editable Product Pack form (name, placement type, color, finish, material, installation, specs) | A data-entry form in the middle of a creative tool. |
| DEV / PROJECTS in the top bar at equal weight with PRESENT | Developer and archive actions compete with the one presentation action that matters. |
| Mixed-language, engineering English in the UI ("Lock placement", "Geometry reference", "rev 3") | Confirms the CAD feel. The Studio must speak plain Spanish. |

## 2. What can be hidden (kept internally, moved to Avanzado)

- Lens / vertical FOV slider and "estimate from anchors".
- Free four-anchor perspective editing and the anchor coordinate readout.
- Wall anchor picking.
- Reference measurement (A / B / known distance).
- Product DNA content and Scene Lock content; the user only sees the analysis status.
- Output provenance (provider, revision, registered flag), favorite, duplicate settings.
- Readiness checklist (replaced by three input states with a check mark).
- Provider selection, frame rate, state JSON, clear-local-data (already in DEV).
- Product Pack field editing (name stays editable inline; everything else in Avanzado).

## 3. What should be renamed (normal Studio UI in Spanish)

| Before | After |
| --- | --- |
| SPACE / Drop the environment photograph | TU ESPACIO / Arrastra una foto de tu espacio. |
| PRODUCT / Add reference images | TU PRODUCTO / Añade fotos del producto. |
| Dimensions (Width / Depth / Height) | MEDIDAS (ANCHO / FONDO / ALTO) |
| FIT · Lock placement | AJUSTAR EN EL ESPACIO · MOVER / GIRAR / TAMAÑO · LISTO ✓ |
| TECHNICAL / Technical placement | REAL PLAN |
| REALITY | REALIDAD |
| ARCHVIZ | ARQUITECTURA |
| MOTION · EXPERIMENTAL | MOVIMIENTO · PRÓXIMAMENTE |
| VISUALIZE | VISUALIZAR ✦ |
| Learn product / Analyze space | (automatic) ANALIZANDO PRODUCTO… → PRODUCTO LISTO ✓ / ANALIZANDO ESPACIO… → ESPACIO LISTO ✓ |
| Before / After | ANTES / DESPUÉS |
| Present | PRESENTAR |
| Visual placement guide. Verify final installation on site. | Visualización de referencia. Verificar medidas finales antes de instalación. |
| Technical output type in state (`TECHNICAL`) | unchanged in state for persistence compatibility; labelled REAL PLAN everywhere in UI |

## 4. Engineering systems that stay intact

- `src/core/geometry/*` — homography solve, focal estimation, projection, footprint operations, units. Only additions: corner-resize and height-from-pointer helpers for the sticker-style handles.
- `src/components/studio/fit/FitLayer.tsx` — React Three Fiber placement volume and solved camera. Reused as is.
- `src/state/project-store.ts` — project state, actions, revision tracking. Additions only (combined dimension + footprint update).
- `src/state/persistence/*` — IndexedDB projects, blobs, hydration. Untouched.
- Source-image alignment: `PhotoViewport`, `CoverImage`, `VolumeSvg`, `registered` flag on outputs. Untouched.
- `CompareSlider` and compare eligibility logic. Untouched; relabelled.
- `src/providers/*` and `src/app/api/*` — mock, OpenAI stub, Higgsfield stub. Untouched; still not connected.
- Present mode architecture (`PresentMode`, GSAP timeline, aspect recomposition). Sequence simplified, engine kept.
- Technical PNG export (`export-png.ts`). Kept; copy and title block restyled as REAL PLAN.
- Demo asset pipeline (`scripts/demo-assets`). Untouched.
