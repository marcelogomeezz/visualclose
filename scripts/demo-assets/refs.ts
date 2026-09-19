/** Placeholder product reference drawings: flat, off-white, hairline. */

const W = 1600;
const H = 1200;

function frame(body: string, title: string, sub: string, bg = "#f2eee4"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#e8e0d0"/></linearGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.045"/></feComponentTransfer></filter>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a2a"/><stop offset="0.5" stop-color="#151515"/><stop offset="1" stop-color="#303030"/></linearGradient>
    <linearGradient id="oak" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b79a6d"/><stop offset="1" stop-color="#a3865c"/></linearGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9cdb8"/><stop offset="1" stop-color="#c3b59d"/></linearGradient>
    <linearGradient id="fabric" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfc6b6"/><stop offset="1" stop-color="#b9af9c"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${body}
  <rect width="${W}" height="${H}" filter="url(#grain)"/>
  <text x="80" y="1100" font-family="Helvetica, Arial, sans-serif" font-size="30" letter-spacing="6" fill="#4a4741">${title}</text>
  <text x="80" y="1140" font-family="Helvetica, Arial, sans-serif" font-size="20" letter-spacing="2" fill="#8a857c">${sub}</text>
</svg>`;
}

export function pergolaFront(): string {
  const body = `
  <g transform="translate(200,240)">
    <rect x="0" y="0" width="1200" height="60" fill="url(#metal)"/>
    ${Array.from({ length: 14 }, (_, i) => `<rect x="${40 + i * 82}" y="62" width="44" height="14" fill="#1a1a1a" opacity="0.85"/>`).join("")}
    <rect x="0" y="60" width="34" height="560" fill="url(#metal)"/>
    <rect x="1166" y="60" width="34" height="560" fill="url(#metal)"/>
    <line x1="-60" y1="620" x2="1260" y2="620" stroke="#8a857c" stroke-width="2"/>
    <line x1="0" y1="680" x2="1200" y2="680" stroke="#4a4741" stroke-width="1.5"/>
    <line x1="0" y1="670" x2="0" y2="690" stroke="#4a4741" stroke-width="1.5"/>
    <line x1="1200" y1="670" x2="1200" y2="690" stroke="#4a4741" stroke-width="1.5"/>
    <text x="600" y="720" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="3" fill="#4a4741">5.00 m</text>
    <line x1="1290" y1="0" x2="1290" y2="620" stroke="#4a4741" stroke-width="1.5"/>
    <text x="1215" y="340" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="3" fill="#4a4741">2.70 m</text>
  </g>`;
  return frame(body, "MILANO X · VISTA FRONTAL", "Referencia de producto · boceto ilustrativo");
}

export function pergolaSide(): string {
  const body = `
  <g transform="translate(300,240)">
    <rect x="0" y="0" width="960" height="60" fill="url(#metal)"/>
    ${Array.from({ length: 12 }, (_, i) => `<polygon points="${30 + i * 78},60 ${30 + i * 78 + 40},60 ${30 + i * 78 + 58},84 ${30 + i * 78 + 18},84" fill="#1a1a1a" opacity="0.9"/>`).join("")}
    <rect x="0" y="60" width="34" height="560" fill="url(#metal)"/>
    <rect x="926" y="60" width="34" height="560" fill="url(#metal)"/>
    <line x1="-60" y1="620" x2="1020" y2="620" stroke="#8a857c" stroke-width="2"/>
    <line x1="0" y1="680" x2="960" y2="680" stroke="#4a4741" stroke-width="1.5"/>
    <text x="480" y="720" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="3" fill="#4a4741">4.00 m</text>
  </g>`;
  return frame(body, "MILANO X · VISTA LATERAL", "Referencia de producto · techo de lamas retráctiles");
}

export function pergolaDetail(): string {
  const body = `
  <g transform="translate(260,200)">
    <rect x="0" y="0" width="1080" height="120" fill="url(#metal)"/>
    ${Array.from({ length: 5 }, (_, i) => `<g transform="translate(${80 + i * 210},130) rotate(-28)"><rect x="0" y="0" width="190" height="26" fill="#1c1c1c"/><rect x="0" y="0" width="190" height="4" fill="#3a3a3a"/></g>`).join("")}
    <rect x="0" y="120" width="70" height="520" fill="url(#metal)"/>
    <circle cx="35" cy="200" r="6" fill="#3a3a3a"/><circle cx="35" cy="560" r="6" fill="#3a3a3a"/>
    <line x1="140" y1="330" x2="420" y2="330" stroke="#4a4741" stroke-width="1.5"/>
    <text x="440" y="338" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="2" fill="#4a4741">Lama del techo · aluminio extruido</text>
    <line x1="140" y1="440" x2="420" y2="440" stroke="#4a4741" stroke-width="1.5"/>
    <text x="440" y="448" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="2" fill="#4a4741">Poste 140 × 140 mm · negro mate</text>
  </g>`;
  return frame(body, "MILANO X · DETALLE", "Referencia de producto · mecanismo del techo y sección del poste");
}

export function pergolaMaterial(): string {
  const body = `
  <rect x="200" y="200" width="1200" height="720" fill="url(#metal)"/>
  <rect x="200" y="200" width="1200" height="720" fill="none" stroke="#3a3a3a" stroke-width="2"/>
  ${Array.from({ length: 36 }, (_, i) => `<line x1="${200 + i * 34}" y1="200" x2="${200 + i * 34}" y2="920" stroke="#262626" stroke-width="1"/>`).join("")}
  <text x="240" y="880" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="4" fill="#9a958c">RAL 9005 · MATE · ALUMINIO LACADO EN POLVO</text>`;
  return frame(body, "MILANO X · ACABADO", "Referencia de producto · muestra de acabado");
}

export function kitchenFront(): string {
  const body = `
  <g transform="translate(160,260)">
    <rect x="0" y="0" width="1280" height="380" fill="url(#oak)"/>
    ${Array.from({ length: 6 }, (_, i) => `<rect x="${i * 213 + 6}" y="6" width="201" height="368" fill="none" stroke="#8b7148" stroke-width="2"/>`).join("")}
    <rect x="-20" y="380" width="1320" height="36" fill="url(#stone)"/>
    <rect x="0" y="416" width="1280" height="300" fill="#2b2a28"/>
    ${Array.from({ length: 4 }, (_, i) => `<rect x="${i * 320 + 6}" y="422" width="308" height="288" fill="none" stroke="#3c3a37" stroke-width="2"/>`).join("")}
    ${Array.from({ length: 4 }, (_, i) => `<rect x="${i * 320 + 100}" y="440" width="120" height="4" fill="#8f8a80"/>`).join("")}
    <line x1="0" y1="760" x2="1280" y2="760" stroke="#4a4741" stroke-width="1.5"/>
    <text x="640" y="800" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="3" fill="#4a4741">4.20 m</text>
  </g>`;
  return frame(body, "SISTEMA DE COCINA LINEA · VISTA FRONTAL", "Referencia de producto · muebles altos en roble, base grafito, encimera de piedra");
}

export function kitchenMaterial(): string {
  const body = `
  <rect x="160" y="200" width="600" height="720" fill="url(#oak)"/>
  ${Array.from({ length: 40 }, (_, i) => `<line x1="${160 + i * 15}" y1="200" x2="${160 + i * 15 + 30}" y2="920" stroke="#8b7148" stroke-width="1" opacity="0.5"/>`).join("")}
  <rect x="800" y="200" width="600" height="720" fill="url(#stone)"/>
  ${Array.from({ length: 14 }, (_, i) => `<path d="M ${800 + i * 45} 200 Q ${820 + i * 45} 560 ${790 + i * 45} 920" stroke="#a89a82" stroke-width="1.2" fill="none" opacity="0.6"/>`).join("")}
  <text x="180" y="880" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="3" fill="#4a3d2a">CHAPA DE ROBLE</text>
  <text x="820" y="880" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="3" fill="#6b6050">PIEDRA CALIZA PULIDA</text>`;
  return frame(body, "SISTEMA DE COCINA LINEA · MATERIALES", "Referencia de producto");
}

export function facadePanels(): string {
  const rows = 8;
  const cols = 10;
  const body = `
  <g transform="translate(160,200)">
    ${Array.from({ length: rows * cols }, (_, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const off = r % 2 === 0 ? 0 : 64;
      return `<rect x="${c * 128 + off}" y="${r * 90}" width="124" height="86" fill="url(#stone)" stroke="#b8ab94" stroke-width="1"/>`;
    }).join("")}
    <clipPath id="clip"><rect x="0" y="0" width="1280" height="720"/></clipPath>
  </g>
  <text x="180" y="960" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="3" fill="#6b6050">TRAVERTINO · PANELES 1200 × 800 mm · A MATAJUNTA</text>`;
  return frame(body, "SISTEMA DE FACHADA TRAVERTINO · PATRÓN DE PANELES", "Referencia de producto · fachada ventilada de piedra");
}

export function facadeDetail(): string {
  const body = `
  <g transform="translate(300,220)">
    <rect x="0" y="0" width="80" height="700" fill="#8c8780"/>
    <rect x="80" y="0" width="60" height="700" fill="#3a3835"/>
    <rect x="140" y="0" width="120" height="700" fill="none" stroke="#4a4741" stroke-dasharray="8 8" stroke-width="1.5"/>
    <rect x="260" y="0" width="60" height="700" fill="url(#stone)"/>
    <text x="360" y="120" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="2" fill="#4a4741">Muro existente</text>
    <text x="360" y="220" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="2" fill="#4a4741">Subestructura de aluminio + aislamiento</text>
    <text x="360" y="320" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="2" fill="#4a4741">Cámara ventilada de 40 mm</text>
    <text x="360" y="420" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="2" fill="#4a4741">Panel de travertino de 30 mm</text>
  </g>`;
  return frame(body, "SISTEMA DE FACHADA TRAVERTINO · SECCIÓN", "Referencia de producto · esquema ilustrativo");
}

export function loungeFront(): string {
  const body = `
  <g transform="translate(260,300)">
    <rect x="0" y="180" width="1080" height="260" rx="10" fill="url(#fabric)"/>
    <rect x="0" y="60" width="140" height="380" rx="10" fill="url(#fabric)"/>
    <rect x="940" y="60" width="140" height="380" rx="10" fill="url(#fabric)"/>
    <rect x="140" y="120" width="800" height="90" rx="6" fill="#c2b7a4"/>
    <rect x="20" y="440" width="1040" height="30" fill="#8a6a45"/>
    <rect x="60" y="470" width="24" height="90" fill="#8a6a45"/>
    <rect x="996" y="470" width="24" height="90" fill="#8a6a45"/>
    <line x1="0" y1="620" x2="1080" y2="620" stroke="#4a4741" stroke-width="1.5"/>
    <text x="540" y="660" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="3" fill="#4a4741">2.40 m</text>
  </g>`;
  return frame(body, "LOUNGE EXTERIOR FORMA · VISTA FRONTAL", "Referencia de producto · estructura de teca, tapicería de exterior");
}

export function loungeMaterial(): string {
  const body = `
  <rect x="160" y="200" width="600" height="720" fill="url(#fabric)"/>
  ${Array.from({ length: 48 }, (_, i) => `<line x1="160" y1="${200 + i * 15}" x2="760" y2="${200 + i * 15}" stroke="#a89f8d" stroke-width="1" opacity="0.6"/>`).join("")}
  <rect x="800" y="200" width="600" height="720" fill="#9a7550"/>
  ${Array.from({ length: 20 }, (_, i) => `<line x1="${800 + i * 30}" y1="200" x2="${800 + i * 30 + 40}" y2="920" stroke="#7d5c3c" stroke-width="1.5" opacity="0.5"/>`).join("")}
  <text x="180" y="880" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="3" fill="#5a5245">ACRÍLICO DE EXTERIOR · ARENA</text>
  <text x="820" y="880" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="3" fill="#f3ebdf">TECA · ACEITADA</text>`;
  return frame(body, "LOUNGE EXTERIOR FORMA · MATERIALES", "Referencia de producto");
}

/** Generic mock output used by the mock provider when no pack-specific placeholder exists. */
export function genericOutput(kind: "REALITY" | "ARCHVIZ"): string {
  const bg = kind === "REALITY" ? "#1a1a1a" : "#221f1b";
  const label = kind === "REALITY" ? "REALIDAD" : "ARQUITECTURA";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1280" viewBox="0 0 1920 1280">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#0f0f0f"/></linearGradient>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.08"/></feComponentTransfer></filter></defs>
  <rect width="1920" height="1280" fill="url(#g)"/>
  <rect width="1920" height="1280" filter="url(#grain)"/>
  <rect x="120" y="120" width="1680" height="1040" fill="none" stroke="#3a3835" stroke-width="1.5"/>
  <text x="160" y="620" font-family="Helvetica, Arial, sans-serif" font-size="88" letter-spacing="10" fill="#e9e4da">${label} · MUESTRA</text>
  <text x="160" y="690" font-family="Helvetica, Arial, sans-serif" font-size="30" letter-spacing="4" fill="#8a857c">SALIDA SIMULADA · NO REGISTRADA EN ESTE ESPACIO · SE SUSTITUIRÁ POR EL RESULTADO DEL PROVEEDOR</text>
</svg>`;
}
