import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createDivLabAiAnalysis,
  type CreateDivLabAiAnalysisResult,
} from "./ai-analysis-service";
import {
  DIVLAB_PORTFOLIO_DEEP_RESEARCH_DISPATCH_VERSION,
  PORTFOLIO_DEEP_RESEARCH_DISPATCH_BUDGET,
  type PortfolioDeepResearchDispatchPlan,
  type PortfolioDeepResearchJob,
} from "./portfolio-deep-research-dispatch";
import { loadLatestPublishableDivLabResearchVersionAsOf } from "./research-version-repository";

export const PORTFOLIO_DEEP_RESEARCH_FRESHNESS_MS = 18 * 60 * 60 * 1_000;

export type PortfolioDeepResearchExecutionItem =
  | {
      status: "reused_fresh";
      job: PortfolioDeepResearchJob;
      analysisVersionId: string;
      dataAsOf: string;
    }
  | {
      status: "executed";
      job: PortfolioDeepResearchJob;
      result: CreateDivLabAiAnalysisResult;
    };

export type PortfolioDeepResearchExecution = {
  version: "portfolio-deep-research-execution-v1";
  dispatchVersion: PortfolioDeepResearchDispatchPlan["version"];
  runKey: string;
  results: PortfolioDeepResearchExecutionItem[];
  stats: {
    jobs: number;
    reusedFresh: number;
    executed: number;
    successful: number;
    failedClosed: number;
  };
};

type LatestResearchLoader = typeof loadLatestPublishableDivLabResearchVersionAsOf;
type AnalysisExecutor = (input: {
  job: PortfolioDeepResearchJob;
  supabase: SupabaseClient;
  now: Date;
  fetchImpl?: typeof fetch;
  useEscalationModel?: boolean;
}) => Promise<CreateDivLabAiAnalysisResult>;

function assertPlan(plan: PortfolioDeepResearchDispatchPlan, now: Date): void {
  if (plan.version !== DIVLAB_PORTFOLIO_DEEP_RESEARCH_DISPATCH_VERSION) {
    throw new Error("portfolio_deep_research_execution_dispatch_version_invalid");
  }
  if (plan.jobs.length > PORTFOLIO_DEEP_RESEARCH_DISPATCH_BUDGET.maxJobs) {
    throw new Error("portfolio_deep_research_execution_job_budget_exceeded");
  }
  if (plan.jobs.length !== plan.stats.uniqueJobs) {
    throw new Error("portfolio_deep_research_execution_job_count_mismatch");
  }
  const asOfMs = new Date(plan.asOf).getTime();
  if (!Number.isFinite(asOfMs) || asOfMs > now.getTime() + 60_000) {
    throw new Error("portfolio_deep_research_execution_as_of_invalid");
  }
}

function assertAnalysisIdentity(
  job: PortfolioDeepResearchJob,
  result: CreateDivLabAiAnalysisResult,
): void {
  if (!("factsPacket" in result)) return;
  const actual = `${result.factsPacket.instrument.symbol}@${result.factsPacket.instrument.exchange}`.toUpperCase();
  const expected = `${job.symbol}@${job.exchange}`.toUpperCase();
  if (actual !== expected) {
    throw new Error(
      `portfolio_deep_research_execution_identity_mismatch:${expected}:${actual}`,
    );
  }
}

function isFresh(dataAsOf: string, now: Date, freshnessMs: number): boolean {
  const value = new Date(dataAsOf).getTime();
  if (!Number.isFinite(value)) return false;
  const age = now.getTime() - value;
  return age >= 0 && age <= freshnessMs;
}

const defaultExecutor: AnalysisExecutor = async (input) =>
  createDivLabAiAnalysis({
    symbol: input.job.symbol,
    exchange: input.job.exchange,
    name: input.job.name,
    fetchImpl: input.fetchImpl,
    now: input.now,
    useEscalationModel: input.useEscalationModel,
    supabase: input.supabase,
  });

/**
 * Execute an already-approved portfolio Deep Research dispatch plan.
 *
 * Cost/safety boundaries:
 * - service-role Supabase is mandatory so an expensive successful analysis is
 *   never intentionally generated without immutable persistence;
 * - newest publishable research is checked before each model call;
 * - a version no older than 18 hours is reused, preventing repeated intraday
 *   analyst calls when several portfolio research windows select the same name;
 * - execution is sequential and hard-capped at four unique jobs;
 * - domain failures remain explicit values and are not converted into synthetic
 *   research or a portfolio decision.
 *
 * This service does not buy, sell, settle, or mutate historical portfolio state.
 */
export async function executePortfolioDeepResearchDispatchPlan(input: {
  plan: PortfolioDeepResearchDispatchPlan;
  supabase: SupabaseClient;
  now?: Date;
  fetchImpl?: typeof fetch;
  useEscalationModel?: boolean;
  freshnessMs?: number;
  /** Test seam; production callers should omit. */
  loadLatest?: LatestResearchLoader;
  /** Test seam; production callers should omit. */
  executor?: AnalysisExecutor;
}): Promise<PortfolioDeepResearchExecution> {
  const now = input.now ?? new Date();
  const freshnessMs = input.freshnessMs ?? PORTFOLIO_DEEP_RESEARCH_FRESHNESS_MS;
  if (!Number.isFinite(freshnessMs) || freshnessMs < 0) {
    throw new Error("portfolio_deep_research_execution_freshness_invalid");
  }
  assertPlan(input.plan, now);

  const loadLatest = input.loadLatest ?? loadLatestPublishableDivLabResearchVersionAsOf;
  const executor = input.executor ?? defaultExecutor;
  const results: PortfolioDeepResearchExecutionItem[] = [];

  for (const job of input.plan.jobs) {
    const existing = await loadLatest({
      supabase: input.supabase,
      symbol: job.symbol,
      exchange: job.exchange,
      maxDataAsOf: now.toISOString(),
    });
    if (
      existing &&
      isFresh(existing.packet.dataAsOf, now, freshnessMs)
    ) {
      results.push({
        status: "reused_fresh",
        job,
        analysisVersionId: existing.analysisVersionId,
        dataAsOf: existing.packet.dataAsOf,
      });
      continue;
    }

    const result = await executor({
      job,
      supabase: input.supabase,
      now,
      fetchImpl: input.fetchImpl,
      useEscalationModel: input.useEscalationModel,
    });
    assertAnalysisIdentity(job, result);
    results.push({ status: "executed", job, result });
  }

  const reusedFresh = results.filter((item) => item.status === "reused_fresh").length;
  const executed = results.filter((item) => item.status === "executed");
  const successful = executed.filter((item) => item.result.ok).length;

  return {
    version: "portfolio-deep-research-execution-v1",
    dispatchVersion: input.plan.version,
    runKey: input.plan.runKey,
    results,
    stats: {
      jobs: input.plan.jobs.length,
      reusedFresh,
      executed: executed.length,
      successful,
      failedClosed: executed.length - successful,
    },
  };
}
