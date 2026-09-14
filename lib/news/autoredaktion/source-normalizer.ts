import type { EditorialSeries } from "./types";

const GENERATED_IMAGE_PATH =
  /^\/news\/generated\/(borssverige|norden-i-centrum)-(\d{4}-\d{2}-\d{2})\.png$/;

const IMAGE_PATH_FIELDS = new Set(["imageUrl", "thumbnailImageUrl"]);
const IMAGE_METADATA_FIELDS = new Set([
  "imageAlt",
  "imageCaption",
  "thumbnailObjectPosition",
  "mobileThumbnailObjectPosition",
  "showImageBrandOverlay",
]);

function topLevelProperty(line: string): string | null {
  return /^  ([A-Za-z][A-Za-z0-9]*):/.exec(line)?.[1] ?? null;
}

function isNullOrEmptyStringProperty(line: string, key: string): boolean {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^  ${escaped}:\\s*(?:null|""|'')\\s*,?\\s*$`).test(line);
}

export function canonicalGeneratedImagePath(
  series: EditorialSeries,
  date: string,
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid canonical image date: ${date}`);
  }
  return `/news/generated/${series}-${date}.png`;
}

/**
 * Normalize only the controlled top-level publication fields that the release
 * automation owns. Editorial prose is never rewritten here.
 *
 * Autonomous fallback contract: if no validated generated image exists, the
 * image fields are omitted (undefined), not emitted as null. Historical/manual
 * NewsArticle modules may still use null; this function governs new managed
 * Autoredaktion publications only.
 */
export function normalizeAutonomousArticleSource(
  sourceText: string,
  options: { series: EditorialSeries; imagePath?: string | null },
): string {
  const hadTrailingNewline = sourceText.endsWith("\n");
  const imagePath = options.imagePath ?? null;
  if (imagePath) {
    const match = GENERATED_IMAGE_PATH.exec(imagePath);
    if (!match || match[1] !== options.series) {
      throw new Error(`Non-canonical generated image path for ${options.series}: ${imagePath}`);
    }
  }

  let sourceFound = false;
  const next: string[] = [];

  for (const line of sourceText.replace(/\r\n/g, "\n").split("\n")) {
    const key = topLevelProperty(line);

    if (key === "source") {
      sourceFound = true;
      next.push('  source: "DivLab Redaktion",');
      continue;
    }

    if (key && IMAGE_PATH_FIELDS.has(key)) {
      continue;
    }

    if (key && IMAGE_METADATA_FIELDS.has(key)) {
      if (!imagePath || isNullOrEmptyStringProperty(line, key)) {
        continue;
      }
    }

    next.push(line);
  }

  if (!sourceFound) {
    throw new Error("Autonomous article source field is missing");
  }

  if (imagePath) {
    const featuredIndex = next.findIndex((line) => /^  featured:\s*(?:true|false),?\s*$/.test(line));
    if (featuredIndex < 0) {
      throw new Error("Autonomous article featured field is missing");
    }
    next.splice(
      featuredIndex + 1,
      0,
      `  imageUrl: ${JSON.stringify(imagePath)},`,
      `  thumbnailImageUrl: ${JSON.stringify(imagePath)},`,
    );
  }

  const normalized = next.join("\n");
  return hadTrailingNewline ? normalized : normalized.replace(/\n$/, "");
}
