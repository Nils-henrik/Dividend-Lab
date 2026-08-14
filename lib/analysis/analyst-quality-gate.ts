import type { DivLabAnalystDraft } from "./analyst-schema";
import type { DivLabResearchPacket } from "./deep-research";

export const DIVLAB_ANALYST_QUALITY_GATE_VERSION = "analyst-quality-v1" as const;

export type DivLabAnalystQualityGate = {
  version: typeof DIVLAB_ANALYST_QUALITY_GATE_VERSION;
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
  };
};

function allSourceIds(draft: DivLabAnalystDraft): string[] {
  const ids: string[] = [];
  const collect = (items: readonly { sourceIds: readonly string[] }[]) => {
    for (const item of items) ids.push(...item.sourceIds);
  };

  collect(draft.investmentCase);
  collect(draft.latestReport);
  collect(draft.fundamentalInterpretation);
  collect(draft.catalysts);
  collect(draft.risks);
  collect(draft.contradictions);
  collect(draft.thesisBreakers);
  collect(draft.technicalInterpretation);
  for (const factor of Object.values(draft.qualityFactors)) ids.push(...factor.sourceIds);
  for (const scenario of draft.valuationScenarios) ids.push(...scenario.sourceIds);
  return ids;
}

function scenarioValue(
  packet: DivLabResearchPacket,
  name: "bear" | "base" | "bull",
): number | null {
  return packet.valuation.scenarios.find((scenario) => scenario.name === name)?.valuePerShare ?? null;
}

function normalizedAssumptionKey(
  scenario: DivLabAnalystDraft["valuationScenarios"][number],
): string {
  return scenario.assumptions
    .map((assumption) => assumption.trim().toLocaleLowerCase("sv-SE"))
    .filter(Boolean)
    .sort()
    .join("|");
}

export function evaluateAnalystContentQuality(input: {
  packet: DivLabResearchPacket;
  draft: DivLabAnalystDraft;
}): DivLabAnalystQualityGate {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const factors = Object.values(input.draft.qualityFactors);
  const knownQualityFactors = factors.filter((factor) => factor.assessment !== "unknown").length;
  const totalQualityFactors = factors.length;
  const unknownQualityFactors = totalQualityFactors - knownQualityFactors;
  const qualityFactorCoverage = knownQualityFactors >= 6;
  if (!qualityFactorCoverage) {
    blockers.push(
      `För få kvalitativa bolagsfaktorer kan bedömas: ${knownQualityFactors} av ${totalQualityFactors}. Minst 6 krävs för DivLab Analys.`,
    );
  }

  const confidenceCalibration =
    input.draft.confidence === "low" ||
    (input.draft.confidence === "medium" && unknownQualityFactors <= 5) ||
    (input.draft.confidence === "high" && unknownQualityFactors <= 2);
  if (!confidenceCalibration) {
    blockers.push(
      `Analysens confidence=${input.draft.confidence} är för hög i förhållande till ${unknownQualityFactors} okända kvalitetsfaktorer.`,
    );
  }

  const uniqueSourceIds = new Set(allSourceIds(input.draft)).size;
  const sourceDiversity = uniqueSourceIds >= 2;
  if (!sourceDiversity) {
    blockers.push("Analystexten bygger på för få separata källor för en publicerbar DivLab Analys.");
  }

  const bear = scenarioValue(input.packet, "bear");
  const base = scenarioValue(input.packet, "base");
  const bull = scenarioValue(input.packet, "bull");
  const scenarioDifferentiation =
    bear !== null &&
    base !== null &&
    bull !== null &&
    bear < base &&
    base < bull;
  if (!scenarioDifferentiation) {
    blockers.push(
      "Bear/Base/Bull måste ge tre tydligt ordnade, separata värden: Bear < Base < Bull.",
    );
  }

  const assumptionKeys = new Set(
    input.draft.valuationScenarios.map(normalizedAssumptionKey),
  );
  const assumptionDifferentiation =
    assumptionKeys.size === 3 && !assumptionKeys.has("");
  if (!assumptionDifferentiation) {
    blockers.push(
      "Bear/Base/Bull måste ha skilda scenarioantaganden; samma antagandetext får inte återanvändas som tre olika scenarier.",
    );
  }

  const baseUpside = input.packet.valuation.scenarios.find(
    (scenario) => scenario.name === "base",
  )?.upsidePct ?? null;
  const viewValuationConsistency =
    baseUpside !== null &&
    (input.draft.view === "neutral" ||
      (input.draft.view === "positive" && baseUpside >= 0) ||
      (input.draft.view === "negative" && baseUpside <= 0));
  if (!viewValuationConsistency) {
    blockers.push(
      "DivLab-synen motsäger basscenariot: positiv syn kräver icke-negativ basuppsida och negativ syn kräver icke-positiv basuppsida.",
    );
  }

  if (input.draft.confidence === "low") {
    warnings.push("Analysen är publiceringsmässigt komplett men modellens confidence är låg.");
  }
  if (unknownQualityFactors >= 4) {
    warnings.push(
      `${unknownQualityFactors} av ${totalQualityFactors} kvalitativa bolagsfaktorer är fortfarande markerade som okända.`,
    );
  }

  const checks = {
    qualityFactorCoverage,
    confidenceCalibration,
    sourceDiversity,
    scenarioDifferentiation,
    assumptionDifferentiation,
    viewValuationConsistency,
  };
  const values = Object.values(checks);
  const score = Math.round((values.filter(Boolean).length / values.length) * 100);

  return {
    version: DIVLAB_ANALYST_QUALITY_GATE_VERSION,
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
