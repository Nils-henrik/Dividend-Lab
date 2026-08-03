/**
 * Generate DivLab App Router favicon assets from the DL monogram.
 *
 * Outputs:
 *   app/favicon.ico      (16 / 32 / 48 PNG-in-ICO)
 *   app/icon.png         (512×512)
 *   app/apple-icon.png   (180×180)
 *
 * Usage: node scripts/generate-favicon.mjs
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, "..", "app");

/** Matches --divlab-blue in app/globals.css */
const BRAND_BLUE = "#0a84ff";

/**
 * Geometric DL monogram matching the header mark: bold blue letters,
 * transparent background, proportions tuned for 16×16 legibility.
 */
function monogramSvg(size) {
  // Paths drawn in a 32×32 design space, then scaled to `size`.
  // Padding ~4 units keeps a clear safe area for browser chrome masks.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
  <!-- D -->
  <path fill="${BRAND_BLUE}" d="
    M4.2 5.2h7.05c4.55 0 7.55 2.85 7.55 7.35v6.9c0 4.5-3 7.35-7.55 7.35H4.2V5.2zm4.35 3.55v14.5h2.45c2.35 0 3.7-1.45 3.7-3.8v-6.9c0-2.35-1.35-3.8-3.7-3.8H8.55z
  "/>
  <!-- L -->
  <path fill="${BRAND_BLUE}" d="
    M21.15 5.2h4.35v17.9H28v3.7H21.15V5.2z
  "/>
</svg>`;
}

async function pngBuffer(size) {
  return sharp(Buffer.from(monogramSvg(size)))
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

/** Build a multi-size ICO containing PNG images (Vista+ compatible). */
function encodeIco(pngImages) {
  const count = pngImages.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + dirEntrySize * count;

  let offset = dirSize;
  const entries = pngImages.map(({ size, buffer }) => {
    const entry = {
      width: size >= 256 ? 0 : size,
      height: size >= 256 ? 0 : size,
      size: buffer.length,
      offset,
      buffer,
    };
    offset += buffer.length;
    return entry;
  });

  const ico = Buffer.alloc(offset);
  // ICONDIR
  ico.writeUInt16LE(0, 0); // reserved
  ico.writeUInt16LE(1, 2); // type: icon
  ico.writeUInt16LE(count, 4);

  entries.forEach((entry, index) => {
    const base = headerSize + dirEntrySize * index;
    ico.writeUInt8(entry.width, base);
    ico.writeUInt8(entry.height, base + 1);
    ico.writeUInt8(0, base + 2); // color palette
    ico.writeUInt8(0, base + 3); // reserved
    ico.writeUInt16LE(1, base + 4); // color planes
    ico.writeUInt16LE(32, base + 6); // bits per pixel
    ico.writeUInt32LE(entry.size, base + 8);
    ico.writeUInt32LE(entry.offset, base + 12);
    entry.buffer.copy(ico, entry.offset);
  });

  return ico;
}

async function main() {
  const icon512 = await pngBuffer(512);
  const apple180 = await pngBuffer(180);
  const png16 = await pngBuffer(16);
  const png32 = await pngBuffer(32);
  const png48 = await pngBuffer(48);

  const favicon = encodeIco([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ]);

  writeFileSync(join(appDir, "icon.png"), icon512);
  writeFileSync(join(appDir, "apple-icon.png"), apple180);
  writeFileSync(join(appDir, "favicon.ico"), favicon);

  // Preview rasters for visual QA at tab sizes (not shipped).
  writeFileSync(join(appDir, ".favicon-preview-16.png"), png16);
  writeFileSync(join(appDir, ".favicon-preview-32.png"), png32);

  console.log("Wrote app/favicon.ico (16/32/48)");
  console.log("Wrote app/icon.png (512×512)");
  console.log("Wrote app/apple-icon.png (180×180)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
