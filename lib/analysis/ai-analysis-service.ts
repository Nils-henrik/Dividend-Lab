import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelPortfolioAiModel } from "@/lib/model-portfolios/engine/ai";
import {
  analystDraftToValuationScenarios,
  generateDivLabAnalystDraft,
  type DivLabAnalystUsage,
} from "./analyst";
import type { DivLabAnalystDraft } from "./analyst-schema";
import {
  persistDivLabAnalysisBundle,
  type PersistedDivLabAnalysisBundle,
} from "./content-repository";
import {
  buildDivLabResearchPacket,
  type DivLabResearchPacket,
} from "./deep-research";
import {
  loadDivLabResearchInputs,
  type DivLabResearchLoadResult,
} from "./research-loader";

export type CreateDivLabAiAnalysisResult =
  | {
      ok: true;
      /** Facts-only packet before analyst scenario assumptions are applied. */
      factsPacket: DivLabResearchPacket;
      analystDraft: DivLabAnalystDraft;
      /** Rebuilt packet after deterministic valuation math and final quality gate. */
      finalPacket: DivLabResearchPacket;
      model: ModelPortfolioAiModel;
      usage: DivLabAnalystUsage;
      persistence: PersistedDivLabAnalysisBundle | null;
    }
  | {
      ok: false;
      stage: "research";
      reason: Extract<DivLabResearchLoadResult, { ok: false }>["reason"];
    }
  | {
      ok: false;
      stage: "analyst";
      reason: "gateway_auth_missing";
      /** Verified research is retained in-memory so the job can be inspected or retried. */
      factsPacket: DivLabResearchPacket;
    };

/**
 * Internal two-stage DivLab analysis flow.
 *
 * 1. Load and normalize facts/evidence.
 * 2. Build a facts packet with no manufactured valuation scenarios.
 * 3. Ask the analyst model for qualitative interpretation + explicit scenario
 *    assumptions only.
 * 4. Re-run deterministic valuation math with those assumptions.
 * 5. Re-run the full publication quality gate.
 * 6. When a service-role Supabase client is supplied, atomically persist the
 *    final research version and analyst content as separate immutable records.
 *
 * The transient facts packet is never persisted as an additional version.
 * If Gateway authentication is unavailable, the function fails closed at the
 * analyst stage but returns the already verified facts packet for observability
 * and a later retry. Other analyst failures still throw so code/schema defects
 * cannot be silently downgraded to an operational retry state.
 */
export async function createDivLabAiAnalysis(input: {
  symbol: string;
  exchange: string;
  name: string;
  fetchImpl?: typeof fetch;
  now?: Date;
  useEscalationModel?: boolean;
  supabase?: SupabaseClient;
  slug?: string;
}): Promise<CreateDivLabAiAnalysisResult> {
  const now = input.now ?? new Date();
  const loaded = await loadDivLabResearchInputs({
    symbol: input.symbol,
    exchange: input.exchange,
    name: input.name,
    fetchImpl: input.fetchImpl,
    now,
  });
  if (!loaded.ok) {
    return {
      ok: false,
      stage: "research",
      reason: loaded.reason,
    };
  }

  const research = loaded.value;
  const common = {
    symbol: research.instrument.symbol,
    exchange: research.instrument.exchange,
    name: research.instrument.name,
    currency: research.instrument.currency,
    currentPrice: research.instrument.currentPrice,
    history: research.history,
    fundamentals: research.fundamentals,
    sources: research.sources,
    evidence: research.evidence,
    now,
  };

  const factsPacket = buildDivLabResearchPacket({
    ...common,
    valuationScenarios: [],
  });

  let analyst: Awaited<ReturnType<typeof generateDivLabAnalystDraft>>;
  try {
    analyst = await generateDivLabAnalystDraft({
      packet: factsPacket,
      useEscalationModel: input.useEscalationModel,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "gateway_auth_missing") {
      return {
        ok: false,
        stage: "analyst",
        reason: "gateway_auth_missing",
        factsPacket,
      };
    }
    throw error;
  }

  const finalPacket = buildDivLabResearchPacket({
    ...common,
    valuationScenarios: analystDraftToValuationScenarios(analyst.draft),
  });

  const persistence = input.supabase
    ? await persistDivLabAnalysisBundle({
        supabase: input.supabase,
        packet: finalPacket,
        analystDraft: analyst.draft,
        analystModel: analyst.model,
        usage: analyst.usage,
        generatedAt: now.toISOString(),
        slug: input.slug,
      })
    : null;

  return {
    ok: true,
    factsPacket,
    analystDraft: analyst.draft,
    finalPacket,
    model: analyst.model,
    usage: analyst.usage,
    persistence,
  };
}
