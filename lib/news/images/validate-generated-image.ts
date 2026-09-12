import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

import { parseIsoDateTime, stockholmCalendarDate } from "@/lib/news/autoredaktion/dates";

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
    .raw()
    .toBuffer();
  return hash(raw);
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

  try {
    const image = await sharp(metadata.outputPath).metadata();
    if (image.width !== SERIES_IMAGE_WIDTH || image.height !== SERIES_IMAGE_HEIGHT) {
      issues.push("image-dimensions");
    }
    if (image.format !== SERIES_IMAGE_FORMAT) issues.push("image-format");

    if (existsSync(referencePath)) {
      const [generatedLogoHash, referenceLogoHash] = await Promise.all([
        staticLogoRegionHash(metadata.outputPath, template.staticLogoRegion),
        staticLogoRegionHash(referencePath, template.staticLogoRegion, true),
      ]);
      if (generatedLogoHash !== referenceLogoHash) {
        issues.push("canonical-logo-region-changed");
      }
    }
  } catch {
    issues.push("image-unreadable");
  }

  return { ok: issues.length === 0, issues };
}
