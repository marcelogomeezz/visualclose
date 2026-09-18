# VISUALCLOSE

Private creative AI visualization studio for physical products inside real spaces.

```
REAL SPACE + REAL PRODUCT + REAL DIMENSIONS + CONTROLLED PLACEMENT
= VISUALIZED BEFORE INSTALLATION
```

- Product intent: [`docs/VISUALCLOSE_PRD.md`](docs/VISUALCLOSE_PRD.md)
- Architecture and 3D approach: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Milestone 1 status: [`docs/MILESTONE_1.md`](docs/MILESTONE_1.md)

## Run

```bash
npm install
npm run dev            # http://localhost:3000
```

Other scripts:

```bash
npm run build          # production build (Vercel uses this)
npm run lint
npm run typecheck
npm run test:geometry  # homography / camera solve round-trip tests
npm run demo:assets    # re-render placeholder demo images (needs Chromium; see scripts/demo-assets/render.ts)
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · React Three Fiber · Three.js · drei · GSAP · Tailwind 4 (layout only) · idb (IndexedDB).

## Providers

All AI and generation calls go through server routes under `src/app/api/*` and provider adapters under `src/providers/*`.
Milestone 1 ships mock providers only. See `.env.example` for the future OpenAI (GPT-6 Astra) and Higgsfield selection.
Credentials are read on the server and never sent to the client.

## Replacing the demo

The hero demo (Milano X pergola, 5.00 × 4.00 × 2.70 m) lives in:

- `public/demo/pergola/*` — placeholder photograph, REALITY and ARCHVIZ outputs, reference drawings
- `src/core/product-packs/milano-x-pergola.ts` — the Product Pack
- `src/core/demo/demo-project.ts` — the demo project (footprint anchors come from `pergola-placement.generated.ts`)

To demo a kitchen, facade, pool or furniture: add a Product Pack file, drop its assets under `public/demo/<pack>/`, and point `createDemoProject()` at it. No component branches on product category.
