import type { DivLabFinancialSpecialistAnalystDraft } from "./financial-specialist-schema";
import type { DivLabFinancialSpecialistResearch } from "./financial-specialist-research";
import type { DivLabFinancialSpecialistScenarioSet } from "./financial-specialist-scenarios";

export const DIVLAB_FINANCIAL_SPECIALIST_ANALYST_QUALITY_GATE_VERSION =
  "financial-specialist-analyst-quality-v1" as const;

export type DivLabFinancialSpecialistAnalystQualityGate = {
  version: typeof DIVLAB_FINANCIAL_SPECIALIST_ANALYST_QUALITY_GATE_VERSION;
  publishable: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  metrics: { knownQualityFactors: number; totalQualityFactors: number; uniqueSourceIds: number };
  checks: {
    specialistTypeConsistency: boolean;
    qualityFactorCoverage: boolean;
    sourceDiversity: boolean;
    confidenceCalibration: boolean;
    scenarioDifferentiation: boolean;
    assumptionDifferentiation: boolean;
    viewValuationConsistency: boolean;
    specialistResearchReady: boolean;
    specialistValuationCoverage: boolean;
  };
};

function sourceIds(draft: DivLabFinancialSpecialistAnalystDraft): string[] {
  const result: string[] = [];
  const add = (items: readonly { sourceIds: readonly string[] }[]) => {
    for (const item of items) result.push(...item.sourceIds);
  };
  add(draft.investmentCase); add(draft.latestReport); add(draft.specialistInterpretation);
  add(draft.valuationInterpretation); add(draft.catalysts); add(draft.risks);
  add(draft.contradictions); add(draft.thesisBreakers); add(draft.technicalInterpretation);
  add(draft.qualityFactors); add(draft.valuationScenarios);
  return result;
}

function assumptionKey(values: readonly string[]): string {
  return [...values].map((value) => value.trim().toLocaleLowerCase("sv-SE")).filter(Boolean).sort().join("|");
}

export function evaluateFinancialSpecialistAnalystQuality(input: {
  research: DivLabFinancialSpecialistResearch;
  draft: DivLabFinancialSpecialistAnalystDraft;
  scenarios: DivLabFinancialSpecialistScenarioSet;
}): DivLabFinancialSpecialistAnalystQualityGate {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const specialistTypeConsistency = input.draft.specialistType === input.research.specialistType && input.scenarios.specialistType === input.research.specialistType;
  if (!specialistTypeConsistency) blockers.push("Analystolkningen använder fel specialistmetodik.");

  const knownQualityFactors = input.draft.qualityFactors.filter((factor) => factor.assessment !== "unknown").length;
  const totalQualityFactors = input.draft.qualityFactors.length;
  const qualityFactorCoverage = knownQualityFactors >= 6;
  if (!qualityFactorCoverage) blockers.push(`För få specialistfaktorer kan bedömas: ${knownQualityFactors} av ${totalQualityFactors}. Minst 6 krävs.`);

  const uniqueSourceIds = new Set(sourceIds(input.draft)).size;
  const sourceDiversity = uniqueSourceIds >= 3;
  if (!sourceDiversity) blockers.push("Specialistanalysen använder för få unika källor.");

  const unknownShare = totalQualityFactors ? (totalQualityFactors - knownQualityFactors) / totalQualityFactors : 1;
  const confidenceCalibration = unknownShare <= 0.25 || input.draft.confidence !== "high";
  if (!confidenceCalibration) blockers.push("Confidence är för hög i relation till andelen okända specialistfaktorer.");

  const [bear, base, bull] = input.scenarios.scenarios;
  const scenarioDifferentiation = Boolean(bear && base && bull) && bear!.valuePerShare !== null && base!.valuePerShare !== null && bull!.valuePerShare !== null && bear!.valuePerShare! < base!.valuePerShare! && base!.valuePerShare! < bull!.valuePerShare!;
  if (!scenarioDifferentiation) blockers.push("Bear/Base/Bull måste ge tre tydligt skilda värderingsutfall.");

  const assumptionDifferentiation = new Set(input.draft.valuationScenarios.map((scenario) => assumptionKey(scenario.assumptions))).size === 3;
  if (!assumptionDifferentiation) blockers.push("Bear/Base/Bull måste bygga på tydligt skilda antaganden.");

  const baseUpside = input.scenarios.baseCaseUpsideDownsidePct;
  const viewValuationConsistency = baseUpside === null || input.draft.view === "neutral" || (input.draft.view === "positive" && baseUpside > -0.08) || (input.draft.view === "negative" && baseUpside < 0.08);
  if (!viewValuationConsistency) blockers.push("Analystens syn är inte rimligt kalibrerad mot basscenariot.");

  const specialistResearchReady = input.research.status === "research_ready";
  if (!specialistResearchReady) blockers.push("Specialistresearch är inte redo för Analyst.");

  const specialistValuationCoverage = input.research.specialistType === "investment_company"
    ? input.research.metrics.navPerShare.status === "confirmed" && input.research.metrics.discountToNavPct.status === "confirmed" && input.scenarios.scenarios.every((scenario) => scenario.method === "NAV_discount")
    : input.research.metrics.totalAumEurBn.status === "confirmed" && input.research.metrics.feeGeneratingAumEurBn.status === "confirmed" && input.research.metrics.trailingPe.status === "confirmed" && input.scenarios.scenarios.every((scenario) => scenario.method === "P/E");
  if (!specialistValuationCoverage) blockers.push("Analysten saknar rätt specialistvärdering för bolagstypen.");
  if (unknownShare > 0.35) warnings.push("En stor andel specialistfaktorer är fortfarande okända.");

  const checks = { specialistTypeConsistency, qualityFactorCoverage, sourceDiversity, confidenceCalibration, scenarioDifferentiation, assumptionDifferentiation, viewValuationConsistency, specialistResearchReady, specialistValuationCoverage };
  const values = Object.values(checks);
  const score = Math.round((values.filter(Boolean).length / values.length) * 100);
  return {
    version: DIVLAB_FINANCIAL_SPECIALIST_ANALYST_QUALITY_GATE_VERSION,
    publishable: blockers.length === 0 && score === 100,
    score,
    blockers,
    warnings,
    metrics: { knownQualityFactors, totalQualityFactors, uniqueSourceIds },
    checks,
  };
}
