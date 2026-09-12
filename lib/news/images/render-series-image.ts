import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";

import type { NewsArticle } from "@/types/news";

import { getApprovedCompanyLogo } from "./company-logo-map";
import { normalizeRequestedCompanies, selectNordenCompanies } from "./select-norden-companies";
import { getSeriesImageTemplate, type SeriesImageTemplate } from "./templates";
import {
  SERIES_IMAGE_FORMAT,
  SERIES_IMAGE_HEIGHT,
  SERIES_IMAGE_WIDTH,
  type SeriesImageInput,
  type SeriesImageRenderMetadata,
  type SeriesImageResult,
} from "./types";
import { validateGeneratedSeriesImage } from "./validate-generated-image";

const SWEDISH_MONTHS = [
  "JANUARI",
  "FEBRUARI",
  "MARS",
  "APRIL",
  "MAJ",
  "JUNI",
  "JULI",
  "AUGUSTI",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DECEMBER",
] as const;

export type RenderSeriesImageOptions = {
  repoRoot?: string;
  mode?: "dry-run" | "publish";
  publishedAt?: string;
  /** Test-only fault injection used by the negative suite. */
  throwBeforeRender?: boolean;
};

type LogoSlot = { x: number; y: number; width: number; height: number };

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function formatSeriesImageDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid image date: ${date}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid image date: ${date}`);
  }
  return `${day} ${SWEDISH_MONTHS[month - 1]} ${year}`;
}

function outputFor(input: SeriesImageInput, repoRoot: string, mode: "dry-run" | "publish") {
  const filename = `${input.series}-${input.date}.png`;
  if (mode === "publish") {
    return {
      outputPath: path.join(repoRoot, "public", "news", "generated", filename),
      publicPath: `/news/generated/${filename}`,
    };
  }
  return {
    outputPath: path.join(repoRoot, ".tmp", "autoredaktion-images", filename),
    publicPath: null,
  };
}

function logoSlots(count: number, panel: NonNullable<SeriesImageTemplate["logoPanel"]>): LogoSlot[] {
  const plateWidth = 188;
  const plateHeight = 112;
  const left = panel.x + 32;
  const right = panel.x + panel.width - 32 - plateWidth;
  const center = panel.x + Math.round((panel.width - plateWidth) / 2);
  const top = panel.y + 34;
  const middle = panel.y + 164;
  const bottom = panel.y + 294;

  switch (count) {
    case 0:
      return [];
    case 1:
      return [{ x: center, y: middle, width: plateWidth, height: plateHeight }];
    case 2:
      return [
        { x: left, y: middle, width: plateWidth, height: plateHeight },
        { x: right, y: middle, width: plateWidth, height: plateHeight },
      ];
    case 3:
      return [
        { x: left, y: top + 30, width: plateWidth, height: plateHeight },
        { x: right, y: top + 30, width: plateWidth, height: plateHeight },
        { x: center, y: bottom - 20, width: plateWidth, height: plateHeight },
      ];
    case 4:
      return [
        { x: left, y: top, width: plateWidth, height: plateHeight },
        { x: right, y: top, width: plateWidth, height: plateHeight },
        { x: left, y: bottom - 24, width: plateWidth, height: plateHeight },
        { x: right, y: bottom - 24, width: plateWidth, height: plateHeight },
      ];
    default:
      return [
        { x: left, y: top - 4, width: plateWidth, height: plateHeight },
        { x: right, y: top - 4, width: plateWidth, height: plateHeight },
        { x: left, y: bottom - 24, width: plateWidth, height: plateHeight },
        { x: right, y: bottom - 24, width: plateWidth, height: plateHeight },
        { x: center, y: middle - 4, width: plateWidth, height: plateHeight },
      ];
  }
}

function foregroundSvg(template: SeriesImageTemplate, date: string, logoCount: number): Buffer {
  const panel = template.textPanel;
  const logoPanel = template.logoPanel;
  const seriesName = escapeXml(template.seriesName);
  const formattedDate = escapeXml(formatSeriesImageDate(date));
  const logoPlateRects = logoPanel
    ? logoSlots(logoCount, logoPanel)
        .map(
          (slot) =>
            `<rect x="${slot.x}" y="${slot.y}" width="${slot.width}" height="${slot.height}" rx="18" fill="#ffffff" fill-opacity="0.94" stroke="#d7e3f6" stroke-opacity="0.42"/>`,
        )
        .join("")
    : "";

  return Buffer.from(`
    <svg width="${SERIES_IMAGE_WIDTH}" height="${SERIES_IMAGE_HEIGHT}" viewBox="0 0 ${SERIES_IMAGE_WIDTH} ${SERIES_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#071426" stop-opacity="0.97"/>
          <stop offset="1" stop-color="#0b2d58" stop-opacity="0.94"/>
        </linearGradient>
      </defs>
      <rect x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" rx="26" fill="url(#panel)"/>
      ${logoPanel ? `<rect x="${logoPanel.x}" y="${logoPanel.y}" width="${logoPanel.width}" height="${logoPanel.height}" rx="28" fill="#071426" fill-opacity="0.91"/>` : ""}
      ${logoPlateRects}
      <text x="${panel.x + 42}" y="${panel.y + 118}" fill="#ffffff" font-family="Inter, Arial, Helvetica, sans-serif" font-size="58" font-weight="800" letter-spacing="1">${seriesName}</text>
      <text x="${panel.x + 44}" y="${panel.y + 190}" fill="#dbeafe" font-family="Inter, Arial, Helvetica, sans-serif" font-size="34" font-weight="700" letter-spacing="2">${formattedDate}</text>
      <rect x="${panel.x + 44}" y="${panel.y + 224}" width="84" height="6" rx="3" fill="#0a84ff"/>
    </svg>
  `);
}

async function renderLogoOverlay(
  repoRoot: string,
  company: string,
  slot: LogoSlot,
): Promise<OverlayOptions | null> {
  const logo = getApprovedCompanyLogo(company);
  if (!logo) return null;
  const sourcePath = path.join(repoRoot, logo.file);
  const input = await readFile(sourcePath);
  const resized = await sharp(input)
    .resize({
      width: slot.width - 34,
      height: slot.height - 32,
      fit: "contain",
      withoutEnlargement: true,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  const metadata = await sharp(resized).metadata();
  const width = metadata.width ?? slot.width - 34;
  const height = metadata.height ?? slot.height - 32;
  return {
    input: resized,
    left: slot.x + Math.round((slot.width - width) / 2),
    top: slot.y + Math.round((slot.height - height) / 2),
  };
}

function resolveCompanies(input: SeriesImageInput) {
  if (input.series === "borssverige") {
    return { requestedCompanies: [], companiesUsed: [], missingCompanyLogos: [] };
  }

  const requestedCompanies = normalizeRequestedCompanies(input.companies ?? []);
  const companiesUsed = requestedCompanies.filter((company) => getApprovedCompanyLogo(company));
  const missingCompanyLogos = requestedCompanies.filter(
    (company) => !getApprovedCompanyLogo(company),
  );
  return { requestedCompanies, companiesUsed, missingCompanyLogos };
}

export async function renderSeriesImage(
  input: SeriesImageInput,
  options: RenderSeriesImageOptions = {},
): Promise<SeriesImageResult> {
  if (options.throwBeforeRender) throw new Error("Injected image renderer failure");

  const repoRoot = options.repoRoot ?? process.cwd();
  const mode = options.mode ?? "dry-run";
  const template = getSeriesImageTemplate(input.series);
  const { outputPath, publicPath } = outputFor(input, repoRoot, mode);
  const { requestedCompanies, companiesUsed, missingCompanyLogos } = resolveCompanies(input);
  const referencePath = path.join(repoRoot, template.referencePath);

  await mkdir(path.dirname(outputPath), { recursive: true });

  const base = sharp(referencePath).resize(SERIES_IMAGE_WIDTH, SERIES_IMAGE_HEIGHT, {
    fit: "cover",
    position: "centre",
  });
  const overlays: OverlayOptions[] = [
    { input: foregroundSvg(template, input.date, companiesUsed.length), left: 0, top: 0 },
  ];

  if (input.series === "norden-i-centrum" && template.logoPanel) {
    const slots = logoSlots(companiesUsed.length, template.logoPanel);
    for (let index = 0; index < companiesUsed.length; index += 1) {
      const overlay = await renderLogoOverlay(repoRoot, companiesUsed[index], slots[index]);
      if (overlay) overlays.push(overlay);
    }
  }

  await base
    .composite(overlays)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  const metadata: SeriesImageRenderMetadata = {
    series: input.series,
    date: input.date,
    articleSlug: input.articleSlug,
    templateVersion: template.templateVersion,
    requestedCompanies,
    companiesUsed,
    missingCompanyLogos,
    outputPath,
    publicPath: publicPath ?? `/news/generated/${input.series}-${input.date}.png`,
    width: SERIES_IMAGE_WIDTH,
    height: SERIES_IMAGE_HEIGHT,
    format: SERIES_IMAGE_FORMAT,
    canonicalDivLabLogoSource: template.canonicalDivLabLogoSource,
  };
  const validation = await validateGeneratedSeriesImage(metadata, {
    repoRoot,
    publishedAt: options.publishedAt,
  });

  return {
    imagePath: validation.ok ? outputPath : null,
    socialImagePath: validation.ok && mode === "publish" ? publicPath : null,
    publicPath: validation.ok && mode === "publish" ? publicPath : null,
    companiesUsed,
    missingCompanyLogos,
    width: SERIES_IMAGE_WIDTH,
    height: SERIES_IMAGE_HEIGHT,
    format: SERIES_IMAGE_FORMAT,
    templateVersion: template.templateVersion,
    status: validation.ok ? "generated" : "failed",
    validation,
    metadata,
  };
}

export async function renderSeriesImageSafe(
  input: SeriesImageInput,
  options: RenderSeriesImageOptions = {},
): Promise<SeriesImageResult> {
  try {
    return await renderSeriesImage(input, options);
  } catch (error) {
    const template = getSeriesImageTemplate(input.series);
    return {
      imagePath: null,
      socialImagePath: null,
      publicPath: null,
      companiesUsed: [],
      missingCompanyLogos: [],
      width: SERIES_IMAGE_WIDTH,
      height: SERIES_IMAGE_HEIGHT,
      format: SERIES_IMAGE_FORMAT,
      templateVersion: template.templateVersion,
      status: "failed",
      validation: {
        ok: false,
        issues: [error instanceof Error ? error.message : "image-renderer-failed"],
      },
      metadata: null,
    };
  }
}

export async function renderSeriesImageForArticle(
  article: NewsArticle,
  series: SeriesImageInput["series"],
  options: RenderSeriesImageOptions = {},
): Promise<{ article: NewsArticle; image: SeriesImageResult }> {
  const selection = series === "norden-i-centrum" ? selectNordenCompanies(article) : null;
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(article.publishedAt));

  const image = await renderSeriesImageSafe(
    {
      series,
      date,
      articleSlug: article.slug ?? article.id,
      companies: selection?.requestedCompanies ?? [],
    },
    { ...options, publishedAt: article.publishedAt },
  );

  // A failed pre-assembly render is explicitly represented as imageUrl:null.
  // A declared non-null local image still fails later in the article validator.
  const nextArticle: NewsArticle = {
    ...article,
    imageUrl: image.status === "generated" && options.mode === "publish" ? image.publicPath : null,
    thumbnailImageUrl:
      image.status === "generated" && options.mode === "publish" ? image.publicPath : null,
    thumbnailObjectPosition: "center 50%",
    mobileThumbnailObjectPosition: "center 50%",
  };

  return { article: nextArticle, image };
}
