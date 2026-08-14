import "server-only";

import { fetchNordicPrimarySourceEvents } from "@/lib/model-portfolios/engine/nordic-primary-sources";
import { enrichNordicPrimarySourceHits } from "@/lib/model-portfolios/engine/primary-source-enrichment";
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

/**
 * Reuses the model-portfolio primary-source path rather than creating a second
 * issuer-disclosure crawler. Only successfully retrieved official reports are
 * marked primary for the DivLab publication quality gate.
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
  });
  if (!hits.length) return [];

  const enriched = await enrichNordicPrimarySourceHits({
    hits,
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
