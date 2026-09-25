import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import WatchlistBoard from "../components/companies/WatchlistBoard";
import { getCompanyProfile, getPilotCompanies } from "../lib/companies/catalog";
import { followButtonLabel } from "../lib/companies/follow-label";
import { isFollowableCompanySlug } from "../lib/companies/follow-policy";
import { getFollowedCompanyNews } from "../lib/companies/news";
import { VERIFIED_OMXS30_SLUGS } from "../lib/companies/omxs30";
import { sessionExtremes } from "../lib/companies/quote-session";
import {
  buildFollowedCompanyCards,
  companyMatchesQuery,
  formatPrice,
  listDiscoveryCompanies,
  listMarketFilters,
  matchesMarketFilter,
  MISSING_MARKET_VALUE,
  searchCompanies,
  sortDiscoveryCompanies,
  sortFollowedCompanies,
  type DiscoveryCompany,
  type FollowControlModel,
  type FollowedCompanyCard,
  type FollowedCompanyInput,
} from "../lib/companies/watchlist";
import type { NewsArticle } from "../types/news";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function investorInput(followedAt = "2026-09-25T10:00:00.000Z"): FollowedCompanyInput {
  return {
    id: "follow-investor",
    slug: "investor",
    name: "Investor",
    ticker: "INVE-B",
    exchange: "Nasdaq Stockholm",
    logoPath: "/company-logos/investor.svg",
    followedAt,
  };
}

function renderBoard(options: {
  isAvailable?: boolean;
  followed?: FollowedCompanyCard[];
  discovery?: Array<DiscoveryCompany & { isFollowing: boolean }>;
  showEmptyFollows?: boolean;
  showNoFollowMatches?: boolean;
  showNoDiscoveryMatches?: boolean;
  followedCount?: number | null;
}) {
  const discovery =
    options.discovery ??
    listDiscoveryCompanies().map((company) => ({ ...company, isFollowing: false }));
  const followed = options.followed ?? [];

  return renderToStaticMarkup(
    createElement(WatchlistBoard, {
      isAvailable: options.isAvailable ?? true,
      followedCount: options.followedCount === undefined ? followed.length : options.followedCount,
      followed,
      discovery,
      news: [],
      filters: listMarketFilters(listDiscoveryCompanies()),
      query: "",
      sort: "name",
      view: "list",
      filterId: "all",
      showEmptyFollows: options.showEmptyFollows ?? false,
      showNoFollowMatches: options.showNoFollowMatches ?? false,
      showNoDiscoveryMatches: options.showNoDiscoveryMatches ?? false,
      onQueryChange: () => undefined,
      onSortChange: () => undefined,
      onViewChange: () => undefined,
      onFilterChange: () => undefined,
      renderFollow: (company: FollowControlModel) =>
        createElement(
          "button",
          { type: "submit" },
          company.followMode === "unfollow"
            ? "Sluta följ"
            : company.isFollowing
              ? "Följer ✓"
              : "+ Följ",
        ),
    }),
  );
}

test("följda bolag renderas med riktiga fält och saknad data som tankstreck", () => {
  const [priced] = buildFollowedCompanyCards([investorInput()], {
    investor: {
      price: 268.4,
      change: 4.2,
      changePct: 1.59,
      currency: "SEK",
      sessionVolume: 1_250_000,
      marketTimestamp: "2026-09-25T13:04:00.000Z",
      marketCap: 820_000_000_000,
      dayHigh: 270.1,
      dayLow: 265.4,
      sparkline: [260, 268.4],
    },
  });
  const [missing] = buildFollowedCompanyCards(
    [{ ...investorInput(), id: "missing", slug: "volvo" }],
    {},
  );

  assert.equal(priced?.displayName, "Investor B");
  assert.equal(priced?.ticker, "INVE B");
  assert.equal(priced?.priceLabel, formatPrice(268.4, "SEK"));
  assert.match(priced?.priceLabel ?? "", /268,40 SEK/);
  assert.equal(priced?.tone, "positive");
  assert.equal(priced?.sparkline?.length, 2);
  assert.match(priced?.marketCapLabel ?? "", /md SEK/);
  assert.equal(missing?.priceLabel, MISSING_MARKET_VALUE);
  assert.equal(missing?.changeLabel, MISSING_MARKET_VALUE);
  assert.equal(missing?.changePctLabel, MISSING_MARKET_VALUE);
  assert.equal(missing?.dayHighLabel, MISSING_MARKET_VALUE);
  assert.equal(missing?.dayLowLabel, MISSING_MARKET_VALUE);
  assert.equal(missing?.volumeLabel, MISSING_MARKET_VALUE);
  assert.equal(missing?.marketCapLabel, MISSING_MARKET_VALUE);
  assert.equal(missing?.timestampLabel, MISSING_MARKET_VALUE);
  assert.equal(missing?.sparkline, null);

  const html = renderBoard({
    followed: [missing!],
    followedCount: 1,
    discovery: listDiscoveryCompanies().map((company) => ({
      ...company,
      isFollowing: company.slug === "volvo",
    })),
  });

  assert.match(html, /Volvo B/);
  assert.match(html, /Visa bolagssida/);
  assert.match(html, /Sluta följ/);
  assert.match(html, /Följda bolag \(1\)/);
  assert.match(html, new RegExp(MISSING_MARKET_VALUE));
  assert.doesNotMatch(html, /Senaste stängningskurser/);
  assert.match(html, /Följer ✓/);
});

test("tom följlista renderar discovery och inte den gamla pilottexten", () => {
  const html = renderBoard({ showEmptyFollows: true, followedCount: 0 });

  assert.match(html, /Du följer inga bolag ännu/);
  assert.match(html, /Upptäck bolag/);
  assert.match(html, /Investor B/);
  assert.match(html, /\+ Följ/);
  assert.doesNotMatch(html, /pilotbolag/i);
  assert.doesNotMatch(html, /officiella bevakningen/);
  assert.doesNotMatch(html, /Följda bolag \(0\)/);
});

test("discovery visar bara följbara bolag och markerar följda", () => {
  const discovery = listDiscoveryCompanies();
  const slugs = discovery.map((company) => company.slug);

  assert.equal(discovery.length, 30);
  assert.deepEqual(new Set(slugs), new Set(getPilotCompanies().map((company) => company.slug)));
  assert.equal(slugs.includes("apple"), false);
  assert.ok(discovery.every((company) => company.indexLabels.includes("OMXS30")));

  const followed = new Set(["investor"]);
  const marked = discovery.filter((company) => followed.has(company.slug));
  assert.deepEqual(marked.map((company) => company.slug), ["investor"]);
});

test("sök är skiftlägesokänslig och träffar ticker, namn och slug", () => {
  const companies = listDiscoveryCompanies();
  const investor = companies.find((company) => company.slug === "investor");
  assert.ok(investor);

  assert.equal(companyMatchesQuery(investor, "investor"), true);
  assert.equal(companyMatchesQuery(investor, "INVESTOR"), true);
  assert.equal(companyMatchesQuery(investor, "iNvEsToR b"), true);
  assert.equal(companyMatchesQuery(investor, "inve b"), true);
  assert.equal(companyMatchesQuery(investor, "INVE-B"), true);
  assert.equal(companyMatchesQuery(investor, "investor"), true);
  assert.deepEqual(
    searchCompanies(companies, "VOLV B").map((company) => company.slug),
    ["volvo"],
  );
  assert.deepEqual(
    searchCompanies(companies, "atlas-copco").map((company) => company.slug),
    ["atlas-copco"],
  );
  assert.deepEqual(searchCompanies(companies, "inte-ett-bolag"), []);
});

test("index- och marknadsfilter visar bara verifierade medlemmar", () => {
  const companies = listDiscoveryCompanies();
  const filters = listMarketFilters(companies);

  assert.deepEqual(
    filters.map((filter) => filter.label),
    ["Alla", "OMXS30", "Sverige"],
  );
  assert.equal(
    filters.some((filter) => /nasdaq|s&p|dax|russell|usa|tyskland|europa/i.test(filter.label)),
    false,
  );

  const omx = companies.filter((company) => matchesMarketFilter(company, "omxs30"));
  assert.equal(omx.length, 30);
  assert.ok(omx.every((company) => company.indexLabels.includes("OMXS30")));

  const outsider: DiscoveryCompany = {
    ...companies[0]!,
    slug: "apple",
    name: "Apple",
    displayName: "Apple",
    ticker: "AAPL",
    countryCode: "US",
    countryName: "USA",
    indexLabels: [],
    exchange: "Nasdaq",
  };

  assert.equal(matchesMarketFilter(outsider, "omxs30"), false);
  assert.equal(matchesMarketFilter(outsider, "country:SE"), false);
  assert.equal(matchesMarketFilter(outsider, "nasdaq-100"), false);
  assert.equal(matchesMarketFilter(companies[0]!, "country:SE"), true);
  assert.deepEqual(new Set(VERIFIED_OMXS30_SLUGS), new Set(companies.map((company) => company.slug)));
  assert.equal((VERIFIED_OMXS30_SLUGS as readonly string[]).includes("apple"), false);
});

test("sortering följer namn, börs och senast följda", () => {
  const base = listDiscoveryCompanies()[0]!;
  const rows = [
    { ...base, slug: "zeta", displayName: "Öresund", exchange: "Zebra", followedAt: "2026-09-01T00:00:00.000Z" },
    { ...base, slug: "alfa", displayName: "Alfa", exchange: "Alfa Market", followedAt: "2026-09-03T00:00:00.000Z" },
    { ...base, slug: "angel", displayName: "Ängelholm", exchange: "Mid", followedAt: "2026-09-02T00:00:00.000Z" },
  ];

  assert.deepEqual(
    sortDiscoveryCompanies(rows, "name", new Map()).map((company) => company.displayName),
    ["Alfa", "Ängelholm", "Öresund"],
  );
  assert.deepEqual(
    sortDiscoveryCompanies(rows, "exchange", new Map()).map((company) => company.slug),
    ["alfa", "angel", "zeta"],
  );
  assert.deepEqual(
    sortFollowedCompanies(rows, "recent").map((company) => company.slug),
    ["alfa", "angel", "zeta"],
  );
  assert.deepEqual(
    sortDiscoveryCompanies(rows, "recent", new Map([["zeta", rows[0]!.followedAt]])).map(
      (company) => company.slug,
    ),
    ["zeta", "alfa", "angel"],
  );
});

test("följ och avfölj använder befintligt action-kontrakt", () => {
  const button = read("components/companies/FollowCompanyButton.tsx");
  const actions = read("app/bolag/actions.ts");

  assert.match(button, /setCompanyFollowAction/);
  assert.match(button, /name="companySlug"/);
  assert.match(button, /name="follow"/);
  assert.match(button, /followButtonLabel/);
  assert.equal(followButtonLabel(false, "page"), "+ Följ bolaget");
  assert.equal(followButtonLabel(true, "page"), "Följer ✓");
  assert.equal(followButtonLabel(true, "unfollow"), "Sluta följ");
  assert.equal(followButtonLabel(false, "discovery"), "+ Följ");
  assert.equal(followButtonLabel(true, "discovery"), "Följer ✓");
  assert.match(actions, /if \(!isFollowableCompanySlug\(slug\)\)/);
  assert.match(actions, /\.from\("company_follows"\)/);
  assert.match(actions, /revalidatePath\("\/watchlist"\)/);
  assert.match(actions, /\.eq\("is_active", true\)/);
});

test("okänt eller icke-följbart bolag stoppas innan följningen skrivs", () => {
  assert.equal(isFollowableCompanySlug("investor"), true);
  assert.equal(isFollowableCompanySlug("volvo"), true);
  assert.equal(isFollowableCompanySlug("apple"), false);
  assert.equal(isFollowableCompanySlug("nasdaq-100"), false);
  assert.equal(isFollowableCompanySlug("ATLAS"), false);
  assert.equal(isFollowableCompanySlug("../investor"), false);
  assert.equal(isFollowableCompanySlug("investor;drop"), false);
  assert.equal(isFollowableCompanySlug(""), false);
  assert.equal(getCompanyProfile("apple"), null);
});

test("schema unavailable skiljs från tom följlista", () => {
  const unavailable = renderBoard({
    isAvailable: false,
    followedCount: null,
    showEmptyFollows: false,
    discovery: listDiscoveryCompanies().slice(0, 2).map((company) => ({
      ...company,
      isFollowing: false,
    })),
  });
  const empty = renderBoard({ showEmptyFollows: true, followedCount: 0 });

  assert.match(unavailable, /Följlistan är tillfälligt otillgänglig/);
  assert.match(unavailable, /Det betyder inte att listan är tom/);
  assert.doesNotMatch(unavailable, /Du följer inga bolag ännu/);
  assert.match(unavailable, /Upptäck bolag/);
  assert.match(empty, /Du följer inga bolag ännu/);
  assert.doesNotMatch(empty, /tillfälligt otillgänglig/);
});

test("dagshögsta och sparkline kräver riktig session och minst två stängningar", () => {
  assert.deepEqual(
    sessionExtremes("2026-09-25T13:04:00.000Z", {
      date: "2026-09-25",
      high: 270.1,
      low: 265.4,
      volume: 10,
    }),
    { dayHigh: 270.1, dayLow: 265.4, sessionVolume: 10 },
  );
  assert.deepEqual(
    sessionExtremes("2026-09-25T13:04:00.000Z", {
      date: "2026-09-24",
      high: 270.1,
      low: 265.4,
      volume: 10,
    }),
    { dayHigh: null, dayLow: null, sessionVolume: null },
  );

  const [shortSeries] = buildFollowedCompanyCards([investorInput()], {
    investor: {
      price: 100,
      change: null,
      changePct: null,
      currency: "SEK",
      sessionVolume: null,
      marketTimestamp: null,
      marketCap: null,
      dayHigh: null,
      dayLow: null,
      sparkline: [100],
    },
  });
  assert.equal(shortSeries?.sparkline, null);

  const marketData = read("lib/companies/market-data.ts");
  const sparkline = read("components/companies/PriceSparkline.tsx");
  assert.match(marketData, /\.slice\(-30\)/);
  assert.match(marketData, /getFollowedCompaniesMarketData/);
  assert.doesNotMatch(marketData, /sparkline:\s*\[/);
  assert.doesNotMatch(sparkline, /mock|fake|placeholder/i);
});

test("/watchlist kräver auth och hämtar marknadsdata bara för följda bolag", () => {
  const page = read("app/watchlist/page.tsx");
  const board = read("components/companies/WatchlistBoard.tsx");

  assert.match(page, /requireAuthenticatedUser\(\)/);
  assert.doesNotMatch(page, /allowGuest/);
  assert.match(page, /getFollowedCompaniesMarketData\(watchlist\.companies\.map/);
  assert.doesNotMatch(page, /getFollowedCompaniesMarketData\(\s*listDiscoveryCompanies/);
  assert.doesNotMatch(board, /officiella bevakningen/);
  assert.doesNotMatch(board, /pilotbolag/i);
  assert.doesNotMatch(board, /Livekurser/);
});

test("följmigrationens RLS är oförändrad i kontraktet", () => {
  const migration = read("supabase/migrations/20260921182717_create_company_following.sql");

  assert.match(migration, /alter table public\.company_follows enable row level security/);
  assert.match(migration, /create policy company_follows_own_read/);
  assert.match(migration, /create policy company_follows_own_insert/);
  assert.match(migration, /create policy company_follows_own_delete/);
  assert.doesNotMatch(migration, /create policy company_follows_own_update/);
  assert.match(migration, /\(select auth\.uid\(\)\) = user_id/);
});

test("befintlig bolagssida behåller sitt marknadsdata- och följkontrakt", () => {
  const page = read("app/bolag/[slug]/page.tsx");
  const content = read("components/companies/CompanyPageContent.tsx");

  assert.match(page, /CompanyPageContent/);
  assert.match(page, /getCompanyMarketData\(company\)/);
  assert.match(content, /FollowCompanyButton/);
  assert.match(content, /companySlug=\{company\.slug\}/);
  assert.doesNotMatch(content, /mode="unfollow"/);
  assert.doesNotMatch(content, /mode="discovery"/);
});

test("personligt nyhetsurval använder bara artiklar som matchar följda bolag", () => {
  const investor = getCompanyProfile("investor");
  const volvo = getCompanyProfile("volvo");
  assert.ok(investor && volvo);

  function article(id: string, companies: string[]): NewsArticle {
    return {
      id,
      title: id,
      summary: id,
      category: "company",
      source: "DivLab",
      publishedAt: `2026-09-${id === "newer" ? "25" : "21"}T08:00:00.000Z`,
      url: null,
      featured: false,
      internalLinking: { companies },
    };
  }

  const news = getFollowedCompanyNews(
    [investor],
    [article("older", ["Investor"]), article("newer", ["Investor"]), article("other", ["Volvo"])],
    1,
  );

  assert.deepEqual(news.map((item) => item.id), ["newer"]);
  assert.equal(
    getFollowedCompanyNews([volvo], [article("other", ["Investor"])]).length,
    0,
  );
});
