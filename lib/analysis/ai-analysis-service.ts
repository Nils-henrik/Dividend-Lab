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
import type { FundamentalMethodologyStatus } from "./fundamental-methodology";
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

/**
 * Internal two-stage DivLab analysis flow.
 *
 * 1. Load and normalize facts/evidence + source-grounded company classification.
 * 2. Build a company-type-aware facts packet with no manufactured valuation scenarios.
 * 3. Fail before any model call if the company type requires a specialized
 *    fundamental methodology that DivLab has not implemented yet.
 * 4. Ask the analyst model for qualitative interpretation + explicit scenario
 *    assumptions only when the deterministic methodology is supported.
 * 5. Re-run deterministic valuation math with those assumptions.
 * 6. Re-run the full research publication quality gate.
 * 7. Run a separate deterministic quality gate over the analyst content.
 * 8. Only a content-quality-passing draft may reach persistence.
 * 9. When a service-role Supabase client is supplied, atomically persist the
 *    final research version, analyst content and its quality certification.
 *
 * The transient facts packet is never persisted as an additional version.
 * If Gateway authentication is unavailable, the function fails closed at the
 * analyst stage but returns the already verified facts packet for observability
 * and a later retry. A thin/self-contradictory analyst result returns an
 * analyst_quality failure and is not persisted. Other analyst/schema failures
 * still throw so code defects cannot be silently downgraded.
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
    companyClassification: research.companyClassification,
    fxConversion: research.fxConversion,
    sources: research.sources,
    evidence: research.evidence,
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

  const finalPacket = buildDivLabResearchPacket({
    ...common,
    valuationScenarios: analystDraftToValuationScenarios(analyst.draft),
  });
  const analystQualityGate = evaluateAnalystContentQuality({
    packet: finalPacket,
    draft: analyst.draft,
  });

  if (!analystQualityGate.publishable) {
    return {
      ok: false,
      stage: "analyst_quality",
      reason: "analyst_quality_gate_failed",
      factsPacket,
      analystDraft: analyst.draft,
      finalPacket,
      analystQualityGate,
      model: analyst.model,
      usage: analyst.usage,
    };
  }

  const persistence = input.supabase
    ? await persistDivLabAnalysisBundle({
        supabase: input.supabase,
        packet: finalPacket,
        analystDraft: analyst.draft,
        analystQualityGate,
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
    analystQualityGate,
    model: analyst.model,
    usage: analyst.usage,
    persistence,
  };
}
