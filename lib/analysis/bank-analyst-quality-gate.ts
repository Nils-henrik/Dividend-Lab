import type { DivLabBankAnalystDraft } from "./bank-analyst-schema";
import type { DivLabBankResearch } from "./bank-research";
import type { DivLabBankScenarioSet } from "./bank-scenarios";

export const DIVLAB_BANK_ANALYST_QUALITY_GATE_VERSION =
  "bank-analyst-quality-v1" as const;

export type DivLabBankAnalystQualityGate = {
  version: typeof DIVLAB_BANK_ANALYST_QUALITY_GATE_VERSION;
  publishable: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  metrics: {
    knownQualityFactors: number;
    totalQualityFactors: number;
    uniqueSourceIds: number;
    unknownQualityFactors: number;
  };
  checks: {
    qualityFactorCoverage: boolean;
    confidenceCalibration: boolean;
    sourceDiversity: boolean;
    scenarioDifferentiation: boolean;
    assumptionDifferentiation: boolean;
    viewValuationConsistency: boolean;
    bankCoreFactorCoverage: boolean;
    bankResearchReady: boolean;
    bankValuationTraceability: boolean;
    bankScenarioBasisCoverage: boolean;
  };
};

function allSourceIds(draft: DivLabBankAnalystDraft): string[] {
  const ids: string[] = [];
  const add = (items: readonly { sourceIds: readonly string[] }[]) => {
    for (const item of items) ids.push(...item.sourceIds);
  };
  add(draft.investmentCase);
  add(draft.latestReport);
  add(draft.bankFundamentalInterpretation);
  add(draft.valuationInterpretation);
  add(draft.catalysts);
  add(draft.risks);
  add(draft.contradictions);
  add(draft.thesisBreakers);
  add(draft.technicalInterpretation);
  for (const factor of Object.values(draft.bankFactors)) ids.push(...factor.sourceIds);
  for (const scenario of draft.valuationScenarios) ids.push(...scenario.sourceIds);
  return ids;
}

function assumptionKey(scenario: DivLabBankAnalystDraft["valuationScenarios"][number]): string {
  return scenario.assumptions
    .map((item) => item.trim().toLocaleLowerCase("sv-SE"))
    .filter(Boolean)
    .sort()
    .join("|");
}

export function evaluateBankAnalystContentQuality(input: {
  bankResearch: DivLabBankResearch;
  draft: DivLabBankAnalystDraft;
  scenarios: DivLabBankScenarioSet;
}): DivLabBankAnalystQualityGate {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const factors = Object.values(input.draft.bankFactors);
  const knownQualityFactors = factors.filter((factor) => factor.assessment !== "unknown").length;
  const totalQualityFactors = factors.length;
  const unknownQualityFactors = totalQualityFactors - knownQualityFactors;

  const qualityFactorCoverage = knownQualityFactors >= 6;
  if (!qualityFactorCoverage) {
    blockers.push(
      `För få bankspecifika kvalitetsfaktorer kan bedömas: ${knownQualityFactors} av ${totalQualityFactors}. Minst 6 krävs.`,
    );
  }

  const confidenceCalibration =
    input.draft.confidence === "low" ||
    (input.draft.confidence === "medium" && unknownQualityFactors <= 4) ||
    (input.draft.confidence === "high" && unknownQualityFactors <= 1);
  if (!confidenceCalibration) {
    blockers.push(
      `Bankanalysens confidence=${input.draft.confidence} är för hög i förhållande till ${unknownQualityFactors} okända bankfaktorer.`,
    );
  }

  const uniqueSourceIds = new Set(allSourceIds(input.draft)).size;
  const sourceDiversity = uniqueSourceIds >= 3;
  if (!sourceDiversity) {
    blockers.push("Bankanalysen måste använda minst tre separata källor för publicering.");
  }

  const bear = input.scenarios.scenarios.find((scenario) => scenario.name === "bear")?.valuePerShare ?? null;
  const base = input.scenarios.scenarios.find((scenario) => scenario.name === "base")?.valuePerShare ?? null;
  const bull = input.scenarios.scenarios.find((scenario) => scenario.name === "bull")?.valuePerShare ?? null;
  const scenarioDifferentiation =
    bear !== null && base !== null && bull !== null && bear < base && base < bull;
  if (!scenarioDifferentiation) {
    blockers.push("Banks cenarierna måste ge ordnade värden: Bear < Base < Bull.");
  }

  const assumptionKeys = new Set(input.draft.valuationScenarios.map(assumptionKey));
  const assumptionDifferentiation = assumptionKeys.size === 3 && !assumptionKeys.has("");
  if (!assumptionDifferentiation) {
    blockers.push("Bear/Base/Bull måste ha tre skilda uppsättningar bankantaganden.");
  }

  const baseUpside = input.scenarios.baseCaseUpsideDownsidePct;
  const viewValuationConsistency =
    baseUpside !== null &&
    (input.draft.view === "neutral" ||
      (input.draft.view === "positive" && baseUpside >= 0) ||
      (input.draft.view === "negative" && baseUpside <= 0));
  if (!viewValuationConsistency) {
    blockers.push(
      "Bankens DivLab-syn motsäger det deterministiska basscenariot.",
    );
  }

  const coreFactors = [
    input.draft.bankFactors.profitability,
    input.draft.bankFactors.capitalStrength,
    input.draft.bankFactors.creditQuality,
    input.draft.bankFactors.fundingAndLiquidity,
  ];
  const bankCoreFactorCoverage = coreFactors.every(
    (factor) => factor.assessment !== "unknown" && factor.sourceIds.length > 0,
  );
  if (!bankCoreFactorCoverage) {
    blockers.push(
      "Lönsamhet, kapitalstyrka, kreditkvalitet och funding/liquidity måste alla vara källstödda och bedömbara.",
    );
  }

  const bankResearchReady = input.bankResearch.status === "research_ready";
  if (!bankResearchReady) {
    blockers.push("Bankspecifik research har inte klarat research-readiness-grinden.");
  }

  const pbClaim = input.draft.valuationInterpretation.find(
    (claim) => claim.measure === "priceToBook",
  );
  const bankValuationTraceability =
    input.bankResearch.valuation.status === "traceable" && Boolean(pbClaim);
  if (!bankValuationTraceability) {
    blockers.push("En publicerbar bankanalys kräver spårbar P/B-värdering och en strukturerad P/B-tolkning.");
  }

  const bankScenarioBasisCoverage = input.draft.valuationScenarios.every(
    (scenario) =>
      scenario.bookValueGrowthPct !== null && scenario.priceToBookMultiple !== null,
  );
  if (!bankScenarioBasisCoverage) {
    blockers.push("Varje bankscenario måste använda bokvärde/aktie och P/B som bankspecifik värderingsbas.");
  }

  if (input.draft.confidence === "low") {
    warnings.push("Bankanalysen är komplett men modellens confidence är låg.");
  }
  if (unknownQualityFactors >= 3) {
    warnings.push(
      `${unknownQualityFactors} av ${totalQualityFactors} bankspecifika kvalitetsfaktorer är fortfarande okända.`,
    );
  }
  if (input.bankResearch.capital.regulatoryCet1Requirement.status !== "confirmed") {
    warnings.push(
      "Regulatoriskt CET1-krav är inte uttryckligen verifierat; kapitalbedömningen får därför inte likställa rapporterad buffert med regulatoriskt headroom.",
    );
  }

  const checks = {
    qualityFactorCoverage,
    confidenceCalibration,
    sourceDiversity,
    scenarioDifferentiation,
    assumptionDifferentiation,
    viewValuationConsistency,
    bankCoreFactorCoverage,
    bankResearchReady,
    bankValuationTraceability,
    bankScenarioBasisCoverage,
  };
  const values = Object.values(checks);
  const score = Math.round((values.filter(Boolean).length / values.length) * 100);

  return {
    version: DIVLAB_BANK_ANALYST_QUALITY_GATE_VERSION,
    publishable: blockers.length === 0,
    score,
    blockers,
    warnings,
    metrics: {
      knownQualityFactors,
      totalQualityFactors,
      uniqueSourceIds,
      unknownQualityFactors,
    },
    checks,
  };
}
