import {
  classifyCompanyMetadata,
  extractYahooCompanyMetadata,
  type DivLabCompanyClassification,
} from "./company-classification";
import {
  fundamentalMethodologyFor,
  type FundamentalMethodologyPolicy,
} from "./fundamental-methodology";
import { applyOmxs30SpecialClassification } from "./omxs30-methodology-registry";
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
 * Pure transformer for a lightweight Yahoo quoteSummary payload. Provider
 * metadata is the default source of truth. The bounded OMXS30 specialist
 * registry may promote exact current special-methodology symbols (bank,
 * investment company, asset manager) to their verified specialist type.
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
  const providerClassification = classifyCompanyMetadata({
    metadata: extractYahooCompanyMetadata(input.payload),
    sourceIds: [sourceId],
  });
  const classification = applyOmxs30SpecialClassification({
    yahooSymbol,
    classification: providerClassification,
  });
  return {
    version: DIVLAB_COMPANY_PROFILE_PREFLIGHT_VERSION,
    yahooSymbol,
    classification,
    methodology: fundamentalMethodologyFor(classification),
    source,
  };
}
