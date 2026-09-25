import {
  INVESTOR_DIVIDEND_PAGE_URL,
  INVESTOR_MANAGEMENT_PAGE_URL,
  INVESTOR_OWNERSHIP_PAGE_URL,
  parseInvestorCeo,
  parseInvestorDividendFact,
  parseInvestorOwnership,
} from "@/lib/companies/investor-official";
import { INVESTOR_ORIGIN, INVESTOR_PUBLISHER } from "@/lib/companies/ingestion/adapters/investor";
import type { CompanyFactDraft, CompanyOwnershipDraft } from "@/lib/companies/ingestion/facts";
import {
  fetchOfficialText,
  INGESTION_MAX_HTML_BYTES,
  type SourceFetchContext,
} from "@/lib/companies/ingestion/fetch-source";

const HTML = ["text/html"] as const;

export const INVESTOR_PROFILE_SOURCE_URLS = {
  management: INVESTOR_MANAGEMENT_PAGE_URL,
  ownership: INVESTOR_OWNERSHIP_PAGE_URL,
  dividend: INVESTOR_DIVIDEND_PAGE_URL,
} as const;

export type InvestorProfileSourceType = keyof typeof INVESTOR_PROFILE_SOURCE_URLS;

export type CollectedInvestorProfile =
  | { status: "ok"; facts: CompanyFactDraft[]; ownership: CompanyOwnershipDraft[] }
  | { status: "error"; reason: string };

function today(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export async function collectInvestorProfileSource(
  sourceType: string,
  sourceUrl: string,
  context: SourceFetchContext,
): Promise<CollectedInvestorProfile> {
  if (!(sourceType in INVESTOR_PROFILE_SOURCE_URLS)) {
    return { status: "error", reason: "unsupported_source_type" };
  }
  const profileType = sourceType as InvestorProfileSourceType;
  if (sourceUrl !== INVESTOR_PROFILE_SOURCE_URLS[profileType]) {
    return { status: "error", reason: "unexpected_source_url" };
  }

  const page = await fetchOfficialText(sourceUrl, context, {
    allowedOrigin: INVESTOR_ORIGIN,
    acceptedContentTypes: HTML,
    maxBytes: INGESTION_MAX_HTML_BYTES,
  });
  if (page.status === "error") {
    return { status: "error", reason: `listing_${page.reason}` };
  }

  if (profileType === "management") {
    const name = parseInvestorCeo(page.text);
    if (!name) return { status: "error", reason: "no_valid_documents" };
    return {
      status: "ok",
      facts: [{
        factType: "ceo",
        valueText: name,
        valueNumeric: null,
        unit: null,
        asOf: today(context.now),
        sourceUrl,
        sourcePublisher: INVESTOR_PUBLISHER,
      }],
      ownership: [],
    };
  }

  if (profileType === "ownership") {
    const parsed = parseInvestorOwnership(page.text);
    if (parsed.items.length === 0) return { status: "error", reason: "no_valid_documents" };
    return {
      status: "ok",
      facts: [],
      ownership: parsed.items.map((item) => ({
        ownerName: item.owner,
        capitalPct: item.capitalPct,
        votesPct: item.votesPct,
        asOf: parsed.asOf,
        sourceUrl,
        sourcePublisher: INVESTOR_PUBLISHER,
      })),
    };
  }

  const dividend = parseInvestorDividendFact(page.text);
  if (!dividend) return { status: "error", reason: "no_valid_documents" };
  const facts: CompanyFactDraft[] = [{
    factType: "dividend_per_share",
    valueText: null,
    valueNumeric: dividend.perShare,
    unit: dividend.currency,
    asOf: today(context.now),
    sourceUrl,
    sourcePublisher: INVESTOR_PUBLISHER,
  }];
  if (dividend.currency) {
    facts.push({
      factType: "dividend_currency",
      valueText: dividend.currency,
      valueNumeric: null,
      unit: null,
      asOf: today(context.now),
      sourceUrl,
      sourcePublisher: INVESTOR_PUBLISHER,
    });
  }
  if (dividend.year) {
    facts.push({
      factType: "dividend_year",
      valueText: null,
      valueNumeric: dividend.year,
      unit: null,
      asOf: today(context.now),
      sourceUrl,
      sourcePublisher: INVESTOR_PUBLISHER,
    });
  }
  return { status: "ok", facts, ownership: [] };
}
