import "server-only";

import { cache } from "react";
import { isCompanySchemaUnavailable } from "@/lib/companies/document-query";
import type { ViewableCompanyDocument } from "@/lib/companies/documents-view";
import { getInvestorOfficialData } from "@/lib/companies/investor-official";
import {
  assembleCompanyOfficialData,
  overlayInvestorLiveData,
  type CompanyOfficialData,
  type PersistedCompanyFact,
  type PersistedOwnershipRow,
  type PersistedSourceCoverage,
} from "@/lib/companies/official-data";
import type { CompanyFollowState } from "@/lib/companies/server";
import type { CompanyProfile } from "@/lib/companies/types";
import { tryGetSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { SourceSupportMode } from "@/lib/companies/ingestion/baseline";

const FACT_TYPES = new Set(["ceo", "dividend_per_share", "dividend_currency", "dividend_year"]);
const SUPPORT_MODES = new Set<SourceSupportMode>(["automated", "source_link_only", "blocked"]);

function isMissingSchema(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  return isCompanySchemaUnavailable(error)
    || error.code === "42703"
    || message.includes("company_facts")
    || message.includes("company_ownership")
    || message.includes("support_mode");
}

function numeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return null;
}

async function loadInvestorFallback(base: CompanyOfficialData): Promise<CompanyOfficialData> {
  const live = await getInvestorOfficialData();
  return overlayInvestorLiveData(base, {
    pressReleases: live.pressReleases,
    reports: live.reports,
    events: live.events,
    ownership: live.ownership,
    ownershipAsOf: live.ownershipAsOf,
    ceo: live.ceo,
    dividendPerShare: live.dividendPerShare,
    dividendCurrency: live.dividendCurrency,
    dividendYear: live.dividendYear,
  });
}

export const getCompanyOfficialData = cache(async (
  company: CompanyProfile,
  followState: CompanyFollowState,
): Promise<CompanyOfficialData> => {
  const documents: ViewableCompanyDocument[] = followState.documents.map((document) => ({
    type: document.type,
    title: document.title,
    url: document.url,
    publishedAt: document.publishedAt,
    eventAt: document.eventAt,
  }));

  if (!tryGetSupabaseConfig() || !followState.companyId) {
    const base = assembleCompanyOfficialData({
      slug: company.slug,
      pressReleasesUrl: company.pressReleasesUrl,
      reportsUrl: company.reportsUrl,
      calendarUrl: company.calendarUrl,
      profileUrl: company.governanceUrl ?? company.ownershipUrl ?? company.websiteUrl,
      documents,
      documentQuery: followState.companyId ? "ok" : "schema_unavailable",
      facts: [],
      ownership: [],
      profileQuery: "schema_unavailable",
      sources: [],
    });
    return company.slug === "investor" ? loadInvestorFallback(base) : base;
  }

  const supabase = await createClient();
  const [factsResult, ownershipResult, sourcesResult] = await Promise.all([
    supabase
      .from("company_facts")
      .select("fact_type, value_text, value_numeric, unit, as_of, source_url, source_publisher")
      .eq("company_id", followState.companyId),
    supabase
      .from("company_ownership")
      .select("owner_name, capital_pct, votes_pct, as_of, source_url, source_publisher")
      .eq("company_id", followState.companyId)
      .order("capital_pct", { ascending: false })
      .limit(10),
    supabase
      .from("company_sources")
      .select("source_type, source_url, publisher, support_mode, last_checked_at, last_success_at, last_failure_reason")
      .eq("company_id", followState.companyId)
      .eq("is_official", true)
      .eq("is_active", true),
  ]);

  const profileQuery = isMissingSchema(factsResult.error) || isMissingSchema(ownershipResult.error)
    ? "schema_unavailable"
    : "ok";
  if (factsResult.error && !isMissingSchema(factsResult.error)) throw new Error(factsResult.error.message);
  if (ownershipResult.error && !isMissingSchema(ownershipResult.error)) throw new Error(ownershipResult.error.message);

  let sources: PersistedSourceCoverage[] = [];
  if (sourcesResult.error && !isMissingSchema(sourcesResult.error)) {
    throw new Error(sourcesResult.error.message);
  }
  if (!sourcesResult.error && Array.isArray(sourcesResult.data)) {
    sources = sourcesResult.data.flatMap((row) => {
      if (
        typeof row.source_type !== "string" ||
        typeof row.source_url !== "string" ||
        typeof row.publisher !== "string" ||
        typeof row.support_mode !== "string" ||
        !SUPPORT_MODES.has(row.support_mode as SourceSupportMode)
      ) {
        return [];
      }
      return [{
        sourceType: row.source_type,
        sourceUrl: row.source_url,
        publisher: row.publisher,
        supportMode: row.support_mode as SourceSupportMode,
        lastCheckedAt: typeof row.last_checked_at === "string" ? row.last_checked_at : null,
        lastSuccessAt: typeof row.last_success_at === "string" ? row.last_success_at : null,
        lastFailureReason: typeof row.last_failure_reason === "string" ? row.last_failure_reason : null,
      }];
    });
  }

  const facts: PersistedCompanyFact[] = profileQuery === "ok"
    ? ((factsResult.data ?? []) as Array<Record<string, unknown>>).flatMap((row) => {
      if (typeof row.fact_type !== "string" || !FACT_TYPES.has(row.fact_type)) return [];
      if (typeof row.source_url !== "string" || typeof row.source_publisher !== "string") return [];
      return [{
        factType: row.fact_type as PersistedCompanyFact["factType"],
        valueText: typeof row.value_text === "string" ? row.value_text : null,
        valueNumeric: numeric(row.value_numeric),
        unit: typeof row.unit === "string" ? row.unit : null,
        asOf: typeof row.as_of === "string" ? row.as_of : null,
        sourceUrl: row.source_url,
        sourcePublisher: row.source_publisher,
      }];
    })
    : [];
  const ownership: PersistedOwnershipRow[] = profileQuery === "ok"
    ? ((ownershipResult.data ?? []) as Array<Record<string, unknown>>).flatMap((row) => {
      const capitalPct = numeric(row.capital_pct);
      if (typeof row.owner_name !== "string" || capitalPct === null) return [];
      if (typeof row.source_url !== "string" || typeof row.source_publisher !== "string") return [];
      return [{
        ownerName: row.owner_name,
        capitalPct,
        votesPct: numeric(row.votes_pct),
        asOf: typeof row.as_of === "string" ? row.as_of : null,
        sourceUrl: row.source_url,
        sourcePublisher: row.source_publisher,
      }];
    })
    : [];

  const assembled = assembleCompanyOfficialData({
    slug: company.slug,
    pressReleasesUrl: company.pressReleasesUrl,
    reportsUrl: company.reportsUrl,
    calendarUrl: company.calendarUrl,
    profileUrl: company.governanceUrl ?? company.ownershipUrl ?? company.websiteUrl,
    documents,
    documentQuery: "ok",
    facts,
    ownership,
    profileQuery,
    sources,
  });
  if (company.slug !== "investor") return assembled;
  const rich = assembled.pressReleases.status === "available_with_items"
    && assembled.ownership.status === "available_with_items"
    && assembled.ceo.name
    && assembled.dividend.perShare !== null;
  if (rich) return assembled;
  return loadInvestorFallback(assembled);
});
