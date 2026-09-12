import type { NewsArticle } from "@/types/news";

export const EDITORIAL_SERIES = ["borssverige", "norden-i-centrum"] as const;

export type EditorialSeries = (typeof EDITORIAL_SERIES)[number];

export type ValidationSeverity = "error";

export type ValidationIssue = {
  code: string;
  message: string;
  path?: string;
  severity: ValidationSeverity;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

export type ArticleValidatorOptions = {
  /** Injected clock. Autonomous runs should pass Europe/Stockholm "now". */
  now?: Date;
  /**
   * Published articles used for ID/slug uniqueness.
   * The candidate itself is ignored when its id+slug already match one entry.
   */
  registry?: readonly NewsArticle[];
  /** Absolute path to the repo `public/` directory. */
  publicDir?: string;
  /**
   * How current `publishedAt` must be. Morning series should stay on the
   * Stockholm calendar day of the run, with a small skew for timezone edges.
   */
  maxAgeHours?: number;
  maxFutureHours?: number;
};

export type SeriesValidatorOptions = {
  series: EditorialSeries;
};

export type AutoredaktionGateName =
  | "article-validator"
  | "series-validator"
  | "lint"
  | "typecheck"
  | "news-seo-tests"
  | "production-build";

export type AutoredaktionGateResult = "pass" | "fail" | "skipped";

/**
 * Compact operational trace the weekday ChatGPT jobs must leave after a run.
 * Success must not be claimed from commit SHA alone.
 */
export type AutoredaktionRunTrace = {
  series: EditorialSeries;
  date: string;
  startedAt: string;
  researchCutoff: string;
  title: string;
  slug: string;
  gateResults: Record<AutoredaktionGateName, AutoredaktionGateResult>;
  commitSha: string | null;
  deployment: {
    provider: "vercel";
    environment: "production";
    status: "READY" | "ERROR" | "PENDING" | "UNKNOWN";
    url?: string;
  } | null;
  liveVerification: {
    url: string;
    httpStatus: number | null;
    h1: boolean;
    title: boolean;
    date: boolean;
    seoTitle: boolean;
    seoDescription: boolean;
    canonical: boolean;
    og: boolean;
    x: boolean;
    image: boolean | "not-set";
    listedOnNewsIndex: boolean;
  } | null;
  finalStatus: "published" | "aborted-fail-closed" | "failed-verification";
};

export function fail(
  code: string,
  message: string,
  path?: string,
): ValidationIssue {
  return { code, message, severity: "error", ...(path ? { path } : {}) };
}

export function resultFromIssues(issues: ValidationIssue[]): ValidationResult {
  return { ok: issues.length === 0, issues };
}

export function mergeResults(...results: ValidationResult[]): ValidationResult {
  return resultFromIssues(results.flatMap((result) => result.issues));
}
