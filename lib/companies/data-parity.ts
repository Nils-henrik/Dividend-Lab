import { companyAiPortfolioLinksForSymbol } from "@/lib/companies/ai-portfolio-crosslinks";
import { acceptBrokerUrl } from "@/lib/companies/broker-links";
import { getPilotCompanies } from "@/lib/companies/catalog";
import { isFollowableCompanySlug } from "@/lib/companies/follow-policy";
import type { SourceSupportMode } from "@/lib/companies/ingestion/baseline";
import {
  companyOfficialCoverage,
  type OfficialCategory,
} from "@/lib/companies/official-coverage";
import { isLei } from "@/lib/companies/short-interest/identifiers";
import { fiIdentityForSlug } from "@/lib/companies/short-interest/identity";
import { reportSnapshotOrigin } from "@/lib/companies/report-snapshot";
import type { CompanyProfile } from "@/lib/companies/types";

/**
 * Static coverage contract for every current and future catalog company.
 * A source-link or blocked cell is never complete. Live quote failures stay
 * on the page as temporarily unavailable and are not stored here as zero.
 */
export const DATA_PARITY_STATUSES = [
  "PASS REAL DATA",
  "SOURCE LINK ONLY",
  "BLOCKED BY SOURCE",
  "TEMPORARILY UNAVAILABLE",
  "NOT APPLICABLE / NO VERIFIED DATA",
] as const;

export type DataParityStatus = (typeof DATA_PARITY_STATUSES)[number];

export const DATA_PARITY_DIMENSIONS = [
  "delayedPrice",
  "valuationMetrics",
  "annualFinancialHistory",
  "dividendHistory",
  "officialPress",
  "officialReports",
  "officialCalendar",
  "ceo",
  "ownership",
  "officialDividend",
  "fiShortInterest",
  "avanzaUrl",
  "nordnetUrl",
  "latestReportSnapshot",
  "divlabArticleAssociation",
  "followSupport",
  "discussionSupport",
  "aiPortfolioEligibility",
] as const;

export type DataParityDimension = (typeof DATA_PARITY_DIMENSIONS)[number];

export const IDENTIFIER_PARITY_DIMENSIONS = [
  "fiShortInterest",
  "avanzaUrl",
  "nordnetUrl",
] as const satisfies readonly DataParityDimension[];

export type DataParityCell = {
  status: DataParityStatus;
  sourceUrl: string | null;
  reason: string | null;
  complete: boolean;
};

export type CatalogParityRow = {
  slug: string;
  cells: Record<DataParityDimension, DataParityCell>;
};

export type IdentifierFailClosed = {
  status: Exclude<DataParityStatus, "PASS REAL DATA">;
  reason: string;
};

/**
 * A future catalog company that lacks a verified broker URL or FI identity
 * must be listed here. An empty reason is not accepted. Guessing is not.
 */
export const CATALOG_IDENTIFIER_FAIL_CLOSED: Partial<
  Record<string, Partial<Record<(typeof IDENTIFIER_PARITY_DIMENSIONS)[number], IdentifierFailClosed>>>
> = {};

const YAHOO_QUOTE = /^[A-Z0-9-]+\.ST$/;

const MATRIX_DIMENSIONS: DataParityDimension[] = [
  "delayedPrice",
  "valuationMetrics",
  "annualFinancialHistory",
  "dividendHistory",
  "officialPress",
  "officialReports",
  "officialCalendar",
  "ceo",
  "ownership",
  "officialDividend",
  "fiShortInterest",
  "avanzaUrl",
  "nordnetUrl",
  "latestReportSnapshot",
];

const MATRIX_HEADER: Record<DataParityDimension, string> = {
  delayedPrice: "Kurs",
  valuationMetrics: "Nyckeltal",
  annualFinancialHistory: "År",
  dividendHistory: "Utd.hist",
  officialPress: "Press",
  officialReports: "Rapp.",
  officialCalendar: "Kalender",
  ceo: "VD",
  ownership: "Ägare",
  officialDividend: "Utd.",
  fiShortInterest: "FI",
  avanzaUrl: "Avanza",
  nordnetUrl: "Nordnet",
  latestReportSnapshot: "Utdrag",
  divlabArticleAssociation: "Artiklar",
  followSupport: "Följ",
  discussionSupport: "Diskussion",
  aiPortfolioEligibility: "AI",
};

const STATUS_CODE: Record<DataParityStatus, string> = {
  "PASS REAL DATA": "R",
  "SOURCE LINK ONLY": "L",
  "BLOCKED BY SOURCE": "B",
  "TEMPORARILY UNAVAILABLE": "T",
  "NOT APPLICABLE / NO VERIFIED DATA": "N",
};

export function isCompleteParityStatus(status: DataParityStatus) {
  return status === "PASS REAL DATA";
}

export function parityStatusFromSupportMode(mode: SourceSupportMode): DataParityStatus {
  if (mode === "automated") return "PASS REAL DATA";
  if (mode === "blocked") return "BLOCKED BY SOURCE";
  return "SOURCE LINK ONLY";
}

function cell(status: DataParityStatus, sourceUrl: string | null, reason: string | null): DataParityCell {
  return {
    status,
    sourceUrl,
    reason,
    complete: isCompleteParityStatus(status),
  };
}

function httpsOrNull(url: string | null | undefined): string | null {
  if (!url || !url.startsWith("https://")) return null;
  return url;
}

function yahooCell(company: CompanyProfile, reason: string): DataParityCell {
  if (!YAHOO_QUOTE.test(company.marketDataSymbol)) {
    return cell(
      "NOT APPLICABLE / NO VERIFIED DATA",
      null,
      "Saknar verifierad marknadsdatasymbol på Nasdaq Stockholm.",
    );
  }
  return cell(
    "PASS REAL DATA",
    `https://finance.yahoo.com/quote/${company.marketDataSymbol}`,
    reason,
  );
}

function officialCell(company: CompanyProfile, category: OfficialCategory, fallbackHref: string): DataParityCell {
  const coverage = companyOfficialCoverage(company.slug)?.[category];
  if (!coverage) {
    return cell("NOT APPLICABLE / NO VERIFIED DATA", httpsOrNull(fallbackHref), "Saknar täckningsrad.");
  }
  return cell(
    parityStatusFromSupportMode(coverage.mode),
    httpsOrNull(coverage.href),
    coverage.blocker,
  );
}

function identifierCell(
  company: CompanyProfile,
  dimension: (typeof IDENTIFIER_PARITY_DIMENSIONS)[number],
  passed: DataParityCell,
  missingReason: string,
): DataParityCell {
  if (passed.status === "PASS REAL DATA") return passed;
  const documented = CATALOG_IDENTIFIER_FAIL_CLOSED[company.slug]?.[dimension];
  if (documented?.reason) return cell(documented.status, passed.sourceUrl, documented.reason);
  return cell(passed.status, passed.sourceUrl, passed.reason ?? missingReason);
}

function fiCell(company: CompanyProfile): DataParityCell {
  const identity = fiIdentityForSlug(company.slug);
  const lei = company.fiLei ?? null;
  const issuer = company.fiIssuerName ?? null;
  const sourceUrl = "https://www.fi.se/sv/vara-register/blankningsregistret/";
  if (!identity || !lei || !issuer) {
    return identifierCell(
      company,
      "fiShortInterest",
      cell("NOT APPLICABLE / NO VERIFIED DATA", sourceUrl, null),
      "Saknar verifierad FI-identitet.",
    );
  }
  if (identity.lei !== lei || !identity.issuerNames?.includes(issuer) || !isLei(lei)) {
    return identifierCell(
      company,
      "fiShortInterest",
      cell("NOT APPLICABLE / NO VERIFIED DATA", sourceUrl, null),
      "FI-identiteten matchar inte den lagrade LEI-koden eller emittentnamnet.",
    );
  }
  return cell(
    "PASS REAL DATA",
    sourceUrl,
    "Aggregerad blankning och namngivna positioner läses från FI:s aktuella register. En saknad rad är inte 0 %.",
  );
}

function brokerCell(
  company: CompanyProfile,
  dimension: "avanzaUrl" | "nordnetUrl",
): DataParityCell {
  const broker = dimension === "avanzaUrl" ? "avanza" : "nordnet";
  const href = acceptBrokerUrl(broker, company[dimension]);
  if (href) return cell("PASS REAL DATA", href, null);
  return identifierCell(
    company,
    dimension,
    cell("NOT APPLICABLE / NO VERIFIED DATA", null, null),
    dimension === "avanzaUrl" ? "Saknar verifierad Avanza-adress." : "Saknar verifierad Nordnet-adress.",
  );
}

function snapshotCell(company: CompanyProfile, reports: DataParityCell): DataParityCell {
  const origin = reportSnapshotOrigin(company.slug);
  if (origin) {
    return cell(
      "PASS REAL DATA",
      reports.sourceUrl ?? origin,
      "Senaste verifierade rapportadressen kan läsas till ett utdrag. Jämförelse krävs för Rapporten i korthet.",
    );
  }
  if (reports.status === "BLOCKED BY SOURCE") {
    return cell("BLOCKED BY SOURCE", reports.sourceUrl, reports.reason);
  }
  if (reports.status === "NOT APPLICABLE / NO VERIFIED DATA") return reports;
  return cell(
    "SOURCE LINK ONLY",
    reports.sourceUrl,
    "Ingen verifierad rapportparser. Arkivet eller källänken används i stället.",
  );
}

function articleCell(company: CompanyProfile): DataParityCell {
  if (company.aliases.length === 0 || company.tickerAliases.length === 0) {
    return cell(
      "NOT APPLICABLE / NO VERIFIED DATA",
      null,
      "Saknar alias eller ticker för explicit artikelmatchning.",
    );
  }
  return cell(
    "PASS REAL DATA",
    null,
    "Artiklar matchas bara via alias och ticker. En tom lista är inte en påhittad nyhet.",
  );
}

function aiCell(company: CompanyProfile): DataParityCell {
  if (!YAHOO_QUOTE.test(company.marketDataSymbol)) {
    return cell(
      "NOT APPLICABLE / NO VERIFIED DATA",
      null,
      "Saknar symbol som kan matchas mot en publik modellportfölj.",
    );
  }
  companyAiPortfolioLinksForSymbol(company.marketDataSymbol, []);
  return cell(
    "PASS REAL DATA",
    null,
    "Länk visas bara för aktiv eller pausad publik portfölj med kvantitet över noll och exakt symbol. Misslyckad läsning utelämnar blocket.",
  );
}

function rowFor(company: CompanyProfile): CatalogParityRow {
  const officialPress = officialCell(company, "press", company.pressReleasesUrl);
  const officialReports = officialCell(company, "reports", company.reportsUrl);
  const cells: Record<DataParityDimension, DataParityCell> = {
    delayedPrice: yahooCell(
      company,
      "Fördröjd kurs från marknadsdata. Saknad kurs förblir saknad.",
    ),
    valuationMetrics: yahooCell(
      company,
      "Nyckeltal från marknadsdata. Saknade fält visas som streck, aldrig som noll.",
    ),
    annualFinancialHistory: yahooCell(
      company,
      "Årsserie från marknadsdata när fälten finns. Tomma år fylls inte med noll.",
    ),
    dividendHistory: yahooCell(
      company,
      "Utbetalda utdelningar från marknadsdata. De årsberäknas inte från en inkompatibel officiell siffra.",
    ),
    officialPress,
    officialReports,
    officialCalendar: officialCell(company, "calendar", company.calendarUrl),
    ceo: officialCell(company, "ceo", company.governanceUrl ?? company.websiteUrl),
    ownership: officialCell(company, "ownership", company.ownershipUrl ?? company.websiteUrl),
    officialDividend: officialCell(company, "dividend", company.websiteUrl),
    fiShortInterest: fiCell(company),
    avanzaUrl: brokerCell(company, "avanzaUrl"),
    nordnetUrl: brokerCell(company, "nordnetUrl"),
    latestReportSnapshot: snapshotCell(company, officialReports),
    divlabArticleAssociation: articleCell(company),
    followSupport: isFollowableCompanySlug(company.slug)
      ? cell("PASS REAL DATA", null, "Katalogbolag kan följas. Okända slugger ignoreras.")
      : cell("NOT APPLICABLE / NO VERIFIED DATA", null, "Sluggen är inte följbar."),
    discussionSupport: cell(
      "PASS REAL DATA",
      null,
      "CompanyComments monteras för varje katalogbolag. Saknad bolagsrad ger en tom diskussion.",
    ),
    aiPortfolioEligibility: aiCell(company),
  };
  return { slug: company.slug, cells };
}

export function auditCatalogDataParity(
  companies: readonly CompanyProfile[] = getPilotCompanies(),
): CatalogParityRow[] {
  return companies.map(rowFor);
}

export type ParityBlocker = {
  slug: string;
  dimension: DataParityDimension;
  status: DataParityStatus;
  sourceUrl: string | null;
  reason: string | null;
};

export function parityBlockers(rows: readonly CatalogParityRow[]): ParityBlocker[] {
  return rows.flatMap((row) => DATA_PARITY_DIMENSIONS.flatMap((dimension) => {
    const item = row.cells[dimension];
    if (item.status !== "BLOCKED BY SOURCE" && item.status !== "SOURCE LINK ONLY") return [];
    return [{
      slug: row.slug,
      dimension,
      status: item.status,
      sourceUrl: item.sourceUrl,
      reason: item.reason,
    }];
  }));
}

export function formatCatalogParityMatrix(rows: readonly CatalogParityRow[]): string {
  const header = ["Bolag", ...MATRIX_DIMENSIONS.map((dimension) => MATRIX_HEADER[dimension])];
  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
  ];
  for (const row of rows) {
    const values = MATRIX_DIMENSIONS.map((dimension) => STATUS_CODE[row.cells[dimension].status]);
    lines.push(`| ${row.slug} | ${values.join(" | ")} |`);
  }
  return lines.join("\n");
}
