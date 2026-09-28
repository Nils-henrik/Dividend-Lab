import type { CompanyIngestionJobType } from "@/lib/companies/ingestion/queue";
import {
  BASELINE_ENQUEUE_LIMIT,
  BASELINE_SOURCE_STALE_MS,
} from "@/lib/companies/ingestion/schedule";

export { BASELINE_ENQUEUE_LIMIT, BASELINE_SOURCE_STALE_MS };

export type SourceSupportMode = "automated" | "source_link_only" | "blocked";

export type BaselineSourceState = {
  supportMode: SourceSupportMode;
  lastCheckedAt: string | null;
  lastSuccessAt?: string | null;
  lastFailureReason?: string | null;
};

export type SourceProgress =
  | "never_checked"
  | "succeeded"
  | "failed_retryable"
  | "blocked"
  | "source_link_only";

export function classifySourceProgress(source: BaselineSourceState): SourceProgress {
  if (source.supportMode === "blocked") return "blocked";
  if (source.supportMode === "source_link_only") return "source_link_only";
  if (!source.lastCheckedAt && !source.lastFailureReason) return "never_checked";
  if (source.lastFailureReason) return "failed_retryable";
  return "succeeded";
}

export type BaselineCompanyState = {
  slug: string;
  followed: boolean;
  sources: readonly BaselineSourceState[];
};

function staleAutomatedSources(
  company: BaselineCompanyState,
  now: Date,
  staleAfterMs: number,
): BaselineSourceState[] {
  return company.sources.filter((source) => {
    if (source.supportMode !== "automated") return false;
    if (!source.lastCheckedAt) return true;
    const checkedAt = new Date(source.lastCheckedAt).getTime();
    return Number.isFinite(checkedAt) && now.getTime() - checkedAt >= staleAfterMs;
  });
}

function progressBand(
  company: BaselineCompanyState,
  stale: readonly BaselineSourceState[],
): number {
  if (stale.some((source) => classifySourceProgress(source) === "never_checked")) return 0;
  const clean = stale.some((source) => !source.lastFailureReason);
  if (company.followed && clean) return 1;
  if (stale.some((source) => source.lastFailureReason)) return 2;
  return 3;
}

function deadlinePenalty(stale: readonly BaselineSourceState[]): number {
  const failed = stale.filter((source) => source.lastFailureReason);
  if (failed.length === 0) return 0;
  return failed.every((source) => source.lastFailureReason === "job_deadline_exceeded") ? 1 : 0;
}

function oldestCheck(sources: readonly BaselineSourceState[]): number {
  const timestamps = sources.map((source) =>
    source.lastCheckedAt ? new Date(source.lastCheckedAt).getTime() : 0,
  );
  return timestamps.length ? Math.min(...timestamps) : 0;
}

export function planBaselineRefresh(input: {
  companies: readonly BaselineCompanyState[];
  now: Date;
  staleAfterMs?: number;
  limit?: number;
}): string[] {
  const staleAfterMs = input.staleAfterMs ?? BASELINE_SOURCE_STALE_MS;
  const limit = Math.min(
    BASELINE_ENQUEUE_LIMIT,
    Math.max(1, input.limit ?? BASELINE_ENQUEUE_LIMIT),
  );
  return input.companies
    .map((company) => ({ company, stale: staleAutomatedSources(company, input.now, staleAfterMs) }))
    .filter((entry) => entry.stale.length > 0)
    .sort((first, second) => {
      const band = progressBand(first.company, first.stale) - progressBand(second.company, second.stale);
      if (band !== 0) return band;
      const penalty = deadlinePenalty(first.stale) - deadlinePenalty(second.stale);
      if (penalty !== 0) return penalty;
      if (first.company.followed !== second.company.followed) return first.company.followed ? -1 : 1;
      return oldestCheck(first.stale) - oldestCheck(second.stale);
    })
    .slice(0, limit)
    .map((entry) => entry.company.slug);
}

export function shouldRefreshCompanySource(input: {
  jobType: CompanyIngestionJobType;
  supportMode: SourceSupportMode;
  lastCheckedAt: string | null;
  now: Date;
  staleAfterMs?: number;
}): boolean {
  if (input.supportMode !== "automated") return false;
  if (input.jobType === "initial_sync") return input.lastCheckedAt === null;
  if (!input.lastCheckedAt) return true;
  const checkedAt = new Date(input.lastCheckedAt).getTime();
  const staleAfterMs = input.staleAfterMs ?? BASELINE_SOURCE_STALE_MS;
  return Number.isFinite(checkedAt) && input.now.getTime() - checkedAt >= staleAfterMs;
}
