import { analyzeFundamentals } from "../lib/analysis/fundamental-analysis";
import type { CurrencyAwareFundamentalSnapshot } from "../lib/analysis/financial-statement-normalizer";
import { fetchNordicDivLabAnalysisSources } from "../lib/analysis/nordic-primary-sources";
import { loadDivLabResearchInputs } from "../lib/analysis/research-loader";
import { analyzeSupportResistance } from "../lib/analysis/support-resistance";
import { fetchNordicPrimarySourceEvents } from "../lib/model-portfolios/engine/nordic-primary-sources";
import { fetchOfficialHttpsDocument } from "../lib/model-portfolios/engine/official-document";
import { PRIMARY_SOURCE_ENRICHMENT_BOUNDS } from "../lib/model-portfolios/engine/primary-source-enrichment";
import { parseReportMetadata } from "../lib/model-portfolios/engine/report-metadata";

const CASES = [
  { profile: "quality-large-cap", symbol: "ATCO-A", exchange: "ST", name: "Atlas Copco AB" },
  { profile: "high-margin-growth", symbol: "EVO", exchange: "ST", name: "Evolution AB" },
  { profile: "volatile-turnaround-event", symbol: "EMBRAC-B", exchange: "ST", name: "Embracer Group AB" },
] as const;

function summarizeDiscovery(hit: Awaited<ReturnType<typeof fetchNordicPrimarySourceEvents>>[number]) {
  const firstAttachment = hit.attachments[0] ?? null;
  const metadata = parseReportMetadata({
    title: hit.title,
    category: hit.category,
    fileName: firstAttachment?.fileName ?? null,
  });
  return {
    title: hit.title,
    category: hit.category,
    publishedAt: hit.publishedAt,
    reportMetadata: metadata,
    attachments: hit.attachments.map((attachment) => ({
      mimeType: attachment.mimeType,
      fileName: attachment.fileName,
      url: attachment.url,
    })),
  };
}

async function diagnoseFirstReportDocument(
  hits: Awaited<ReturnType<typeof fetchNordicPrimarySourceEvents>>,
) {
  const candidate = hits.find((hit) => {
    const attachment = hit.attachments.find((item) => {
      const mime = item.mimeType?.toLowerCase() ?? "";
      return mime.includes("pdf") || (item.fileName ?? "").toLowerCase().endsWith(".pdf");
    });
    if (!attachment) return false;
    const metadata = parseReportMetadata({
      title: hit.title,
      category: hit.category,
      fileName: attachment.fileName,
    });
    return metadata.looksLikeReportDocument;
  });
  if (!candidate) return null;

  const attachment = candidate.attachments.find((item) => {
    const mime = item.mimeType?.toLowerCase() ?? "";
    return mime.includes("pdf") || (item.fileName ?? "").toLowerCase().endsWith(".pdf");
  });
  if (!attachment) return null;

  let head: Record<string, unknown> | null = null;
  try {
    const response = await fetch(attachment.url, {
      method: "HEAD",
      redirect: "manual",
      headers: { "User-Agent": "DivLab/1.0 analysis-smoke" },
    });
    head = {
      status: response.status,
      contentLength: response.headers.get("content-length"),
      contentType: response.headers.get("content-type"),
      location: response.headers.get("location"),
    };
  } catch (error) {
    head = { error: error instanceof Error ? error.message : "head_failed" };
  }

  const fetched = await fetchOfficialHttpsDocument({
    url: attachment.url,
    maxBytes: PRIMARY_SOURCE_ENRICHMENT_BOUNDS.maxDocumentBytes,
  });
  if (!fetched.ok) {
    return {
      title: candidate.title,
      fileName: attachment.fileName,
      url: attachment.url,
      maxBytes: PRIMARY_SOURCE_ENRICHMENT_BOUNDS.maxDocumentBytes,
      head,
      fetch: fetched,
    };
  }
  return {
    title: candidate.title,
    fileName: attachment.fileName,
    url: attachment.url,
    maxBytes: PRIMARY_SOURCE_ENRICHMENT_BOUNDS.maxDocumentBytes,
    head,
    fetch: {
      ok: true as const,
      bytes: fetched.bytes,
      contentType: fetched.contentType,
      finalUrl: fetched.finalUrl,
    },
  };
}

async function main() {
  const now = new Date();
  const cases = [];

  for (const item of CASES) {
    const rawDiscovery = await fetchNordicPrimarySourceEvents({
      companyName: item.name,
      symbol: item.symbol,
      exchange: item.exchange,
      now,
      maxHits: 12,
      queryCount: 20,
    });
    const enrichedSources = await fetchNordicDivLabAnalysisSources({
      companyName: item.name,
      symbol: item.symbol,
      exchange: item.exchange,
      now,
    });
    const directReportFetch = item.symbol === "EMBRAC-B"
      ? await diagnoseFirstReportDocument(rawDiscovery)
      : null;

    const sourceDiagnostics = {
      enrichedCount: enrichedSources.length,
      primaryCount: enrichedSources.filter((source) => source.primary).length,
      directReportFetch,
      enrichedSources: enrichedSources.map((source) => ({
        kind: source.kind,
        publisher: source.publisher,
        publishedAt: source.publishedAt,
        primary: source.primary,
        url: source.url,
      })),
      rawPrimaryDiscovery: rawDiscovery.map(summarizeDiscovery),
    };

    const loaded = await loadDivLabResearchInputs({ ...item, now });
    if (!loaded.ok) {
      cases.push({
        profile: item.profile,
        symbol: item.symbol,
        ok: false,
        reason: loaded.reason,
        sourceDiagnostics,
      });
      continue;
    }

    const snapshot = loaded.value.fundamentals as CurrencyAwareFundamentalSnapshot;
    const fundamental = analyzeFundamentals(snapshot);
    const levels = analyzeSupportResistance(loaded.value.history);
    const primarySources = loaded.value.sources.filter((source) => source.primary);

    cases.push({
      profile: item.profile,
      ok: true,
      instrument: loaded.value.instrument,
      sourceCount: loaded.value.sources.length,
      primarySourceCount: primarySources.length,
      primarySources: primarySources.map((source) => ({
        kind: source.kind,
        publishedAt: source.publishedAt,
        publisher: source.publisher,
        url: source.url,
      })),
      currencies: {
        market: snapshot.currency,
        reporting: snapshot.reportingCurrency ?? null,
        epsTtm: snapshot.epsTtmCurrency ?? null,
      },
      historicalPeriodCoverage: snapshot.historicalPeriods?.map((period) => ({
        period: period.period,
        revenue: typeof period.revenue === "number",
        operatingIncome: typeof period.operatingIncome === "number",
        netIncome: typeof period.netIncome === "number",
        freeCashFlow: typeof period.freeCashFlow === "number",
        eps: typeof period.eps === "number",
        shares: typeof period.sharesOutstanding === "number",
      })) ?? [],
      trends: fundamental.trends,
      unknowns: fundamental.unknowns,
      resistanceState: levels.resistanceState,
      priorHigh: levels.priorHigh,
      nearestSupport: levels.supports[0]
        ? { lower: levels.supports[0].lower, upper: levels.supports[0].upper, strength: levels.supports[0].strength }
        : null,
      nearestResistance: levels.resistances[0]
        ? { lower: levels.resistances[0].lower, upper: levels.resistances[0].upper, strength: levels.resistances[0].strength }
        : null,
      sourceDiagnostics,
    });
  }

  console.log(JSON.stringify({
    status: "completed",
    readOnly: true,
    persistence: false,
    aiUsed: false,
    executedAt: now.toISOString(),
    cases,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
