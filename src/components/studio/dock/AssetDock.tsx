"use client";

import { useState } from "react";
import { DEMO_PRODUCT_PACKS } from "@/core/product-packs";
import { CATEGORY_LABELS, REFERENCE_TYPES, type ProductReference, type ReferenceType } from "@/core/types";
import { actions, useProject } from "@/state/project-store";
import { ui } from "@/state/ui-store";
import { Icon } from "@/components/ui/icons";
import { DropZone } from "./DropZone";

const PRODUCT_TYPES: ReferenceType[] = ["front", "side", "rear", "detail", "material"];
const OPTIONAL_TYPES: ReferenceType[] = ["installed", "other"];

export function AssetDock() {
  const project = useProject();
  if (!project) return null;
  const { space, productPack } = project;
  const productRefs = productPack.references.filter((r) => PRODUCT_TYPES.includes(r.type));
  const optionalRefs = productPack.references.filter((r) => OPTIONAL_TYPES.includes(r.type));
  const remaining = 8 - productPack.references.length;

  return (
    <aside className="hairline-r bg-graphite-1 overflow-y-auto vc-scroll min-h-0">
      {/* SPACE */}
      <section className="px-4 pt-4 pb-4 hairline-b">
        <header className="flex items-center justify-between mb-3">
          <span className="t-label">Space</span>
          {space && (
            <button type="button" className="t-label hover:text-ivory transition-colors" onClick={() => actions.clearSpace()}>
              Remove
            </button>
          )}
        </header>
        {space ? (
          <DropZone onFiles={(f) => void actions.setSpace(f[0])} compact className="!p-0 !border-solid !border-line group relative">
            <div className="relative overflow-hidden bg-graphite-0" style={{ aspectRatio: `${space.width} / ${space.height}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={space.asset.url} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-graphite-0/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="t-label-strong">Replace photograph</span>
              </div>
            </div>
            <div className="px-2.5 py-2 flex items-center justify-between">
              <span className="text-[11px] text-ivory truncate">{space.asset.name}</span>
              <span className="t-mono text-[10px] text-warm-grey">
                {space.width}×{space.height}
              </span>
            </div>
          </DropZone>
        ) : (
          <DropZone onFiles={(f) => void actions.setSpace(f[0])}>
            <div className="py-8 text-center">
              <div className="text-[12px] text-ivory mb-1">Drop the environment photograph</div>
              <div className="text-[11px] text-warm-grey">One real space. It stays the hero.</div>
            </div>
          </DropZone>
        )}
      </section>

      {/* PRODUCT */}
      <section className="px-4 pt-4 pb-4 hairline-b">
        <header className="flex items-center justify-between mb-3">
          <span className="t-label">Product</span>
          <span className="t-mono text-[10px] text-warm-grey">{productPack.references.length}/8</span>
        </header>
        <select
          className="vc-input mb-3"
          value={DEMO_PRODUCT_PACKS.some((p) => p.id === productPack.id) ? productPack.id : "custom"}
          onChange={(e) => e.target.value !== "custom" && actions.selectProductPack(e.target.value)}
        >
          {DEMO_PRODUCT_PACKS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {CATEGORY_LABELS[p.category]}
            </option>
          ))}
          {!DEMO_PRODUCT_PACKS.some((p) => p.id === productPack.id) && <option value="custom">{productPack.name}</option>}
        </select>
        <ReferenceGrid refs={productRefs} />
        {remaining > 0 && (
          <DropZone multiple onFiles={(f) => void actions.addProductReferences(f, "front")} compact className="mt-2">
            <div className="flex items-center justify-center gap-2 py-2 text-warm-grey">
              <Icon.Plus />
              <span className="text-[11px]">Add reference images</span>
            </div>
          </DropZone>
        )}
      </section>

      {/* OPTIONAL REFERENCES */}
      <section className="px-4 pt-4 pb-4 hairline-b">
        <header className="flex items-center justify-between mb-3">
          <span className="t-label">Optional references</span>
        </header>
        {optionalRefs.length > 0 && <ReferenceGrid refs={optionalRefs} />}
        {remaining > 0 ? (
          <DropZone multiple onFiles={(f) => void actions.addProductReferences(f, "installed")} compact className={optionalRefs.length ? "mt-2" : ""}>
            <div className="py-2 text-center">
              <div className="text-[11px] text-warm-grey">Installed examples, context, mood</div>
            </div>
          </DropZone>
        ) : (
          <div className="text-[11px] text-warm-grey">Reference limit reached.</div>
        )}
      </section>

      <section className="px-4 py-4">
        <button
          type="button"
          onClick={() => {
            actions.loadDemoProject();
            ui.setMode("ORIGINAL");
            ui.selectOutput(null);
            ui.resetViewport();
            ui.toast("Demo project loaded");
          }}
          className="w-full h-8 border border-line text-[10.5px] tracking-[0.14em] uppercase text-warm-grey hover:text-ivory hover:border-line-strong transition-colors"
        >
          Load demo project
        </button>
      </section>
    </aside>
  );
}

function ReferenceGrid({ refs }: { refs: ProductReference[] }) {
  if (!refs.length) return null;
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {refs.map((r) => (
        <ReferenceTile key={r.id} reference={r} />
      ))}
    </div>
  );
}

function ReferenceTile({ reference }: { reference: ProductReference }) {
  const [hover, setHover] = useState(false);
  return (
    <div className="relative group bg-graphite-0 border border-line overflow-hidden" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={reference.asset.url} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>
      <div className="absolute left-0 right-0 bottom-0 px-1.5 py-1 bg-gradient-to-t from-graphite-0/85 to-transparent flex items-end justify-between">
        <select
          className="bg-transparent text-[9.5px] tracking-[0.12em] uppercase text-ivory outline-none appearance-none cursor-pointer"
          value={reference.type}
          onChange={(e) => actions.setReferenceType(reference.id, e.target.value as ReferenceType)}
        >
          {REFERENCE_TYPES.map((t) => (
            <option key={t} value={t} className="bg-graphite-2 text-ivory">
              {t}
            </option>
          ))}
        </select>
        {hover && (
          <button type="button" className="text-warm-grey hover:text-ivory" onClick={() => actions.removeReference(reference.id)} title="Remove">
            <Icon.Close width={12} height={12} />
          </button>
        )}
      </div>
    </div>
  );
}
