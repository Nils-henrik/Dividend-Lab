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
import { buildDivLabAnalysisDraft } from "./draft-service";
import type { DivLabResearchPacket } from "./deep-research";
import {
  loadDivLabResearchInputs,
  type LoadDivLabResearchInputsDeps,
} from "./research-loader";

export type CreateDivLabBankAiAnalysisResult = {
  stage:
    | "methodology"
    | "bank_research"
    | "bank_research_quality"
    | "gateway_auth_missing"
    | "analyst_quality"
    | "complete";
  basePacket: DivLabResearchPacket;
  bankResearch: DivLabBankResearch | null;
  packet: DivLabBankResearchPacket | null;
  bankScenarios: DivLabBankScenarioSet | null;
  draft: DivLabBankAnalystDraft | null;
  analystQualityGate: DivLabBankAnalystQualityGate | null;
  analystModel: string | null;
  usage: DivLabAnalystUsage | null;
  persisted: PersistedDivLabBankAnalysisBundle | null;
  error: string | null;
};

export async function createDivLabBankAiAnalysis(input: {
  symbol: string;
  exchange: string;
  supabase?: SupabaseClient;
  persist?: boolean;
  slug?: string;
  useEscalationModel?: boolean;
  deps?: LoadDivLabResearchInputsDeps;
}): Promise<CreateDivLabBankAiAnalysisResult> {
  const inputs = await loadDivLabResearchInputs({
    symbol: input.symbol,
    exchange: input.exchange,
    deps: input.deps,
  });
  const basePacket = buildDivLabAnalysisDraft(inputs).packet;

  const emptyResult = (
    stage: CreateDivLabBankAiAnalysisResult["stage"],
    error: string,
    bankResearch: DivLabBankResearch | null = null,
  ): CreateDivLabBankAiAnalysisResult => ({
    stage,
    basePacket,
    bankResearch,
    packet: null,
    bankScenarios: null,
    draft: null,
    analystQualityGate: null,
    analystModel: null,
    usage: null,
    persisted: null,
    error,
  });

  if (basePacket.companyClassification.type !== "bank") {
    return emptyResult("methodology", "bank_analysis_requires_bank_classification");
  }

  const bankResearch = buildBankResearch({
    evidence: basePacket.evidence,
    fundamentals: basePacket.fundamentalSnapshot,
    currentPrice: basePacket.instrument.currentPrice,
    marketCurrency: basePacket.instrument.currency,
    reportingCurrency: basePacket.currencyContext.reportingCurrency,
    fxConversion: inputs.fxConversion,
    sources: basePacket.sources,
  });
  if (bankResearch.status !== "research_ready") {
    return emptyResult("bank_research", "bank_research_not_ready", bankResearch);
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
      return emptyResult("gateway_auth_missing", "gateway_auth_missing", bankResearch);
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
    now: new Date(),
    basePacket,
    bankResearch,
    bankScenarios,
  });
  if (!packet.qualityGate.publishable) {
    return {
      ...emptyResult("bank_research_quality", "bank_research_quality_gate_failed", bankResearch),
      packet,
      bankScenarios,
      draft: analyst.draft,
      analystModel: analyst.model,
      usage: analyst.usage,
    };
  }

  const analystQualityGate = evaluateBankAnalystContentQuality({
    bankResearch,
    draft: analyst.draft,
    scenarios: bankScenarios,
  });
  if (!analystQualityGate.publishable) {
    return {
      stage: "analyst_quality",
      basePacket,
      bankResearch,
      packet,
      bankScenarios,
      draft: analyst.draft,
      analystQualityGate,
      analystModel: analyst.model,
      usage: analyst.usage,
      persisted: null,
      error: "bank_analyst_quality_gate_failed",
    };
  }

  let persisted: PersistedDivLabBankAnalysisBundle | null = null;
  if (input.persist !== false) {
    if (!input.supabase) throw new Error("supabase_client_required_for_persistence");
    persisted = await persistDivLabBankAnalysisBundle({
      supabase: input.supabase,
      packet,
      draft: analyst.draft,
      analystModel: analyst.model,
      usage: analyst.usage,
      qualityGate: analystQualityGate,
      slug: input.slug,
    });
  }

  return {
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
    error: null,
  };
}
