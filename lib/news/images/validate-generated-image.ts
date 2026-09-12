import { existsSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

import { parseIsoDateTime, stockholmCalendarDate } from "@/lib/news/autoredaktion/dates";
import type { EditorialSeries } from "@/lib/news/autoredaktion/types";
import type { NewsArticle } from "@/types/news";

import { resolveApprovedCompanyLogo } from "./company-logo-map";
import { calculateStaticRegionDiff, staticRegionDiffPasses } from "./static-regression";
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

async function validateReadablePng(
  imagePath: string,
  referencePath: string,
  series: EditorialSeries,
): Promise<string[]> {
  const issues: string[] = [];
  try {
    const image = await sharp(imagePath).metadata();
    if (image.width !== SERIES_IMAGE_WIDTH || image.height !== SERIES_IMAGE_HEIGHT) {
      issues.push("image-dimensions");
    }
    if (image.format !== SERIES_IMAGE_FORMAT) issues.push("image-format");

    if (existsSync(referencePath) && image.width === SERIES_IMAGE_WIDTH && image.height === SERIES_IMAGE_HEIGHT) {
      const template = getSeriesImageTemplate(series);
      const dynamicRegions = [
        template.dynamicRegions.date,
        ...(template.dynamicRegions.companyRow ? [template.dynamicRegions.companyRow] : []),
      ];
      const diff = await calculateStaticRegionDiff(
        imagePath,
        referencePath,
        dynamicRegions,
        template.staticRegression,
      );
      if (!staticRegionDiffPasses(diff, template.staticRegression)) {
        issues.push(
          `static-region-regression:ratio=${diff.changedPixelRatio.toFixed(6)}:mae=${diff.meanAbsoluteError.toFixed(4)}`,
        );
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
  if (metadata.companiesUsed.length > template.maxCompanyLogos) issues.push("too-many-company-logos");
  if (metadata.series === "borssverige" && metadata.companiesUsed.length > 0) {
    issues.push("borssverige-company-logo");
  }

  for (const company of metadata.companiesUsed) {
    const logo = resolveApprovedCompanyLogo(company, "dark");
    if (!logo || !existsSync(path.join(repoRoot, logo.resolvedFile))) {
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

  issues.push(...(await validateReadablePng(metadata.outputPath, referencePath, metadata.series)));

  return { ok: issues.length === 0, issues };
}

/**
 * Quality-gate validation for the image path declared by a finished article.
 * `imageUrl:null` is a valid explicit fail-safe. A non-null generated path must
 * be the canonical date URL and must point at a readable 1280x720 PNG whose
 * pixels outside the explicit date/company masks still match source of truth.
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
  issues.push(...(await validateReadablePng(imagePath, referencePath, series)));

  return { ok: issues.length === 0, issues };
}
