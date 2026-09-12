import type { NewsArticle } from "@/types/news";

import { stockholmCalendarDate } from "./dates";
import {
  fail,
  type EditorialSeries,
  type ValidationIssue,
} from "./types";

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

const ENGLISH_MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
] as const;

export type PlannedPublication = {
  series: EditorialSeries;
  date: string;
  moduleName: string;
  filePath: string;
  exportName: string;
  importLine: string;
  registryLine: string;
};

export type PublicationDecision =
  | {
      status: "create";
      plan: PlannedPublication;
      nextRegistrySource: string;
    }
  | {
      status: "already-published";
      plan: PlannedPublication;
      nextRegistrySource: string;
    }
  | {
      status: "reject";
      plan: PlannedPublication;
      issues: ValidationIssue[];
    };

export type PlanPublicationInput = {
  series: EditorialSeries;
  date: Date;
  article: NewsArticle;
  registrySource: string;
  existingFiles: readonly string[];
  startedFromMainSha?: string;
  latestMainSha?: string;
  refreshedFromLatestMain?: boolean;
};

function stockholmParts(date: Date): { year: number; monthIndex: number; day: number } {
  const [year, month, day] = stockholmCalendarDate(date).split("-").map(Number);
  return { year, monthIndex: month - 1, day };
}

export function plannedModuleName(series: EditorialSeries, date: Date): string {
  const { year, monthIndex, day } = stockholmParts(date);
  return `${series}-${day}-${SWEDISH_MONTHS[monthIndex]}-${year}`;
}

export function plannedExportName(series: EditorialSeries, date: Date): string {
  const { year, monthIndex, day } = stockholmParts(date);
  const prefix =
    series === "borssverige" ? "BORSSVERIGE" : "NORDEN_I_CENTRUM";
  return `${prefix}_${day}_${ENGLISH_MONTHS[monthIndex]}_${year}_ARTICLE`;
}

export function plannedFilePath(series: EditorialSeries, date: Date): string {
  return `data/news-articles/${plannedModuleName(series, date)}.ts`;
}

export function buildPublicationPlan(
  series: EditorialSeries,
  date: Date,
): PlannedPublication {
  const moduleName = plannedModuleName(series, date);
  const exportName = plannedExportName(series, date);

  return {
    series,
    date: stockholmCalendarDate(date),
    moduleName,
    filePath: plannedFilePath(series, date),
    exportName,
    importLine: `import { ${exportName} } from "@/data/news-articles/${moduleName}";`,
    registryLine: `  applyNewsSearchSeo(${exportName}),`,
  };
}

export function registryMentionsExport(
  registrySource: string,
  exportName: string,
): boolean {
  return (
    registrySource.includes(`applyNewsSearchSeo(${exportName})`) ||
    new RegExp(
      `import \\{[^}]*\\b${exportName}\\b[^}]*\\} from "@/data/news-articles/`,
    ).test(registrySource)
  );
}

export function registryMentionsModule(
  registrySource: string,
  moduleName: string,
): boolean {
  return registrySource.includes(`@/data/news-articles/${moduleName}`);
}

function insertImport(source: string, importLine: string): string {
  if (source.includes(importLine)) {
    return source;
  }

  const firstNewsImport = source.search(
    /^import \{ .+ \} from "@\/data\/news-articles\//m,
  );
  if (firstNewsImport === -1) {
    return `${importLine}\n${source}`;
  }

  return `${source.slice(0, firstNewsImport)}${importLine}\n${source.slice(firstNewsImport)}`;
}

function insertRegistryLine(source: string, registryLine: string): string {
  if (source.includes(registryLine.trim())) {
    return source;
  }

  const marker = "const PUBLISHED_NEWS_ARTICLES: NewsArticle[] = [";
  const index = source.indexOf(marker);
  if (index === -1) {
    throw new Error("PUBLISHED_NEWS_ARTICLES array not found in registry source");
  }

  const insertAt = index + marker.length;
  return `${source.slice(0, insertAt)}\n${registryLine}${source.slice(insertAt)}`;
}

/**
 * Apply one series entry onto a registry snapshot. Additive only — never
 * deletes existing imports or applyNewsSearchSeo rows.
 */
export function applyRegistryEntry(
  registrySource: string,
  plan: PlannedPublication,
): string {
  if (
    registryMentionsExport(registrySource, plan.exportName) &&
    registryMentionsModule(registrySource, plan.moduleName)
  ) {
    return registrySource;
  }

  return insertRegistryLine(insertImport(registrySource, plan.importLine), plan.registryLine);
}

export function applyRegistryEntryFromLatestMain(
  latestMainRegistrySource: string,
  plan: PlannedPublication,
): string {
  return applyRegistryEntry(latestMainRegistrySource, plan);
}

function fileExistsForPlan(
  existingFiles: readonly string[],
  plan: PlannedPublication,
): boolean {
  const normalized = new Set(
    existingFiles.map((file) => file.replace(/\\/g, "/")),
  );
  return (
    normalized.has(plan.filePath) ||
    normalized.has(`/${plan.filePath}`) ||
    [...normalized].some((file) => file.endsWith(`/${plan.filePath}`))
  );
}

/**
 * Idempotent publication planner.
 *
 * Same series+Stockholm date always maps to one module file and one registry
 * export. If main moved after the run started, the caller must pass the latest
 * main registry source and `refreshedFromLatestMain: true` rather than
 * overwriting a stale working copy.
 */
export function planPublication(input: PlanPublicationInput): PublicationDecision {
  const plan = buildPublicationPlan(input.series, input.date);
  const issues: ValidationIssue[] = [];

  if (
    input.startedFromMainSha &&
    input.latestMainSha &&
    input.startedFromMainSha !== input.latestMainSha &&
    !input.refreshedFromLatestMain
  ) {
    issues.push(
      fail(
        "stale-main",
        "main moved after the run started. Refresh/rebase the registry change from latest main before writing.",
        "registry",
      ),
    );
    return { status: "reject", plan, issues };
  }

  const alreadyInRegistry =
    registryMentionsExport(input.registrySource, plan.exportName) ||
    registryMentionsModule(input.registrySource, plan.moduleName);
  const alreadyOnDisk = fileExistsForPlan(input.existingFiles, plan);

  if (alreadyInRegistry || alreadyOnDisk) {
    return {
      status: "already-published",
      plan,
      nextRegistrySource: alreadyInRegistry
        ? input.registrySource
        : applyRegistryEntry(input.registrySource, plan),
    };
  }

  return {
    status: "create",
    plan,
    nextRegistrySource: applyRegistryEntry(input.registrySource, plan),
  };
}

export function countRegistryEntries(
  registrySource: string,
  exportNames: readonly string[],
): number {
  return exportNames.filter((name) =>
    registryMentionsExport(registrySource, name),
  ).length;
}
