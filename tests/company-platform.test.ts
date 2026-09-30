import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { acceptBrokerUrl, resolveBrokerLinks } from "@/lib/companies/broker-links";
import { getCompanyProfile, getPilotCompanies } from "@/lib/companies/catalog";
import {
  buildFollowFeed,
  followFeedRecencyLabel,
  FOLLOW_FEED_RECENCY_LAST_24H_LABEL,
  FOLLOW_FEED_RECENCY_TODAY_LABEL,
} from "@/lib/companies/follow-feed";
import {
  articleCompanyLinks,
  groupCompaniesByLetter,
  groupCompaniesBySector,
  recentlyMentionedCompanies,
  selectUpcomingReports,
} from "@/lib/companies/hub";
import { COMPANY_PAGE_INDEX_MINIMUM, companyIndexSignals } from "@/lib/companies/page-model";
import { companyPageMetadataCopy } from "@/lib/companies/page-seo";
import { companyPageNavigation } from "@/lib/companies/page-nav";
import { reportFactChanges } from "@/lib/companies/report-facts";
import type { ReportSnapshotMetric } from "@/lib/companies/report-snapshot";
import { INDEXABLE_STATIC_PUBLIC_PATHS } from "@/lib/seo/public-routes";
import { dividendYearSeries } from "@/lib/companies/series";
import type { NewsArticle } from "@/types/news";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function metric(partial: Partial<ReportSnapshotMetric> & Pick<ReportSnapshotMetric, "id" | "amount">): ReportSnapshotMetric {
  return {
    label: partial.label ?? partial.id,
    comparisonAmount: partial.comparisonAmount ?? null,
    comparisonLabel: partial.comparisonLabel ?? null,
    reportedChangePercent: null,
    scale: "million",
    ...partial,
  };
}

describe("mäklarlänkar", () => {
  it("visar bara verifierade adresser utan query", () => {
    const investor = getCompanyProfile("investor");
    assert.ok(investor);
    const links = resolveBrokerLinks(investor);
    assert.deepEqual(links.map((link) => link.label), [
      "Handla hos Avanza ↗",
      "Handla hos Nordnet ↗",
    ]);
    assert.equal(links.every((link) => !link.href.includes("?")), true);
    assert.equal(acceptBrokerUrl("avanza", `${investor.avanzaUrl}?utm_source=divlab`), null);
    assert.equal(acceptBrokerUrl("nordnet", "https://www.nordnet.se/aktier/kurser/investor-b-inve-b-xsto?ref=affiliate"), null);
    assert.equal(acceptBrokerUrl("avanza", "https://www.avanza.se/kop/nu"), null);
  });

  it("är stängd när katalogen saknar en träff", () => {
    assert.deepEqual(resolveBrokerLinks({}), []);
    assert.equal(getPilotCompanies().every((company) => resolveBrokerLinks(company).length === 2), true);
  });
});

describe("FI blankning i bolagsytan", () => {
  it("visar inte noll procent och hämtar registret en gång per sida", () => {
    const panel = read("components/companies/ShortInterestPanel.tsx");
    const pageData = read("lib/companies/page-data.server.ts");
    const hub = read("app/bolag/page.tsx");
    const hubLoader = read("lib/companies/hub.server.ts");
    assert.match(panel, /aggregatePercent > 0/);
    assert.match(panel, /absenceIsNotZero/);
    assert.doesNotMatch(panel, /0,00 %|0 %|>0%</);
    assert.match(pageData, /loadCompanyShortInterest\(company\)/);
    assert.doesNotMatch(pageData, /for\s*\([\s\S]*loadCompanyShortInterest/);
    assert.doesNotMatch(hub, /loadCompanyShortInterest|fetchFiOds|fi\.se/);
    assert.doesNotMatch(hubLoader, /fi\.se|loadCompanyShortInterest|getCompanyMarketData/);
  });
});

describe("bolagshubb och navigering", () => {
  it("grupperar katalogen och kommande rapporter utan rankning", () => {
    const companies = getPilotCompanies();
    const sectors = groupCompaniesBySector(companies);
    assert.ok(sectors.every((group, index) => index === 0 || group.sector.localeCompare(sectors[index - 1]!.sector, "sv") >= 0));
    const letters = groupCompaniesByLetter(companies);
    assert.equal(letters[0]?.companies[0]?.displayName.localeCompare(letters[0].companies.at(-1)!.displayName, "sv") <= 0, true);
    assert.deepEqual(selectUpcomingReports([
      { slug: "investor", name: "Investor B", ticker: "INVE B", title: "Q3", date: "2026-10-20" },
      { slug: "abb", name: "ABB", ticker: "ABB", title: "Gammal", date: "2026-01-01" },
    ], "2026-09-30"), [
      { slug: "investor", name: "Investor B", ticker: "INVE B", title: "Q3", date: "2026-10-20" },
    ]);
  });

  it("visar inte döda avsnitt och behåller indexgrinden", () => {
    const tabs = companyPageNavigation({
      hasReports: false,
      hasOwnership: false,
      hasShortInterest: false,
      hasInsiders: true,
      hasNews: false,
      hasCurrentEvents: false,
    });
    assert.deepEqual(tabs.map((tab) => tab.label), ["Översikt", "Kurs", "Nyckeltal", "Finansiellt", "Utdelning", "Insyn", "Diskussion"]);
    const thin = companyIndexSignals({
      dividendKind: "unspecified",
      dividendAmount: false,
      reports: 0,
      press: 0,
      events: 0,
      management: 0,
      ownership: 0,
      articles: 0,
    });
    assert.equal(COMPANY_PAGE_INDEX_MINIMUM, 2);
    assert.equal(thin.length >= COMPANY_PAGE_INDEX_MINIMUM, false);
    assert.equal(companyPageMetadataCopy(getCompanyProfile("investor")!, { indexable: false }).robots.index, false);
    assert.equal(companyPageMetadataCopy(getCompanyProfile("investor")!, { indexable: true }).robots.index, true);
    assert.equal(INDEXABLE_STATIC_PUBLIC_PATHS.includes("/bolag"), true);
    assert.equal(INDEXABLE_STATIC_PUBLIC_PATHS.includes("/bolag/investor"), false);
    const seo = read("lib/companies/page-seo.ts");
    const hubPage = read("app/bolag/page.tsx");
    assert.doesNotMatch(seo, /userId|email|followState|watchlist/);
    assert.doesNotMatch(hubPage, /userId|email|followState/);
    assert.match(hubPage, /robots: \{ index: true, follow: true \}/);
  });
});

describe("artikellänkar och fas 3", () => {
  it("lägger bolagschips utanför brödtexten", () => {
    const article = {
      id: "a",
      title: "Investor höjer utdelningen",
      summary: "",
      category: "company",
      source: "DivLab",
      publishedAt: "2026-09-30T08:00:00.000Z",
      url: null,
      featured: false,
      internalLinking: { companies: ["Investor"] },
    } as NewsArticle;
    const links = articleCompanyLinks(article, getPilotCompanies());
    assert.equal(links.some((link) => link.slug === "investor"), true);
    assert.equal(links.every((link) => link.href.startsWith("/bolag/")), true);
    const view = read("components/news/NewsArticleView.tsx");
    const chips = read("components/companies/CompanyArticleLinks.tsx");
    assert.match(view, /<CompanyArticleLinks/);
    assert.doesNotMatch(chips, /<Link[\s\S]*<Link/);
    assert.doesNotMatch(chips, /<a[\s\S]*<a/);
    assert.match(chips, /Bolag i artikeln/);
    const mentions = recentlyMentionedCompanies([article], getPilotCompanies(), 4);
    assert.equal(mentions[0]?.slug, "investor");
  });

  it("märker senaste händelser utan oläst-status och utan 24-timmarspåstående för datumrader", () => {
    const now = new Date("2026-09-29T10:00:00.000Z");
    assert.equal(followFeedRecencyLabel("2026-09-29", now), FOLLOW_FEED_RECENCY_TODAY_LABEL);
    assert.equal(followFeedRecencyLabel("2026-09-28", now), null);
    assert.equal(followFeedRecencyLabel("2026-09-30", now), null);
    assert.equal(followFeedRecencyLabel("2026-09-28T22:30:00.000Z", now), FOLLOW_FEED_RECENCY_TODAY_LABEL);
    assert.equal(followFeedRecencyLabel("2026-09-28T21:00:00.000Z", now), FOLLOW_FEED_RECENCY_LAST_24H_LABEL);
    assert.equal(followFeedRecencyLabel("2026-09-28T10:00:00.000Z", now), FOLLOW_FEED_RECENCY_LAST_24H_LABEL);
    assert.equal(followFeedRecencyLabel("2026-09-28T09:59:59.999Z", now), null);
    assert.equal(followFeedRecencyLabel("2026-09-29T12:00:00.000Z", now), null);
    assert.equal(followFeedRecencyLabel("", now), null);
    assert.equal(followFeedRecencyLabel("inte-ett-datum", now), null);
    assert.notEqual(followFeedRecencyLabel("2026-09-29", now), FOLLOW_FEED_RECENCY_LAST_24H_LABEL);

    const feed = buildFollowFeed({
      followedCount: 1,
      available: true,
      now,
      companies: [{
        slug: "nordea",
        name: "Nordea",
        ticker: "NDA SE",
        reports: [],
        press: [{
          title: "Dagens pressmeddelande",
          date: "2026-09-29",
          url: "https://www.nordea.com/en/press/today",
          publisher: "Nordea",
        }],
        events: [{
          title: "Kommande rapport",
          date: "2026-10-02",
          url: "https://www.nordea.com/en/calendar/next",
          publisher: "Nordea",
        }],
        dividends: [],
        articles: [],
        priceMove: null,
      }],
    });
    const press = feed.items.find((item) => item.kind === "press");
    const calendar = feed.items.find((item) => item.kind === "calendar");
    assert.equal(press?.recencyLabel, FOLLOW_FEED_RECENCY_TODAY_LABEL);
    assert.notEqual(press?.recencyLabel, FOLLOW_FEED_RECENCY_LAST_24H_LABEL);
    assert.equal(calendar?.recencyLabel, null);
    assert.equal(calendar?.freshnessLabel, "Om 3 dagar");
    const feedSource = read("lib/companies/follow-feed.ts");
    const feedList = read("components/companies/FollowFeedList.tsx");
    assert.doesNotMatch(feedSource, /Nyligen|oläst|unread|readAt|isRead/);
    assert.doesNotMatch(feedList, /oläst|Oläst|unread/);
    const changes = reportFactChanges([
      metric({ id: "revenue", label: "Omsättning", amount: 12, comparisonAmount: 10, comparisonLabel: "Q2 2025" }),
      metric({ id: "ebit", label: "Rörelseresultat", amount: 1, comparisonAmount: 2, comparisonLabel: "Q2 2025" }),
    ]);
    assert.deepEqual(changes.map((change) => change.direction), ["up", "down"]);
    assert.equal(dividendYearSeries([
      { exDate: "2024-04-01", amount: 1, currency: "SEK" },
      { exDate: "2025-04-01", amount: 2, currency: "SEK" },
    ]).length, 2);
  });
});
