// Generates all LitGive brand assets into web/public/brand/.
//
// Run with: node scripts/export-brand.mjs
//
// Outputs:
//   /brand/mark.svg               — pure SVG mark (transparent bg)
//   /brand/mark-mono.svg          — same, monochrome (no gold accent)
//   /brand/mark-cream.svg         — mark on cream paper bg
//   /brand/mark-ink.svg           — mark on ink (dark) bg
//   /brand/wordmark.svg           — mark + "LitGive" wordmark + tagline
//   /brand/wordmark-ink.svg       — wordmark on ink bg
//
//   /brand/mark-32.png            — favicon
//   /brand/mark-64.png
//   /brand/mark-128.png
//   /brand/mark-180.png           — apple touch icon
//   /brand/mark-256.png
//   /brand/mark-512.png
//   /brand/mark-1024.png          — high-res master
//   /brand/mark-cream-512.png     — for press / light backgrounds
//   /brand/mark-ink-512.png       — for screens / dark backgrounds
//
//   /brand/og.png                 — 1200×630 social share image
//   /brand/twitter-banner.png     — 1500×500 X / Twitter header
//
// Color tokens
const INK = "#0b0b10";
const CREAM = "#f5f0e2";
const PAPER_GRAIN = "#efe9d8";
const GOLD = "#cdb380";
const FOREGROUND_ON_CREAM = "#1a1a22";

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "brand");

// ---------------------------------------------------------------------------
// Geometry — must match web/src/components/Logo.tsx exactly
// ---------------------------------------------------------------------------

const VIEWBOX = 64;
const CX = 32;
const CY = 32;

const ARMS = [
  { angleDeg: 0,   len: 30,   base: 2.6, name: "top" },
  { angleDeg: 45,  len: 25.5, base: 2.1, name: "ne" },
  { angleDeg: 90,  len: 30,   base: 2.6, name: "right" },
  { angleDeg: 135, len: 25.5, base: 2.1, name: "se" },
  { angleDeg: 180, len: 30,   base: 2.6, name: "bottom" },
  { angleDeg: 225, len: 25.5, base: 2.1, name: "sw" },
  { angleDeg: 270, len: 30,   base: 2.6, name: "left" },
  { angleDeg: 315, len: 25.5, base: 2.1, name: "nw" },
];

const BASE_OFFSET = 1.3;
const PIN_R = 1.6;

function armPath(arm) {
  const rad = (arm.angleDeg * Math.PI) / 180;
  const ux = Math.sin(rad);
  const uy = -Math.cos(rad);
  const px = -uy;
  const py = ux;
  const tx = CX + ux * arm.len;
  const ty = CY + uy * arm.len;
  const bx = CX + ux * BASE_OFFSET;
  const by = CY + uy * BASE_OFFSET;
  const b1x = bx + px * arm.base;
  const b1y = by + py * arm.base;
  const b2x = bx - px * arm.base;
  const b2y = by - py * arm.base;
  const f = (n) => n.toFixed(2);
  return `M ${f(b1x)} ${f(b1y)} L ${f(tx)} ${f(ty)} L ${f(b2x)} ${f(b2y)} Z`;
}

// ---------------------------------------------------------------------------
// SVG builders
// ---------------------------------------------------------------------------

function svgMark({
  ink = INK,
  gold = GOLD,
  accent = true,
  background = "transparent",
  size = VIEWBOX,
} = {}) {
  const arms = ARMS.map((a) => {
    const fill = accent && a.name === "top" ? gold : ink;
    return `  <path d="${armPath(a)}" fill="${fill}" />`;
  }).join("\n");
  const bgRect =
    background === "transparent"
      ? ""
      : `  <rect width="${VIEWBOX}" height="${VIEWBOX}" fill="${background}" />\n`;
  const pinFill = accent ? ink : ink;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" width="${size}" height="${size}" role="img" aria-label="LitGive">
${bgRect}${arms}
  <circle cx="${CX}" cy="${CY}" r="${PIN_R}" fill="${pinFill}" />
</svg>
`;
}

function svgWordmark({
  ink = INK,
  gold = GOLD,
  background = "transparent",
} = {}) {
  // Layout: mark on the left (64×64 viewBox), wordmark + tagline to the right.
  // Total canvas: 480×140. Wordmark in Fraunces; tagline in monospace.
  const arms = ARMS.map((a) => {
    const fill = a.name === "top" ? gold : ink;
    return `    <path d="${armPath(a)}" fill="${fill}" />`;
  }).join("\n");

  const bgRect =
    background === "transparent"
      ? ""
      : `  <rect width="480" height="140" fill="${background}" />\n`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 140" width="480" height="140" role="img" aria-label="LitGive. Onchain donations on LitVM">
${bgRect}  <g transform="translate(20 38)">
${arms}
    <circle cx="${CX}" cy="${CY}" r="${PIN_R}" fill="${ink}" />
  </g>
  <g font-family="Fraunces, 'Times New Roman', serif" font-weight="400">
    <text x="115" y="78" font-size="68" fill="${ink}" letter-spacing="-2">LitGive</text>
  </g>
  <g font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="13" letter-spacing="2.6">
    <text x="116" y="105" fill="${ink}" opacity="0.55">ONCHAIN DONATIONS ON LITVM</text>
  </g>
</svg>
`;
}

function svgOg() {
  // 1200×630. Editorial layout with masthead, big mark+wordmark, bottom rule.
  const arms = ARMS.map((a) => {
    const fill = a.name === "top" ? GOLD : "#f5f0e2";
    return `    <path d="${armPath(a)}" fill="${fill}" />`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <pattern id="grain" width="3" height="3" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="0.4" fill="#f5f0e2" opacity="0.04" />
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="${INK}" />
  <rect width="1200" height="630" fill="url(#grain)" />

  <!-- Top rule + masthead -->
  <line x1="84" y1="92" x2="1116" y2="92" stroke="#2a2a25" stroke-width="1" />
  <g font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="16" letter-spacing="3" fill="#9a9a8e">
    <text x="84" y="76">VOL. I &#183; NO. 042 &#183; LITVM LITEFORGE</text>
    <text x="1116" y="76" text-anchor="end">CHAIN ID 4441 &#183; ZKLTC</text>
  </g>

  <!-- Center: mark + wordmark -->
  <g transform="translate(120 200) scale(4.3)">
${arms}
    <circle cx="${CX}" cy="${CY}" r="${PIN_R}" fill="#f5f0e2" />
  </g>
  <g font-family="Fraunces, 'Times New Roman', serif" font-weight="300">
    <text x="430" y="370" font-size="180" fill="#f5f0e2" letter-spacing="-6">LitGive</text>
  </g>
  <g font-family="Fraunces, 'Times New Roman', serif" font-weight="400" font-style="italic">
    <text x="432" y="430" font-size="34" fill="#bdbdb0">Donations, transparent by default.</text>
  </g>

  <!-- Bottom rule + meta -->
  <line x1="84" y1="555" x2="1116" y2="555" stroke="#2a2a25" stroke-width="1" />
  <g font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="16" letter-spacing="3" fill="#9a9a8e">
    <text x="84" y="585">ONCHAIN DONATION MARKETPLACE</text>
    <text x="1116" y="585" text-anchor="end">LITGIVE.APP</text>
  </g>
</svg>
`;
}

function svgTwitterBanner() {
  // 1500×500. Mark left, wordmark right, lots of breathing room.
  const arms = ARMS.map((a) => {
    const fill = a.name === "top" ? GOLD : "#f5f0e2";
    return `    <path d="${armPath(a)}" fill="${fill}" />`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 500" width="1500" height="500">
  <rect width="1500" height="500" fill="${INK}" />

  <line x1="80" y1="80" x2="1420" y2="80" stroke="#2a2a25" stroke-width="1" />
  <g font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="14" letter-spacing="3" fill="#9a9a8e">
    <text x="80" y="68">LITGIVE &#183; LITVM LITEFORGE</text>
    <text x="1420" y="68" text-anchor="end">DONATIONS, TRANSPARENT BY DEFAULT</text>
  </g>

  <g transform="translate(180 230) scale(3.4)">
${arms}
    <circle cx="${CX}" cy="${CY}" r="${PIN_R}" fill="#f5f0e2" />
  </g>

  <g font-family="Fraunces, 'Times New Roman', serif" font-weight="300">
    <text x="430" y="295" font-size="148" fill="#f5f0e2" letter-spacing="-5">LitGive</text>
  </g>
  <g font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="18" letter-spacing="3.2" fill="#9a9a8e">
    <text x="432" y="335">ONCHAIN DONATIONS ON LITVM</text>
  </g>

  <line x1="80" y1="430" x2="1420" y2="430" stroke="#2a2a25" stroke-width="1" />
</svg>
`;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function ensureDir(p) {
  if (!existsSync(p)) await mkdir(p, { recursive: true });
}

async function writeSvg(name, content) {
  const path = join(OUT_DIR, name);
  await writeFile(path, content, "utf8");
  console.log(`  ✓ ${name}`);
}

async function rasterize(svgString, sizes, baseName) {
  // Re-encode size in viewBox-relative — sharp will render the SVG at any
  // requested size without quality loss.
  const buf = Buffer.from(svgString);
  for (const size of sizes) {
    const out = `${baseName}-${size}.png`;
    await sharp(buf)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(OUT_DIR, out));
    console.log(`  ✓ ${out}`);
  }
}

async function rasterizeFixed(svgString, width, height, fileName) {
  const buf = Buffer.from(svgString);
  await sharp(buf)
    .resize(width, height, { fit: "contain" })
    .png()
    .toFile(join(OUT_DIR, fileName));
  console.log(`  ✓ ${fileName}`);
}

async function main() {
  await ensureDir(OUT_DIR);
  console.log(`Writing brand assets to ${OUT_DIR}\n`);

  // --- SVGs ---
  console.log("SVGs:");
  await writeSvg("mark.svg", svgMark()); // ink + gold accent, transparent bg
  await writeSvg("mark-mono.svg", svgMark({ accent: false })); // pure ink
  await writeSvg(
    "mark-mono-cream.svg",
    svgMark({ accent: false, ink: FOREGROUND_ON_CREAM })
  );
  await writeSvg(
    "mark-cream.svg",
    svgMark({ ink: FOREGROUND_ON_CREAM, gold: GOLD, background: CREAM })
  );
  await writeSvg(
    "mark-ink.svg",
    svgMark({ ink: "#f5f0e2", gold: GOLD, background: INK })
  );
  await writeSvg("wordmark.svg", svgWordmark());
  await writeSvg(
    "wordmark-cream.svg",
    svgWordmark({ ink: FOREGROUND_ON_CREAM, background: CREAM })
  );
  await writeSvg(
    "wordmark-ink.svg",
    svgWordmark({ ink: "#f5f0e2", background: INK })
  );
  await writeSvg("og.svg", svgOg());
  await writeSvg("twitter-banner.svg", svgTwitterBanner());

  // --- PNG: mark (transparent) at multiple sizes ---
  console.log("\nMark PNGs (transparent):");
  await rasterize(svgMark(), [32, 64, 128, 180, 256, 512, 1024], "mark");

  // --- PNG: mark on backgrounds ---
  console.log("\nMark PNGs (on backgrounds):");
  await rasterize(
    svgMark({ ink: FOREGROUND_ON_CREAM, background: CREAM }),
    [512, 1024],
    "mark-cream"
  );
  await rasterize(
    svgMark({ ink: "#f5f0e2", background: INK }),
    [512, 1024],
    "mark-ink"
  );

  // --- PNG: OG + Twitter banner ---
  console.log("\nLockup PNGs:");
  await rasterizeFixed(svgOg(), 1200, 630, "og.png");
  await rasterizeFixed(svgTwitterBanner(), 1500, 500, "twitter-banner.png");

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
