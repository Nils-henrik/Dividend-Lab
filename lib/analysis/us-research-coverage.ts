import type { GlobalEvidenceBundle, GlobalEvidenceQualityGate } from "./global-evidence-contract";
import {
  buildDivLabResearchPacket,
  type DivLabResearchPacket,
} from "./deep-research";
import type { DivLabResearchInputs } from "./research-loader";
import type { AnalysisEvidence } from "./evidence";
import type { AnalysisSource } from "./quality-gate";

export const US_RESEARCH_COVERAGE_VERSION = "us-research-coverage-v1" as const;

export type UsResearchCoverageGate = {
  version: typeof US_RESEARCH_COVERAGE_VERSION;
  ready: boolean;
  score: number;
  blockers: string[];
  checks: {
    usOperatingCompanyTarget: boolean;
    methodologyCoverage: boolean;
    currentFinancialCoverage: boolean;
    multiYearFinancialCoverage: boolean;
    currencyCoverage: boolean;
    marketAndTechnicalHistoryCoverage: boolean;
    classificationProvenance: boolean;
    valuationInputProvenance: boolean;
    freshPrimaryEvidenceCoverage: boolean;
  };
  /**
   * The ordinary Research publication gate is intentionally not expected to be
   * 100/100 here because Bear/Base/Bull assumptions belong to the later Analyst
   * stage. US Research Coverage proves the deterministic inputs required before
   * that stage can ever be invoked.
   */
  factsResearchQuality: {
    score: number;
    publishable: boolean;
    failedChecks: string[];
    valuationScenarioCoverageDeferred: boolean;
  };
};

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

function normalizedCurrency(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

function currenciesAreUsable(packet: DivLabResearchPacket): boolean {
  const market = normalizedCurrency(packet.currencyContext.marketCurrency);
  const reporting = normalizedCurrency(packet.currencyContext.reportingCurrency);
  const eps = normalizedCurrency(packet.currencyContext.epsTtmCurrency);
  if (!market || !reporting || !eps) return false;

  const conversionSupports = (source: string): boolean => {
    if (source === market) return true;
    return Boolean(
      packet.fxConversion &&
        packet.fxConversion.fromCurrency === source &&
        packet.fxConversion.toCurrency === market &&
        Number.isFinite(packet.fxConversion.rate) &&
        packet.fxConversion.rate > 0,
    );
  };

  return conversionSupports(reporting) && conversionSupports(eps);
}

function failedCheckNames(checks: Record<string, boolean>): string[] {
  return Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
}

/**
 * Build the exact existing Deep Research facts packet with verified SEC evidence
 * attached. No Analyst model is called and no valuation scenario is invented.
 */
export function buildUsResearchCoverageFactsPacket(input: {
  research: DivLabResearchInputs;
  evidenceBundle: GlobalEvidenceBundle;
  now?: Date;
}): DivLabResearchPacket {
  const sources = dedupeSources([
    ...input.research.sources,
    ...input.evidenceBundle.analysisSources,
  ]);
  const evidence = dedupeEvidence([
    ...input.research.evidence,
    ...input.evidenceBundle.evidence,
  ]);

  return buildDivLabResearchPacket({
    symbol: input.research.instrument.symbol,
    exchange: input.research.instrument.exchange,
    name: input.research.instrument.name,
    currency: input.research.instrument.currency,
    currentPrice: input.research.instrument.currentPrice,
    history: input.research.history,
    fundamentals: input.research.fundamentals,
    companyClassification: input.research.companyClassification,
    fxConversion: input.research.fxConversion,
    valuationScenarios: [],
    sources,
    evidence,
    now: input.now,
  });
}

/**
 * Readiness gate for US Research inputs only. This is deliberately not a second
 * publication quality standard: every substantive check is derived from the
 * existing DivLab Research packet / quality gate plus the already-established
 * Global Evidence Extraction gate.
 */
export function evaluateUsResearchCoverage(input: {
  packet: DivLabResearchPacket;
  evidenceQualityGate: GlobalEvidenceQualityGate;
}): UsResearchCoverageGate {
  const packet = input.packet;
  const researchChecks = packet.qualityGate.checks;
  const usOperatingCompanyTarget =
    packet.instrument.exchange === "US" &&
    packet.companyClassification.type === "operating_company";
  const methodologyCoverage = researchChecks.fundamentalMethodologyCoverage;
  const currentFinancialCoverage = researchChecks.fundamentalCoverage;
  const multiYearFinancialCoverage = researchChecks.multiYearFundamentalCoverage;
  const currencyCoverage = currenciesAreUsable(packet);
  const marketAndTechnicalHistoryCoverage =
    Number.isFinite(packet.instrument.currentPrice) &&
    packet.instrument.currentPrice > 0 &&
    researchChecks.technicalHistoryCoverage &&
    researchChecks.technicalLevelCoverage;
  const classificationProvenance = researchChecks.companyClassificationCoverage;
  const valuationInputProvenance = researchChecks.valuationTraceability;
  const freshPrimaryEvidenceCoverage =
    input.evidenceQualityGate.ready &&
    input.evidenceQualityGate.score === 100 &&
    researchChecks.freshPrimarySource &&
    researchChecks.sourceTraceability &&
    researchChecks.primaryEvidenceCoverage;

  const checks = {
    usOperatingCompanyTarget,
    methodologyCoverage,
    currentFinancialCoverage,
    multiYearFinancialCoverage,
    currencyCoverage,
    marketAndTechnicalHistoryCoverage,
    classificationProvenance,
    valuationInputProvenance,
    freshPrimaryEvidenceCoverage,
  };
  const values = Object.values(checks);
  const score = Math.round((values.filter(Boolean).length / values.length) * 100);
  const blockers: string[] = [];

  if (!usOperatingCompanyTarget) blockers.push("US Research Coverage v1 tillåter endast verifierade amerikanska operating companies.");
  if (!methodologyCoverage) blockers.push("Den befintliga operating-company-metodiken är inte verifierat tillgänglig för målbolaget.");
  if (!currentFinancialCoverage) blockers.push("Aktuell fundamental täckning når inte DivLabs befintliga Research-gate.");
  if (!multiYearFinancialCoverage) blockers.push("Flerårig fundamental historik når inte DivLabs befintliga Research-gate.");
  if (!currencyCoverage) blockers.push("Rapporterings-, EPS- och marknadsvaluta kan inte verifieras eller konverteras spårbart.");
  if (!marketAndTechnicalHistoryCoverage) blockers.push("Marknadspris eller teknisk historik/stöd-motstånd når inte befintlig Research-gate.");
  if (!classificationProvenance) blockers.push("Bolagsklassificeringen saknar verifierad proveniens.");
  if (!valuationInputProvenance) blockers.push("Tillgängliga deterministiska värderingsmått saknar full inputproveniens.");
  if (!freshPrimaryEvidenceCoverage) blockers.push("Färsk SEC-evidens når inte både Evidence- och ordinarie Research-gaten.");

  return {
    version: US_RESEARCH_COVERAGE_VERSION,
    ready: blockers.length === 0,
    score,
    blockers,
    checks,
    factsResearchQuality: {
      score: packet.qualityGate.score,
      publishable: packet.qualityGate.publishable,
      failedChecks: failedCheckNames(packet.qualityGate.checks),
      valuationScenarioCoverageDeferred: !researchChecks.valuationScenarioCoverage,
    },
  };
}
