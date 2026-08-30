import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createDivLabAiAnalysis,
  type CreateDivLabAiAnalysisResult,
} from "./ai-analysis-service";
import type { DailyCaseDeepResearchDispatchPlan } from "./daily-case-research-dispatch";
import {
  runDailyCaseDeepResearchDispatch,
  type DailyCaseDeepResearchExecution,
} from "./daily-case-research-runner";

function assertAnalysisIdentity(input: {
  symbol: string;
  exchange: string;
  result: CreateDivLabAiAnalysisResult;
}): void {
  if (!("factsPacket" in input.result)) return;
  const actualSymbol = input.result.factsPacket.instrument.symbol.trim().toUpperCase();
  const actualExchange = input.result.factsPacket.instrument.exchange.trim().toUpperCase();
  const expectedSymbol = input.symbol.trim().toUpperCase();
  const expectedExchange = input.exchange.trim().toUpperCase();
  if (actualSymbol !== expectedSymbol || actualExchange !== expectedExchange) {
    throw new Error(
      `daily_case_research_result_identity_mismatch:${expectedSymbol}@${expectedExchange}:${actualSymbol}@${actualExchange}`,
    );
  }
}

/**
 * Explicit server-only bridge from an approved Daily Case dispatch plan into
 * the full DivLab AI-analysis flow. Nothing calls this from the selector itself.
 * Successful quality-gated analyses are persisted only when a service-role
 * Supabase client is explicitly supplied.
 */
export async function executeDailyCaseDeepResearchPlan(input: {
  plan: DailyCaseDeepResearchDispatchPlan;
  maxConcurrency?: number;
  fetchImpl?: typeof fetch;
  now?: Date;
  useEscalationModel?: boolean;
  supabase?: SupabaseClient;
}): Promise<DailyCaseDeepResearchExecution<CreateDivLabAiAnalysisResult>> {
  return runDailyCaseDeepResearchDispatch({
    plan: input.plan,
    maxConcurrency: input.maxConcurrency,
    executor: async (job) => {
      const result = await createDivLabAiAnalysis({
        symbol: job.symbol,
        exchange: job.exchange,
        name: job.name ?? job.symbol,
        fetchImpl: input.fetchImpl,
        now: input.now,
        useEscalationModel: input.useEscalationModel,
        supabase: input.supabase,
      });
      assertAnalysisIdentity({
        symbol: job.symbol,
        exchange: job.exchange,
        result,
      });
      return result;
    },
  });
}
