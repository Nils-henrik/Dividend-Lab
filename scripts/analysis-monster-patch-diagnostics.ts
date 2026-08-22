import { buildBankResearch } from "../lib/analysis/bank-research";
import { buildDivLabResearchPacket } from "../lib/analysis/deep-research";
import { buildFinancialSpecialistResearch } from "../lib/analysis/financial-specialist-research";
import { discoverGlobalPrimarySources } from "../lib/analysis/global-primary-sources";
import { searchAnalysisInstruments } from "../lib/analysis/instrument-search";
import { loadDivLabResearchInputs } from "../lib/analysis/research-loader";

function emit(stage: string, value: Record<string, unknown>) {
  console.log(`ANALYSIS_PATCH_DIAGNOSTIC ${stage} ${JSON.stringify(value)}`);
}

async function packetFor(symbol: string, exchange: string, name: string) {
  const loaded = await loadDivLabResearchInputs({ symbol, exchange, name });
  if (!loaded.ok) {
    emit("load-failed", { symbol, exchange, reason: loaded.reason });
    return null;
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
  emit("evidence", {
    symbol: `${symbol}.${exchange}`,
    evidence: packet.evidence.map((item) => ({
      sourceId: item.sourceId,
      title: item.title,
      kind: item.kind,
      primary: item.primary,
      documentRetrieved: item.documentRetrieved,
      documentType: item.documentType,
      reportPeriod: item.reportPeriod,
      reportYear: item.reportYear,
      documentExcerptLength: item.documentExcerpt?.length ?? 0,
    })),
  });
  return packet;
}

async function bankDiagnostic() {
  const packet = await packetFor("SEB-A", "ST", "Skandinaviska Enskilda Banken AB");
  if (!packet) return;
  const research = buildBankResearch({
    evidence: packet.evidence,
    fundamentals: packet.fundamentalSnapshot,
    currentPrice: packet.instrument.currentPrice,
    marketCurrency: packet.currencyContext.marketCurrency,
    reportingCurrency: packet.currencyContext.reportingCurrency,
    fxConversion: packet.fxConversion,
    sources: packet.sources,
  });
  emit("bank-seb", {
    status: research.status,
    blockers: research.blockers,
    warnings: research.warnings,
    reportStatus: research.reportMetrics.status,
    reportMetrics: Object.fromEntries(Object.entries(research.reportMetrics.metrics).map(([key, metric]) => [key, {
      status: metric.status,
      valuePct: metric.valuePct,
      context: metric.context,
      sourceId: metric.sourceId,
    }])),
    capitalStatus: research.capital.status,
    regulatoryRequirement: research.capital.regulatoryCet1Requirement,
    reportedBuffer: research.capital.reportedCapitalBuffer,
    fundingStatus: research.funding.status,
    fundingMetrics: Object.fromEntries(Object.entries(research.funding.metrics).map(([key, metric]) => [key, {
      status: metric.status,
      valuePct: metric.valuePct,
      context: metric.context,
      sourceId: metric.sourceId,
    }])),
    valuationStatus: research.valuation.status,
    valuationPriceToBook: research.valuation.priceToBook,
    valuationProvenance: research.valuation.provenance,
  });
}

async function specialistDiagnostic(symbol: string, name: string) {
  const packet = await packetFor(symbol, "ST", name);
  if (!packet) return;
  const research = buildFinancialSpecialistResearch({ basePacket: packet });
  emit(`specialist-${symbol}`, {
    type: research.specialistType,
    status: research.status,
    blockers: research.blockers,
    warnings: research.warnings,
    metrics: research.metrics,
    trailingPe: packet.valuation.trailing.pe,
    price: packet.instrument.currentPrice,
  });
}

async function xomRawSecDiagnostic() {
  try {
    const response = await fetch("https://data.sec.gov/submissions/CIK0000034088.json", {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "User-Agent": "DivLab kontakt@divlab.se",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      emit("xom-sec-raw", { ok: false, status: response.status });
      return;
    }
    const body = await response.json() as {
      filings?: {
        recent?: {
          form?: unknown;
          accessionNumber?: unknown;
          filingDate?: unknown;
          primaryDocument?: unknown;
        };
      };
    };
    const recent = body.filings?.recent;
    const forms = Array.isArray(recent?.form) ? recent.form : [];
    const accessions = Array.isArray(recent?.accessionNumber) ? recent.accessionNumber : [];
    const dates = Array.isArray(recent?.filingDate) ? recent.filingDate : [];
    const documents = Array.isArray(recent?.primaryDocument) ? recent.primaryDocument : [];
    const rows: Array<Record<string, unknown>> = [];
    const length = Math.min(forms.length, accessions.length, dates.length, documents.length);
    for (let index = 0; index < length; index += 1) {
      const form = typeof forms[index] === "string" ? forms[index] : "";
      if (!["10-K", "10-K/A", "10-Q", "10-Q/A"].includes(form.trim().toUpperCase())) continue;
      rows.push({
        index,
        form,
        accessionNumber: accessions[index],
        filingDate: dates[index],
        primaryDocument: documents[index],
      });
      if (rows.length >= 8) break;
    }
    emit("xom-sec-raw", { ok: true, rows });
  } catch (error) {
    emit("xom-sec-raw", { ok: false, error: error instanceof Error ? error.message.slice(0, 120) : "unknown" });
  }
}

async function xomDiagnostic() {
  const discovery = await discoverGlobalPrimarySources({
    yahooSymbol: "XOM",
    symbol: "XOM",
    exchange: "US",
    companyName: "Exxon Mobil Corporation",
  });
  emit("xom-discovery", {
    status: discovery.status,
    ready: discovery.readyForEvidenceExtraction,
    annualPrimaryCount: discovery.annualPrimaryCount,
    interimPrimaryCount: discovery.interimPrimaryCount,
    sources: discovery.sources.map((source) => ({
      kind: source.kind,
      form: source.form,
      primary: source.primary,
      publishedAt: source.publishedAt,
      url: source.url,
    })),
  });
}

async function avanzaDiagnostic() {
  const matches = await searchAnalysisInstruments({ query: "Avanza", limit: 12 });
  emit("avanza-search", {
    matches: matches.map((item) => ({
      yahooSymbol: item.yahooSymbol,
      symbol: item.symbol,
      exchange: item.exchange,
      name: item.name,
      kind: item.kind,
      currency: item.currency,
      canPreflight: item.canPreflight,
      canRunAnalysis: item.canRunAnalysis,
    })),
  });
}

await bankDiagnostic();
await specialistDiagnostic("INVE-B", "Investor AB");
await specialistDiagnostic("EQT", "EQT AB");
await xomRawSecDiagnostic();
await xomDiagnostic();
await avanzaDiagnostic();
