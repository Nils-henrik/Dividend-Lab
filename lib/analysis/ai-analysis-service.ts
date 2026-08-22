import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelPortfolioAiModel } from "@/lib/model-portfolios/engine/ai";
import {
  analystDraftToValuationScenarios,
  generateDivLabAnalystDraft,
  type DivLabAnalystUsage,
} from "./analyst";
import {
  evaluateAnalystContentQuality,
  type DivLabAnalystQualityGate,
} from "./analyst-quality-gate";
import { repairDivLabAnalystDraftForQuality } from "./analyst-quality-repair";
import type { DivLabAnalystDraft } from "./analyst-schema";
import type { DivLabCompanyType } from "./company-classification";
import {
  persistDivLabAnalysisBundle,
  type PersistedDivLabAnalysisBundle,
} from "./content-repository";
import {
  buildDivLabResearchPacket,
  type DivLabResearchPacket,
} from "./deep-research";
import type { AnalysisEvidence } from "./evidence";
import type { FundamentalMethodologyStatus } from "./fundamental-methodology";
import type { AnalysisSource } from "./quality-gate";
import {
  loadDivLabResearchInputs,
  type DivLabResearchInputs,
  type DivLabResearchLoadResult,
} from "./research-loader";

export type CreateDivLabAiAnalysisResult =
  | {
      ok: true;
      /** Facts-only packet before analyst scenario assumptions are applied. */
      factsPacket: DivLabResearchPacket;
      analystDraft: DivLabAnalystDraft;
      /** Rebuilt packet after deterministic valuation math and final research quality gate. */
      finalPacket: DivLabResearchPacket;
      /** Separate deterministic quality gate for the AI interpretation itself. */
      analystQualityGate: DivLabAnalystQualityGate;
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
      stage: "methodology";
      reason: "fundamental_methodology_not_supported";
      methodologyStatus: Exclude<FundamentalMethodologyStatus, "supported">;
      companyType: DivLabCompanyType;
      /** Facts are retained for QA and for future specialized-methodology work. */
      factsPacket: DivLabResearchPacket;
    }
  | {
      ok: false;
      stage: "analyst";
      reason: "gateway_auth_missing";
      /** Verified research is retained in-memory so the job can be inspected or retried. */
      factsPacket: DivLabResearchPacket;
    }
  | {
      ok: false;
      stage: "analyst_quality";
      reason: "analyst_quality_gate_failed";
      /** The rejected draft remains available for internal QA but is never persisted. */
      factsPacket: DivLabResearchPacket;
      analystDraft: DivLabAnalystDraft;
      finalPacket: DivLabResearchPacket;
      analystQualityGate: DivLabAnalystQualityGate;
      model: ModelPortfolioAiModel;
      usage: DivLabAnalystUsage;
    };

function mergeAnalystUsage(
  first: DivLabAnalystUsage,
  second: DivLabAnalystUsage,
): DivLabAnalystUsage {
  return {
    inputTokens: first.inputTokens + second.inputTokens,
    outputTokens: first.outputTokens + second.outputTokens,
    totalTokens: first.totalTokens + second.totalTokens,
    estimatedCostUsdMicros:
      first.estimatedCostUsdMicros + second.estimatedCostUsdMicros,
  };
}

function safeRepairFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown";
  return message.replace(/[^a-zA-Z0-9_.:-]+/g, "_").slice(0, 180);
}

function dedupeSources(sources: readonly AnalysisSource[]): AnalysisSource[] {
  const byId = new Map<string, AnalysisSource>();
  for (const source of sources) {
    if (!byId.has(source.id)) byId.set(source.id, { ...source });
  }
  return [...byId.values()];
}

function dedupeEvidence(evidence: readonly AnalysisEvidence[]): AnalysisEvidence[] {
  const byId = new Map<string, AnalysisEvidence>();
  for (const item of evidence) {
    if (!byId.has(item.id)) byId.set(item.id, { ...item });
  }
  return [...byId.values()];
}

/**
 * Execute the established operating-company Analyst/final-quality sequence from
 * already verified canonical Research inputs.
 *
 * This is intentionally market-agnostic. Callers may attach additional verified
 * primary sources/evidence (for example regulator filings) before the facts packet
 * is built. Existing callers that do not supply additions retain the exact normal
 * Research -> Analyst behavior.
 */
export async function createDivLabAiAnalysisFromResearchInputs(input: {
  research: DivLabResearchInputs;
  additionalSources?: readonly AnalysisSource[];
  additionalEvidence?: readonly AnalysisEvidence[];
  now?: Date;
  useEscalationModel?: boolean;
  supabase?: SupabaseClient;
  slug?: string;
}): Promise<CreateDivLabAiAnalysisResult> {
  const now = input.now ?? new Date();
  const research = input.research;
  const sources = dedupeSources([
    ...research.sources,
    ...(input.additionalSources ?? []),
  ]);
  const evidence = dedupeEvidence([
    ...research.evidence,
    ...(input.additionalEvidence ?? []),
  ]);
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
    sources,
    evidence,
    now,
  };

  const factsPacket = buildDivLabResearchPacket({
    ...common,
    valuationScenarios: [],
  });

  if (factsPacket.fundamental.methodology.status !== "supported") {
    return {
      ok: false,
      stage: "methodology",
      reason: "fundamental_methodology_not_supported",
      methodologyStatus: factsPacket.fundamental.methodology.status,
      companyType: factsPacket.companyClassification.type,
      factsPacket,
    };
  }

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

  let analystDraft = analyst.draft;
  let analystModel = analyst.model;
  let analystUsage = analyst.usage;
  let finalPacket = buildDivLabResearchPacket({
    ...common,
    valuationScenarios: analystDraftToValuationScenarios(analystDraft),
  });
  let analystQualityGate = evaluateAnalystContentQuality({
    packet: finalPacket,
    draft: analystDraft,
  });

  if (!analystQualityGate.publishable) {
    console.warn("[divlab-analysis] analyst quality gate failed; attempting one bounded repair", {
      score: analystQualityGate.score,
      blockerCount: analystQualityGate.blockers.length,
      failedChecks: Object.entries(analystQualityGate.checks)
        .filter(([, passed]) => !passed)
        .map(([name]) => name),
    });

    try {
      const repaired = await repairDivLabAnalystDraftForQuality({
        factsPacket,
        finalPacket,
        draft: analystDraft,
        qualityGate: analystQualityGate,
      });
      analystDraft = repaired.draft;
      analystModel = repaired.model;
      analystUsage = mergeAnalystUsage(analystUsage, repaired.usage);
      finalPacket = buildDivLabResearchPacket({
        ...common,
        valuationScenarios: analystDraftToValuationScenarios(analystDraft),
      });
      analystQualityGate = evaluateAnalystContentQuality({
        packet: finalPacket,
        draft: analystDraft,
      });
    } catch (error) {
      console.warn("[divlab-analysis] bounded analyst quality repair failed", {
        failureCode: safeRepairFailure(error),
      });
    }
  }

  if (!analystQualityGate.publishable) {
    console.warn("[divlab-analysis] analyst quality gate remains fail-closed", {
      score: analystQualityGate.score,
      blockerCount: analystQualityGate.blockers.length,
      failedChecks: Object.entries(analystQualityGate.checks)
        .filter(([, passed]) => !passed)
        .map(([name]) => name),
    });
    return {
      ok: false,
      stage: "analyst_quality",
      reason: "analyst_quality_gate_failed",
      factsPacket,
      analystDraft,
      finalPacket,
      analystQualityGate,
      model: analystModel,
      usage: analystUsage,
    };
  }

  const persistence = input.supabase
    ? await persistDivLabAnalysisBundle({
        supabase: input.supabase,
        packet: finalPacket,
        analystDraft,
        analystQualityGate,
        analystModel,
        usage: analystUsage,
        generatedAt: now.toISOString(),
        slug: input.slug,
      })
    : null;

  return {
    ok: true,
    factsPacket,
    analystDraft,
    finalPacket,
    analystQualityGate,
    model: analystModel,
    usage: analystUsage,
    persistence,
  };
}

/**
 * Internal two-stage DivLab analysis flow.
 *
 * 1. Load and normalize facts/evidence + source-grounded company classification.
 * 2. Delegate the already loaded canonical Research inputs to the shared Analyst
 *    sequence above.
 * 3. Existing Nordic primary-source loading and optional persistence behavior are
 *    preserved because this wrapper still owns the ordinary Research loader.
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

  return createDivLabAiAnalysisFromResearchInputs({
    research: loaded.value,
    now,
    useEscalationModel: input.useEscalationModel,
    ...(input.supabase ? { supabase: input.supabase } : {}),
    ...(input.slug ? { slug: input.slug } : {}),
  });
}
