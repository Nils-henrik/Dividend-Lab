import "server-only";

import { fetchNordicPrimarySourceEvents, type NordicPrimarySourceHit } from "@/lib/model-portfolios/engine/nordic-primary-sources";
import {
  enrichNordicPrimarySourceHits,
  PRIMARY_SOURCE_ENRICHMENT_BOUNDS,
} from "@/lib/model-portfolios/engine/primary-source-enrichment";
import { parseReportMetadata } from "@/lib/model-portfolios/engine/report-metadata";
import type { AnalysisEvidence, AnalysisEvidenceKind } from "./evidence";
import type { AnalysisSource } from "./quality-gate";

export type NordicDivLabAnalysisResearch = {
  sources: AnalysisSource[];
  evidence: AnalysisEvidence[];
};

const DEEP_RESEARCH_CNS_REQUEST_BUDGET = {
  currentReport: 3,
  annualReport: 2,
  total: 5,
} as const;

function analysisKind(input: {
  sourceType: "official_company_report" | "company_release" | "regulatory_filing";
  documentType: string;
}): AnalysisSource["kind"] {
  if (input.sourceType !== "official_company_report") {
    return input.sourceType === "company_release" ? "company_release" : "other";
  }
  if (input.documentType === "annual_report" || input.documentType === "year_end_report") {
    return "annual_report";
  }
  return "quarterly_report";
}

function evidenceKind(input: {
  sourceType: "official_company_report" | "company_release" | "regulatory_filing";
}): AnalysisEvidenceKind {
  if (input.sourceType === "official_company_report") return "official_report_excerpt";
  if (input.sourceType === "regulatory_filing") return "regulatory_summary";
  return "company_release_summary";
}

function hitPublishedAt(hit: NordicPrimarySourceHit): number {
  const value = Date.parse(hit.publishedAt ?? hit.fetchedAt);
  return Number.isFinite(value) ? value : 0;
}

function hitPdfAttachment(hit: NordicPrimarySourceHit) {
  return hit.attachments.find((item) => {
    const mime = item.mimeType?.toLowerCase() ?? "";
    return !mime || mime.includes("pdf") || (item.fileName ?? "").toLowerCase().endsWith(".pdf");
  }) ?? null;
}

function parsedHit(hit: NordicPrimarySourceHit) {
  const attachment = hitPdfAttachment(hit);
  const parsed = parseReportMetadata({
    title: hit.title,
    category: hit.category,
    fileName: attachment?.fileName ?? null,
  });
  return { hit, attachment, parsed };
}

function isAnnualDocumentType(value: string): boolean {
  return value === "annual_report" || value === "year_end_report";
}

function genericReportPriority(hit: NordicPrimarySourceHit): number {
  const { attachment, parsed } = parsedHit(hit);
  if (!attachment) return 0;
  if (parsed.looksLikeReportDocument && parsed.reportPeriod) return 3;
  if (parsed.looksLikeReportDocument) return 2;
  return 1;
}

/**
 * Dedicated analysis intentionally gives its two PDF attempts different jobs:
 * latest current/interim report first, then latest annual/year-end report.
 * Remaining hits retain deterministic report-first/recency ordering.
 */
export function rankNordicDeepResearchHits(
  hits: readonly NordicPrimarySourceHit[],
): NordicPrimarySourceHit[] {
  const candidates = hits.map(parsedHit);
  const current = candidates
    .filter(
      ({ attachment, parsed }) =>
        Boolean(attachment)
        && parsed.looksLikeReportDocument
        && !isAnnualDocumentType(parsed.documentType),
    )
    .sort((a, b) => hitPublishedAt(b.hit) - hitPublishedAt(a.hit))[0]?.hit ?? null;
  const annual = candidates
    .filter(
      ({ attachment, parsed }) =>
        Boolean(attachment)
        && parsed.looksLikeReportDocument
        && isAnnualDocumentType(parsed.documentType),
    )
    .sort((a, b) => hitPublishedAt(b.hit) - hitPublishedAt(a.hit))[0]?.hit ?? null;

  const preferred = [current, annual].filter(
    (hit): hit is NordicPrimarySourceHit => Boolean(hit),
  );
  const preferredUrls = new Set(preferred.map((hit) => hit.url));
  const rest = hits
    .filter((hit) => !preferredUrls.has(hit.url))
    .map((hit, index) => ({ hit, index, priority: genericReportPriority(hit) }))
    .sort(
      (a, b) =>
        b.priority - a.priority
        || hitPublishedAt(b.hit) - hitPublishedAt(a.hit)
        || a.index - b.index,
    )
    .map(({ hit }) => hit);

  return [...preferred, ...rest];
}

function dedupeHits(hits: readonly NordicPrimarySourceHit[]): NordicPrimarySourceHit[] {
  const seen = new Set<string>();
  const output: NordicPrimarySourceHit[] = [];
  for (const hit of hits) {
    if (seen.has(hit.url)) continue;
    seen.add(hit.url);
    output.push(hit);
  }
  return output;
}

function annualDiscoverySymbol(symbol: string): string {
  const base = symbol.trim().toUpperCase().replace(/-(?:A|B|SDB)$/i, "");
  return `${base || symbol.trim()} annual`;
}

function boundedFetch(fetchImpl: typeof fetch, maxRequests: number): typeof fetch {
  let requests = 0;
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (requests >= maxRequests) {
      return new Response(null, { status: 429, statusText: "DivLab bounded research budget" });
    }
    requests += 1;
    return fetchImpl(input, init);
  }) as typeof fetch;
}

async function fetchEnrichedNordicResearch(input: {
  companyName: string;
  symbol: string;
  exchange: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<NordicDivLabAnalysisResearch> {
  const now = input.now ?? new Date();
  const fetchImpl = input.fetchImpl ?? fetch;

  const currentHits = await fetchNordicPrimarySourceEvents({
    companyName: input.companyName,
    symbol: input.symbol,
    exchange: input.exchange,
    fetchImpl: boundedFetch(fetchImpl, DEEP_RESEARCH_CNS_REQUEST_BUDGET.currentReport),
    now,
    maxHits: 12,
    queryCount: 20,
    preferFinancialReports: true,
  });

  const alreadyHasAnnual = currentHits.some(({ title, category, attachments }) => {
    const attachment = attachments.find((item) => {
      const mime = item.mimeType?.toLowerCase() ?? "";
      return !mime || mime.includes("pdf") || (item.fileName ?? "").toLowerCase().endsWith(".pdf");
    });
    if (!attachment) return false;
    const parsed = parseReportMetadata({
      title,
      category,
      fileName: attachment.fileName,
    });
    return parsed.looksLikeReportDocument && isAnnualDocumentType(parsed.documentType);
  });

  const annualHits = alreadyHasAnnual
    ? []
    : await fetchNordicPrimarySourceEvents({
        companyName: input.companyName,
        // The shared adapter builds its first bounded term from symbol. Appending
        // "annual" produces e.g. "ATCO annual report" while issuer filtering
        // still uses the untouched company name. The second call is capped at
        // two CNS requests, keeping total dedicated discovery at <=5 requests.
        symbol: annualDiscoverySymbol(input.symbol),
        exchange: input.exchange,
        fetchImpl: boundedFetch(fetchImpl, DEEP_RESEARCH_CNS_REQUEST_BUDGET.annualReport),
        now,
        maxHits: 4,
        queryCount: 20,
        preferFinancialReports: true,
      });

  const hits = dedupeHits([...currentHits, ...annualHits]);
  if (!hits.length) return { sources: [], evidence: [] };

  const reportFirst = rankNordicDeepResearchHits(hits);

  // Dedicated product analysis may attempt two official documents: one current
  // report and one annual/year-end report. Portfolio research defaults remain
  // unchanged at one document attempt.
  const enriched = await enrichNordicPrimarySourceHits({
    hits: reportFirst,
    fetchImpl,
    maxDocuments: 2,
    maxDocumentBytes: PRIMARY_SOURCE_ENRICHMENT_BOUNDS.maxDocumentBytes,
  });

  const sources: AnalysisSource[] = [];
  const evidence: AnalysisEvidence[] = [];

  enriched.forEach((item, index) => {
    const publishedAt = item.hit.publishedAt ?? item.hit.fetchedAt;
    const primary =
      item.sourceType === "official_company_report" &&
      item.documentRetrieved &&
      Boolean(item.documentUrl);
    const sourceId = `nordic-primary:${input.symbol}:${publishedAt}:${index}`;
    sources.push({
      id: sourceId,
      kind: analysisKind({
        sourceType: item.sourceType,
        documentType: item.documentType,
      }),
      publisher: item.hit.publisher,
      url: item.documentUrl ?? item.hit.url,
      publishedAt,
      verifiedAt: item.hit.fetchedAt,
      primary,
    });

    const content = item.summary.trim();
    if (!content) return;
    evidence.push({
      id: `evidence:${sourceId}`,
      sourceId,
      kind: evidenceKind({ sourceType: item.sourceType }),
      title: item.hit.title,
      content,
      documentExcerpt: item.documentExcerpt,
      publishedAt,
      primary,
      documentRetrieved: item.documentRetrieved,
      reportPeriod: item.reportPeriod,
      reportYear: item.reportYear,
      documentType: item.documentType || null,
    });
  });

  return { sources, evidence };
}

/**
 * Dedicated analysis research returns both normalized source provenance and the
 * bounded evidence that was actually read from those sources. The evidence is
 * preserved so the analysis AI never has to infer report content from a URL or
 * headline alone.
 */
export async function fetchNordicDivLabAnalysisResearch(input: {
  companyName: string;
  symbol: string;
  exchange: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<NordicDivLabAnalysisResearch> {
  return fetchEnrichedNordicResearch(input);
}

/** Compatibility wrapper for existing callers that only need provenance. */
export async function fetchNordicDivLabAnalysisSources(input: {
  companyName: string;
  symbol: string;
  exchange: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<AnalysisSource[]> {
  const research = await fetchEnrichedNordicResearch(input);
  return research.sources;
}
