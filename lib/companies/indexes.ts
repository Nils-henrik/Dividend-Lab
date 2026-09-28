import { DAX40_COMPANIES } from "@/lib/companies/catalog/dax40";
import {
  NASDAQ100_COMPANIES,
  NASDAQ100_SECURITIES,
} from "@/lib/companies/catalog/nasdaq100";

/**
 * Verified followable index membership.
 *
 * OMXS30, DAX 40 and Nasdaq-100 use the same shape. Watchlist filters are
 * built from these definitions. There is no per-index branch in discovery.
 *
 * OMXS30 source: Nasdaq OMXS30 composition as of 1 July 2025, unchanged at
 * the semi-annual review effective 1 June 2026.
 *
 * DAX 40 source: STOXX public selection list
 * slpublic_daxk_20260902.csv, Index Membership = DAXK (40 constituents).
 * https://www.stoxx.com/documents/stoxxnet/Documents/Reports/DAXSelectionList/2026/September/slpublic_daxk_20260902.csv
 * STOXX announced on 3 September 2026 that DAX had no additions or deletions.
 * That review became effective on 21 September 2026.
 * https://stoxx.com/stoxx-announces-scheduled-adjustments-to-dax-blue-chip-indices-sep-3-2026/
 *
 * Nasdaq-100 source: Nasdaq Index Weighting for NDX, end of day 25 September 2026.
 * https://indexes.nasdaq.com/Index/Weighting/NDX
 * The file contains 101 securities. Alphabet is one issuer with Class A
 * (GOOGL) and Class C (GOOG). DivLab keeps one company, alphabet, on GOOGL.
 */
export const COMPANY_INDEX_IDS = ["omxs30", "dax40", "nasdaq100"] as const;

export type CompanyIndexId = (typeof COMPANY_INDEX_IDS)[number];

export type CompanyIndexDefinition = {
  id: CompanyIndexId;
  label: string;
  market: string;
  region: string;
  verifiedAsOf: string;
  sourceUrl: string;
  sourcePublisher: string;
  constituentSlugs: readonly string[];
  securityCount: number;
  issuerCount: number;
  shareClassNote: string;
};

const VERIFIED_OMXS30_SLUG_ORDER = [
  "abb",
  "addtech",
  "alfa-laval",
  "assa-abloy",
  "astrazeneca",
  "atlas-copco",
  "boliden",
  "epiroc",
  "eqt",
  "ericsson",
  "essity",
  "evolution",
  "handelsbanken",
  "hexagon",
  "hm",
  "industrivarden",
  "investor",
  "lifco",
  "nibe",
  "nordea",
  "saab",
  "sandvik",
  "sca",
  "seb",
  "skanska",
  "skf",
  "swedbank",
  "tele2",
  "telia",
  "volvo",
] as const;

const nasdaqIssuerSlugs = NASDAQ100_COMPANIES.map((company) => company.slug);

export const COMPANY_INDEXES: readonly CompanyIndexDefinition[] = [
  {
    id: "omxs30",
    label: "OMXS30",
    market: "Nasdaq Stockholm",
    region: "Sverige",
    verifiedAsOf: "2026-06-01",
    sourceUrl: "https://indexes.nasdaq.com/Index/Overview/OMXS30",
    sourcePublisher: "Nasdaq",
    constituentSlugs: VERIFIED_OMXS30_SLUG_ORDER,
    securityCount: VERIFIED_OMXS30_SLUG_ORDER.length,
    issuerCount: VERIFIED_OMXS30_SLUG_ORDER.length,
    shareClassNote:
      "One canonical share class per issuer, the same 30 followable OMXS30 companies as before.",
  },
  {
    id: "dax40",
    label: "DAX 40",
    market: "Xetra",
    region: "Tyskland",
    verifiedAsOf: "2026-09-21",
    sourceUrl:
      "https://www.stoxx.com/documents/stoxxnet/Documents/Reports/DAXSelectionList/2026/September/slpublic_daxk_20260902.csv",
    sourcePublisher: "STOXX Ltd.",
    constituentSlugs: DAX40_COMPANIES.map((company) => company.slug),
    securityCount: DAX40_COMPANIES.length,
    issuerCount: DAX40_COMPANIES.length,
    shareClassNote:
      "40 securities and 40 issuers. Volkswagen and Henkel enter through their preferred lines, VOW3 and HEN3, not as a second company.",
  },
  {
    id: "nasdaq100",
    label: "Nasdaq-100",
    market: "Nasdaq",
    region: "USA",
    verifiedAsOf: "2026-09-25",
    sourceUrl: "https://indexes.nasdaq.com/Index/Weighting/NDX",
    sourcePublisher: "Nasdaq",
    constituentSlugs: nasdaqIssuerSlugs,
    securityCount: NASDAQ100_SECURITIES.length,
    issuerCount: new Set(NASDAQ100_SECURITIES.map((security) => security.issuerSlug)).size,
    shareClassNote:
      "101 securities and 100 issuers. GOOGL and GOOG are both index securities of Alphabet. The DivLab company is alphabet and the canonical listing is GOOGL.",
  },
];

const MEMBERS = new Map<CompanyIndexId, ReadonlySet<string>>(
  COMPANY_INDEXES.map((index) => [index.id, new Set(index.constituentSlugs)]),
);

export function indexById(id: string): CompanyIndexDefinition | null {
  return COMPANY_INDEXES.find((index) => index.id === id) ?? null;
}

export function indexIdsForSlug(slug: string): CompanyIndexId[] {
  return COMPANY_INDEXES.filter((index) => MEMBERS.get(index.id)?.has(slug)).map(
    (index) => index.id,
  );
}

export function indexLabelsForSlug(slug: string): string[] {
  const ids = new Set(indexIdsForSlug(slug));
  return COMPANY_INDEXES.filter((index) => ids.has(index.id)).map((index) => index.label);
}

export function indexIdsForSlugIn(
  slug: string,
  indexes: readonly Pick<CompanyIndexDefinition, "id" | "constituentSlugs">[],
): CompanyIndexId[] {
  return indexes
    .filter((index) => index.constituentSlugs.includes(slug))
    .map((index) => index.id);
}
