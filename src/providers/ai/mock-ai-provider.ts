import { CATEGORY_LABELS } from "@/core/types";
import type { ProductDNA, SceneLock } from "@/core/types";
import type { AIProvider, ProductAnalysisInput, RenderBrief, RenderBriefInput, SceneAnalysisInput, ValidationInput, ValidationResult } from "./types";

const CURATED_DNA: Record<string, Partial<ProductDNA>> = {
  pack_milano_x: {
    summary:
      "Pérgola bioclimática rectilínea. Cuatro postes esbeltos de sección cuadrada sostienen un marco de vigas perimetral plano; el techo es un campo de lamas de aluminio paralelas que giran y se retraen. Se percibe como un único marco oscuro y preciso, sin fijaciones visibles.",
    distinctiveFeatures: [
      "Viga perimetral a haces vivos con esquinas de 90° marcadas",
      "Campo de lamas continuo alineado con el eje de fondo",
      "Postes situados exactamente en las esquinas del contorno, sin riostras",
      "Superficie negro mate uniforme con brillos suaves y de bajo contraste",
    ],
    structuralComponents: ["4 postes de 140 × 140 mm", "Marco de vigas perimetral", "Lamas del techo", "Canalón y drenaje integrados en los postes"],
    materials: ["Aluminio extruido lacado en polvo", "Juntas EPDM"],
    colors: ["Negro mate RAL 9005"],
    invariants: ["Número y posición de los postes", "Proporción de la viga respecto a los postes", "Dirección de las lamas", "Acabado negro mate"],
    fidelityRules: [
      "No añadir nunca lona, cristal o madera en el techo",
      "No redondear nunca las esquinas de la viga",
      "Mantener el espaciado de las lamas regular",
      "Sin tornillos, herrajes ni cables visibles",
    ],
    renderingConstraints: [
      "Las sombras siguen el ángulo de las lamas",
      "La estructura debe apoyar en el plano del suelo, en el contorno guardado",
      "No ocultar la fachada de la vivienda más allá de lo que la estructura cubre geométricamente",
    ],
  },
};

function genericDNA(input: ProductAnalysisInput): Partial<ProductDNA> {
  const { pack } = input;
  const descripcion = pack.tagline ?? CATEGORY_LABELS[pack.category];
  return {
    summary: `${pack.name}: ${descripcion}. ${pack.material} en ${pack.color}, ${pack.finish}.`,
    distinctiveFeatures: pack.customSpecifications.map((s) => `${s.label}: ${s.value}`),
    structuralComponents: ["Volumen principal según lo especificado en el Product Pack", "Bordes y juntas visibles en las imágenes de referencia"],
    materials: [pack.material],
    colors: [pack.color],
    invariants: ["Proporción general según las medidas configuradas", `Acabado: ${pack.finish}`, "Aspecto del material de referencia"],
    fidelityRules: ["No inventar componentes adicionales", "No cambiar el material ni el color", "Mantener las superficies coherentes con las imágenes de referencia"],
    renderingConstraints: ["Respetar el contorno guardado", "Igualar la dirección de la luz de la fotografía", "Conservar todo lo que quede fuera de la zona de instalación"],
  };
}

export class MockAIProvider implements AIProvider {
  readonly id = "mock" as const;

  async analyzeScene(input: SceneAnalysisInput): Promise<SceneLock> {
    const outdoor = input.productCategory === "OUTDOOR_STRUCTURE" || input.productCategory === "LANDSCAPE" || input.productCategory === "POOL_AND_WATER";
    return {
      preserve: {
        architecture: outdoor ? ["Fachada trasera con alero plano", "Línea de cubierta y peto"] : ["Paredes y línea de techo existentes", "Plano del suelo"],
        doors: outdoor ? ["Puerta corredera central, dos paños"] : ["Acceso a la estancia tal como aparece en la foto"],
        windows: outdoor ? ["Ventana izquierda", "Ventana derecha"] : ["Cualquier ventana dentro del encuadre"],
        floor: outdoor ? "Terraza pavimentada con juntas regulares, césped al fondo" : "Acabado y nivel de suelo existentes",
        walls: outdoor ? ["Fachada trasera, revoco blanco cálido"] : ["Todas las paredes y acabados de la estancia"],
        landscaping: outdoor ? ["Árboles detrás de la vivienda", "Seto lateral", "Jardinera junto a la puerta"] : [],
        background: outdoor ? "Cielo y copas de los árboles" : "Estancias y aberturas adyacentes",
        importantObjects: outdoor ? ["Jardinera junto a la puerta"] : ["Mobiliario y elementos fijos"],
      },
      installationRegion: {
        description: outdoor ? "Terraza pavimentada frente a la puerta corredera, centrada con la fachada" : "A lo largo de la pared principal en la zona de instalación",
        rect: outdoor ? { x: 0.12, y: 0.58, w: 0.68, h: 0.22 } : undefined,
      },
      obstructions: outdoor ? ["Jardinera junto al borde de la puerta"] : ["Mobiliario suelto"],
      lighting: "Luz diurna suave, sol desde arriba a la izquierda, sombras poco marcadas",
      createdAt: Date.now(),
      provenance: { provider: "mock", note: "Análisis de espacio simulado. El análisis real usará el proveedor de IA configurado." },
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
      provenance: { provider: "mock", note: "Análisis de producto simulado. Comprensión estructurada, no entrenamiento de modelo." },
    };
  }

  async createRenderBrief(input: RenderBriefInput): Promise<RenderBrief> {
    const { dimensions, pack, sceneLock, productDNA, geometryReference } = input;
    const preserve = sceneLock
      ? [...sceneLock.preserve.architecture, ...sceneLock.preserve.doors, ...sceneLock.preserve.windows, sceneLock.preserve.floor, ...sceneLock.preserve.landscaping]
      : ["Toda la fotografía fuera del contorno de instalación"];
    return {
      mode: input.mode,
      environment: {
        preserve,
        installationRegion: sceneLock?.installationRegion.description ?? "Contorno guardado",
      },
      product: {
        name: pack.name,
        summary: productDNA?.summary ?? `${pack.name}, ${pack.material}, ${pack.color}`,
        invariants: productDNA?.invariants ?? [],
      },
      geometry: {
        dimensions,
        footprintDescription: geometryReference
          ? `Anclas del contorno FL(${geometryReference.footprint.FL.x.toFixed(3)}, ${geometryReference.footprint.FL.y.toFixed(3)}) … BR(${geometryReference.footprint.BR.x.toFixed(3)}, ${geometryReference.footprint.BR.y.toFixed(3)})`
          : "Colocación no guardada",
        locked: !!geometryReference,
      },
      constraints: [
        "El entorno permanece como referencia visual autoritativa",
        "Las medidas son fijas; nunca se reescala el producto",
        ...(productDNA?.renderingConstraints ?? []),
      ],
      createdAt: Date.now(),
    };
  }

  async validateResult(input: ValidationInput): Promise<ValidationResult> {
    return {
      passed: true,
      checks: [
        { name: "environment-preserved", passed: true, note: "Validación simulada" },
        { name: "product-invariants", passed: true, note: `${input.brief.product.invariants.length} invariantes declaradas` },
      ],
    };
  }
}
