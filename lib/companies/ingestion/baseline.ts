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
};

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
      const firstUninitialized = first.stale.some((source) => !source.lastCheckedAt) ? 0 : 1;
      const secondUninitialized = second.stale.some((source) => !source.lastCheckedAt) ? 0 : 1;
      if (firstUninitialized !== secondUninitialized) return firstUninitialized - secondUninitialized;
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
