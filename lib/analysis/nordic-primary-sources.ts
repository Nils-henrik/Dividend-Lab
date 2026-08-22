import "server-only";

import {
  fetchNordicPrimarySourceEvents,
  nordicDisclosureCompanyAliases,
  type NordicPrimarySourceHit,
} from "@/lib/model-portfolios/engine/nordic-primary-sources";
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

function compactTickerSearchToken(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();
  return normalized.replace(/-(?:A|B|SDB)$/i, "") || normalized;
}

function preferredIssuerSearchName(companyName: string): string {
  const aliases = nordicDisclosureCompanyAliases(companyName)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const withoutLegalSuffix = aliases.find(
    (alias) => !/\s(?:AB|ASA|Oyj|A\/S|Plc|PLC|Ltd|Limited|Group)\.?$/i.test(alias),
  );
  return withoutLegalSuffix ?? aliases[0] ?? companyName.replace(/\s+/g, " ").trim();
}

function uniqueTerms(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = value.replace(/\s+/g, " ").trim();
    const key = normalized.toUpperCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
  }
  return output;
}

type CurrentReportIntent = {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  phrase: string;
  secondaryPhrase: string;
};

/**
 * Use the latest normally reportable completed quarter, not the current partial
 * quarter. This is search intent only; report period/year are still parsed from
 * the retrieved official source and are never invented from this helper.
 */
function currentReportIntent(now: Date): CurrentReportIntent {
  const month = now.getUTCMonth() + 1;
  if (month <= 3) {
    return { quarter: "Q4", phrase: "year-end", secondaryPhrase: "fourth quarter" };
  }
  if (month <= 6) {
    return { quarter: "Q1", phrase: "first quarter", secondaryPhrase: "interim report" };
  }
  if (month <= 9) {
    return { quarter: "Q2", phrase: "half-year", secondaryPhrase: "interim report" };
  }
  return { quarter: "Q3", phrase: "third quarter", secondaryPhrase: "interim report" };
}

export function nordicCurrentReportIntentTerms(input: {
  companyName: string;
  symbol: string;
  now: Date;
}): string[] {
  const issuer = preferredIssuerSearchName(input.companyName);
  const ticker = compactTickerSearchToken(input.symbol);
  const intent = currentReportIntent(input.now);
  return uniqueTerms([
    `${ticker} ${intent.quarter}`,
    `${issuer} ${intent.phrase}`,
    `${issuer} ${intent.secondaryPhrase}`,
  ]).slice(0, DEEP_RESEARCH_CNS_REQUEST_BUDGET.currentReport);
}

export function nordicAnnualReportIntentTerms(input: {
  companyName: string;
  symbol: string;
}): string[] {
  const issuer = preferredIssuerSearchName(input.companyName);
  const ticker = compactTickerSearchToken(input.symbol);
  return uniqueTerms([
    `${issuer} annual report`,
    `${ticker} annual report`,
  ]).slice(0, DEEP_RESEARCH_CNS_REQUEST_BUDGET.annualReport);
}

function requestUrl(input: RequestInfo | URL): URL | null {
  try {
    if (input instanceof URL) return new URL(input.toString());
    if (typeof input === "string") return new URL(input);
    return new URL(input.url);
  } catch {
    return null;
  }
}

/**
 * The shared Nasdaq adapter owns endpoint parameters, Main Market scope,
 * issuer-side filtering and attachment trust. Dedicated Deep Research only
 * replaces the first generated `freeText` value with one explicit internal
 * report-intent term and then closes the wrapper after that single request.
 */
function exactFreeTextFetch(fetchImpl: typeof fetch, freeText: string): typeof fetch {
  let requestUsed = false;
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (requestUsed) {
      return new Response(null, { status: 429, statusText: "DivLab bounded research budget" });
    }
    requestUsed = true;
    const url = requestUrl(input);
    if (
      !url
      || url.protocol !== "https:"
      || url.hostname !== "api.news.eu.nasdaq.com"
      || url.pathname !== "/news/query.action"
    ) {
      return new Response(null, { status: 400, statusText: "Unexpected Nordic research endpoint" });
    }
    url.searchParams.set("freeText", freeText);
    return fetchImpl(url, init);
  }) as typeof fetch;
}

async function fetchTermedNordicHits(input: {
  companyName: string;
  symbol: string;
  terms: readonly string[];
  exchange: string;
  fetchImpl: typeof fetch;
  now: Date;
  maxHits: number;
}): Promise<NordicPrimarySourceHit[]> {
  const batches: NordicPrimarySourceHit[][] = [];
  for (const term of input.terms) {
    batches.push(await fetchNordicPrimarySourceEvents({
      companyName: input.companyName,
      symbol: input.symbol,
      exchange: input.exchange,
      fetchImpl: exactFreeTextFetch(input.fetchImpl, term),
      now: input.now,
      maxHits: input.maxHits,
      queryCount: 20,
      preferFinancialReports: true,
    }));
  }
  return dedupeHits(batches.flat());
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

  const currentHits = await fetchTermedNordicHits({
    companyName: input.companyName,
    symbol: input.symbol,
    terms: nordicCurrentReportIntentTerms({
      companyName: input.companyName,
      symbol: input.symbol,
      now,
    }),
    exchange: input.exchange,
    fetchImpl,
    now,
    maxHits: 12,
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
    : await fetchTermedNordicHits({
        companyName: input.companyName,
        symbol: input.symbol,
        terms: nordicAnnualReportIntentTerms(input),
        exchange: input.exchange,
        fetchImpl,
        now,
        maxHits: 4,
      });

  const hits = dedupeHits([...currentHits, ...annualHits]);
  if (!hits.length) return { sources: [], evidence: [] };

  const reportFirst = rankNordicDeepResearchHits(hits);

  // Dedicated product analysis may attempt two official documents: one current
  // report and one annual/year-end report. Portfolio research defaults remain
  // unchanged at one document attempt and the conservative 4,500-character
  // excerpt unless that caller explicitly opts in.
  const enriched = await enrichNordicPrimarySourceHits({
    hits: reportFirst,
    fetchImpl,
    maxDocuments: 2,
    maxDocumentBytes: PRIMARY_SOURCE_ENRICHMENT_BOUNDS.maxDocumentBytes,
    maxDocumentTextChars: PRIMARY_SOURCE_ENRICHMENT_BOUNDS.maxDocumentTextChars,
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
