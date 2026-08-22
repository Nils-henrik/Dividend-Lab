import { analysisEngineForCompanyType } from "../lib/analysis/analysis-engine-dispatch";
import {
  createDivLabAiAnalysis,
  createDivLabAiAnalysisFromResearchInputs,
} from "../lib/analysis/ai-analysis-service";
import { createDivLabBankAiAnalysis } from "../lib/analysis/bank-ai-analysis-service";
import { buildDivLabResearchPacket } from "../lib/analysis/deep-research";
import { createDivLabFinancialSpecialistAnalysis } from "../lib/analysis/financial-specialist-ai-analysis-service";
import { extractGlobalSecEvidence } from "../lib/analysis/global-evidence-extraction";
import { discoverGlobalPrimarySources } from "../lib/analysis/global-primary-sources";
import { resolveGlobalEquityAnalysisTarget } from "../lib/analysis/instrument-search";
import { loadDivLabResearchInputs } from "../lib/analysis/research-loader";
import {
  buildUsResearchCoverageFactsPacket,
  evaluateUsResearchCoverage,
} from "../lib/analysis/us-research-coverage";

type ExpectedFamily =
  | "operating_company"
  | "bank"
  | "insurance"
  | "real_estate"
  | "financial_other"
  | "investment_company"
  | "asset_manager"
  | "fund_or_etf"
  | "foreign_private_issuer_boundary";

type Target = {
  id: string;
  market: "nordic" | "us";
  symbol: string;
  exchange: string;
  name: string;
  yahooSymbol: string;
  expectedFamily: ExpectedFamily;
  fullExecution?: "operating" | "bank" | "specialist" | "us_operating";
};

type Finding = {
  target: string;
  severity: "P0" | "P1" | "P2" | "P3" | "INFO";
  code: string;
  detail: string;
};

const TARGETS: readonly Target[] = [
  // Nordic operating-company diversity across markets/currencies/sectors.
  { id: "se-industrial", market: "nordic", symbol: "VOLV-B", exchange: "ST", name: "Volvo AB", yahooSymbol: "VOLV-B.ST", expectedFamily: "operating_company", fullExecution: "operating" },
  { id: "se-telecom-tech", market: "nordic", symbol: "ERIC-B", exchange: "ST", name: "Telefonaktiebolaget LM Ericsson", yahooSymbol: "ERIC-B.ST", expectedFamily: "operating_company" },
  { id: "dk-healthcare", market: "nordic", symbol: "NOVO-B", exchange: "CO", name: "Novo Nordisk A/S", yahooSymbol: "NOVO-B.CO", expectedFamily: "operating_company" },
  { id: "dk-shipping", market: "nordic", symbol: "MAERSK-B", exchange: "CO", name: "A.P. Møller - Mærsk A/S", yahooSymbol: "MAERSK-B.CO", expectedFamily: "operating_company" },
  { id: "no-energy", market: "nordic", symbol: "EQNR", exchange: "OL", name: "Equinor ASA", yahooSymbol: "EQNR.OL", expectedFamily: "operating_company" },
  { id: "fi-tech", market: "nordic", symbol: "NOKIA", exchange: "HE", name: "Nokia Oyj", yahooSymbol: "NOKIA.HE", expectedFamily: "operating_company" },

  // Banks: registry-backed Sweden plus provider-classified Norway/Denmark.
  { id: "se-bank", market: "nordic", symbol: "SEB-A", exchange: "ST", name: "Skandinaviska Enskilda Banken AB", yahooSymbol: "SEB-A.ST", expectedFamily: "bank", fullExecution: "bank" },
  { id: "no-bank", market: "nordic", symbol: "DNB", exchange: "OL", name: "DNB Bank ASA", yahooSymbol: "DNB.OL", expectedFamily: "bank" },
  { id: "dk-bank", market: "nordic", symbol: "DANSKE", exchange: "CO", name: "Danske Bank A/S", yahooSymbol: "DANSKE.CO", expectedFamily: "bank" },

  // Financial specialists currently supported through exact verified registry entries.
  { id: "se-investment-company", market: "nordic", symbol: "INVE-B", exchange: "ST", name: "Investor AB", yahooSymbol: "INVE-B.ST", expectedFamily: "investment_company", fullExecution: "specialist" },
  { id: "se-investment-company-2", market: "nordic", symbol: "INDU-C", exchange: "ST", name: "Industrivärden AB", yahooSymbol: "INDU-C.ST", expectedFamily: "investment_company" },
  { id: "se-asset-manager", market: "nordic", symbol: "EQT", exchange: "ST", name: "EQT AB", yahooSymbol: "EQT.ST", expectedFamily: "asset_manager", fullExecution: "specialist" },

  // Explicit unsupported methodology families: must fail closed, not fall through.
  { id: "fi-insurance", market: "nordic", symbol: "SAMPO", exchange: "HE", name: "Sampo Oyj", yahooSymbol: "SAMPO.HE", expectedFamily: "insurance" },
  { id: "dk-insurance", market: "nordic", symbol: "TRYG", exchange: "CO", name: "Tryg A/S", yahooSymbol: "TRYG.CO", expectedFamily: "insurance" },
  { id: "se-real-estate", market: "nordic", symbol: "CAST", exchange: "ST", name: "Castellum AB", yahooSymbol: "CAST.ST", expectedFamily: "real_estate" },
  { id: "se-real-estate-2", market: "nordic", symbol: "BALD-B", exchange: "ST", name: "Fastighets AB Balder", yahooSymbol: "BALD-B.ST", expectedFamily: "real_estate" },
  { id: "se-financial-other", market: "nordic", symbol: "AVANZ", exchange: "ST", name: "Avanza Bank Holding AB", yahooSymbol: "AVANZ.ST", expectedFamily: "financial_other" },
  { id: "se-etf", market: "nordic", symbol: "XACT-OMXS30", exchange: "ST", name: "XACT OMXS30", yahooSymbol: "XACT-OMXS30.ST", expectedFamily: "fund_or_etf" },

  // US operating-company breadth plus specialist/fail-closed boundaries.
  { id: "us-tech", market: "us", symbol: "MSFT", exchange: "US", name: "Microsoft Corporation", yahooSymbol: "MSFT", expectedFamily: "operating_company", fullExecution: "us_operating" },
  { id: "us-energy", market: "us", symbol: "XOM", exchange: "US", name: "Exxon Mobil Corporation", yahooSymbol: "XOM", expectedFamily: "operating_company" },
  { id: "us-healthcare", market: "us", symbol: "JNJ", exchange: "US", name: "Johnson & Johnson", yahooSymbol: "JNJ", expectedFamily: "operating_company" },
  { id: "us-bank", market: "us", symbol: "JPM", exchange: "US", name: "JPMorgan Chase & Co.", yahooSymbol: "JPM", expectedFamily: "bank" },
  { id: "us-insurance", market: "us", symbol: "BRK-B", exchange: "US", name: "Berkshire Hathaway Inc.", yahooSymbol: "BRK-B", expectedFamily: "insurance" },
  { id: "us-real-estate", market: "us", symbol: "PLD", exchange: "US", name: "Prologis, Inc.", yahooSymbol: "PLD", expectedFamily: "real_estate" },
  { id: "us-asset-manager-classification-boundary", market: "us", symbol: "BLK", exchange: "US", name: "BlackRock, Inc.", yahooSymbol: "BLK", expectedFamily: "financial_other" },
  { id: "us-etf-boundary", market: "us", symbol: "SPY", exchange: "US", name: "SPDR S&P 500 ETF Trust", yahooSymbol: "SPY", expectedFamily: "fund_or_etf" },
  { id: "us-foreign-private-issuer", market: "us", symbol: "NVO", exchange: "US", name: "Novo Nordisk A/S", yahooSymbol: "NVO", expectedFamily: "foreign_private_issuer_boundary" },
] as const;

const findings: Finding[] = [];

function emit(stage: string, payload: Record<string, unknown>) {
  console.log(`ANALYSIS_MONSTER_PASS ${stage} ${JSON.stringify(payload)}`);
}

function addFinding(finding: Finding) {
  findings.push(finding);
  emit("finding", finding);
}

function failedCheckNames(checks: Record<string, boolean>): string[] {
  return Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
}

function safeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}:${error.message}`.slice(0, 220);
  return "unknown_error";
}

function familyMatches(target: Target, detected: string): boolean {
  if (target.expectedFamily === "foreign_private_issuer_boundary") return true;
  return detected === target.expectedFamily;
}

async function inspectNordic(target: Target) {
  try {
    const loaded = await loadDivLabResearchInputs({
      symbol: target.symbol,
      exchange: target.exchange,
      name: target.name,
    });
    if (!loaded.ok) {
      emit("target", {
        target: target.id,
        yahooSymbol: target.yahooSymbol,
        market: target.market,
        expectedFamily: target.expectedFamily,
        status: "research_load_failed",
        reason: loaded.reason,
      });
      const severity = target.expectedFamily === "fund_or_etf" ? "INFO" : "P1";
      addFinding({ target: target.id, severity, code: `research_load_${loaded.reason}`, detail: `${target.yahooSymbol}: ${loaded.reason}` });
      return;
    }

    const research = loaded.value;
    const packet = buildDivLabResearchPacket({
      symbol: research.instrument.symbol,
      exchange: research.instrument.exchange,
      name: research.instrument.name,
      currency: research.instrument.currency,
      currentPrice: research.instrument.currentPrice,
      history: research.history,
      fundamentals: research.fundamentals,
      companyClassification: research.companyClassification,
      fxConversion: research.fxConversion,
      valuationScenarios: [],
      sources: research.sources,
      evidence: research.evidence,
    });
    const detected = packet.companyClassification.type;
    const engine = analysisEngineForCompanyType(detected);
    const expectedUnsupported = ["insurance", "real_estate", "financial_other", "fund_or_etf"].includes(target.expectedFamily);

    emit("target", {
      target: target.id,
      yahooSymbol: target.yahooSymbol,
      market: target.market,
      expectedFamily: target.expectedFamily,
      detectedFamily: detected,
      classificationConfidence: packet.companyClassification.confidence,
      classificationBasis: packet.companyClassification.basis,
      engine,
      methodologyStatus: packet.fundamental.methodology.status,
      marketCurrency: packet.currencyContext.marketCurrency,
      reportingCurrency: packet.currencyContext.reportingCurrency,
      historySessions: research.history.length,
      historicalPeriods: research.fundamentals.historicalPeriods?.length ?? 0,
      sourceCount: packet.sources.length,
      primarySourceCount: packet.sources.filter((source) => source.primary).length,
      evidenceCount: packet.evidence.length,
      factsQuality: packet.qualityGate.score,
      factsFailedChecks: failedCheckNames(packet.qualityGate.checks),
    });

    if (!familyMatches(target, detected)) {
      addFinding({
        target: target.id,
        severity: expectedUnsupported ? "P2" : "P1",
        code: "classification_mismatch",
        detail: `expected=${target.expectedFamily} detected=${detected}`,
      });
    }
    if (expectedUnsupported && engine !== null) {
      addFinding({
        target: target.id,
        severity: "P0",
        code: "unsupported_family_routed_to_engine",
        detail: `${detected} unexpectedly routed to ${engine}`,
      });
    }
    if (!expectedUnsupported && target.expectedFamily !== "foreign_private_issuer_boundary" && !engine) {
      addFinding({
        target: target.id,
        severity: "P1",
        code: "supported_family_missing_engine",
        detail: `${detected} has no engine`,
      });
    }
  } catch (error) {
    addFinding({ target: target.id, severity: "P1", code: "nordic_probe_exception", detail: safeError(error) });
  }
}

async function inspectUs(target: Target) {
  try {
    const resolved = await resolveGlobalEquityAnalysisTarget({ yahooSymbol: target.yahooSymbol });
    if (!resolved) {
      emit("target", {
        target: target.id,
        yahooSymbol: target.yahooSymbol,
        market: target.market,
        expectedFamily: target.expectedFamily,
        status: "global_target_unresolved",
      });
      const severity = target.expectedFamily === "fund_or_etf" ? "INFO" : "P2";
      addFinding({ target: target.id, severity, code: "global_target_unresolved", detail: target.yahooSymbol });
      return;
    }

    const discovery = await discoverGlobalPrimarySources({
      yahooSymbol: resolved.yahooSymbol,
      symbol: resolved.symbol,
      exchange: resolved.exchange,
      companyName: resolved.name,
    });

    const loaded = await loadDivLabResearchInputs({
      symbol: resolved.symbol,
      exchange: resolved.exchange,
      name: resolved.name,
    });

    if (!loaded.ok) {
      emit("target", {
        target: target.id,
        yahooSymbol: target.yahooSymbol,
        market: target.market,
        expectedFamily: target.expectedFamily,
        resolved: true,
        discoveryReady: discovery.readyForEvidenceExtraction,
        discoveryStatus: discovery.status,
        status: "research_load_failed",
        reason: loaded.reason,
      });
      addFinding({ target: target.id, severity: target.expectedFamily === "fund_or_etf" ? "INFO" : "P2", code: `us_research_load_${loaded.reason}`, detail: target.yahooSymbol });
      return;
    }

    const detected = loaded.value.companyClassification.type;
    const engine = analysisEngineForCompanyType(detected);
    let evidenceScore: number | null = null;
    let coverageScore: number | null = null;
    let coverageReady: boolean | null = null;
    let coverageFailedChecks: string[] = [];
    let evidenceCount = 0;
    let primarySourceCount = 0;

    if (discovery.readyForEvidenceExtraction) {
      const extraction = await extractGlobalSecEvidence({
        companyName: discovery.companyName,
        sources: discovery.sources,
      });
      evidenceScore = extraction.bundle.qualityGate.score;
      evidenceCount = extraction.bundle.evidence.length;
      primarySourceCount = extraction.bundle.analysisSources.filter((source) => source.primary).length;
      const packet = buildUsResearchCoverageFactsPacket({
        research: loaded.value,
        evidenceBundle: extraction.bundle,
      });
      const coverage = evaluateUsResearchCoverage({
        packet,
        evidenceQualityGate: extraction.bundle.qualityGate,
      });
      coverageScore = coverage.score;
      coverageReady = coverage.ready;
      coverageFailedChecks = failedCheckNames(coverage.checks);
    }

    emit("target", {
      target: target.id,
      yahooSymbol: target.yahooSymbol,
      market: target.market,
      expectedFamily: target.expectedFamily,
      detectedFamily: detected,
      classificationConfidence: loaded.value.companyClassification.confidence,
      classificationBasis: loaded.value.companyClassification.basis,
      engine,
      marketCurrency: loaded.value.instrument.currency,
      historySessions: loaded.value.history.length,
      historicalPeriods: loaded.value.fundamentals.historicalPeriods?.length ?? 0,
      discoveryReady: discovery.readyForEvidenceExtraction,
      discoveryStatus: discovery.status,
      discoveredForms: discovery.sources.filter((source) => source.primary).map((source) => source.form),
      evidenceScore,
      primarySourceCount,
      evidenceCount,
      usCoverageReady: coverageReady,
      usCoverageScore: coverageScore,
      usCoverageFailedChecks: coverageFailedChecks,
    });

    if (!familyMatches(target, detected)) {
      addFinding({
        target: target.id,
        severity: "P2",
        code: "us_classification_mismatch",
        detail: `expected=${target.expectedFamily} detected=${detected}`,
      });
    }

    if (target.expectedFamily === "operating_company") {
      if (!discovery.readyForEvidenceExtraction) {
        addFinding({ target: target.id, severity: "P1", code: "us_operating_source_discovery_blocked", detail: discovery.status });
      } else if (evidenceScore !== 100) {
        addFinding({ target: target.id, severity: "P1", code: "us_operating_evidence_not_100", detail: `score=${evidenceScore}` });
      } else if (coverageReady !== true || coverageScore !== 100) {
        addFinding({ target: target.id, severity: "P1", code: "us_operating_coverage_not_100", detail: `score=${coverageScore} failed=${coverageFailedChecks.join(",")}` });
      }
    } else if (target.expectedFamily === "foreign_private_issuer_boundary") {
      if (discovery.readyForEvidenceExtraction) {
        addFinding({ target: target.id, severity: "P2", code: "foreign_issuer_unexpected_sec_readiness", detail: `forms=${discovery.sources.map((source) => source.form).join(",")}` });
      } else {
        addFinding({ target: target.id, severity: "INFO", code: "foreign_issuer_failed_closed", detail: discovery.status });
      }
    } else if (coverageReady === true) {
      addFinding({ target: target.id, severity: "P0", code: "us_specialist_bypassed_operating_gate", detail: `${detected} reached US operating coverage ready` });
    }
  } catch (error) {
    addFinding({ target: target.id, severity: "P2", code: "us_probe_exception", detail: safeError(error) });
  }
}

async function runFullNordicExecution(target: Target) {
  try {
    if (target.fullExecution === "operating") {
      const result = await createDivLabAiAnalysis({
        symbol: target.symbol,
        exchange: target.exchange,
        name: target.name,
      });
      emit("execution", result.ok ? {
        target: target.id,
        engine: "operating_company",
        ok: true,
        researchQuality: result.finalPacket.qualityGate.score,
        researchPublishable: result.finalPacket.qualityGate.publishable,
        analystQuality: result.analystQualityGate.score,
        analystPublishable: result.analystQualityGate.publishable,
        persistenceNull: result.persistence === null,
        model: result.model,
        estimatedCostUsdMicros: result.usage.estimatedCostUsdMicros,
      } : {
        target: target.id,
        engine: "operating_company",
        ok: false,
        stage: result.stage,
        reason: result.reason,
      });
      if (!result.ok) addFinding({ target: target.id, severity: result.stage === "analyst" ? "P3" : "P1", code: `execution_${result.stage}`, detail: result.reason });
      else if (!result.finalPacket.qualityGate.publishable || !result.analystQualityGate.publishable || result.persistence !== null) {
        addFinding({ target: target.id, severity: "P0", code: "operating_execution_contract_failed", detail: `research=${result.finalPacket.qualityGate.score} analyst=${result.analystQualityGate.score} persistence=${result.persistence !== null}` });
      }
      return;
    }

    if (target.fullExecution === "bank") {
      const result = await createDivLabBankAiAnalysis({
        symbol: target.symbol,
        exchange: target.exchange,
        name: target.name,
        persist: false,
      });
      emit("execution", result.ok ? {
        target: target.id,
        engine: "bank",
        ok: true,
        researchQuality: result.packet.qualityGate.score,
        researchPublishable: result.packet.qualityGate.publishable,
        analystQuality: result.analystQualityGate.score,
        analystPublishable: result.analystQualityGate.publishable,
        persistenceNull: result.persisted === null,
        model: result.analystModel,
        estimatedCostUsdMicros: result.usage.estimatedCostUsdMicros,
      } : {
        target: target.id,
        engine: "bank",
        ok: false,
        stage: result.stage,
        reason: result.reason,
      });
      if (!result.ok) addFinding({ target: target.id, severity: result.stage === "gateway_auth_missing" ? "P3" : "P1", code: `execution_${result.stage}`, detail: result.reason });
      else if (!result.packet.qualityGate.publishable || !result.analystQualityGate.publishable || result.persisted !== null) {
        addFinding({ target: target.id, severity: "P0", code: "bank_execution_contract_failed", detail: `research=${result.packet.qualityGate.score} analyst=${result.analystQualityGate.score} persistence=${result.persisted !== null}` });
      }
      return;
    }

    if (target.fullExecution === "specialist") {
      const result = await createDivLabFinancialSpecialistAnalysis({
        symbol: target.symbol,
        exchange: target.exchange,
        name: target.name,
        persist: false,
      });
      emit("execution", result.ok ? {
        target: target.id,
        engine: "financial_specialist",
        ok: true,
        detectedFamily: result.basePacket.companyClassification.type,
        researchQuality: result.packet.qualityGate.score,
        researchPublishable: result.packet.qualityGate.publishable,
        analystQuality: result.analystQualityGate.score,
        analystPublishable: result.analystQualityGate.publishable,
        persistenceNull: result.persisted === null,
        model: result.analystModel,
        estimatedCostUsdMicros: result.usage.estimatedCostUsdMicros,
      } : {
        target: target.id,
        engine: "financial_specialist",
        ok: false,
        stage: result.stage,
        reason: result.reason,
      });
      if (!result.ok) addFinding({ target: target.id, severity: result.stage === "gateway_auth_missing" ? "P3" : "P1", code: `execution_${result.stage}`, detail: result.reason });
      else if (!result.packet.qualityGate.publishable || !result.analystQualityGate.publishable || result.persisted !== null) {
        addFinding({ target: target.id, severity: "P0", code: "specialist_execution_contract_failed", detail: `research=${result.packet.qualityGate.score} analyst=${result.analystQualityGate.score} persistence=${result.persisted !== null}` });
      }
    }
  } catch (error) {
    addFinding({ target: target.id, severity: "P1", code: "full_execution_exception", detail: safeError(error) });
  }
}

async function runFullUsExecution(target: Target) {
  try {
    const resolved = await resolveGlobalEquityAnalysisTarget({ yahooSymbol: target.yahooSymbol });
    if (!resolved) {
      addFinding({ target: target.id, severity: "P1", code: "us_execution_unresolved", detail: target.yahooSymbol });
      return;
    }
    const discovery = await discoverGlobalPrimarySources({
      yahooSymbol: resolved.yahooSymbol,
      symbol: resolved.symbol,
      exchange: resolved.exchange,
      companyName: resolved.name,
    });
    if (!discovery.readyForEvidenceExtraction) {
      addFinding({ target: target.id, severity: "P1", code: "us_execution_discovery_blocked", detail: discovery.status });
      return;
    }
    const extraction = await extractGlobalSecEvidence({ companyName: discovery.companyName, sources: discovery.sources });
    if (!extraction.bundle.qualityGate.ready || extraction.bundle.qualityGate.score !== 100) {
      addFinding({ target: target.id, severity: "P1", code: "us_execution_evidence_blocked", detail: `score=${extraction.bundle.qualityGate.score}` });
      return;
    }
    const loaded = await loadDivLabResearchInputs({ symbol: resolved.symbol, exchange: resolved.exchange, name: resolved.name });
    if (!loaded.ok) {
      addFinding({ target: target.id, severity: "P1", code: "us_execution_research_load_failed", detail: loaded.reason });
      return;
    }
    const coveragePacket = buildUsResearchCoverageFactsPacket({ research: loaded.value, evidenceBundle: extraction.bundle });
    const coverage = evaluateUsResearchCoverage({ packet: coveragePacket, evidenceQualityGate: extraction.bundle.qualityGate });
    if (!coverage.ready || coverage.score !== 100) {
      addFinding({ target: target.id, severity: "P1", code: "us_execution_coverage_blocked", detail: `score=${coverage.score}` });
      return;
    }
    const result = await createDivLabAiAnalysisFromResearchInputs({
      research: loaded.value,
      additionalSources: extraction.bundle.analysisSources,
      additionalEvidence: extraction.bundle.evidence,
    });
    emit("execution", result.ok ? {
      target: target.id,
      engine: "us_operating_company",
      ok: true,
      usCoverageQuality: coverage.score,
      researchQuality: result.finalPacket.qualityGate.score,
      researchPublishable: result.finalPacket.qualityGate.publishable,
      analystQuality: result.analystQualityGate.score,
      analystPublishable: result.analystQualityGate.publishable,
      persistenceNull: result.persistence === null,
      secSourcesPreserved: extraction.bundle.analysisSources.every((source) => result.finalPacket.sources.some((candidate) => candidate.id === source.id)),
      secEvidencePreserved: extraction.bundle.evidence.every((item) => result.finalPacket.evidence.some((candidate) => candidate.id === item.id)),
      model: result.model,
      estimatedCostUsdMicros: result.usage.estimatedCostUsdMicros,
    } : {
      target: target.id,
      engine: "us_operating_company",
      ok: false,
      stage: result.stage,
      reason: result.reason,
    });
    if (!result.ok) addFinding({ target: target.id, severity: result.stage === "analyst" ? "P3" : "P1", code: `execution_${result.stage}`, detail: result.reason });
    else {
      const secSourcesPreserved = extraction.bundle.analysisSources.every((source) => result.finalPacket.sources.some((candidate) => candidate.id === source.id));
      const secEvidencePreserved = extraction.bundle.evidence.every((item) => result.finalPacket.evidence.some((candidate) => candidate.id === item.id));
      if (!result.finalPacket.qualityGate.publishable || !result.analystQualityGate.publishable || result.persistence !== null || !secSourcesPreserved || !secEvidencePreserved) {
        addFinding({ target: target.id, severity: "P0", code: "us_execution_contract_failed", detail: `research=${result.finalPacket.qualityGate.score} analyst=${result.analystQualityGate.score} persistence=${result.persistence !== null} sourceProv=${secSourcesPreserved} evidenceProv=${secEvidencePreserved}` });
      }
    }
  } catch (error) {
    addFinding({ target: target.id, severity: "P1", code: "us_full_execution_exception", detail: safeError(error) });
  }
}

async function main() {
  emit("start", {
    targetCount: TARGETS.length,
    nordicCount: TARGETS.filter((target) => target.market === "nordic").length,
    usCount: TARGETS.filter((target) => target.market === "us").length,
    fullExecutionTargets: TARGETS.filter((target) => target.fullExecution).map((target) => target.id),
    rule: "observe_first_patch_second",
  });

  for (const target of TARGETS.filter((candidate) => candidate.market === "nordic")) {
    await inspectNordic(target);
  }
  for (const target of TARGETS.filter((candidate) => candidate.market === "us")) {
    await inspectUs(target);
  }

  for (const target of TARGETS.filter((candidate) => candidate.fullExecution && candidate.market === "nordic")) {
    await runFullNordicExecution(target);
  }
  const usExecution = TARGETS.find((target) => target.fullExecution === "us_operating");
  if (usExecution) await runFullUsExecution(usExecution);

  const severities = findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
    return acc;
  }, {});
  emit("summary", {
    targetCount: TARGETS.length,
    findingCount: findings.length,
    severities,
    findings,
  });
}

main().catch((error) => {
  addFinding({ target: "monster-pass", severity: "P1", code: "fatal_probe_exception", detail: safeError(error) });
  emit("summary", { targetCount: TARGETS.length, findingCount: findings.length, findings });
});
