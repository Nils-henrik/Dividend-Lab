import {
  resolveDailyCaseResearchConcurrency,
  type DailyCaseDeepResearchDispatchPlan,
  type DailyCaseDeepResearchJob,
} from "./daily-case-research-dispatch";

export type DailyCaseDeepResearchExecutor<T> = (
  job: DailyCaseDeepResearchJob,
) => Promise<T>;

export type DailyCaseDeepResearchExecution<T> = {
  version: "daily-case-research-execution-v1";
  dispatchVersion: DailyCaseDeepResearchDispatchPlan["version"];
  runKey: string;
  results: Array<{
    job: DailyCaseDeepResearchJob;
    result: T;
  }>;
  stats: {
    jobs: number;
    completed: number;
  };
};

/**
 * Executes an already-approved dispatch plan with bounded concurrency.
 * Expected domain failures must be returned by the injected executor as values.
 * Unexpected thrown errors intentionally reject the whole runner so code defects
 * cannot be silently converted into a normal research outcome.
 */
export async function runDailyCaseDeepResearchDispatch<T>(input: {
  plan: DailyCaseDeepResearchDispatchPlan;
  executor: DailyCaseDeepResearchExecutor<T>;
  maxConcurrency?: number;
}): Promise<DailyCaseDeepResearchExecution<T>> {
  if (input.plan.version !== "daily-case-research-dispatch-v1") {
    throw new Error("daily_case_research_execution_dispatch_version_invalid");
  }
  if (input.plan.jobs.length !== input.plan.stats.jobs) {
    throw new Error("daily_case_research_execution_job_count_mismatch");
  }
  const concurrency = resolveDailyCaseResearchConcurrency(input.maxConcurrency);
  const results = new Array<DailyCaseDeepResearchExecution<T>["results"][number]>(
    input.plan.jobs.length,
  );
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor;
      cursor += 1;
      const job = input.plan.jobs[index];
      if (!job) return;
      const result = await input.executor(job);
      results[index] = { job, result };
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, input.plan.jobs.length) },
      () => worker(),
    ),
  );

  return {
    version: "daily-case-research-execution-v1",
    dispatchVersion: input.plan.version,
    runKey: input.plan.runKey,
    results,
    stats: {
      jobs: input.plan.jobs.length,
      completed: results.length,
    },
  };
}
