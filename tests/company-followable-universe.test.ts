import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CompanyPageContent from "../components/companies/CompanyPageContent";
import { getCompanyCatalog, getCompanyProfile } from "../lib/companies/catalog";
import { DAX40_COMPANIES } from "../lib/companies/catalog/dax40";
import {
  NASDAQ100_COMPANIES,
  NASDAQ100_SECURITIES,
} from "../lib/companies/catalog/nasdaq100";
import { companySourceDisclaimer } from "../lib/companies/documents-view";
import { isFollowableCompanySlug } from "../lib/companies/follow-policy";
import { SUPPORTED_COMPANY_INGESTION_SLUGS } from "../lib/companies/ingestion/queue";
import {
  COMPANY_INDEXES,
  indexIdsForSlug,
  indexIdsForSlugIn,
} from "../lib/companies/indexes";
import { assembleCompanyOfficialData } from "../lib/companies/official-data";
import { isSubstantiveCompanyPage } from "../lib/companies/page-policy";
import {
  listDiscoveryCompanies,
  listMarketFilters,
  matchesMarketFilter,
  searchCompanies,
} from "../lib/companies/watchlist";
import type { CompanyMarketData } from "../lib/companies/market-data";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const EXPECTED_INGESTION_SLUGS = [
  "investor",
  "volvo",
  "ericsson",
  "atlas-copco",
  "astrazeneca",
  "saab",
  "sandvik",
  "sca",
  "addtech",
  "eqt",
  "evolution",
  "nibe",
  "essity",
  "hm",
  "alfa-laval",
  "assa-abloy",
  "handelsbanken",
];

test("OMXS30, DAX 40 and Nasdaq-100 share one membership model", () => {
  const watchlist = read("lib/companies/watchlist.ts");
  const omx = COMPANY_INDEXES.find((index) => index.id === "omxs30");
  const dax = COMPANY_INDEXES.find((index) => index.id === "dax40");
  const nasdaq = COMPANY_INDEXES.find((index) => index.id === "nasdaq100");

  assert.deepEqual(
    COMPANY_INDEXES.map((index) => index.id),
    ["omxs30", "dax40", "nasdaq100"],
  );
  assert.equal(omx?.constituentSlugs.length, 30);
  assert.equal(omx?.securityCount, 30);
  assert.equal(dax?.constituentSlugs.length, 40);
  assert.equal(dax?.securityCount, 40);
  assert.equal(dax?.issuerCount, 40);
  assert.equal(nasdaq?.securityCount, 101);
  assert.equal(nasdaq?.issuerCount, 100);
  assert.equal(NASDAQ100_SECURITIES.length, 101);
  assert.equal(NASDAQ100_COMPANIES.length, 100);
  assert.equal(
    NASDAQ100_SECURITIES.filter((security) => security.issuerSlug === "alphabet")
      .map((security) => security.symbol)
      .sort()
      .join(","),
    "GOOG,GOOGL",
  );
  assert.equal(getCompanyProfile("alphabet")?.ticker, "GOOGL");
  assert.equal(getCompanyProfile("goog"), null);
  assert.doesNotMatch(watchlist, /filterId === "omxs30"/);
  assert.doesNotMatch(watchlist, /filterId === "dax40"/);
  assert.doesNotMatch(watchlist, /filterId === "nasdaq100"/);
  assert.match(dax?.sourcePublisher ?? "", /STOXX/);
  assert.equal(dax?.verifiedAsOf, "2026-09-21");
  assert.equal(nasdaq?.verifiedAsOf, "2026-09-25");
  assert.match(nasdaq?.sourceUrl ?? "", /indexes\.nasdaq\.com/);
});

test("katalogens slugs och seed-rader är unika och täcker indexen", () => {
  const catalog = getCompanyCatalog();
  const slugs = catalog.map((company) => company.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(catalog.length, 170);

  for (const index of COMPANY_INDEXES) {
    assert.equal(new Set(index.constituentSlugs).size, index.constituentSlugs.length);
    for (const slug of index.constituentSlugs) {
      assert.ok(getCompanyProfile(slug), slug);
    }
  }

  const migration = read("supabase/migrations/20260928150000_seed_global_followable_companies.sql");
  const companySql = migration.split("insert into public.company_instruments")[0] ?? "";
  const seeded = [...companySql.matchAll(/^\s+\('([a-z0-9-]+)',/gm)].map((match) => match[1]);
  assert.equal(new Set(seeded).size, seeded.length);
  assert.equal(seeded.length, 140);
  assert.equal(seeded.includes("investor"), false);
  assert.equal(seeded.filter((slug) => slug === "alphabet").length, 1);
  assert.doesNotMatch(migration, /insert into public\.company_sources/i);
  assert.match(migration, /on conflict \(slug\) do nothing/);
  assert.match(migration, /on conflict \(company_id, exchange_name, symbol\) do nothing/);
  assert.doesNotMatch(migration, /supported_company_ingestion|enqueue_company/i);
});

test("ett bolag kan matcha flera index utan att dupliceras", () => {
  const ids = indexIdsForSlugIn("siemens", [
    { id: "dax40", constituentSlugs: ["siemens", "sap"] },
    { id: "nasdaq100", constituentSlugs: ["siemens", "apple"] },
  ]);
  assert.deepEqual(ids, ["dax40", "nasdaq100"]);

  const siemens = listDiscoveryCompanies().find((company) => company.slug === "siemens");
  assert.ok(siemens);
  assert.deepEqual(indexIdsForSlug("siemens"), ["dax40"]);
  assert.equal(
    listDiscoveryCompanies().filter((company) => company.slug === "siemens").length,
    1,
  );
  assert.equal(matchesMarketFilter({ ...siemens, indexIds: ids }, "dax40"), true);
  assert.equal(matchesMarketFilter({ ...siemens, indexIds: ids }, "nasdaq100"), true);
  assert.equal(
    new Set(getCompanyCatalog().map((company) => company.slug)).size,
    getCompanyCatalog().length,
  );
});

test("discovery-filter och sök träffar DAX och Nasdaq utan extra quote-fanout", () => {
  const companies = listDiscoveryCompanies();
  const filters = listMarketFilters(companies);
  assert.deepEqual(
    filters.filter((filter) => filter.kind === "index").map((filter) => filter.id),
    ["omxs30", "dax40", "nasdaq100"],
  );
  assert.deepEqual(
    filters.filter((filter) => filter.kind === "country").map((filter) => filter.id),
    ["country:NL", "country:SE", "country:DE", "country:US"],
  );
  assert.equal(companies.filter((company) => matchesMarketFilter(company, "dax40")).length, 40);
  assert.equal(
    companies.filter((company) => matchesMarketFilter(company, "nasdaq100")).length,
    100,
  );
  assert.equal(companies.filter((company) => matchesMarketFilter(company, "country:DE")).length, 38);
  assert.equal(companies.filter((company) => matchesMarketFilter(company, "country:NL")).length, 2);

  for (const query of ["Siemens", "SAP", "Allianz", "Apple", "Microsoft", "Nvidia", "Amazon", "Alphabet"]) {
    assert.equal(searchCompanies(companies, query).length > 0, true, query);
  }
  assert.deepEqual(searchCompanies(companies, "SIE.DE").map((company) => company.slug), ["siemens"]);
  assert.deepEqual(searchCompanies(companies, "GOOG").map((company) => company.slug), ["alphabet"]);

  const page = read("app/watchlist/page.tsx");
  const marketData = read("lib/companies/market-data.ts");
  assert.match(page, /getFollowedCompaniesMarketData\(watchlist\.companies\.map/);
  assert.doesNotMatch(page, /getFollowedCompaniesMarketData\(\s*listDiscoveryCompanies/);
  assert.doesNotMatch(marketData, /listDiscoveryCompanies/);
});

test("nya bolag går att följa, okända slugs blockeras och ingestion är orörd", () => {
  assert.equal(isFollowableCompanySlug("siemens"), true);
  assert.equal(isFollowableCompanySlug("apple"), true);
  assert.equal(isFollowableCompanySlug("alphabet"), true);
  assert.equal(isFollowableCompanySlug("not-a-company"), false);
  assert.equal(isFollowableCompanySlug("SIEMENS"), false);
  assert.deepEqual([...SUPPORTED_COMPANY_INGESTION_SLUGS], EXPECTED_INGESTION_SLUGS);
  assert.equal(
    (SUPPORTED_COMPANY_INGESTION_SLUGS as readonly string[]).includes("siemens"),
    false,
  );
  assert.equal(
    (SUPPORTED_COMPANY_INGESTION_SLUGS as readonly string[]).includes("apple"),
    false,
  );
  assert.doesNotMatch(read("lib/companies/ingestion/queue.ts"), /dax40|nasdaq100/);
});

test("tunna bolagssidor är noindex och visar ingen fejkad officiell data", () => {
  const investor = getCompanyProfile("investor");
  const siemens = getCompanyProfile("siemens");
  const apple = getCompanyProfile("apple");
  assert.ok(investor && siemens && apple);
  assert.equal(isSubstantiveCompanyPage(investor), true);
  assert.equal(isSubstantiveCompanyPage(siemens), false);
  assert.equal(isSubstantiveCompanyPage(apple), false);
  assert.equal(
    getCompanyCatalog().filter((company) => isSubstantiveCompanyPage(company)).length,
    30,
  );

  const official = assembleCompanyOfficialData({
    slug: siemens.slug,
    pressReleasesUrl: siemens.websiteUrl ?? "",
    reportsUrl: siemens.websiteUrl ?? "",
    calendarUrl: siemens.websiteUrl ?? "",
    profileUrl: siemens.websiteUrl ?? "",
    documents: [],
    documentQuery: "ok",
    facts: [],
    ownership: [],
    profileQuery: "ok",
    sources: [],
  });
  assert.equal(official.pressReleases.status, "source_link_only");
  assert.equal(official.reports.status, "source_link_only");
  assert.equal(official.events.status, "source_link_only");
  assert.equal(official.ownership.status, "source_link_only");
  assert.deepEqual(official.pressReleases.items, []);
  assert.deepEqual(official.reports.items, []);
  assert.deepEqual(official.ownership.items, []);
  assert.equal(official.ceo.name, null);

  const disclaimer = companySourceDisclaimer(siemens);
  assert.match(disclaimer, /hämtar inte officiella rapporter/);
  assert.doesNotMatch(disclaimer, /hämtas från/);
  assert.doesNotMatch(disclaimer, /kunde inte hämtas/i);
  assert.match(companySourceDisclaimer(investor), /Investor AB/);

  const marketData: CompanyMarketData = {
    price: null,
    previousClose: null,
    change: null,
    changePct: null,
    currency: null,
    volume: null,
    marketTimestamp: null,
    marketCap: null,
    peRatio: null,
    dividendYield: null,
    week52Low: null,
    week52High: null,
    dayHigh: null,
    dayLow: null,
    sessionVolume: null,
    sparkline: [],
    sourceUrl: "https://finance.yahoo.com/quote/SIE.DE",
    fetchedAt: "2026-09-28T00:00:00.000Z",
  };
  const html = renderToStaticMarkup(
    createElement(CompanyPageContent, {
      company: siemens,
      articles: [],
      isAuthenticated: false,
      followState: {
        companyId: null,
        isAvailable: true,
        isFollowing: false,
        documents: [],
      },
      relatedCompanies: [],
      marketData,
      relatedMarketData: {},
      officialData: official,
    }),
  );

  assert.match(html, /Siemens/);
  assert.match(html, /SIE/);
  assert.match(html, /Xetra/);
  assert.match(html, /Kursgraf för Siemens/);
  assert.match(html, /Följ/);
  assert.match(html, /Inga publicerade DivLab-nyheter/);
  assert.doesNotMatch(html, /Datan kunde inte hämtas/);
  assert.doesNotMatch(html, /Grundat/);
  assert.doesNotMatch(html, /Huvudkontor/);
  assert.equal(DAX40_COMPANIES[0]?.slug, "siemens");
});
