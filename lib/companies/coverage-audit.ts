import { VERIFIED_OMXS30_SLUGS } from "@/lib/companies/omxs30";
import {
  COMPANY_OFFICIAL_COVERAGE,
  type OfficialCategory,
} from "@/lib/companies/official-coverage";
import type { SourceSupportMode } from "@/lib/companies/ingestion/baseline";
import { COMPANY_PAGE_INDEX_MINIMUM, companyIndexSignals } from "@/lib/companies/page-model";

const CATEGORIES: OfficialCategory[] = ["press", "reports", "calendar", "ceo", "ownership", "dividend"];

export type CoverageAuditRow = {
  slug: string;
  press: SourceSupportMode;
  reports: SourceSupportMode;
  calendar: SourceSupportMode;
  management: SourceSupportMode;
  ownership: SourceSupportMode;
  dividend: SourceSupportMode;
  automatedSignals: string[];
  indexableFromAutomatedCoverage: boolean;
  delayedQuote: "page_only";
  valuation: "page_only";
  annualFinancials: "page_only";
  paidDividendHistory: "page_only";
  editorial: "render_time";
  peers: "same_sector";
  currentEvents: "derived";
  officialSourceUrls: string[];
  blockers: string[];
  lastSuccess: string | null;
  lastFailure: string | null;
};

export function auditOmxs30Coverage(): CoverageAuditRow[] {
  return VERIFIED_OMXS30_SLUGS.map((slug) => {
    const coverage = COMPANY_OFFICIAL_COVERAGE[slug];
    const mode = (category: OfficialCategory): SourceSupportMode => coverage?.[category].mode ?? "source_link_only";
    const signals = companyIndexSignals({
      dividendKind: "unspecified",
      dividendAmount: mode("dividend") === "automated",
      reports: mode("reports") === "automated" ? 1 : 0,
      press: mode("press") === "automated" ? 1 : 0,
      events: mode("calendar") === "automated" ? 1 : 0,
      management: mode("ceo") === "automated" ? 1 : 0,
      ownership: mode("ownership") === "automated" ? 1 : 0,
      articles: 0,
    });
    const urls = coverage
      ? [...new Set(CATEGORIES.map((category) => coverage[category].href))]
      : [];
    const blockers = coverage
      ? [...new Set(CATEGORIES.flatMap((category) => coverage[category].blocker ? [coverage[category].blocker as string] : []))]
      : ["Saknar täckningsrad."];
    return {
      slug,
      press: mode("press"),
      reports: mode("reports"),
      calendar: mode("calendar"),
      management: mode("ceo"),
      ownership: mode("ownership"),
      dividend: mode("dividend"),
      automatedSignals: signals,
      indexableFromAutomatedCoverage: signals.length >= COMPANY_PAGE_INDEX_MINIMUM,
      delayedQuote: "page_only",
      valuation: "page_only",
      annualFinancials: "page_only",
      paidDividendHistory: "page_only",
      editorial: "render_time",
      peers: "same_sector",
      currentEvents: "derived",
      officialSourceUrls: urls,
      blockers,
      lastSuccess: null,
      lastFailure: null,
    };
  });
}
