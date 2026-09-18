import type { AssetRef, Project } from "@/core/types";
import { persistence } from "./db";

const objectUrls = new Map<string, string>();

export function objectUrlFor(id: string, blob: Blob): string {
  const existing = objectUrls.get(id);
  if (existing) return existing;
  const url = URL.createObjectURL(blob);
  objectUrls.set(id, url);
  return url;
}

export function revokeObjectUrl(id: string): void {
  const url = objectUrls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrls.delete(id);
  }
}

async function hydrateAsset(asset: AssetRef): Promise<AssetRef> {
  if (asset.kind !== "blob") return asset;
  const blob = await persistence.getAsset(asset.id);
  if (!blob) return { ...asset, url: "" };
  return { ...asset, url: objectUrlFor(asset.id, blob) };
}

/** Re-creates object URLs for every blob asset in a stored project. */
export async function hydrateProject(project: Project): Promise<Project> {
  const space = project.space ? { ...project.space, asset: await hydrateAsset(project.space.asset) } : null;
  const references = await Promise.all(project.productPack.references.map(async (r) => ({ ...r, asset: await hydrateAsset(r.asset) })));
  const outputs = await Promise.all(
    project.outputs.map(async (o) => ({ ...o, asset: await hydrateAsset(o.asset), thumbnail: await hydrateAsset(o.thumbnail) })),
  );
  const prospectLogo = project.presentation.prospectLogo ? await hydrateAsset(project.presentation.prospectLogo) : null;
  const placementReference = project.placementReference ? await hydrateAsset(project.placementReference) : null;
  const placementMask = project.placementMask ? await hydrateAsset(project.placementMask) : null;
  return {
    ...project,
    space,
    productPack: { ...project.productPack, references },
    outputs,
    presentation: { ...project.presentation, prospectLogo },
    placementReference,
    placementMask,
  };
}

/** Strips transient object URLs before writing to IndexedDB. */
export function dehydrateProject(project: Project): Project {
  const strip = (a: AssetRef): AssetRef => (a.kind === "blob" ? { ...a, url: "" } : a);
  return {
    ...project,
    space: project.space ? { ...project.space, asset: strip(project.space.asset) } : null,
    productPack: { ...project.productPack, references: project.productPack.references.map((r) => ({ ...r, asset: strip(r.asset) })) },
    outputs: project.outputs.map((o) => ({ ...o, asset: strip(o.asset), thumbnail: strip(o.thumbnail) })),
    presentation: { ...project.presentation, prospectLogo: project.presentation.prospectLogo ? strip(project.presentation.prospectLogo) : null },
    placementReference: project.placementReference ? strip(project.placementReference) : null,
    placementMask: project.placementMask ? strip(project.placementMask) : null,
  };
}
