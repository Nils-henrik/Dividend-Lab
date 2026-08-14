import "server-only";

import {
  analystDraftToValuationScenarios,
  generateDivLabAnalystDraft,
  type DivLabAnalystUsage,
} from "./analyst";
import type { DivLabAnalystDraft } from "./analyst-schema";
import {
  buildDivLabResearchPacket,
  type DivLabResearchPacket,
} from "./deep-research";
import {
  loadDivLabResearchInputs,
  type DivLabResearchLoadResult,
} from "./research-loader";
import type { ModelPortfolioAiModel } from "@/lib/model-portfolios/engine/ai";

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
    }
  | {
      ok: false;
      reason: Extract<DivLabResearchLoadResult, { ok: false }>["reason"];
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
 *
 * This service deliberately does not persist the analyst narrative yet. That
 * should be added with an explicit versioned analysis-content persistence
 * contract rather than hiding narrative inside the research facts blob.
 */
export async function createDivLabAiAnalysis(input: {
  symbol: string;
  exchange: string;
  name: string;
  fetchImpl?: typeof fetch;
  now?: Date;
  useEscalationModel?: boolean;
}): Promise<CreateDivLabAiAnalysisResult> {
  const loaded = await loadDivLabResearchInputs({
    symbol: input.symbol,
    exchange: input.exchange,
    name: input.name,
    fetchImpl: input.fetchImpl,
    now: input.now,
  });
  if (!loaded.ok) return loaded;

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
    now: input.now,
  };

  const factsPacket = buildDivLabResearchPacket({
    ...common,
    valuationScenarios: [],
  });

  const analyst = await generateDivLabAnalystDraft({
    packet: factsPacket,
    useEscalationModel: input.useEscalationModel,
  });

  const finalPacket = buildDivLabResearchPacket({
    ...common,
    valuationScenarios: analystDraftToValuationScenarios(analyst.draft),
  });

  return {
    ok: true,
    factsPacket,
    analystDraft: analyst.draft,
    finalPacket,
    model: analyst.model,
    usage: analyst.usage,
  };
}
