/**
 * Compose DivLab Börsnyheter cover for Norden i centrum, 11 augusti 2026.
 *
 * Scenery/panel backgrounds are editorial imagery. Masthead, headline, date,
 * Nordic flags, company names and captions are applied deterministically via
 * SVG + sharp (no fabricated logo marks or final typography).
 *
 * Visual reference: public/news-demo/norden-i-centrum-10-augusti-2026.webp
 * Implementation reference: scripts/compose-norden-i-centrum-10-augusti-cover.mjs
 *
 * Usage: node scripts/compose-norden-i-centrum-11-augusti-cover.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const assetsDir = "/opt/cursor/artifacts/assets";
const outputPath = join(
  root,
  "public/news-demo/norden-i-centrum-11-augusti-2026.webp",
);

const WIDTH = 1024;
const HEIGHT = 682;

const NAVY = "#0B1F3A";
const NAVY_DEEP = "#071628";
const BLUE = "#163A66";
const WHITE = "#FFFFFF";
const MUTED = "#D7E4F5";

const SERIF =
  "'Liberation Serif', 'Noto Serif', 'Times New Roman', serif";
const SANS =
  "'Liberation Sans', 'Noto Sans', 'DejaVu Sans', Arial, sans-serif";

const PANELS = [
  {
    name: "Storskogen",
    caption: "Storskogen levererar Q2-rapport",
    file: "norden11-panel-storskogen.png",
  },
  {
    name: "ISS",
    caption: "ISS visar H1 mot höjd prognos",
    file: "norden11-panel-iss.png",
  },
  {
    name: "Sparebanken Norge",
    caption: "Sparebanken Norge väntar Q2 och CMD",
    file: "norden11-panel-sparebanken.png",
  },
  {
    name: "Ponsse",
    caption: "Ponsse har halvårsrapport i dag",
    file: "norden11-panel-ponsse.png",
  },
  {
    name: "Equinor",
    caption: "Equinor mäter oljepriset",
    file: "norden11-panel-equinor.png",
  },
  {
    name: "Nokia",
    caption: "Nokia följer AI-sentimentet",
    file: "norden11-panel-nokia.png",
  },
];

const HEADER_H = 292;
const TITLE_BAND_H = 58;
const PANEL_TOP = HEADER_H + TITLE_BAND_H;
const FOOTER_H = 36;
const PANEL_H = HEIGHT - PANEL_TOP - FOOTER_H;
const PANEL_GAP = 2;
const PANEL_W = Math.floor((WIDTH - PANEL_GAP * 5) / 6);

function wrapCaption(text, maxChars = 18) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function flagSweden(x, y, w = 46, h = 30) {
  const crossV = w * 0.3;
  const crossH = h * 0.4;
  return `
  <g transform="translate(${x},${y})">
    <rect width="${w}" height="${h}" fill="#006AA7" rx="1"/>
    <rect x="${crossV}" width="${w * 0.16}" height="${h}" fill="#FECC00"/>
    <rect y="${crossH}" width="${w}" height="${h * 0.2}" fill="#FECC00"/>
  </g>`;
}

function flagDenmark(x, y, w = 46, h = 30) {
  const crossV = w * 0.3;
  const crossH = h * 0.4;
  return `
  <g transform="translate(${x},${y})">
    <rect width="${w}" height="${h}" fill="#C8102E" rx="1"/>
    <rect x="${crossV}" width="${w * 0.14}" height="${h}" fill="#FFFFFF"/>
    <rect y="${crossH}" width="${w}" height="${h * 0.18}" fill="#FFFFFF"/>
  </g>`;
}

function flagNorway(x, y, w = 46, h = 30) {
  const crossV = w * 0.28;
  const crossH = h * 0.38;
  return `
  <g transform="translate(${x},${y})">
    <rect width="${w}" height="${h}" fill="#BA0C2F" rx="1"/>
    <rect x="${crossV}" width="${w * 0.2}" height="${h}" fill="#FFFFFF"/>
    <rect y="${crossH}" width="${w}" height="${h * 0.24}" fill="#FFFFFF"/>
    <rect x="${crossV + w * 0.04}" width="${w * 0.12}" height="${h}" fill="#00205B"/>
    <rect y="${crossH + h * 0.05}" width="${w}" height="${h * 0.14}" fill="#00205B"/>
  </g>`;
}

function flagFinland(x, y, w = 46, h = 30) {
  const crossV = w * 0.3;
  const crossH = h * 0.4;
  return `
  <g transform="translate(${x},${y})">
    <rect width="${w}" height="${h}" fill="#FFFFFF" stroke="#D0D7E2" stroke-width="1" rx="1"/>
    <rect x="${crossV}" width="${w * 0.16}" height="${h}" fill="#002F6C"/>
    <rect y="${crossH}" width="${w}" height="${h * 0.2}" fill="#002F6C"/>
  </g>`;
}

function chartIcon() {
  return `
  <g stroke="#7EB6FF" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 10 L4 7 L8 8.5 L13 2"/>
    <path d="M0 12 H14"/>
  </g>`;
}

function overlaySvg(panelMeta) {
  const flagStartX = WIDTH - 28 - 4 * 52;
  const panelsMarkup = panelMeta
    .map((panel, index) => {
      const x = index * (PANEL_W + PANEL_GAP);
      const nameSize =
        panel.name.length > 18 ? 10.5 : panel.name.length > 12 ? 12 : 13.5;
      const captionLines = wrapCaption(
        panel.caption,
        panel.name.length > 16 ? 15 : 16,
      );
      const captionStartY =
        PANEL_TOP + PANEL_H - 58 - (captionLines.length - 1) * 11;
      const captionTspans = captionLines
        .map(
          (line, i) =>
            `<tspan x="${x + PANEL_W / 2}" dy="${i === 0 ? 0 : 11}">${line}</tspan>`,
        )
        .join("");
      return `
      <rect x="${x}" y="${PANEL_TOP}" width="${PANEL_W}" height="${PANEL_H}" fill="url(#panelWash)"/>
      <rect x="${x}" y="${PANEL_TOP + PANEL_H - 110}" width="${PANEL_W}" height="110" fill="url(#panelBottom)"/>
      <rect x="${x}" y="${PANEL_TOP}" width="${PANEL_W}" height="2" fill="#2E6BB3"/>
      <text x="${x + PANEL_W / 2}" y="${PANEL_TOP + 26}" text-anchor="middle"
        fill="${WHITE}" font-family="${SANS}" font-size="${nameSize}" font-weight="700"
        letter-spacing="0.15">${panel.name}</text>
      <text x="${x + PANEL_W / 2}" y="${captionStartY}" text-anchor="middle"
        fill="${WHITE}" font-family="${SANS}" font-size="10" font-weight="600"
        letter-spacing="0.05">${captionTspans}</text>
      <g transform="translate(${x + PANEL_W / 2 - 32}, ${PANEL_TOP + PANEL_H - 26})">
        ${chartIcon()}
        <text x="18" y="10" fill="#8FC0FF" font-family="${SANS}" font-size="9"
          font-weight="700" letter-spacing="1.1">LÄS MER</text>
      </g>
      ${index < 5 ? `<rect x="${x + PANEL_W}" y="${PANEL_TOP}" width="${PANEL_GAP}" height="${PANEL_H}" fill="${NAVY_DEEP}"/>` : ""}`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="skyFade" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="55%" stop-color="rgba(255,255,255,0.04)"/>
      <stop offset="100%" stop-color="rgba(11,31,58,0.18)"/>
    </linearGradient>
    <linearGradient id="titleBand" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F7FAFE"/>
      <stop offset="100%" stop-color="#E7EEF8"/>
    </linearGradient>
    <linearGradient id="panelWash" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(7,22,40,0.55)"/>
      <stop offset="35%" stop-color="rgba(7,22,40,0.28)"/>
      <stop offset="100%" stop-color="rgba(7,22,40,0.48)"/>
    </linearGradient>
    <linearGradient id="panelBottom" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(7,22,40,0)"/>
      <stop offset="100%" stop-color="rgba(7,22,40,0.88)"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.4" flood-color="rgba(0,0,0,0.28)"/>
    </filter>
  </defs>

  <!-- Soft wash over skyline for masthead readability -->
  <rect width="${WIDTH}" height="${HEADER_H}" fill="url(#skyFade)"/>

  <!-- Masthead -->
  <g filter="url(#softShadow)">
    <text x="28" y="42" fill="${NAVY}" font-family="${SERIF}" font-size="34" font-weight="700"
      letter-spacing="-0.6">DivLab</text>
    <text x="30" y="62" fill="${BLUE}" font-family="${SANS}" font-size="11" font-weight="700"
      letter-spacing="3.2">BÖRSNYHETER</text>
    <line x1="30" y1="70" x2="168" y2="70" stroke="${BLUE}" stroke-width="1"/>
    <text x="30" y="84" fill="${BLUE}" font-family="${SANS}" font-size="7.5" font-weight="600"
      letter-spacing="1.4">NORDISK FINANSIELL NYHETSFÖRMEDLING</text>
  </g>

  <!-- Flags -->
  ${flagSweden(flagStartX, 22)}
  ${flagDenmark(flagStartX + 52, 22)}
  ${flagNorway(flagStartX + 104, 22)}
  ${flagFinland(flagStartX + 156, 22)}

  <!-- Title band -->
  <rect x="0" y="${HEADER_H}" width="${WIDTH}" height="${TITLE_BAND_H}" fill="url(#titleBand)"/>
  <text x="${WIDTH / 2}" y="${HEADER_H + 28}" text-anchor="middle" fill="${NAVY}"
    font-family="${SERIF}" font-size="30" font-weight="700" letter-spacing="1.5">NORDEN I CENTRUM</text>
  <line x1="210" y1="${HEADER_H + 42}" x2="430" y2="${HEADER_H + 42}" stroke="${BLUE}" stroke-width="1"/>
  <text x="${WIDTH / 2}" y="${HEADER_H + 47}" text-anchor="middle" fill="${BLUE}"
    font-family="${SANS}" font-size="12" font-weight="700" letter-spacing="2.4">11 AUGUSTI</text>
  <line x1="594" y1="${HEADER_H + 42}" x2="814" y2="${HEADER_H + 42}" stroke="${BLUE}" stroke-width="1"/>

  <!-- Panels text overlays -->
  ${panelsMarkup}

  <!-- Footer -->
  <rect x="0" y="${HEIGHT - FOOTER_H}" width="${WIDTH}" height="${FOOTER_H}" fill="${NAVY_DEEP}"/>
  <text x="24" y="${HEIGHT - 13}" fill="${MUTED}" font-family="${SANS}" font-size="9.5"
    font-weight="600" letter-spacing="1.6">AKTIER   ·   EKONOMI   ·   HÅLLBARHET   ·   INNOVATION   ·   NORDEN</text>
  <text x="${WIDTH - 24}" y="${HEIGHT - 13}" text-anchor="end" fill="${WHITE}"
    font-family="${SANS}" font-size="10" font-weight="700" letter-spacing="1.8">DIVLAB.SE</text>
</svg>`;
}

async function preparePanel(file, width, height) {
  return sharp(join(assetsDir, file))
    .resize(width, height, { fit: "cover", position: "centre" })
    .modulate({ brightness: 0.78, saturation: 0.9 })
    .toBuffer();
}

async function main() {
  mkdirSync(dirname(outputPath), { recursive: true });

  const skyline = await sharp(join(assetsDir, "norden11-skyline.png"))
    .resize(WIDTH, HEADER_H + 40, { fit: "cover", position: "south" })
    .extract({ left: 0, top: 0, width: WIDTH, height: HEADER_H })
    .toBuffer();

  const panelBuffers = await Promise.all(
    PANELS.map((panel) => preparePanel(panel.file, PANEL_W, PANEL_H)),
  );

  const base = await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: NAVY_DEEP,
    },
  })
    .composite([
      { input: skyline, top: 0, left: 0 },
      ...panelBuffers.map((input, index) => ({
        input,
        top: PANEL_TOP,
        left: index * (PANEL_W + PANEL_GAP),
      })),
    ])
    .png()
    .toBuffer();

  const overlay = await sharp(Buffer.from(overlaySvg(PANELS))).png().toBuffer();

  const output = await sharp(base)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .webp({ quality: 86 })
    .toBuffer();

  writeFileSync(outputPath, output);
  const meta = await sharp(output).metadata();
  console.log(
    `Wrote ${outputPath} (${meta.width}x${meta.height}, ${output.length} bytes)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
