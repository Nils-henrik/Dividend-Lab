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

function officialReportPriority(hit: NordicPrimarySourceHit): number {
  const attachment = hit.attachments.find((item) => {
    const mime = item.mimeType?.toLowerCase() ?? "";
    return !mime || mime.includes("pdf") || (item.fileName ?? "").toLowerCase().endsWith(".pdf");
  });
  const parsed = parseReportMetadata({
    title: hit.title,
    category: hit.category,
    fileName: attachment?.fileName ?? null,
  });
  if (!attachment) return 0;
  if (parsed.looksLikeReportDocument && parsed.reportPeriod) return 3;
  if (parsed.looksLikeReportDocument) return 2;
  return 1;
}

async function fetchEnrichedNordicResearch(input: {
  companyName: string;
  symbol: string;
  exchange: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<NordicDivLabAnalysisResearch> {
  const now = input.now ?? new Date();
  const hits = await fetchNordicPrimarySourceEvents({
    companyName: input.companyName,
    symbol: input.symbol,
    exchange: input.exchange,
    fetchImpl: input.fetchImpl,
    now,
    maxHits: 12,
    queryCount: 20,
  });
  if (!hits.length) return { sources: [], evidence: [] };

  // The shared document reader has a one-PDF hard attempt budget. Rank a real
  // quarterly/annual report ahead of generic attachment-bearing releases so a
  // lower-value PDF cannot consume the only deep-research document attempt.
  const reportFirst = hits
    .map((hit, index) => ({ hit, index, priority: officialReportPriority(hit) }))
    .sort((a, b) => b.priority - a.priority || a.index - b.index)
    .map(({ hit }) => hit);

  const enriched = await enrichNordicPrimarySourceHits({
    hits: reportFirst,
    fetchImpl: input.fetchImpl,
    maxDocuments: 1,
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
 * preserved so the future analysis AI never has to infer report content from a
 * URL or headline alone.
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
