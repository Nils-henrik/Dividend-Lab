import {
  classifyCompanyMetadata,
  extractYahooCompanyMetadata,
  type DivLabCompanyClassification,
} from "./company-classification";
import {
  fundamentalMethodologyFor,
  type FundamentalMethodologyPolicy,
} from "./fundamental-methodology";
import type { AnalysisSource } from "./quality-gate";

export const DIVLAB_COMPANY_PROFILE_PREFLIGHT_VERSION = "company-profile-preflight-v1" as const;

export type CompanyProfilePreflight = {
  version: typeof DIVLAB_COMPANY_PROFILE_PREFLIGHT_VERSION;
  yahooSymbol: string;
  classification: DivLabCompanyClassification;
  methodology: FundamentalMethodologyPolicy;
  source: AnalysisSource;
};

function normalizedYahooSymbol(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!normalized) throw new Error("company_profile_preflight_symbol_required");
  return normalized;
}

/**
 * Pure transformer for a lightweight Yahoo quoteSummary payload.
 * It never infers company type from ticker/name or financial ratios.
 */
export function buildCompanyProfilePreflightFromYahooPayload(input: {
  payload: unknown;
  yahooSymbol: string;
  fetchedAt: Date;
}): CompanyProfilePreflight {
  if (!Number.isFinite(input.fetchedAt.getTime())) {
    throw new Error("company_profile_preflight_time_invalid");
  }
  const yahooSymbol = normalizedYahooSymbol(input.yahooSymbol);
  const fetchedAt = input.fetchedAt.toISOString();
  const sourceId = `fundamental:yahoo-profile:${yahooSymbol}:${fetchedAt.slice(0, 10)}`;
  const source: AnalysisSource = {
    id: sourceId,
    kind: "fundamental_data",
    publisher: "Yahoo Finance",
    url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}/profile/`,
    publishedAt: fetchedAt,
    verifiedAt: fetchedAt,
    primary: false,
  };
  const classification = classifyCompanyMetadata({
    metadata: extractYahooCompanyMetadata(input.payload),
    sourceIds: [sourceId],
  });
  return {
    version: DIVLAB_COMPANY_PROFILE_PREFLIGHT_VERSION,
    yahooSymbol,
    classification,
    methodology: fundamentalMethodologyFor(classification),
    source,
  };
}
