import type { SourceSupportMode } from "@/lib/companies/ingestion/baseline";
import type { ViewableCompanyDocument } from "@/lib/companies/documents-view";
import { classifyCompanyDocuments } from "@/lib/companies/documents-view";
import type { OfficialItem, OwnershipItem } from "@/lib/companies/investor-official";
import {
  companyOfficialCoverage,
  type OfficialCategory,
  type OfficialCategoryCoverage,
} from "@/lib/companies/official-coverage";

export type CompanyDataStatus =
  | "available_with_items"
  | "available_empty"
  | "source_link_only"
  | "temporarily_unavailable"
  | "schema_unavailable";

export type CompanyOfficialSection<T> = {
  status: CompanyDataStatus;
  items: T[];
  sourceUrl: string | null;
  sourcePublisher: string | null;
  asOf: string | null;
};

export type CompanyCeoFact = {
  status: CompanyDataStatus;
  name: string | null;
  sourceUrl: string | null;
  sourcePublisher: string | null;
  asOf: string | null;
};

export type CompanyDividendFact = {
  status: CompanyDataStatus;
  perShare: number | null;
  currency: string | null;
  year: number | null;
  sourceUrl: string | null;
  sourcePublisher: string | null;
  asOf: string | null;
};

export type CompanyOwnershipEntry = OwnershipItem & {
  asOf: string | null;
  sourceUrl: string;
  sourcePublisher: string;
};

export type CompanyOfficialData = {
  pressReleases: CompanyOfficialSection<OfficialItem>;
  reports: CompanyOfficialSection<OfficialItem>;
  events: CompanyOfficialSection<OfficialItem>;
  ownership: CompanyOfficialSection<CompanyOwnershipEntry>;
  ceo: CompanyCeoFact;
  dividend: CompanyDividendFact;
};

export type PersistedCompanyFact = {
  factType: "ceo" | "dividend_per_share" | "dividend_currency" | "dividend_year";
  valueText: string | null;
  valueNumeric: number | null;
  unit: string | null;
  asOf: string | null;
  sourceUrl: string;
  sourcePublisher: string;
};

export type PersistedOwnershipRow = {
  ownerName: string;
  capitalPct: number;
  votesPct: number | null;
  asOf: string | null;
  sourceUrl: string;
  sourcePublisher: string;
};

export type PersistedSourceCoverage = {
  sourceType: string;
  sourceUrl: string;
  publisher: string;
  supportMode: SourceSupportMode;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  lastFailureReason: string | null;
};

const SOURCE_TYPE_FOR_CATEGORY = {
  press: "press_releases",
  reports: "financial_reports",
  calendar: "financial_calendar",
  ceo: "management",
  ownership: "ownership",
  dividend: "dividend",
} as const;

function coverageFor(
  slug: string,
  category: OfficialCategory,
  fallbackHref: string,
): OfficialCategoryCoverage {
  return companyOfficialCoverage(slug)?.[category] ?? {
    mode: "source_link_only",
    href: fallbackHref,
    blocker: null,
  };
}

function sourceFor(sources: readonly PersistedSourceCoverage[], sourceType: string) {
  return sources.find((source) => source.sourceType === sourceType) ?? null;
}

function resolveStatus(input: {
  hasItems: boolean;
  query: "ok" | "schema_unavailable";
  source: PersistedSourceCoverage | null;
  staticMode: SourceSupportMode;
}): CompanyDataStatus {
  if (input.hasItems) return "available_with_items";
  const mode = input.source?.supportMode ?? input.staticMode;
  if (mode === "source_link_only" || mode === "blocked") return "source_link_only";
  if (input.source?.lastFailureReason) return "temporarily_unavailable";
  if (input.source?.lastSuccessAt) return "available_empty";
  if (input.query === "schema_unavailable") return "schema_unavailable";
  return "source_link_only";
}

function sectionFromItems<T>(
  items: T[],
  statusInput: Parameters<typeof resolveStatus>[0],
  sourceUrl: string | null,
  publisher: string | null,
  asOf: string | null,
): CompanyOfficialSection<T> {
  const status = resolveStatus({ ...statusInput, hasItems: items.length > 0 });
  return {
    status,
    items: status === "available_with_items" ? items : [],
    sourceUrl,
    sourcePublisher: publisher,
    asOf,
  };
}

export function assembleCompanyOfficialData(input: {
  slug: string;
  pressReleasesUrl: string;
  reportsUrl: string;
  calendarUrl: string;
  profileUrl: string;
  documents: readonly ViewableCompanyDocument[];
  documentQuery: "ok" | "schema_unavailable";
  facts: readonly PersistedCompanyFact[];
  ownership: readonly PersistedOwnershipRow[];
  profileQuery: "ok" | "schema_unavailable";
  sources: readonly PersistedSourceCoverage[];
  now?: Date;
}): CompanyOfficialData {
  const now = input.now ?? new Date();
  const classified = classifyCompanyDocuments(input.documents, now);
  const pressSource = sourceFor(input.sources, SOURCE_TYPE_FOR_CATEGORY.press);
  const reportSource = sourceFor(input.sources, SOURCE_TYPE_FOR_CATEGORY.reports);
  const calendarSource = sourceFor(input.sources, SOURCE_TYPE_FOR_CATEGORY.calendar);
  const managementSource = sourceFor(input.sources, SOURCE_TYPE_FOR_CATEGORY.ceo);
  const ownershipSource = sourceFor(input.sources, SOURCE_TYPE_FOR_CATEGORY.ownership);
  const dividendSource = sourceFor(input.sources, SOURCE_TYPE_FOR_CATEGORY.dividend);
  const pressCoverage = coverageFor(input.slug, "press", input.pressReleasesUrl);
  const reportCoverage = coverageFor(input.slug, "reports", input.reportsUrl);
  const calendarCoverage = coverageFor(input.slug, "calendar", input.calendarUrl);
  const ceoCoverage = coverageFor(input.slug, "ceo", input.profileUrl);
  const ownershipCoverage = coverageFor(input.slug, "ownership", input.profileUrl);
  const dividendCoverage = coverageFor(input.slug, "dividend", input.profileUrl);

  const ceoFact = input.facts.find((fact) => fact.factType === "ceo" && fact.valueText);
  const perShare = input.facts.find((fact) => fact.factType === "dividend_per_share" && fact.valueNumeric !== null);
  const currencyFact = input.facts.find((fact) => fact.factType === "dividend_currency" && fact.valueText);
  const yearFact = input.facts.find((fact) => fact.factType === "dividend_year" && fact.valueNumeric !== null);
  const currency = currencyFact?.valueText ?? perShare?.unit ?? null;
  const ownershipItems: CompanyOwnershipEntry[] = input.ownership.map((owner) => ({
    owner: owner.ownerName,
    capitalPct: owner.capitalPct,
    votesPct: owner.votesPct,
    asOf: owner.asOf,
    sourceUrl: owner.sourceUrl,
    sourcePublisher: owner.sourcePublisher,
  }));
  const ownershipAsOf = ownershipItems.find((item) => item.asOf)?.asOf ?? null;

  const ceoStatus = resolveStatus({
    hasItems: Boolean(ceoFact),
    query: input.profileQuery,
    source: managementSource,
    staticMode: ceoCoverage.mode,
  });
  const dividendStatus = resolveStatus({
    hasItems: Boolean(perShare),
    query: input.profileQuery,
    source: dividendSource,
    staticMode: dividendCoverage.mode,
  });

  return {
    pressReleases: sectionFromItems(
      classified.pressReleases,
      { hasItems: false, query: input.documentQuery, source: pressSource, staticMode: pressCoverage.mode },
      pressSource?.sourceUrl ?? pressCoverage.href,
      pressSource?.publisher ?? null,
      null,
    ),
    reports: sectionFromItems(
      classified.reports,
      { hasItems: false, query: input.documentQuery, source: reportSource, staticMode: reportCoverage.mode },
      reportSource?.sourceUrl ?? reportCoverage.href,
      reportSource?.publisher ?? null,
      null,
    ),
    events: sectionFromItems(
      classified.events,
      { hasItems: false, query: input.documentQuery, source: calendarSource, staticMode: calendarCoverage.mode },
      calendarSource?.sourceUrl ?? calendarCoverage.href,
      calendarSource?.publisher ?? null,
      null,
    ),
    ownership: sectionFromItems(
      ownershipItems,
      { hasItems: false, query: input.profileQuery, source: ownershipSource, staticMode: ownershipCoverage.mode },
      ownershipSource?.sourceUrl ?? ownershipItems[0]?.sourceUrl ?? ownershipCoverage.href,
      ownershipSource?.publisher ?? ownershipItems[0]?.sourcePublisher ?? null,
      ownershipAsOf,
    ),
    ceo: {
      status: ceoStatus,
      name: ceoStatus === "available_with_items" ? ceoFact?.valueText ?? null : null,
      sourceUrl: managementSource?.sourceUrl ?? ceoFact?.sourceUrl ?? ceoCoverage.href,
      sourcePublisher: managementSource?.publisher ?? ceoFact?.sourcePublisher ?? null,
      asOf: ceoFact?.asOf ?? null,
    },
    dividend: {
      status: dividendStatus,
      perShare: dividendStatus === "available_with_items" ? perShare?.valueNumeric ?? null : null,
      currency: dividendStatus === "available_with_items" ? currency : null,
      year: dividendStatus === "available_with_items" && yearFact?.valueNumeric ? yearFact.valueNumeric : null,
      sourceUrl: dividendSource?.sourceUrl ?? perShare?.sourceUrl ?? dividendCoverage.href,
      sourcePublisher: dividendSource?.publisher ?? perShare?.sourcePublisher ?? null,
      asOf: perShare?.asOf ?? null,
    },
  };
}

export function officialDividendYieldPercent(input: {
  dividend: CompanyDividendFact;
  price: number | null;
  marketCurrency: string | null;
}): number | null {
  const { dividend, price, marketCurrency } = input;
  if (
    dividend.perShare === null ||
    price === null ||
    price <= 0 ||
    !dividend.currency ||
    !marketCurrency ||
    dividend.currency !== marketCurrency
  ) {
    return null;
  }
  return (dividend.perShare / price) * 100;
}

export function overlayInvestorLiveData(
  base: CompanyOfficialData,
  live: {
    pressReleases: OfficialItem[];
    reports: OfficialItem[];
    events: OfficialItem[];
    ownership: OwnershipItem[];
    ownershipAsOf: string | null;
    ceo: string | null;
    dividendPerShare: number | null;
    dividendCurrency: "SEK" | null;
    dividendYear: number | null;
  },
): CompanyOfficialData {
  const withItems = <T>(section: CompanyOfficialSection<T>, items: T[], asOf: string | null = section.asOf): CompanyOfficialSection<T> => {
    if (section.status === "available_with_items" || items.length === 0) return section;
    return { ...section, status: "available_with_items", items, asOf };
  };
  const ownership = live.ownership.map((item) => ({
    ...item,
    asOf: live.ownershipAsOf,
    sourceUrl: base.ownership.sourceUrl ?? "https://www.investorab.com/investors-media/the-investor-share/ownership-structure",
    sourcePublisher: "Investor AB",
  }));
  return {
    pressReleases: withItems(base.pressReleases, live.pressReleases),
    reports: withItems(base.reports, live.reports),
    events: withItems(base.events, live.events),
    ownership: withItems(base.ownership, ownership, live.ownershipAsOf),
    ceo: base.ceo.name
      ? base.ceo
      : live.ceo
        ? { ...base.ceo, status: "available_with_items", name: live.ceo, sourcePublisher: base.ceo.sourcePublisher ?? "Investor AB" }
        : base.ceo,
    dividend: base.dividend.perShare !== null
      ? base.dividend
      : live.dividendPerShare !== null
        ? {
          ...base.dividend,
          status: "available_with_items",
          perShare: live.dividendPerShare,
          currency: live.dividendCurrency,
          year: live.dividendYear,
          sourcePublisher: base.dividend.sourcePublisher ?? "Investor AB",
        }
        : base.dividend,
  };
}
