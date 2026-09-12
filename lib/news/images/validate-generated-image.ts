import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

import { parseIsoDateTime, stockholmCalendarDate } from "@/lib/news/autoredaktion/dates";
import type { EditorialSeries } from "@/lib/news/autoredaktion/types";
import type { NewsArticle } from "@/types/news";

import { getApprovedCompanyLogo } from "./company-logo-map";
import { getSeriesImageTemplate } from "./templates";
import {
  SERIES_IMAGE_FORMAT,
  SERIES_IMAGE_HEIGHT,
  SERIES_IMAGE_WIDTH,
  type SeriesImageRenderMetadata,
  type SeriesImageValidation,
} from "./types";

export type ValidateGeneratedImageOptions = {
  repoRoot?: string;
  publishedAt?: string;
};

function canonicalFilename(metadata: SeriesImageRenderMetadata): string {
  return `${metadata.series}-${metadata.date}.png`;
}

function hash(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

async function staticLogoRegionHash(
  file: string,
  region: { x: number; y: number; width: number; height: number },
  resizeReference = false,
): Promise<string> {
  let image = sharp(file);
  if (resizeReference) {
    image = image.resize(SERIES_IMAGE_WIDTH, SERIES_IMAGE_HEIGHT, {
      fit: "cover",
      position: "centre",
    });
  }
  const raw = await image
    .extract({
      left: region.x,
      top: region.y,
      width: region.width,
      height: region.height,
    })
    // Composite output can be RGBA while the approved source is RGB. Normalize
    // both before hashing so the regression check compares visible pixels, not
    // container channel metadata.
    .ensureAlpha()
    .raw()
    .toBuffer();
  return hash(raw);
}

async function validateReadablePng(
  imagePath: string,
  referencePath: string,
  staticLogoRegion: { x: number; y: number; width: number; height: number },
): Promise<string[]> {
  const issues: string[] = [];
  try {
    const image = await sharp(imagePath).metadata();
    if (image.width !== SERIES_IMAGE_WIDTH || image.height !== SERIES_IMAGE_HEIGHT) {
      issues.push("image-dimensions");
    }
    if (image.format !== SERIES_IMAGE_FORMAT) issues.push("image-format");

    if (existsSync(referencePath)) {
      const [generatedLogoHash, referenceLogoHash] = await Promise.all([
        staticLogoRegionHash(imagePath, staticLogoRegion),
        staticLogoRegionHash(referencePath, staticLogoRegion, true),
      ]);
      if (generatedLogoHash !== referenceLogoHash) {
        issues.push("canonical-logo-region-changed");
      }
    }
  } catch {
    issues.push("image-unreadable");
  }
  return issues;
}

export async function validateGeneratedSeriesImage(
  metadata: SeriesImageRenderMetadata,
  options: ValidateGeneratedImageOptions = {},
): Promise<SeriesImageValidation> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const issues: string[] = [];
  const template = getSeriesImageTemplate(metadata.series);
  const referencePath = path.join(repoRoot, template.referencePath);

  if (!existsSync(metadata.outputPath)) {
    issues.push("output-missing");
    return { ok: false, issues };
  }

  const stats = statSync(metadata.outputPath);
  if (!stats.isFile() || stats.size <= 0) issues.push("output-empty");

  if (path.basename(metadata.outputPath) !== canonicalFilename(metadata)) {
    issues.push("output-filename");
  }
  if (metadata.publicPath !== `/news/generated/${canonicalFilename(metadata)}`) {
    issues.push("public-path");
  }

  if (metadata.width !== SERIES_IMAGE_WIDTH || metadata.height !== SERIES_IMAGE_HEIGHT) {
    issues.push("metadata-dimensions");
  }
  if (metadata.format !== SERIES_IMAGE_FORMAT) issues.push("metadata-format");
  if (metadata.templateVersion !== template.templateVersion) issues.push("template-version");
  if (metadata.canonicalDivLabLogoSource !== template.canonicalDivLabLogoSource) {
    issues.push("canonical-divlab-logo");
  }

  const uniqueCompanies = new Set(
    metadata.companiesUsed.map((company) => company.toLocaleLowerCase("sv-SE")),
  );
  if (uniqueCompanies.size !== metadata.companiesUsed.length) issues.push("duplicate-company-logo");
  if (metadata.companiesUsed.length > 5) issues.push("too-many-company-logos");
  if (metadata.series === "borssverige" && metadata.companiesUsed.length > 0) {
    issues.push("borssverige-company-logo");
  }

  for (const company of metadata.companiesUsed) {
    const logo = getApprovedCompanyLogo(company);
    if (!logo || !existsSync(path.join(repoRoot, logo.file))) {
      issues.push(`broken-logo:${company}`);
    }
  }

  if (!existsSync(referencePath)) issues.push("template-reference-missing");
  if (!existsSync(path.join(repoRoot, template.canonicalDivLabLogoSource))) {
    issues.push("canonical-divlab-logo-source-missing");
  }

  if (options.publishedAt) {
    const published = parseIsoDateTime(options.publishedAt);
    if (!published) {
      issues.push("published-at-invalid");
    } else if (stockholmCalendarDate(published) !== metadata.date) {
      issues.push("image-date-mismatch");
    }
  }

  issues.push(
    ...(await validateReadablePng(
      metadata.outputPath,
      referencePath,
      template.staticLogoRegion,
    )),
  );

  return { ok: issues.length === 0, issues };
}

/**
 * Quality-gate validation for the image path declared by a finished article.
 * `imageUrl:null` is a valid explicit fail-safe. A non-null generated path must
 * be the canonical date URL and must point at a readable 1280x720 PNG whose
 * static DivLab brand region still matches the approved template reference.
 */
export async function validateDeclaredGeneratedImage(
  article: NewsArticle,
  series: EditorialSeries,
  repoRoot = process.cwd(),
): Promise<SeriesImageValidation> {
  if (article.imageUrl == null) return { ok: true, issues: [] };
  if (!article.imageUrl.startsWith("/news/generated/")) {
    return { ok: true, issues: [] };
  }

  const issues: string[] = [];
  const published = parseIsoDateTime(article.publishedAt);
  if (!published) return { ok: false, issues: ["published-at-invalid"] };
  const date = stockholmCalendarDate(published);
  const expectedPublicPath = `/news/generated/${series}-${date}.png`;
  if (article.imageUrl !== expectedPublicPath) issues.push("declared-public-path");
  if (article.thumbnailImageUrl != null && article.thumbnailImageUrl !== article.imageUrl) {
    issues.push("thumbnail-image-mismatch");
  }

  const imagePath = path.join(repoRoot, "public", article.imageUrl.replace(/^\//, ""));
  if (!existsSync(imagePath)) return { ok: false, issues: [...issues, "output-missing"] };
  const stats = statSync(imagePath);
  if (!stats.isFile() || stats.size <= 0) issues.push("output-empty");

  const template = getSeriesImageTemplate(series);
  const referencePath = path.join(repoRoot, template.referencePath);
  issues.push(
    ...(await validateReadablePng(imagePath, referencePath, template.staticLogoRegion)),
  );

  return { ok: issues.length === 0, issues };
}
