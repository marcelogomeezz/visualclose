import { createId } from "../ids";
import { clonePack, createCustomPack, milanoXPergola } from "../product-packs";
import type { Project, ProductPack } from "../types";
import { defaultFootprint } from "../geometry/footprint";
import { DEFAULT_FOV_DEG } from "../geometry/camera";
import { DEMO_PERGOLA_FOOTPRINT, DEMO_PERGOLA_FOV_DEG, DEMO_SPACE_SIZE } from "./pergola-placement.generated";

export const DEMO_PROJECT_ID = "project_demo_milano_x";

export function createEmptyProject(name = "Proyecto sin título", pack: ProductPack = createCustomPack()): Project {
  const now = Date.now();
  return {
    id: createId("project"),
    name,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    space: null,
    productPack: pack,
    dimensions: { ...pack.dimensions },
    referenceMeasurement: null,
    placement: {
      footprint: defaultFootprint(),
      wallAnchor: null,
      rotationDeg: 0,
      lens: { fovDeg: DEFAULT_FOV_DEG, source: "default" },
      locked: false,
      lockedAt: null,
    },
    geometryReference: null,
    placementReference: null,
    placementMask: null,
    placementAssetsRevision: null,
    maskSettings: { ...DEFAULT_MASK_SETTINGS },
    sceneLock: null,
    productDNA: null,
    outputs: [],
    presentation: { prospectName: "", prospectLogo: null, aspect: "16:9" },
  };
}

export const DEFAULT_MASK_SETTINGS = { paddingPx: 24, shadowReach: 0.9 } as const;

/** Fills fields added after a project was stored. Safe to call on any project. */
export function migrateProject(stored: Partial<Project> & Pick<Project, "id" | "name">): Project {
  const base = createEmptyProject(stored.name);
  return {
    ...base,
    ...stored,
    placementReference: stored.placementReference ?? null,
    placementMask: stored.placementMask ?? null,
    placementAssetsRevision: stored.placementAssetsRevision ?? null,
    maskSettings: stored.maskSettings ?? { ...DEFAULT_MASK_SETTINGS },
  } as Project;
}

/**
 * The hero demo: outdoor residential space, Milano X pergola, 5.00 × 4.00 × 2.70 m, matte black, retractable roof.
 * Swapping the demo to a kitchen, facade or pool is a matter of pointing at another pack, photo and footprint.
 */
export function createDemoProject(): Project {
  const project = createEmptyProject("Milano X · Rear terrace", clonePack(milanoXPergola));
  const now = Date.now();
  project.id = DEMO_PROJECT_ID;
  project.space = {
    asset: {
      id: "asset_demo_space_pergola",
      kind: "url",
      url: "/demo/pergola/space.jpg",
      name: "rear-terrace.jpg",
      mime: "image/jpeg",
      width: DEMO_SPACE_SIZE.width,
      height: DEMO_SPACE_SIZE.height,
    },
    width: DEMO_SPACE_SIZE.width,
    height: DEMO_SPACE_SIZE.height,
  };
  project.dimensions = { width: 5, depth: 4, height: 2.7, units: "m" };
  project.placement = {
    footprint: structuredClone(DEMO_PERGOLA_FOOTPRINT),
    wallAnchor: null,
    rotationDeg: 0,
    lens: { fovDeg: DEMO_PERGOLA_FOV_DEG, source: "estimated" },
    locked: false,
    lockedAt: null,
  };
  project.referenceMeasurement = {
    a: { x: 0.3922, y: 0.3516 },
    b: { x: 0.6138, y: 0.3516 },
    distance: 3.4,
    units: "m",
    label: "Sliding door width",
  };
  project.outputs = [
    {
      id: createId("out"),
      type: "ORIGINAL",
      index: 1,
      sourceRevision: 1,
      spaceAssetId: project.space.asset.id,
      createdAt: now,
      thumbnail: project.space.asset,
      asset: project.space.asset,
      provenance: { provider: "local", note: "Source photograph" },
      settings: {
        productPackId: project.productPack.id,
        productName: project.productPack.name,
        dimensions: { ...project.dimensions },
        placementLocked: false,
        hadProductDNA: false,
        hadSceneLock: false,
      },
      favorite: false,
      registered: true,
    },
  ];
  project.presentation = { prospectName: "", prospectLogo: null, aspect: "16:9" };
  return project;
}
