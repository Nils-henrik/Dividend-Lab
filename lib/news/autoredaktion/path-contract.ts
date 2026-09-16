import type { EditorialSeries } from "./types";

const MANAGED_BRANCH_PATTERN =
  /^autoredaktion\/(borssverige|norden-i-centrum|bolaget-i-fokus|usa-i-fokus)-(\d{4}-\d{2}-\d{2})$/;

const MANAGED_ARTICLE_PREFIX_PATTERN =
  /^data\/news-articles\/(borssverige|norden-i-centrum|bolaget-i-fokus|usa-i-fokus)-/;

const SWEDISH_MONTHS = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
] as const;

export type ManagedPublicationIdentity = {
  series: EditorialSeries;
  date: string;
};

export type ManagedPublicationPaths = ManagedPublicationIdentity & {
  articlePath: string;
  imagePath: string;
  publicImagePath: string;
  registryPath: "lib/news/get-articles.ts";
};

function canonicalDateParts(
  date: string,
): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function isCanonicalPublicationDate(date: string): boolean {
  return canonicalDateParts(date) !== null;
}

export function parseManagedBranchName(
  branchName: string,
): ManagedPublicationIdentity | null {
  const match = MANAGED_BRANCH_PATTERN.exec(branchName);
  if (!match || !isCanonicalPublicationDate(match[2])) return null;
  return {
    series: match[1] as EditorialSeries,
    date: match[2],
  };
}

export function managedSeriesFromArticlePathPrefix(
  articlePath: string,
): EditorialSeries | null {
  const match = MANAGED_ARTICLE_PREFIX_PATTERN.exec(articlePath);
  return (match?.[1] as EditorialSeries | undefined) ?? null;
}

export function canonicalArticleModuleName(
  series: EditorialSeries,
  date: string,
): string {
  const parts = canonicalDateParts(date);
  if (!parts) throw new Error(`Invalid canonical publication date: ${date}`);
  return `${series}-${parts.day}-${SWEDISH_MONTHS[parts.month - 1]}-${parts.year}`;
}

export function canonicalArticlePath(
  series: EditorialSeries,
  date: string,
): string {
  return `data/news-articles/${canonicalArticleModuleName(series, date)}.ts`;
}

export function canonicalImagePath(
  series: EditorialSeries,
  date: string,
): string {
  if (!isCanonicalPublicationDate(date)) {
    throw new Error(`Invalid canonical publication date: ${date}`);
  }
  return `public/news/generated/${series}-${date}.png`;
}

export function canonicalPublicImagePath(
  series: EditorialSeries,
  date: string,
): string {
  return `/${canonicalImagePath(series, date).replace(/^public\//, "")}`;
}

export function managedPublicationPaths(
  series: EditorialSeries,
  date: string,
): ManagedPublicationPaths {
  return {
    series,
    date,
    articlePath: canonicalArticlePath(series, date),
    imagePath: canonicalImagePath(series, date),
    publicImagePath: canonicalPublicImagePath(series, date),
    registryPath: "lib/news/get-articles.ts",
  };
}

export function parseCanonicalArticlePath(
  articlePath: string,
): ManagedPublicationIdentity | null {
  const series = managedSeriesFromArticlePathPrefix(articlePath);
  if (!series) return null;

  for (let month = 1; month <= SWEDISH_MONTHS.length; month += 1) {
    const pattern = new RegExp(
      `^data/news-articles/${series}-(\\d{1,2})-${SWEDISH_MONTHS[month - 1]}-(\\d{4})\\.ts$`,
    );
    const match = pattern.exec(articlePath);
    if (!match) continue;
    const date = `${match[2]}-${String(month).padStart(2, "0")}-${String(
      Number(match[1]),
    ).padStart(2, "0")}`;
    if (
      isCanonicalPublicationDate(date) &&
      canonicalArticlePath(series, date) === articlePath
    ) {
      return { series, date };
    }
  }

  return null;
}
