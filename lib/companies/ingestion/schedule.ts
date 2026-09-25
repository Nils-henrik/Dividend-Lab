import {
  COMPANY_INGESTION_JOB_BUDGET_MS,
  COMPANY_INGESTION_PLATFORM_MAX_MS,
  createJobDeadline,
  type JobDeadline,
} from "@/lib/companies/ingestion/deadline";

/**
 * Vercel Hobby rejects a cron that fires more than once per day.
 * `17 3 * * *` is 03:17 UTC, once.
 */
export const COMPANY_INGESTION_CRON_SCHEDULE = "17 3 * * *";

/**
 * Companies enqueued and claimed in one daily invocation.
 * Seventeen supported automated companies finish an initial pass in three
 * daily runs. The route still stops early when the shared time budget is gone.
 */
export const COMPANY_INGESTION_BATCH_LIMIT = 8;

/**
 * Shared budget for the whole cron invocation, inside the 60s platform limit.
 * A later job receives only what remains. It does not get a fresh 45s.
 */
export const COMPANY_INGESTION_ROUTE_BUDGET_MS = COMPANY_INGESTION_JOB_BUDGET_MS;

/**
 * Do not claim another company unless the route can still give it a slice
 * that includes the per-job cleanup margin.
 */
export const COMPANY_INGESTION_MIN_JOB_SLICE_MS = 12_000;

/**
 * A daily cron cannot honor a 12-hour refresh. Twenty hours makes a source
 * checked on the previous run eligible at the next 03:17 UTC run.
 */
export const BASELINE_SOURCE_STALE_MS = 20 * 60 * 60 * 1000;
export const BASELINE_STALE_AFTER = "20 hours";
export const BASELINE_ENQUEUE_LIMIT = COMPANY_INGESTION_BATCH_LIMIT;

const SINGLE_MINUTE = /^(?:[0-9]|[1-5][0-9])$/;
const SINGLE_HOUR = /^(?:[0-9]|1[0-9]|2[0-3])$/;
const SINGLE_DAY_FIELD = /^(?:\*|\d+)$/;

export function isVercelHobbyDailyCron(schedule: string): boolean {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  return (
    SINGLE_MINUTE.test(minute) &&
    SINGLE_HOUR.test(hour) &&
    SINGLE_DAY_FIELD.test(dayOfMonth) &&
    SINGLE_DAY_FIELD.test(month) &&
    SINGLE_DAY_FIELD.test(dayOfWeek)
  );
}

export function companyIngestionRouteFitsPlatformLimit(): boolean {
  return (
    COMPANY_INGESTION_ROUTE_BUDGET_MS < COMPANY_INGESTION_PLATFORM_MAX_MS &&
    COMPANY_INGESTION_MIN_JOB_SLICE_MS < COMPANY_INGESTION_ROUTE_BUDGET_MS &&
    COMPANY_INGESTION_ROUTE_BUDGET_MS + 15_000 <= COMPANY_INGESTION_PLATFORM_MAX_MS
  );
}

export type CompanyIngestionDrainClaim<TJob> =
  | { status: "claimed"; job: TJob }
  | { status: "empty" }
  | { status: "error" };

export type CompanyIngestionDrainStop =
  | "queue_empty"
  | "batch_limit"
  | "route_budget"
  | "claim_error";

export async function drainCompanyIngestionJobs<TJob, TResult>(input: {
  claim: () => Promise<CompanyIngestionDrainClaim<TJob>>;
  run: (job: TJob, budgetMs: number) => Promise<TResult>;
  clock?: () => number;
  deadline?: JobDeadline;
  budgetMs?: number;
  batchLimit?: number;
  minJobSliceMs?: number;
}): Promise<{ jobs: TResult[]; stoppedReason: CompanyIngestionDrainStop }> {
  const batchLimit = input.batchLimit ?? COMPANY_INGESTION_BATCH_LIMIT;
  const minJobSliceMs = input.minJobSliceMs ?? COMPANY_INGESTION_MIN_JOB_SLICE_MS;
  const deadline =
    input.deadline ??
    createJobDeadline({
      clock: input.clock,
      budgetMs: input.budgetMs ?? COMPANY_INGESTION_ROUTE_BUDGET_MS,
    });
  const jobs: TResult[] = [];

  while (jobs.length < batchLimit) {
    if (deadline.remainingMs() < minJobSliceMs) {
      return { jobs, stoppedReason: "route_budget" };
    }

    const claim = await input.claim();
    if (claim.status === "empty") {
      return { jobs, stoppedReason: "queue_empty" };
    }
    if (claim.status === "error") {
      return { jobs, stoppedReason: "claim_error" };
    }

    const budgetMs = Math.max(0, Math.floor(deadline.remainingMs()));
    jobs.push(await input.run(claim.job, budgetMs));
  }

  return { jobs, stoppedReason: "batch_limit" };
}
