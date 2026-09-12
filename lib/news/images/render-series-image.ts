import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";

import type { NewsArticle } from "@/types/news";

import { resolveApprovedCompanyLogo } from "./company-logo-map";
import { normalizeRequestedCompanies, selectNordenCompanies } from "./select-norden-companies";
import { getSeriesImageTemplate, type PixelRegion, type SeriesImageTemplate } from "./templates";
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

function parseDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid image date: ${date}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid image date: ${date}`);
  }
  return { year, month, day };
}

export function formatSeriesImageDate(date: string): string {
  const { year, month, day } = parseDate(date);
  return `${day} ${SWEDISH_MONTHS[month - 1]} ${year}`;
}

function formatTemplateDate(template: SeriesImageTemplate, date: string): string {
  const { year, month, day } = parseDate(date);
  const monthName = SWEDISH_MONTHS[month - 1];
  return template.dateFormat === "day-month-year"
    ? `${day} ${monthName} ${year}`
    : `${day} ${monthName}`;
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

/**
 * Remove baked dynamic content without touching any pixel outside the explicit
 * mask. Each column is reconstructed from the clean pixels immediately above
 * and below the mask. This is deterministic local interpolation, not generative
 * inpainting, and is intentionally limited to the small date/company zones.
 */
function reconstructRegion(
  pixels: Buffer,
  width: number,
  height: number,
  region: PixelRegion,
) {
  const left = Math.max(0, region.x);
  const right = Math.min(width, region.x + region.width);
  const top = Math.max(0, region.y);
  const bottom = Math.min(height, region.y + region.height);
  const topSampleY = Math.max(0, top - 1);
  const bottomSampleY = Math.min(height - 1, bottom);
  const span = Math.max(1, bottom - top + 1);

  for (let y = top; y < bottom; y += 1) {
    const mix = (y - top + 1) / span;
    for (let x = left; x < right; x += 1) {
      const target = (y * width + x) * 4;
      const topIndex = (topSampleY * width + x) * 4;
      const bottomIndex = (bottomSampleY * width + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        pixels[target + channel] = Math.round(
          pixels[topIndex + channel] * (1 - mix) + pixels[bottomIndex + channel] * mix,
        );
      }
    }
  }
}

async function cleanTemplateBase(referencePath: string, template: SeriesImageTemplate) {
  const { data, info } = await sharp(referencePath)
    .resize(SERIES_IMAGE_WIDTH, SERIES_IMAGE_HEIGHT, {
      fit: "cover",
      position: "centre",
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 4) throw new Error("template-base-must-be-rgba");
  const pixels = Buffer.from(data);
  reconstructRegion(pixels, SERIES_IMAGE_WIDTH, SERIES_IMAGE_HEIGHT, template.dynamicRegions.date);
  if (template.dynamicRegions.companyRow) {
    reconstructRegion(
      pixels,
      SERIES_IMAGE_WIDTH,
      SERIES_IMAGE_HEIGHT,
      template.dynamicRegions.companyRow,
    );
  }

  return sharp(pixels, {
    raw: { width: SERIES_IMAGE_WIDTH, height: SERIES_IMAGE_HEIGHT, channels: 4 },
  });
}

function dateOverlay(template: SeriesImageTemplate, date: string): OverlayOptions {
  const region = template.dynamicRegions.date;
  const typography = template.dateTypography;
  const value = escapeXml(formatTemplateDate(template, date));
  const svg = Buffer.from(`
    <svg width="${region.width}" height="${region.height}" viewBox="0 0 ${region.width} ${region.height}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${typography.x}"
        y="${typography.baseline}"
        text-anchor="${typography.textAnchor}"
        fill="${typography.fill}"
        font-family="${typography.fontFamily}"
        font-size="${typography.fontSize}"
        font-weight="${typography.fontWeight}"
        letter-spacing="${typography.letterSpacing}"
      >${value}</text>
    </svg>
  `);
  return { input: svg, left: region.x, top: region.y };
}

function logoSlots(count: number, region: PixelRegion): LogoSlot[] {
  if (count <= 0) return [];
  const slotWidth = region.width / count;
  const logoHeight = Math.min(36, region.height - 28);
  return Array.from({ length: count }, (_, index) => {
    const left = region.x + Math.round(index * slotWidth);
    const right = region.x + Math.round((index + 1) * slotWidth);
    return {
      x: left,
      y: region.y + Math.round((region.height - logoHeight) / 2),
      width: Math.max(1, right - left),
      height: logoHeight,
    };
  });
}

function separatorOverlay(count: number, region: PixelRegion): OverlayOptions | null {
  if (count <= 1) return null;
  const slotWidth = region.width / count;
  const lines = Array.from({ length: count - 1 }, (_, index) => {
    const x = Math.round((index + 1) * slotWidth);
    return `<line x1="${x}" x2="${x}" y1="14" y2="${region.height - 14}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1"/>`;
  }).join("");
  return {
    input: Buffer.from(
      `<svg width="${region.width}" height="${region.height}" viewBox="0 0 ${region.width} ${region.height}" xmlns="http://www.w3.org/2000/svg">${lines}</svg>`,
    ),
    left: region.x,
    top: region.y,
  };
}

async function renderLogoOverlay(
  repoRoot: string,
  company: string,
  slot: LogoSlot,
): Promise<OverlayOptions | null> {
  const logo = resolveApprovedCompanyLogo(company, "dark");
  if (!logo) return null;
  const sourcePath = path.join(repoRoot, logo.resolvedFile);
  if (!existsSync(sourcePath)) return null;
  const input = await readFile(sourcePath);
  const resized = await sharp(input)
    .resize({
      width: Math.max(1, slot.width - 32),
      height: slot.height,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  const metadata = await sharp(resized).metadata();
  const width = metadata.width ?? slot.width - 32;
  const height = metadata.height ?? slot.height;
  return {
    input: resized,
    left: slot.x + Math.round((slot.width - width) / 2),
    top: slot.y + Math.round((slot.height - height) / 2),
  };
}

function resolveCompanies(input: SeriesImageInput, repoRoot: string) {
  if (input.series === "borssverige") {
    return { requestedCompanies: [], companiesUsed: [], missingCompanyLogos: [] };
  }

  const requestedCompanies = normalizeRequestedCompanies(input.companies ?? []);
  const companiesUsed: string[] = [];
  const missingCompanyLogos: string[] = [];
  for (const company of requestedCompanies) {
    const logo = resolveApprovedCompanyLogo(company, "dark");
    if (logo && existsSync(path.join(repoRoot, logo.resolvedFile))) {
      companiesUsed.push(company);
    } else {
      missingCompanyLogos.push(company);
    }
  }
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
  const { requestedCompanies, companiesUsed, missingCompanyLogos } = resolveCompanies(
    input,
    repoRoot,
  );
  const referencePath = path.join(repoRoot, template.referencePath);

  await mkdir(path.dirname(outputPath), { recursive: true });

  const base = await cleanTemplateBase(referencePath, template);
  const overlays: OverlayOptions[] = [dateOverlay(template, input.date)];

  if (input.series === "norden-i-centrum" && template.dynamicRegions.companyRow) {
    const region = template.dynamicRegions.companyRow;
    const slots = logoSlots(companiesUsed.length, region);
    const separators = separatorOverlay(companiesUsed.length, region);
    if (separators) overlays.push(separators);
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
