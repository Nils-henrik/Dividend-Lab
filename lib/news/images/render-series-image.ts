import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";

import type { NewsArticle } from "@/types/news";

import { resolveApprovedCompanyLogo } from "./company-logo-map";
import { normalizeRequestedCompanies, selectNordenCompanies } from "./select-norden-companies";
import {
  getSeriesImageTemplate,
  type CompanyRowTypography,
  type PixelRegion,
  type SeriesImageTemplate,
} from "./templates";
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

type RenderedCompanyMark = {
  company: string;
  input: Buffer;
  width: number;
  height: number;
};

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

/**
 * The published 1/2/4 Sep Norden covers show the company row as white
 * typographic wordmarks separated by thin rules. Rendering the approved company
 * names in that grammar is deliberately more source-of-truth faithful than
 * placing the coloured SVG assets directly on this dark photographic template.
 * The local logo registry still acts as the approval/availability allowlist;
 * missing or broken registry assets are therefore skipped before this stage.
 */
async function renderCompanyMark(
  company: string,
  typography: CompanyRowTypography,
): Promise<RenderedCompanyMark> {
  const displayName = escapeXml(company.toLocaleUpperCase("sv-SE"));
  const svg = Buffer.from(`
    <svg width="520" height="70" viewBox="0 0 520 70" xmlns="http://www.w3.org/2000/svg">
      <text
        x="2"
        y="50"
        fill="${typography.fill}"
        font-family="${typography.fontFamily}"
        font-size="${typography.fontSize}"
        font-weight="${typography.fontWeight}"
        letter-spacing="${typography.letterSpacing}"
      >${displayName}</text>
    </svg>
  `);
  const { data, info } = await sharp(svg)
    .trim()
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true });
  return {
    company,
    input: data,
    width: info.width,
    height: info.height,
  };
}

function companyRowRequiredWidth(
  marks: readonly RenderedCompanyMark[],
  typography: CompanyRowTypography,
) {
  if (marks.length === 0) return typography.x;
  const separators = marks.length - 1;
  return (
    typography.x +
    marks.reduce((sum, mark) => sum + mark.width, 0) +
    separators *
      (typography.gapBeforeSeparator + 1 + typography.gapAfterSeparator)
  );
}

async function companyRowOverlays(
  companies: readonly string[],
  region: PixelRegion,
  typography: CompanyRowTypography,
): Promise<{ overlays: OverlayOptions[]; companiesUsed: string[] }> {
  const marks = await Promise.all(companies.map((company) => renderCompanyMark(company, typography)));

  // Visual fit is part of selection: fewer correctly sized marks are preferable
  // to shrinking/crowding the established row merely to hit a technical max.
  while (marks.length > 0 && companyRowRequiredWidth(marks, typography) > region.width) {
    marks.pop();
  }

  const overlays: OverlayOptions[] = [];
  const separatorPositions: number[] = [];
  let x = typography.x;

  for (let index = 0; index < marks.length; index += 1) {
    const mark = marks[index];
    overlays.push({
      input: mark.input,
      left: region.x + x,
      top: region.y + typography.top,
    });
    x += mark.width;
    if (index < marks.length - 1) {
      const separatorX = x + typography.gapBeforeSeparator;
      separatorPositions.push(separatorX);
      x = separatorX + 1 + typography.gapAfterSeparator;
    }
  }

  if (separatorPositions.length > 0) {
    const lines = separatorPositions
      .map(
        (separatorX) =>
          `<line x1="${separatorX}" x2="${separatorX}" y1="${typography.separatorTop}" y2="${typography.separatorBottom}" stroke="${typography.separatorColor}" stroke-opacity="${typography.separatorOpacity}" stroke-width="1"/>`,
      )
      .join("");
    overlays.push({
      input: Buffer.from(
        `<svg width="${region.width}" height="${region.height}" viewBox="0 0 ${region.width} ${region.height}" xmlns="http://www.w3.org/2000/svg">${lines}</svg>`,
      ),
      left: region.x,
      top: region.y,
    });
  }

  return { overlays, companiesUsed: marks.map((mark) => mark.company) };
}

function resolveCompanies(input: SeriesImageInput, repoRoot: string) {
  if (input.series === "borssverige") {
    return { requestedCompanies: [], eligibleCompanies: [], missingCompanyLogos: [] };
  }

  const requestedCompanies = normalizeRequestedCompanies(input.companies ?? []);
  const eligibleCompanies: string[] = [];
  const missingCompanyLogos: string[] = [];
  for (const company of requestedCompanies) {
    const logo = resolveApprovedCompanyLogo(company, "dark");
    if (logo && existsSync(path.join(repoRoot, logo.resolvedFile))) {
      eligibleCompanies.push(company);
    } else {
      missingCompanyLogos.push(company);
    }
  }
  return { requestedCompanies, eligibleCompanies, missingCompanyLogos };
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
  const { requestedCompanies, eligibleCompanies, missingCompanyLogos } = resolveCompanies(
    input,
    repoRoot,
  );
  const referencePath = path.join(repoRoot, template.referencePath);

  await mkdir(path.dirname(outputPath), { recursive: true });

  const base = await cleanTemplateBase(referencePath, template);
  const overlays: OverlayOptions[] = [dateOverlay(template, input.date)];
  let companiesUsed = eligibleCompanies;

  if (
    input.series === "norden-i-centrum" &&
    template.dynamicRegions.companyRow &&
    template.companyRowTypography
  ) {
    const row = await companyRowOverlays(
      eligibleCompanies,
      template.dynamicRegions.companyRow,
      template.companyRowTypography,
    );
    companiesUsed = row.companiesUsed;
    overlays.push(...row.overlays);
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
