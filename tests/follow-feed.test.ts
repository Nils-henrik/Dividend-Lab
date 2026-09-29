import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FollowFeedList from "../components/companies/FollowFeedList";
import WatchlistBoard from "../components/companies/WatchlistBoard";
import { decideFollowWrite, FOLLOW_PREMIUM_PLAN } from "../lib/companies/follow-policy";
import {
  buildFollowFeed,
  filterFollowFeed,
  followFeedCalendarEventAfter,
  followFeedCompanyFromOfficial,
  followFeedDocumentPublishedAfter,
  FOLLOW_FEED_FILTERS,
  FOLLOW_FEED_LIMIT,
  type FollowFeedCompanyInput,
  type FollowFeedModel,
} from "../lib/companies/follow-feed";
import { persistedFactFromRow, type CompanyOfficialData } from "../lib/companies/official-data";
import { listDiscoveryCompanies, listMarketFilters, type FollowControlModel } from "../lib/companies/watchlist";

const NOW = new Date("2026-09-29T10:00:00.000Z");

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function company(overrides: Partial<FollowFeedCompanyInput> = {}): FollowFeedCompanyInput {
  return {
    slug: "nordea",
    name: "Nordea",
    ticker: "NDA SE",
    reports: [],
    press: [],
    events: [],
    dividends: [],
    articles: [],
    priceMove: null,
    ...overrides,
  };
}

function section<T>(status: CompanyOfficialData["reports"]["status"], items: T[] = []) {
  return {
    status,
    items,
    sourceUrl: "https://www.nordea.com/en/investors",
    sourcePublisher: "Nordea",
    asOf: null,
  };
}

test("flödet innehåller bara bolag som skickas in", () => {
  const feed = buildFollowFeed({
    followedCount: 1,
    available: true,
    now: NOW,
    companies: [
      company({
        reports: [{
          title: "Nordea half-year results 2026",
          date: "2026-09-16",
          url: "https://www.nordea.com/en/press/2026-07-16/half-year-results",
          publisher: "Nordea",
        }],
      }),
    ],
  });

  assert.deepEqual(feed.items.map((item) => item.companySlug), ["nordea"]);
  assert.equal(feed.items.some((item) => item.title.includes("Tele2")), false);
});

test("användare A och B delas inte via user id i flödesläsaren", () => {
  const page = read("app/watchlist/page.tsx");
  const loader = read("lib/companies/follow-feed.server.ts");

  assert.match(page, /requireAuthenticatedUser\(\)/);
  assert.match(page, /getFollowedCompanies\(user\.id\)/);
  assert.match(page, /loadFollowedOfficialRecords\(watchlist\.companies\.map/);
  assert.doesNotMatch(page, /searchParams/);
  assert.doesNotMatch(page, /userId/);
  assert.doesNotMatch(loader, /user_id|userId/);
  assert.match(loader, /createClient\(\)/);
  assert.doesNotMatch(loader, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("noll följda bolag ger onboarding utan påhittade kort", () => {
  const feed = buildFollowFeed({
    companies: [company({
      reports: [{
        title: "Ska inte synas",
        date: "2026-09-20",
        url: "https://www.nordea.com/en/press/report",
        publisher: "Nordea",
      }],
    })],
    followedCount: 0,
    available: true,
    now: NOW,
  });

  assert.equal(feed.mode, "onboarding");
  assert.deepEqual(feed.items, []);
  assert.equal(feed.summary.followedCount, 0);
});

test("händelsefilter delar rapport, kalender, press, utdelning och artikel", () => {
  const feed = buildFollowFeed({
    followedCount: 1,
    available: true,
    now: NOW,
    companies: [company({
      events: [{
        title: "Kvartalsrapport Q3",
        date: "2026-10-20",
        url: "https://www.tele2.com/investors/calendar/q3",
        publisher: "Tele2",
      }],
      reports: [{
        title: "Half-year results",
        date: "2026-09-16",
        url: "https://www.nordea.com/en/press/half-year",
        publisher: "Nordea",
      }],
      press: [{
        title: "Changes in leadership",
        date: "2026-09-18",
        url: "https://www.nordea.com/en/press/leadership",
        publisher: "Nordea",
      }],
      dividends: [{
        kind: "decided",
        title: "Beslutad utdelning 0,34 EUR",
        date: "2026-09-21",
        url: "https://www.nordea.com/en/press/dividend",
        publisher: "Nordea",
      }],
      articles: [{
        id: "article-nordea",
        title: "Nordea i fokus",
        publishedAt: "2026-09-22T08:00:00.000Z",
        href: "/news/nordea-i-fokus",
      }],
    })],
  });

  assert.deepEqual(
    FOLLOW_FEED_FILTERS.map((filter) => filter.label),
    ["Alla", "Rapporter", "Kalender", "Pressmeddelanden", "Utdelning", "DivLab-artiklar"],
  );
  assert.equal(filterFollowFeed(feed.items, "all").length, 5);
  assert.deepEqual(filterFollowFeed(feed.items, "reports").map((item) => item.kind), ["report"]);
  assert.deepEqual(filterFollowFeed(feed.items, "calendar").map((item) => item.kind), ["calendar"]);
  assert.deepEqual(filterFollowFeed(feed.items, "press").map((item) => item.kind), ["press"]);
  assert.deepEqual(filterFollowFeed(feed.items, "dividend").map((item) => item.kind), ["dividend"]);
  assert.deepEqual(filterFollowFeed(feed.items, "articles").map((item) => item.kind), ["article"]);
  assert.equal(filterFollowFeed(feed.items, "reports").some((item) => item.kind === "price_move"), false);
});

test("ordningen är kalender, rapport, utdelning, press, artikel och kurs", () => {
  const feed = buildFollowFeed({
    followedCount: 2,
    available: true,
    now: NOW,
    companies: [
      company({
        slug: "tele2",
        name: "Tele2",
        ticker: "TEL2 B",
        events: [
          {
            title: "Senare rapport",
            date: "2026-10-20",
            url: "https://www.tele2.com/investors/calendar/q3",
            publisher: "Tele2",
          },
          {
            title: "Nästa rapport",
            date: "2026-10-02",
            url: "https://www.tele2.com/investors/calendar/soon",
            publisher: "Tele2",
          },
        ],
        articles: [{
          id: "tele2-artikel",
          title: "Tele2 i DivLab",
          publishedAt: "2026-09-27T06:00:00.000Z",
          href: "/news/tele2",
        }],
        priceMove: {
          changePct: 3.25,
          marketTimestamp: "2026-09-29T08:00:00.000Z",
          sourceUrl: "https://finance.yahoo.com/quote/TEL2-B.ST",
        },
      }),
      company({
        reports: [{
          title: "Half-year results",
          date: "2026-09-10",
          url: "https://www.nordea.com/en/press/half-year",
          publisher: "Nordea",
        }],
        press: [{
          title: "Changes in leadership",
          date: "2026-09-25T08:00:00.000Z",
          url: "https://www.nordea.com/en/press/leadership",
          publisher: "Nordea",
        }],
        dividends: [{
          kind: "decided",
          title: "Beslutad utdelning 0,34 EUR",
          date: "2026-09-21",
          url: "https://www.nordea.com/en/press/dividend",
          publisher: "Nordea",
        }],
      }),
    ],
  });

  assert.deepEqual(feed.items.map((item) => item.kind), [
    "calendar",
    "calendar",
    "report",
    "dividend",
    "press",
    "article",
    "price_move",
  ]);
  assert.deepEqual(
    feed.items.filter((item) => item.kind === "calendar").map((item) => item.title),
    ["Nästa rapport", "Senare rapport"],
  );
  assert.equal(feed.summary.upcomingReports, 0);
  assert.equal(feed.summary.newOfficialEvents, 3);
});

test("samma rapport- och press-URL eller titel slås ihop", () => {
  const feed = buildFollowFeed({
    followedCount: 1,
    available: true,
    now: NOW,
    companies: [company({
      slug: "tele2",
      name: "Tele2",
      ticker: "TEL2 B",
      reports: [
        {
          title: "Tele2 reports second quarter 2026 results",
          date: "2026-09-20",
          url: "https://www.tele2.com/investors/reports/q2/",
          publisher: "Tele2",
        },
        {
          title: "Tele2 reports second quarter 2026 results",
          date: "2026-09-20",
          url: "https://www.tele2.com/investors/reports/q2",
          publisher: "Tele2",
        },
      ],
      press: [
        {
          title: "Tele2 reports second quarter 2026 results",
          date: "2026-09-20",
          url: "https://www.tele2.com/media/news/q2-copy",
          publisher: "Tele2",
        },
        {
          title: "Annat meddelande",
          date: "2026-09-19",
          url: "https://www.tele2.com/investors/reports/q2",
          publisher: "Tele2",
        },
        {
          title: "Inbjudan till presentation",
          date: "2026-09-18",
          url: "https://www.tele2.com/media/news/invitation",
          publisher: "Tele2",
        },
      ],
    })],
  });

  assert.deepEqual(feed.items.map((item) => item.kind), ["report", "press"]);
  assert.equal(feed.items[1]?.title, "Inbjudan till presentation");
});

test("förslag, beslutad och utbetald utdelning förblir olika kort", () => {
  const url = "https://www.nordea.com/en/press/2026-07-16/half-year-results";
  const feed = buildFollowFeed({
    followedCount: 1,
    available: true,
    now: NOW,
    companies: [company({
      dividends: [
        { kind: "board_proposal", title: "Styrelseförslag 0,34 EUR", date: "2026-09-20", url, publisher: "Nordea" },
        { kind: "decided", title: "Beslutad utdelning 0,34 EUR", date: "2026-09-21", url, publisher: "Nordea" },
        { kind: "paid", title: "Historiskt utbetald utdelning 0,34 EUR", date: "2026-09-22", url, publisher: "Nordea" },
        { kind: "decided", title: "Beslutad utdelning 0,34 EUR", date: "2026-09-21", url, publisher: "Nordea" },
      ],
    })],
  });

  assert.deepEqual(feed.items.map((item) => item.dividendKind), ["paid", "decided", "board_proposal"]);
});

test("otillgänglig källa skapar inget påhittat kort", () => {
  const official: CompanyOfficialData = {
    pressReleases: section("source_link_only", [{
      title: "Påhittat pressmeddelande",
      date: "2026-09-28",
      url: "https://www.nordea.com/en/press/fake",
    }]),
    reports: section("temporarily_unavailable", [{
      title: "Påhittad rapport",
      date: "2026-09-28",
      url: "https://www.nordea.com/en/press/fake-report",
    }]),
    events: section("available_empty"),
    ownership: section("schema_unavailable"),
    ceo: {
      status: "source_link_only",
      name: null,
      sourceUrl: null,
      sourcePublisher: null,
      asOf: null,
    },
    dividend: {
      status: "source_link_only",
      perShare: 1,
      currency: "EUR",
      year: 2026,
      sourceUrl: "https://www.nordea.com/en/investors",
      sourcePublisher: "Nordea",
      asOf: "2026-09-28",
      kind: "decided",
      exDate: null,
      recordDate: "2026-09-28",
      paymentDate: null,
    },
  };
  const input = followFeedCompanyFromOfficial({
    slug: "swedbank",
    name: "Swedbank",
    ticker: "SWED A",
    official,
    articles: [],
    priceMove: null,
  });
  const feed = buildFollowFeed({
    companies: [input],
    followedCount: 1,
    available: true,
    sourcesUnavailable: true,
    now: NOW,
  });

  assert.equal(input.reports.length, 0);
  assert.equal(input.press.length, 0);
  assert.equal(input.dividends.length, 0);
  assert.equal(feed.mode, "calendar_fallback");
  assert.deepEqual(feed.items, []);
  assert.equal(feed.sourcesUnavailable, true);
  assert.equal(JSON.stringify(feed).includes("Påhittad"), false);
});

test("utan nya händelser visas nästa kända kalenderdatum", () => {
  const feed = buildFollowFeed({
    followedCount: 1,
    available: true,
    now: NOW,
    companies: [company({
      slug: "industrivarden",
      name: "Industrivärden",
      ticker: "INDU C",
      press: [{
        title: "Gammalt pressmeddelande",
        date: "2026-01-02",
        url: "https://www.industrivarden.se/media/gammalt",
        publisher: "Industrivärden",
      }],
      events: [{
        title: "Årsstämma 2027",
        date: "2027-03-23",
        url: "https://www.industrivarden.se/investerare/Kalender/arsstamma-2027",
        publisher: "Industrivärden",
      }],
    })],
  });

  assert.equal(feed.mode, "calendar_fallback");
  assert.equal(feed.summary.newOfficialEvents, 0);
  assert.deepEqual(feed.items.map((item) => item.title), ["Årsstämma 2027"]);
  assert.equal(feed.items[0]?.fallback, true);
  assert.equal(feed.items[0]?.freshnessLabel, "Nästa kända datum");
});

test("liten kursrörelse och gammal kurs skapar inget kort", () => {
  const quiet = buildFollowFeed({
    followedCount: 1,
    available: true,
    now: NOW,
    companies: [company({
      priceMove: {
        changePct: 0.4,
        marketTimestamp: "2026-09-29T08:00:00.000Z",
        sourceUrl: "https://finance.yahoo.com/quote/NDA-SE.ST",
      },
    })],
  });
  const stale = buildFollowFeed({
    followedCount: 1,
    available: true,
    now: NOW,
    companies: [company({
      priceMove: {
        changePct: 4,
        marketTimestamp: "2026-09-28T08:00:00.000Z",
        sourceUrl: "https://finance.yahoo.com/quote/NDA-SE.ST",
      },
    })],
  });

  assert.deepEqual(quiet.items, []);
  assert.deepEqual(stale.items, []);
});

test("flödet hämtar inte kurser för hela upptäcktslistan och indexeras inte", () => {
  const page = read("app/watchlist/page.tsx");
  const loader = read("lib/companies/follow-feed.server.ts");
  const robots = read("lib/seo/robots-policy.ts");

  assert.match(page, /getFollowedCompaniesMarketData\(watchlist\.companies\.map/);
  assert.doesNotMatch(page, /getFollowedCompaniesMarketData\(\s*listDiscoveryCompanies/);
  assert.doesNotMatch(page, /getCompanyMarketData\(/);
  assert.doesNotMatch(loader, /getCompanyMarketData|listDiscoveryCompanies|fetchYahoo/);
  assert.match(page, /noIndexMetadata\("Mitt DivLab"\)/);
  assert.doesNotMatch(page, /ld\+json|jsonLd|application\/ld\+json/);
  assert.match(robots, /"\/watchlist"/);
  assert.doesNotMatch(read("lib/companies/follow-feed.ts"), /börskollen|borskollen|autoredaktion/i);
});

test("sparad utdelningsfakt når sidmodellen och följgränsen är avstängd", () => {
  const fact = persistedFactFromRow({
    fact_type: "dividend_kind",
    value_text: "decided",
    value_numeric: null,
    unit: null,
    as_of: "2026-07-16",
    source_url: "https://www.nordea.com/en/press/2026-07-16/half-year-results",
    source_publisher: "Nordea",
  });
  const recordDate = persistedFactFromRow({
    fact_type: "dividend_record_date",
    value_text: "2026-08-06",
    value_numeric: null,
    unit: null,
    as_of: null,
    source_url: "https://www.nordea.com/en/press/2026-07-16/half-year-results",
    source_publisher: "Nordea",
  });

  assert.equal(fact?.factType, "dividend_kind");
  assert.equal(fact?.valueText, "decided");
  assert.equal(recordDate?.valueText, "2026-08-06");
  assert.match(read("lib/companies/official-data.server.ts"), /persistedFactFromRow/);
  assert.equal(FOLLOW_PREMIUM_PLAN.freeCompanyLimit, 3);
  assert.equal(FOLLOW_PREMIUM_PLAN.monthlyPriceSek, 99);
  assert.equal(FOLLOW_PREMIUM_PLAN.enforcement, "disabled");
  assert.deepEqual(decideFollowWrite(4), { allowed: true, enforcement: "disabled" });
  assert.doesNotMatch(read("app/bolag/actions.ts"), /decideFollowWrite|FOLLOW_PREMIUM_PLAN/);
});

test("filter får egna rader även när högre prioritet fyller alla-vyn", () => {
  const companies: FollowFeedCompanyInput[] = Array.from({ length: FOLLOW_FEED_LIMIT + 1 }, (_, index) => company({
    slug: `bolag-${index}`,
    name: `Bolag ${index}`,
    ticker: `T${index}`,
    events: [{
      title: `Kalender ${index}`,
      date: "2026-10-02",
      url: `https://www.example.com/kalender/${index}`,
      publisher: "Bolag",
    }],
  }));
  companies.push(company({
    slug: "tele2",
    name: "Tele2",
    ticker: "TEL2 B",
    press: [{
      title: "Inbjudan till presentation",
      date: "2026-09-20",
      url: "https://www.tele2.com/media/news/invitation",
      publisher: "Tele2",
    }],
    articles: [{
      id: "tele2-artikel",
      title: "Tele2 i DivLab",
      publishedAt: "2026-09-27T06:00:00.000Z",
      href: "/news/tele2",
    }],
  }));

  const feed = buildFollowFeed({
    companies,
    followedCount: companies.length,
    available: true,
    now: NOW,
  });

  assert.equal(filterFollowFeed(feed.items, "all").length, FOLLOW_FEED_LIMIT);
  assert.equal(filterFollowFeed(feed.items, "all").some((item) => item.kind === "press"), false);
  assert.deepEqual(filterFollowFeed(feed.items, "press").map((item) => item.title), ["Inbjudan till presentation"]);
  assert.deepEqual(filterFollowFeed(feed.items, "articles").map((item) => item.title), ["Tele2 i DivLab"]);
  assert.ok(feed.items.length <= (FOLLOW_FEED_LIMIT * 6));
});

test("sparad utgivare når rapport-, press- och kalenderkortet", () => {
  const official: CompanyOfficialData = {
    pressReleases: {
      ...section("available_with_items", [{
        title: "Changes in leadership",
        date: "2026-09-18",
        url: "https://www.nordea.com/en/press/leadership",
      }]),
      sourcePublisher: null,
    },
    reports: {
      ...section("available_with_items", [{
        title: "Half-year results 2026",
        date: "2026-09-16",
        url: "https://www.nordea.com/en/press/half-year",
      }]),
      sourcePublisher: "Yahoo Finance",
    },
    events: {
      ...section("available_with_items", [{
        title: "Interim report Q3 2026",
        date: "2026-10-16",
        url: "https://www.tele2.com/investors/calendar/q3",
      }]),
      sourcePublisher: null,
    },
    ownership: section("available_empty"),
    ceo: {
      status: "available_empty",
      name: null,
      sourceUrl: null,
      sourcePublisher: null,
      asOf: null,
    },
    dividend: {
      status: "available_empty",
      perShare: null,
      currency: null,
      year: null,
      sourceUrl: null,
      sourcePublisher: null,
      asOf: null,
      kind: null,
      exDate: null,
      recordDate: null,
      paymentDate: null,
    },
  };
  const input = followFeedCompanyFromOfficial({
    slug: "nordea",
    name: "Nordea",
    ticker: "NDA SE",
    official,
    articles: [],
    priceMove: null,
    publishersByUrl: new Map([
      ["https://www.nordea.com/en/press/leadership", "Nordea"],
      ["https://www.nordea.com/en/press/half-year", "Nordea"],
      ["https://www.tele2.com/investors/calendar/q3", "Tele2"],
    ]),
  });
  const feed = buildFollowFeed({
    companies: [input],
    followedCount: 1,
    available: true,
    now: NOW,
  });
  const html = renderToStaticMarkup(createElement(FollowFeedList, { items: feed.items }));

  assert.equal(input.reports[0]?.publisher, "Nordea");
  assert.equal(input.press[0]?.publisher, "Nordea");
  assert.equal(input.events[0]?.publisher, "Tele2");
  assert.match(html, /Nordea/);
  assert.match(html, /Tele2/);
  assert.doesNotMatch(html, /Yahoo Finance/);
  assert.match(read("app/watchlist/page.tsx"), /publishersByUrl/);
  assert.match(read("app/watchlist/page.tsx"), /document\.publisher\.trim\(\)/);
});

test("kommande rapporter räknar bara rapportdatum", () => {
  const feed = buildFollowFeed({
    followedCount: 1,
    available: true,
    now: NOW,
    companies: [company({
      slug: "industrivarden",
      name: "Industrivärden",
      ticker: "INDU C",
      events: [
        {
          title: "Interim report Q3 2026",
          date: "2026-10-20",
          url: "https://www.industrivarden.se/investerare/Kalender/q3-2026",
          publisher: "Industrivärden",
          fiscalPeriod: "2026 Q3",
        },
        {
          title: "Årsstämma 2026",
          date: "2026-11-05",
          url: "https://www.industrivarden.se/investerare/Kalender/arsstamma-2026",
          publisher: "Industrivärden",
          fiscalPeriod: null,
        },
      ],
    })],
  });

  assert.deepEqual(feed.items.map((item) => item.title), ["Interim report Q3 2026", "Årsstämma 2026"]);
  assert.equal(feed.summary.upcomingReports, 1);
  assert.equal(feed.items.every((item) => item.kind === "calendar"), true);
});

test("dokumentfrågan stannar inom fönstret och behåller kommande kalender", () => {
  const summer = new Date("2026-09-29T10:00:00.000Z");
  const winter = new Date("2026-01-15T12:00:00.000Z");
  const lateEvening = new Date("2026-09-29T22:30:00.000Z");

  assert.equal(followFeedDocumentPublishedAfter(summer), "2026-08-14T22:00:00.000Z");
  assert.equal(followFeedCalendarEventAfter(summer), "2026-09-28T22:00:00.000Z");
  assert.equal(followFeedDocumentPublishedAfter(winter), "2025-11-30T23:00:00.000Z");
  assert.equal(followFeedCalendarEventAfter(winter), "2026-01-14T23:00:00.000Z");
  assert.equal(followFeedCalendarEventAfter(lateEvening), "2026-09-29T22:00:00.000Z");
  assert.ok(followFeedCalendarEventAfter(summer) < "2027-03-23T00:00:00.000Z");

  const loader = read("lib/companies/follow-feed.server.ts");
  assert.match(loader, /followFeedDocumentPublishedAfter\(\)/);
  assert.match(loader, /\.gte\("published_at", publishedAfter\)/);
  assert.match(loader, /followFeedCalendarEventAfter\(\)/);
  assert.match(loader, /\.gte\("event_at", calendarAfter\)/);
  assert.doesNotMatch(loader, /\.lte\("event_at"|\.lt\("event_at"/);
  assert.doesNotMatch(loader, /user_id|userId|SUPABASE_SERVICE_ROLE_KEY/);
});

test("flödeskort visar bolag, typ, datum, källa och status", () => {
  const feed: FollowFeedModel = buildFollowFeed({
    followedCount: 1,
    available: true,
    now: NOW,
    companies: [company({
      press: [{
        title: "Ett mycket långt svenskt pressmeddelande om förändringar i Nordeas koncernledning och kommande rapport",
        date: "2026-09-25T08:15:00.000Z",
        url: "https://www.nordea.com/en/press/leadership",
        publisher: "Nordea",
      }],
    })],
  });
  const html = renderToStaticMarkup(
    createElement(WatchlistBoard, {
      isAvailable: true,
      followedCount: 1,
      followed: [],
      discovery: listDiscoveryCompanies().slice(0, 1).map((item) => ({ ...item, isFollowing: true })),
      feed,
      filters: listMarketFilters(listDiscoveryCompanies()),
      query: "",
      sort: "recent",
      filterId: "all",
      showEmptyFollows: false,
      showNoFollowMatches: false,
      showNoDiscoveryMatches: false,
      onQueryChange: () => undefined,
      onSortChange: () => undefined,
      onFilterChange: () => undefined,
      renderFollow: (item: FollowControlModel) => createElement("button", { type: "submit" }, item.displayName),
    }),
  );

  assert.match(html, /Nordea/);
  assert.match(html, /NDA SE/);
  assert.match(html, /Pressmeddelande/);
  assert.match(html, /Nytt pressmeddelande/);
  assert.match(html, /Nordea/);
  assert.match(html, /Bolagssida/);
  assert.match(html, /Filtrera flödet/);
  assert.match(html, /Ett mycket långt svenskt pressmeddelande/);
  assert.doesNotMatch(html, /köp|sälj/i);
});
