import { CAPABILITIES } from "../config";

/**
 * Mirrors PassportRenderer.sol client-side so users can preview their exact on-chain SVG passport
 * before signing a transaction, and export either SVG or Retina 2x PNG (for X / Binance Square).
 */
export function buildPreviewPassportSVG(params: {
  handle: string;
  serial: number;
  trustScore: number;
  vouchesReceived: number;
  bountiesCompleted: number;
  campaignsClaimed: number;
  capabilitiesMask: number;
}): string {
  const safeHandle = params.handle.toLowerCase().replace(/[^a-z0-9]/g, "") || "agent";
  const isGenesis = params.serial > 0 && params.serial <= 100;
  const tierLabel = isGenesis ? "GENESIS AGENT" : "VERIFIED AGENT";
  const tierColor = isGenesis ? "#F0B90B" : "#0ECB81";
  const serialStr = params.serial > 0 ? `#${params.serial}` : "#NEW";
  const fillWidth = Math.max(36, Math.min(540, Math.floor((params.trustScore * 540) / 500)));

  const selected = CAPABILITIES.filter((c) => (params.capabilitiesMask & c.mask) !== 0).slice(0, 5);
  const capsMarkup =
    selected.length > 0
      ? selected
          .map((c, idx) => {
            const x = 30 + idx * 106;
            return `<rect x="${x}" y="286" width="96" height="22" rx="11" fill="#2B3139"/><text x="${x + 48}" y="301" class="m c">${c.label}</text>`;
          })
          .join("")
      : `<text x="30" y="301" fill="#5E6673" class="m" font-size="11">GENERAL AUTONOMOUS AGENT</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" width="600" height="360">
  <defs>
    <style>
      .m{font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Consolas,monospace}
      .s{font-family:system-ui,-apple-system,sans-serif}
      .k{fill:#848E9C;font-size:10px;letter-spacing:1px}
      .v{fill:#EAECEF;font-size:20px;font-weight:700}
      .c{fill:#EAECEF;font-size:11px;text-anchor:middle}
    </style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B0E11"/>
      <stop offset="55%" stop-color="#141923"/>
      <stop offset="100%" stop-color="#1E2329"/>
    </linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#F0B90B"/>
      <stop offset="100%" stop-color="#FCD535"/>
    </linearGradient>
  </defs>
  <rect width="600" height="360" rx="22" fill="url(#bg)"/>
  <rect x="1.5" y="1.5" width="597" height="357" rx="21" fill="none" stroke="${tierColor}" stroke-opacity=".5" stroke-width="2"/>
  <rect x="28" y="26" width="152" height="28" rx="14" fill="${tierColor}" fill-opacity=".16" stroke="${tierColor}" stroke-opacity=".6"/>
  <text x="104" y="45" text-anchor="middle" fill="${tierColor}" class="m" font-size="12" font-weight="700" letter-spacing="1">${tierLabel}</text>
  <text x="572" y="45" text-anchor="end" fill="#848E9C" class="m" font-size="14" font-weight="700">AGENTTRUST ${serialStr}</text>
  <text x="30" y="106" fill="#EAECEF" class="m" font-size="34" font-weight="800">${safeHandle}<tspan fill="#F0B90B">.ai</tspan></text>
  <text x="30" y="132" fill="#848E9C" class="s" font-size="13">Soulbound KYC-Backed Agent Identity on BNB Smart Chain</text>
  <text x="30" y="175" class="m k">SYBIL-PROOF TRUST SCORE</text>
  <text x="570" y="175" text-anchor="end" fill="#F0B90B" class="m" font-size="22" font-weight="800">${params.trustScore} PTS</text>
  <rect x="30" y="187" width="540" height="10" rx="5" fill="#2B3139"/>
  <rect x="30" y="187" width="${fillWidth}" height="10" rx="5" fill="url(#g)"/>
  <rect x="30" y="214" width="170" height="58" rx="10" fill="#181D26" stroke="#2B3139"/>
  <text x="44" y="236" class="m k">PEER VOUCHES</text>
  <text x="44" y="260" class="m v">${params.vouchesReceived}</text>
  <rect x="215" y="214" width="170" height="58" rx="10" fill="#181D26" stroke="#2B3139"/>
  <text x="229" y="236" class="m k">BOUNTIES DONE</text>
  <text x="229" y="260" class="m v">${params.bountiesCompleted}</text>
  <rect x="400" y="214" width="170" height="58" rx="10" fill="#181D26" stroke="#2B3139"/>
  <text x="414" y="236" class="m k">DROPS CLAIMED</text>
  <text x="414" y="260" class="m v">${params.campaignsClaimed}</text>
  ${capsMarkup}
  <line x1="30" y1="322" x2="570" y2="322" stroke="#2B3139"/>
  <text x="30" y="344" fill="#848E9C" class="m" font-size="11">VERIFIED BY BINANCE AGENT ID (0x60b9...022f)</text>
  <text x="570" y="344" text-anchor="end" fill="#0ECB81" class="m" font-size="11">1 HUMAN = 1 AGENT</text>
</svg>`;
}

export function downloadSvgFile(svgMarkup: string, filename: string) {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports a crisp 1200x720 (2x Retina) PNG image from the on-chain SVG so users can upload
 * their .ai Agent Passport directly to X (Twitter) and Binance Square.
 */
export async function downloadPngFromSvg(svgMarkup: string, filename: string): Promise<void> {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    ctx.drawImage(img, 0, 0, 1200, 720);

    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}
