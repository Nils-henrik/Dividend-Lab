/**
 * Hard stop for one ingestion job, inside the 60s Vercel `maxDuration`.
 *
 * The job budget is 45s from a monotonic clock. New crawl delays and HTTP
 * requests are refused once fewer than 5s of that budget remain, so the
 * last network call ends by 45s and `retryOrFailJob` still has about 15s
 * before the platform can terminate the function. Request timeouts stay
 * capped at the existing per-request limit.
 */
export const COMPANY_INGESTION_PLATFORM_MAX_MS = 60_000;
export const COMPANY_INGESTION_JOB_BUDGET_MS = 45_000;
export const COMPANY_INGESTION_CLEANUP_MARGIN_MS = 5_000;

export const JOB_DEADLINE_EXCEEDED = "job_deadline_exceeded";

export type JobDeadline = {
  remainingMs: () => number;
  allowDelay: (delayMs: number) => boolean;
  requestTimeoutMs: (normalTimeoutMs: number) => number | null;
};

export function createJobDeadline(options?: {
  clock?: () => number;
  budgetMs?: number;
  cleanupMarginMs?: number;
}): JobDeadline {
  const clock = options?.clock ?? (() => performance.now());
  const budgetMs = options?.budgetMs ?? COMPANY_INGESTION_JOB_BUDGET_MS;
  const cleanupMarginMs = options?.cleanupMarginMs ?? COMPANY_INGESTION_CLEANUP_MARGIN_MS;
  const startedAt = clock();

  function remainingMs(): number {
    return budgetMs - (clock() - startedAt);
  }

  function usableMs(): number {
    return remainingMs() - cleanupMarginMs;
  }

  return {
    remainingMs,
    allowDelay(delayMs: number) {
      return usableMs() >= delayMs;
    },
    requestTimeoutMs(normalTimeoutMs: number) {
      const available = Math.floor(usableMs());
      if (available < 1 || normalTimeoutMs < 1) {
        return null;
      }

      return Math.min(normalTimeoutMs, available);
    },
  };
}
