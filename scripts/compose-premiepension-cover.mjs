/**
 * Compose DivLab Learning cover for premiepension article.
 * Usage: node scripts/compose-premiepension-cover.mjs
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const inputPath =
  process.argv[2] ??
  "/opt/cursor/artifacts/assets/premiepension-beach-bg.png";
const outputPath = join(
  root,
  "public/learning/ta-kontroll-over-premiepensionen.png",
);

const WIDTH = 1536;
const HEIGHT = 1024;

const titleSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="leftFade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(8,18,32,0.55)"/>
      <stop offset="45%" stop-color="rgba(8,18,32,0.28)"/>
      <stop offset="72%" stop-color="rgba(8,18,32,0.05)"/>
      <stop offset="100%" stop-color="rgba(8,18,32,0)"/>
    </linearGradient>
    <filter id="titleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="rgba(0,0,0,0.45)"/>
    </filter>
    <filter id="subtitleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="4" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#leftFade)"/>

  <g filter="url(#titleShadow)">
    <text x="96" y="168" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="74" font-weight="700" letter-spacing="-1.5">
      <tspan x="96" dy="0">Din valbara pension</tspan>
      <tspan x="96" dy="86">kan bli värd mer</tspan>
      <tspan x="96" dy="86">än du tror</tspan>
    </text>
  </g>

  <g filter="url(#subtitleShadow)">
    <text x="96" y="500" fill="#9DD8F5" font-family="Inter, sans-serif" font-size="38" font-weight="500" letter-spacing="-0.3">
      Så tar du kontroll över premiepensionen
    </text>
  </g>
</svg>`;

async function main() {
  const background = await sharp(inputPath)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "center" })
    .toBuffer();

  const overlay = await sharp(Buffer.from(titleSvg)).png().toBuffer();

  const output = await sharp(background)
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
