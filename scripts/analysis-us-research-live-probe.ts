import { extractGlobalSecEvidence } from "../lib/analysis/global-evidence-extraction";
import { discoverGlobalPrimarySources } from "../lib/analysis/global-primary-sources";
import { resolveGlobalEquityAnalysisTarget } from "../lib/analysis/instrument-search";
import { loadDivLabResearchInputs } from "../lib/analysis/research-loader";
import {
  buildUsResearchCoverageFactsPacket,
  evaluateUsResearchCoverage,
} from "../lib/analysis/us-research-coverage";

function emit(stage: string, payload: Record<string, unknown>) {
  console.log(`US_RESEARCH_LIVE_PROBE ${stage} ${JSON.stringify(payload)}`);
}

async function main() {
  const resolved = await resolveGlobalEquityAnalysisTarget({ yahooSymbol: "MSFT" });
  if (!resolved) {
    emit("target", { ok: false, reason: "unresolved" });
    return;
  }

  emit("target", {
    ok: true,
    symbol: resolved.symbol,
    exchange: resolved.exchange,
    yahooSymbol: resolved.yahooSymbol,
  });

  const discovery = await discoverGlobalPrimarySources({
    yahooSymbol: resolved.yahooSymbol,
    symbol: resolved.symbol,
    exchange: resolved.exchange,
    companyName: resolved.name,
  });
  emit("discovery", {
    ready: discovery.readyForEvidenceExtraction,
    status: discovery.status,
    primarySourceCount: discovery.primarySourceCount,
    annualPrimaryCount: discovery.annualPrimaryCount,
    interimPrimaryCount: discovery.interimPrimaryCount,
    forms: discovery.sources.filter((source) => source.primary).map((source) => source.form),
  });
  if (!discovery.readyForEvidenceExtraction) return;

  const extraction = await extractGlobalSecEvidence({
    companyName: discovery.companyName,
    sources: discovery.sources,
  });
  emit("evidence", {
    ready: extraction.bundle.qualityGate.ready,
    score: extraction.bundle.qualityGate.score,
    blockers: extraction.bundle.qualityGate.blockers,
    failures: extraction.failures,
    documents: extraction.bundle.documents.map((document) => ({
      sourceId: document.sourceId,
      bytes: document.bytes,
      truncated: document.truncated,
      contentType: document.contentType,
    })),
  });
  if (!extraction.bundle.qualityGate.ready) return;

  const loaded = await loadDivLabResearchInputs({
    symbol: resolved.symbol,
    exchange: resolved.exchange,
    name: resolved.name,
  });
  if (!loaded.ok) {
    emit("research-loader", { ok: false, reason: loaded.reason });
    return;
  }

  emit("research-loader", {
    ok: true,
    currency: loaded.value.instrument.currency,
    historySessions: loaded.value.history.length,
    companyType: loaded.value.companyClassification.type,
    sourceCount: loaded.value.sources.length,
    evidenceCount: loaded.value.evidence.length,
    historicalPeriods: loaded.value.fundamentals.historicalPeriods?.length ?? 0,
  });

  const packet = buildUsResearchCoverageFactsPacket({
    research: loaded.value,
    evidenceBundle: extraction.bundle,
  });
  const coverage = evaluateUsResearchCoverage({
    packet,
    evidenceQualityGate: extraction.bundle.qualityGate,
  });

  emit("coverage", {
    ready: coverage.ready,
    score: coverage.score,
    blockers: coverage.blockers,
    checks: coverage.checks,
    factsResearchQuality: coverage.factsResearchQuality,
    marketCurrency: packet.currencyContext.marketCurrency,
    reportingCurrency: packet.currencyContext.reportingCurrency,
    epsTtmCurrency: packet.currencyContext.epsTtmCurrency,
    historicalPeriodsAnalyzed: packet.fundamental.trends.periodsAnalyzed,
    yearsCovered: packet.fundamental.trends.yearsCovered,
    technicalSessions: packet.technical.snapshot.sessions,
    sourceCount: packet.sources.length,
    primarySourceCount: packet.sources.filter((source) => source.primary).length,
    evidenceCount: packet.evidence.length,
    companyType: packet.companyClassification.type,
    methodologyStatus: packet.fundamental.methodology.status,
  });
}

main().catch((error) => {
  emit("fatal", { errorName: error instanceof Error ? error.name : "unknown" });
  process.exitCode = 1;
});
