/**
 * Compose DivLab Learning list thumbnail for premiepension article.
 * Optimized for mobile list cards (~1.9:1 with shell padding) and desktop chips.
 *
 * Usage: node scripts/compose-premiepension-thumbnail.mjs
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const coverPath = join(
  root,
  "public/learning/ta-kontroll-over-premiepensionen.png",
);
const outputPath = join(
  root,
  "public/learning/ta-kontroll-over-premiepensionen-thumbnail.png",
);

// Compromise aspect between mobile list cards (~1.9:1) and desktop chips (1.625:1).
const WIDTH = 936;
const HEIGHT = 504;

const titleSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="leftFade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(8,18,32,0.78)"/>
      <stop offset="34%" stop-color="rgba(8,18,32,0.48)"/>
      <stop offset="58%" stop-color="rgba(8,18,32,0.14)"/>
      <stop offset="100%" stop-color="rgba(8,18,32,0)"/>
    </linearGradient>
    <filter id="titleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="rgba(0,0,0,0.45)"/>
    </filter>
    <filter id="subtitleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#leftFade)"/>

  <g filter="url(#titleShadow)">
    <text x="72" y="96" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="40" font-weight="700" letter-spacing="-0.8">
      <tspan x="72" dy="0">Din valbara pension</tspan>
      <tspan x="72" dy="46">kan bli värd mer</tspan>
      <tspan x="72" dy="46">än du tror</tspan>
    </text>
  </g>

  <g filter="url(#subtitleShadow)">
    <text x="72" y="276" fill="#9DD8F5" font-family="Inter, sans-serif" font-size="21" font-weight="500" letter-spacing="-0.2">
      Så tar du kontroll över premiepensionen
    </text>
  </g>
</svg>`;

async function main() {
  const scenic = await sharp(coverPath)
    .extract({ left: 500, top: 0, width: 1036, height: 1024 })
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "right bottom" })
    .toBuffer();

  const overlay = await sharp(Buffer.from(titleSvg)).png().toBuffer();

  const output = await sharp(scenic)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ compressionLevel: 9, quality: 92 })
    .toBuffer();

  writeFileSync(outputPath, output);

  const meta = await sharp(output).metadata();
  console.log(`Wrote ${outputPath} (${meta.width}x${meta.height})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
