import "server-only";

import { fetchNordicPrimarySourceEvents, type NordicPrimarySourceHit } from "@/lib/model-portfolios/engine/nordic-primary-sources";
import { enrichNordicPrimarySourceHits } from "@/lib/model-portfolios/engine/primary-source-enrichment";
import { parseReportMetadata } from "@/lib/model-portfolios/engine/report-metadata";
import type { AnalysisSource } from "./quality-gate";

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

/**
 * Reuses the model-portfolio primary-source path rather than creating a second
 * issuer-disclosure crawler. Only successfully retrieved official reports are
 * marked primary for the DivLab publication quality gate.
 *
 * Dedicated Deep Research deliberately searches a wider bounded CNS window
 * than a normal portfolio pass so recent buybacks/releases cannot crowd the
 * latest quarterly or annual report out of the two-hit portfolio budget.
 */
export async function fetchNordicDivLabAnalysisSources(input: {
  companyName: string;
  symbol: string;
  exchange: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<AnalysisSource[]> {
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
  if (!hits.length) return [];

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
  });

  return enriched.map((item, index): AnalysisSource => {
    const publishedAt = item.hit.publishedAt ?? item.hit.fetchedAt;
    const primary =
      item.sourceType === "official_company_report" &&
      item.documentRetrieved &&
      Boolean(item.documentUrl);
    return {
      id: `nordic-primary:${input.symbol}:${publishedAt}:${index}`,
      kind: analysisKind({
        sourceType: item.sourceType,
        documentType: item.documentType,
      }),
      publisher: item.hit.publisher,
      url: item.documentUrl ?? item.hit.url,
      publishedAt,
      verifiedAt: item.hit.fetchedAt,
      primary,
    };
  });
}
