import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DivLabAnalystUsage } from "./analyst";
import type { DivLabFinancialSpecialistAnalystQualityGate } from "./financial-specialist-analyst-quality-gate";
import { evaluateFinancialSpecialistAnalystQuality } from "./financial-specialist-analyst-quality-gate";
import { generateDivLabFinancialSpecialistAnalystDraft } from "./financial-specialist-analyst";
import type { DivLabFinancialSpecialistAnalystDraft } from "./financial-specialist-schema";
import {
  buildDivLabFinancialSpecialistResearchPacket,
  type DivLabFinancialSpecialistResearchPacket,
} from "./financial-specialist-deep-research";
import { buildFinancialSpecialistResearch, type DivLabFinancialSpecialistResearch } from "./financial-specialist-research";
import {
  buildFinancialSpecialistScenarioSet,
  type DivLabFinancialSpecialistScenarioSet,
} from "./financial-specialist-scenarios";
import {
  persistDivLabFinancialSpecialistBundle,
  type PersistedDivLabFinancialSpecialistBundle,
} from "./financial-specialist-content-repository";
import { buildDivLabResearchPacket, type DivLabResearchPacket } from "./deep-research";
import { loadDivLabResearchInputs, type DivLabResearchLoadResult } from "./research-loader";

export type CreateDivLabFinancialSpecialistAnalysisResult =
  | {
      ok: false;
      stage: "research";
      reason: Extract<DivLabResearchLoadResult, { ok: false }>["reason"];
    }
  | {
      ok: false;
      stage: "methodology" | "specialist_research" | "gateway_auth_missing" | "research_quality" | "analyst_quality";
      reason: string;
      basePacket: DivLabResearchPacket;
      specialistResearch: DivLabFinancialSpecialistResearch | null;
      packet: DivLabFinancialSpecialistResearchPacket | null;
      scenarios: DivLabFinancialSpecialistScenarioSet | null;
      draft: DivLabFinancialSpecialistAnalystDraft | null;
      analystQualityGate: DivLabFinancialSpecialistAnalystQualityGate | null;
      analystModel: string | null;
      usage: DivLabAnalystUsage | null;
    }
  | {
      ok: true;
      stage: "complete";
      basePacket: DivLabResearchPacket;
      specialistResearch: DivLabFinancialSpecialistResearch;
      packet: DivLabFinancialSpecialistResearchPacket;
      scenarios: DivLabFinancialSpecialistScenarioSet;
      draft: DivLabFinancialSpecialistAnalystDraft;
      analystQualityGate: DivLabFinancialSpecialistAnalystQualityGate;
      analystModel: string;
      usage: DivLabAnalystUsage;
      persisted: PersistedDivLabFinancialSpecialistBundle | null;
    };

export async function createDivLabFinancialSpecialistAnalysis(input: {
  symbol: string;
  exchange: string;
  name: string;
  fetchImpl?: typeof fetch;
  now?: Date;
  useEscalationModel?: boolean;
  supabase?: SupabaseClient;
  persist?: boolean;
  slug?: string;
}): Promise<CreateDivLabFinancialSpecialistAnalysisResult> {
  const now = input.now ?? new Date();
  const loaded = await loadDivLabResearchInputs({
    symbol: input.symbol,
    exchange: input.exchange,
    name: input.name,
    fetchImpl: input.fetchImpl,
    now,
  });
  if (!loaded.ok) return { ok: false, stage: "research", reason: loaded.reason };

  const researchInputs = loaded.value;
  const basePacket = buildDivLabResearchPacket({
    symbol: researchInputs.instrument.symbol,
    exchange: researchInputs.instrument.exchange,
    name: researchInputs.instrument.name,
    currency: researchInputs.instrument.currency,
    currentPrice: researchInputs.instrument.currentPrice,
    history: researchInputs.history,
    fundamentals: researchInputs.fundamentals,
    companyClassification: researchInputs.companyClassification,
    fxConversion: researchInputs.fxConversion,
    valuationScenarios: [],
    sources: researchInputs.sources,
    evidence: researchInputs.evidence,
    now,
  });

  const type = basePacket.companyClassification.type;
  if (type !== "investment_company" && type !== "asset_manager") {
    return {
      ok: false,
      stage: "methodology",
      reason: "financial_specialist_classification_required",
      basePacket,
      specialistResearch: null,
      packet: null,
      scenarios: null,
      draft: null,
      analystQualityGate: null,
      analystModel: null,
      usage: null,
    };
  }

  const specialistResearch = buildFinancialSpecialistResearch({ basePacket });
  if (specialistResearch.status !== "research_ready") {
    return {
      ok: false,
      stage: "specialist_research",
      reason: "financial_specialist_research_not_ready",
      basePacket,
      specialistResearch,
      packet: null,
      scenarios: null,
      draft: null,
      analystQualityGate: null,
      analystModel: null,
      usage: null,
    };
  }

  let analyst: Awaited<ReturnType<typeof generateDivLabFinancialSpecialistAnalystDraft>>;
  try {
    analyst = await generateDivLabFinancialSpecialistAnalystDraft({
      packet: basePacket,
      research: specialistResearch,
      useEscalationModel: input.useEscalationModel,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "gateway_auth_missing") {
      return {
        ok: false,
        stage: "gateway_auth_missing",
        reason: "gateway_auth_missing",
        basePacket,
        specialistResearch,
        packet: null,
        scenarios: null,
        draft: null,
        analystQualityGate: null,
        analystModel: null,
        usage: null,
      };
    }
    throw error;
  }

  const scenarios = buildFinancialSpecialistScenarioSet({
    currentPrice: basePacket.instrument.currentPrice,
    currency: basePacket.instrument.currency,
    research: specialistResearch,
    trailingEps: basePacket.valuationInputs.epsTtm.value,
    draft: analyst.draft,
  });
  const packet = buildDivLabFinancialSpecialistResearchPacket({
    basePacket,
    research: specialistResearch,
    scenarios,
  });
  if (!packet.qualityGate.publishable) {
    return {
      ok: false,
      stage: "research_quality",
      reason: "financial_specialist_research_quality_failed",
      basePacket,
      specialistResearch,
      packet,
      scenarios,
      draft: analyst.draft,
      analystQualityGate: null,
      analystModel: analyst.model,
      usage: analyst.usage,
    };
  }

  const analystQualityGate = evaluateFinancialSpecialistAnalystQuality({
    research: specialistResearch,
    draft: analyst.draft,
    scenarios,
  });
  if (!analystQualityGate.publishable) {
    return {
      ok: false,
      stage: "analyst_quality",
      reason: "financial_specialist_analyst_quality_failed",
      basePacket,
      specialistResearch,
      packet,
      scenarios,
      draft: analyst.draft,
      analystQualityGate,
      analystModel: analyst.model,
      usage: analyst.usage,
    };
  }

  const persisted = input.supabase && input.persist !== false
    ? await persistDivLabFinancialSpecialistBundle({
        supabase: input.supabase,
        packet,
        draft: analyst.draft,
        analystQualityGate,
        analystModel: String(analyst.model),
        usage: analyst.usage,
        generatedAt: now.toISOString(),
        slug: input.slug,
      })
    : null;

  return {
    ok: true,
    stage: "complete",
    basePacket,
    specialistResearch,
    packet,
    scenarios,
    draft: analyst.draft,
    analystQualityGate,
    analystModel: String(analyst.model),
    usage: analyst.usage,
    persisted,
  };
}
