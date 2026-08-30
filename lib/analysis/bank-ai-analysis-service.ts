import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DivLabAnalystUsage } from "./analyst";
import { generateDivLabBankAnalystDraft } from "./bank-analyst";
import {
  evaluateBankAnalystContentQuality,
  type DivLabBankAnalystQualityGate,
} from "./bank-analyst-quality-gate";
import type { DivLabBankAnalystDraft } from "./bank-analyst-schema";
import {
  buildDivLabBankResearchPacket,
  type DivLabBankResearchPacket,
} from "./bank-deep-research";
import {
  persistDivLabBankAnalysisBundle,
  type PersistedDivLabBankAnalysisBundle,
} from "./bank-content-repository";
import { buildBankResearch, type DivLabBankResearch } from "./bank-research";
import { buildBankScenarioSet, type DivLabBankScenarioSet } from "./bank-scenarios";
import {
  buildDivLabResearchPacket,
  type DivLabResearchPacket,
} from "./deep-research";
import {
  loadDivLabResearchInputs,
  type DivLabResearchLoadResult,
} from "./research-loader";

export type CreateDivLabBankAiAnalysisResult =
  | {
      ok: false;
      stage: "research";
      reason: Extract<DivLabResearchLoadResult, { ok: false }>["reason"];
    }
  | {
      ok: false;
      stage:
        | "methodology"
        | "bank_research"
        | "bank_research_quality"
        | "gateway_auth_missing"
        | "analyst_quality";
      reason: string;
      basePacket: DivLabResearchPacket;
      bankResearch: DivLabBankResearch | null;
      packet: DivLabBankResearchPacket | null;
      bankScenarios: DivLabBankScenarioSet | null;
      draft: DivLabBankAnalystDraft | null;
      analystQualityGate: DivLabBankAnalystQualityGate | null;
      analystModel: string | null;
      usage: DivLabAnalystUsage | null;
    }
  | {
      ok: true;
      stage: "complete";
      basePacket: DivLabResearchPacket;
      bankResearch: DivLabBankResearch;
      packet: DivLabBankResearchPacket;
      bankScenarios: DivLabBankScenarioSet;
      draft: DivLabBankAnalystDraft;
      analystQualityGate: DivLabBankAnalystQualityGate;
      analystModel: string;
      usage: DivLabAnalystUsage;
      persisted: PersistedDivLabBankAnalysisBundle | null;
    };

/**
 * Standalone bank-v3 analysis flow. The generic operating-company service is
 * intentionally untouched until this specialized path has passed its own full
 * repository and database verification.
 */
export async function createDivLabBankAiAnalysis(input: {
  symbol: string;
  exchange: string;
  name: string;
  fetchImpl?: typeof fetch;
  now?: Date;
  supabase?: SupabaseClient;
  persist?: boolean;
  slug?: string;
  useEscalationModel?: boolean;
}): Promise<CreateDivLabBankAiAnalysisResult> {
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
    companyClassification: research.companyClassification,
    fxConversion: research.fxConversion,
    sources: research.sources,
    evidence: research.evidence,
    now,
  };
  const basePacket = buildDivLabResearchPacket({
    ...common,
    valuationScenarios: [],
  });

  const failure = (
    stage: Exclude<Exclude<CreateDivLabBankAiAnalysisResult, { ok: true }>["stage"], "research">,
    reason: string,
    overrides: Partial<
      Omit<
        Exclude<CreateDivLabBankAiAnalysisResult, { ok: false; stage: "research" }>,
        "ok" | "stage" | "reason" | "basePacket"
      >
    > = {},
  ): Exclude<CreateDivLabBankAiAnalysisResult, { ok: true } | { stage: "research" }> => ({
    ok: false,
    stage,
    reason,
    basePacket,
    bankResearch: null,
    packet: null,
    bankScenarios: null,
    draft: null,
    analystQualityGate: null,
    analystModel: null,
    usage: null,
    ...overrides,
  });

  if (basePacket.companyClassification.type !== "bank") {
    return failure("methodology", "bank_analysis_requires_bank_classification");
  }

  const bankResearch = buildBankResearch({
    evidence: basePacket.evidence,
    fundamentals: basePacket.fundamentalSnapshot,
    currentPrice: basePacket.instrument.currentPrice,
    marketCurrency: basePacket.instrument.currency,
    reportingCurrency: basePacket.currencyContext.reportingCurrency,
    fxConversion: research.fxConversion,
    sources: basePacket.sources,
  });
  if (bankResearch.status !== "research_ready") {
    return failure("bank_research", "bank_research_not_ready", { bankResearch });
  }

  let analyst: Awaited<ReturnType<typeof generateDivLabBankAnalystDraft>>;
  try {
    analyst = await generateDivLabBankAnalystDraft({
      packet: basePacket,
      bankResearch,
      useEscalationModel: input.useEscalationModel,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "gateway_auth_missing") {
      return failure("gateway_auth_missing", "gateway_auth_missing", { bankResearch });
    }
    throw error;
  }

  const bankScenarios = buildBankScenarioSet({
    currentPrice: basePacket.instrument.currentPrice,
    currency: basePacket.instrument.currency,
    trailingEps: basePacket.valuationInputs.epsTtm.value,
    bookValuePerShare: bankResearch.valuation.bookValuePerShare.value,
    scenarios: analyst.draft.valuationScenarios,
  });
  const packet = buildDivLabBankResearchPacket({
    now,
    basePacket,
    bankResearch,
    bankScenarios,
  });
  if (!packet.qualityGate.publishable) {
    return failure("bank_research_quality", "bank_research_quality_gate_failed", {
      bankResearch,
      packet,
      bankScenarios,
      draft: analyst.draft,
      analystModel: analyst.model,
      usage: analyst.usage,
    });
  }

  const analystQualityGate = evaluateBankAnalystContentQuality({
    bankResearch,
    draft: analyst.draft,
    scenarios: bankScenarios,
  });
  if (!analystQualityGate.publishable) {
    return failure("analyst_quality", "bank_analyst_quality_gate_failed", {
      bankResearch,
      packet,
      bankScenarios,
      draft: analyst.draft,
      analystQualityGate,
      analystModel: analyst.model,
      usage: analyst.usage,
    });
  }

  const persisted =
    input.supabase && input.persist !== false
      ? await persistDivLabBankAnalysisBundle({
          supabase: input.supabase,
          packet,
          draft: analyst.draft,
          analystModel: analyst.model,
          usage: analyst.usage,
          qualityGate: analystQualityGate,
          generatedAt: now.toISOString(),
          slug: input.slug,
        })
      : null;

  return {
    ok: true,
    stage: "complete",
    basePacket,
    bankResearch,
    packet,
    bankScenarios,
    draft: analyst.draft,
    analystQualityGate,
    analystModel: analyst.model,
    usage: analyst.usage,
    persisted,
  };
}
