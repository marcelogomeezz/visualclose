import type { ProductDNA, SceneLock } from "@/core/types";
import type { AIProvider, ProductAnalysisInput, RenderBrief, RenderBriefInput, SceneAnalysisInput, ValidationInput, ValidationResult } from "./types";

const CURATED_DNA: Record<string, Partial<ProductDNA>> = {
  pack_milano_x: {
    summary:
      "Rectilinear bioclimatic pergola. Four slender square posts carry a flat perimeter beam frame; the roof is a field of parallel aluminium louver blades that rotate and retract. Reads as a single dark, precise frame with no visible fixings.",
    distinctiveFeatures: [
      "Flush perimeter beam with sharp 90° corners",
      "Continuous louver field aligned with the depth axis",
      "Posts set exactly at the footprint corners, no bracing",
      "Uniform matte black surface with soft, low-contrast highlights",
    ],
    structuralComponents: ["4 posts 140 × 140 mm", "Perimeter beam frame", "Louver blades", "Integrated gutter and drainage in posts"],
    materials: ["Powder-coated extruded aluminium", "EPDM seals"],
    colors: ["Matte black RAL 9005"],
    invariants: ["Post count and position", "Beam proportion relative to posts", "Louver direction", "Matte black finish"],
    fidelityRules: [
      "Never add roofing fabric, glass or timber",
      "Never round the beam corners",
      "Keep blade spacing regular",
      "No visible screws, brackets or cables",
    ],
    renderingConstraints: [
      "Shadows follow the louver angle",
      "Structure must sit on the ground plane at the locked footprint",
      "Do not obscure the house facade beyond what the structure geometrically covers",
    ],
  },
};

function genericDNA(input: ProductAnalysisInput): Partial<ProductDNA> {
  const { pack } = input;
  return {
    summary: `${pack.name}: ${pack.tagline ?? pack.category.toLowerCase().replace("_", " ")}. ${pack.material} in ${pack.color}, ${pack.finish}.`,
    distinctiveFeatures: pack.customSpecifications.map((s) => `${s.label}: ${s.value}`),
    structuralComponents: ["Primary volume as specified by the Product Pack", "Visible edges and joints from the reference images"],
    materials: [pack.material],
    colors: [pack.color],
    invariants: ["Overall proportion from configured dimensions", `Finish: ${pack.finish}`, "Reference material appearance"],
    fidelityRules: ["Do not invent additional components", "Do not change material or color", "Keep surfaces consistent with the reference images"],
    renderingConstraints: ["Respect the locked footprint", "Match the photograph's lighting direction", "Preserve everything outside the installation region"],
  };
}

export class MockAIProvider implements AIProvider {
  readonly id = "mock" as const;

  async analyzeScene(input: SceneAnalysisInput): Promise<SceneLock> {
    const outdoor = input.productCategory === "OUTDOOR_STRUCTURE" || input.productCategory === "LANDSCAPE" || input.productCategory === "POOL_AND_WATER";
    return {
      preserve: {
        architecture: outdoor ? ["Rear facade with flat fascia", "Roof line and parapet"] : ["Existing walls and ceiling line", "Floor plane"],
        doors: outdoor ? ["Central sliding door, two panels"] : ["Room entry as photographed"],
        windows: outdoor ? ["Left window", "Right window"] : ["Any window in frame"],
        floor: outdoor ? "Paved terrace with regular joints, lawn beyond" : "Existing floor finish and level",
        walls: outdoor ? ["Rear facade, warm off-white render"] : ["All room walls and finishes"],
        landscaping: outdoor ? ["Trees behind the house", "Side hedge", "Planter near the door"] : [],
        background: outdoor ? "Sky and tree canopy" : "Adjacent rooms and openings",
        importantObjects: outdoor ? ["Planter by the door"] : ["Fixed furniture and fittings"],
      },
      installationRegion: {
        description: outdoor ? "Paved terrace in front of the sliding door, centred on the facade" : "Along the primary wall in the installation area",
        rect: outdoor ? { x: 0.12, y: 0.58, w: 0.68, h: 0.22 } : undefined,
      },
      obstructions: outdoor ? ["Planter near the door edge"] : ["Free-standing furniture"],
      lighting: "Soft daylight, sun from upper left, mild shadows",
      createdAt: Date.now(),
      provenance: { provider: "mock", note: "Simulated Scene Lock. Real analysis will use the configured AI provider." },
    };
  }

  async analyzeProduct(input: ProductAnalysisInput): Promise<ProductDNA> {
    const curated = CURATED_DNA[input.pack.id];
    const base = genericDNA(input);
    const merged = { ...base, ...curated };
    return {
      summary: merged.summary ?? "",
      distinctiveFeatures: merged.distinctiveFeatures ?? [],
      structuralComponents: merged.structuralComponents ?? [],
      materials: merged.materials ?? [],
      colors: merged.colors ?? [],
      invariants: merged.invariants ?? [],
      fidelityRules: merged.fidelityRules ?? [],
      renderingConstraints: merged.renderingConstraints ?? [],
      createdAt: Date.now(),
      provenance: { provider: "mock", note: "Simulated Product DNA. Structured understanding, not model training." },
    };
  }

  async createRenderBrief(input: RenderBriefInput): Promise<RenderBrief> {
    const { dimensions, pack, sceneLock, productDNA, geometryReference } = input;
    const preserve = sceneLock
      ? [...sceneLock.preserve.architecture, ...sceneLock.preserve.doors, ...sceneLock.preserve.windows, sceneLock.preserve.floor, ...sceneLock.preserve.landscaping]
      : ["Entire photograph outside the installation footprint"];
    return {
      mode: input.mode,
      environment: {
        preserve,
        installationRegion: sceneLock?.installationRegion.description ?? "Locked footprint",
      },
      product: {
        name: pack.name,
        summary: productDNA?.summary ?? `${pack.name}, ${pack.material}, ${pack.color}`,
        invariants: productDNA?.invariants ?? [],
      },
      geometry: {
        dimensions,
        footprintDescription: geometryReference
          ? `Footprint anchors FL(${geometryReference.footprint.FL.x.toFixed(3)}, ${geometryReference.footprint.FL.y.toFixed(3)}) … BR(${geometryReference.footprint.BR.x.toFixed(3)}, ${geometryReference.footprint.BR.y.toFixed(3)})`
          : "Placement not locked",
        locked: !!geometryReference,
      },
      constraints: [
        "Environment remains visually authoritative",
        "Dimensions are fixed; never re-scale the product",
        ...(productDNA?.renderingConstraints ?? []),
      ],
      createdAt: Date.now(),
    };
  }

  async validateResult(input: ValidationInput): Promise<ValidationResult> {
    return {
      passed: true,
      checks: [
        { name: "environment-preserved", passed: true, note: "Mock validation" },
        { name: "product-invariants", passed: true, note: `${input.brief.product.invariants.length} invariants declared` },
      ],
    };
  }
}
