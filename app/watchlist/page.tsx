import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import CompanyWatchlist from "@/components/companies/CompanyWatchlist";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { companyAiPortfolioLinksBySlug } from "@/lib/companies/ai-portfolio-crosslinks";
import { getCompanyProfile, getPilotCompanies } from "@/lib/companies/catalog";
import {
  buildFollowFeed,
  followFeedCompanyFromOfficial,
  type FollowFeedArticle,
  type FollowFeedPriceMove,
} from "@/lib/companies/follow-feed";
import {
  loadFollowedOfficialRecords,
  type FollowedOfficialRecords,
} from "@/lib/companies/follow-feed.server";
import { getFollowedCompaniesMarketData } from "@/lib/companies/market-data";
import { articleMatchesCompany } from "@/lib/companies/news";
import { assembleCompanyOfficialData } from "@/lib/companies/official-data";
import { getFollowedCompanies, type FollowedCompany } from "@/lib/companies/server";
import { buildFollowedCompanyCards, listDiscoveryCompanies } from "@/lib/companies/watchlist";
import { loadPublicModelPortfolioHoldings } from "@/lib/model-portfolios/public-holdings.server";
import { getNewsArticleHref, getNewsArticles } from "@/lib/news/get-articles";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";
import type { CompanyProfile } from "@/lib/companies/types";
import type { NewsArticle } from "@/types/news";

export const metadata: Metadata = noIndexMetadata("Mitt DivLab");

export const dynamic = "force-dynamic";

const ARTICLES_PER_COMPANY = 5;

function articlesForFollowed(
  profiles: readonly CompanyProfile[],
  articles: readonly NewsArticle[],
) {
  const bySlug = new Map<string, FollowFeedArticle[]>();
  for (const profile of profiles) bySlug.set(profile.slug, []);

  const ordered = [...articles].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  for (const article of ordered) {
    const href = getNewsArticleHref(article);
    if (!href) continue;
    for (const profile of profiles) {
      const bucket = bySlug.get(profile.slug);
      if (!bucket || bucket.length >= ARTICLES_PER_COMPANY) continue;
      if (!articleMatchesCompany(article, profile)) continue;
      bucket.push({
        id: article.id,
        title: article.title,
        publishedAt: article.publishedAt,
        href,
      });
    }
  }

  return bySlug;
}

function priceMoveFor(quote: {
  changePct: number | null;
  marketTimestamp: string | null;
  sourceUrl: string;
} | undefined): FollowFeedPriceMove | null {
  if (!quote || quote.changePct === null || !quote.marketTimestamp || !quote.sourceUrl) return null;
  return {
    changePct: quote.changePct,
    marketTimestamp: quote.marketTimestamp,
    sourceUrl: quote.sourceUrl,
  };
}

function feedCompanies(
  followed: readonly FollowedCompany[],
  records: Awaited<ReturnType<typeof loadFollowedOfficialRecords>>,
  quotes: Awaited<ReturnType<typeof getFollowedCompaniesMarketData>>,
  articles: ReadonlyMap<string, FollowFeedArticle[]>,
) {
  return followed.flatMap((company) => {
    const profile = getCompanyProfile(company.slug);
    if (!profile) return [];
    const stored = records.byCompanyId.get(company.id);
    const publishersByUrl = new Map<string, string>();
    const fiscalPeriodsByUrl = new Map<string, string>();
    for (const document of stored?.documents ?? []) {
      const publisher = document.publisher.trim();
      if (publisher) publishersByUrl.set(document.url, publisher);
      const fiscalPeriod = document.fiscalPeriod?.trim();
      if (fiscalPeriod) fiscalPeriodsByUrl.set(document.url, fiscalPeriod);
    }
    const official = assembleCompanyOfficialData({
      slug: profile.slug,
      pressReleasesUrl: profile.pressReleasesUrl,
      reportsUrl: profile.reportsUrl,
      calendarUrl: profile.calendarUrl,
      profileUrl: profile.governanceUrl ?? profile.ownershipUrl ?? profile.websiteUrl,
      documents: (stored?.documents ?? []).map((document) => ({
        type: document.type,
        title: document.title,
        url: document.url,
        publishedAt: document.publishedAt,
        eventAt: document.eventAt,
      })),
      documentQuery: records.documentsUnavailable ? "schema_unavailable" : "ok",
      facts: stored?.facts ?? [],
      ownership: [],
      profileQuery: records.documentsUnavailable ? "schema_unavailable" : "ok",
      sources: [],
    });

    return [followFeedCompanyFromOfficial({
      slug: profile.slug,
      name: profile.displayName,
      ticker: profile.ticker,
      official,
      articles: articles.get(profile.slug) ?? [],
      priceMove: priceMoveFor(quotes[profile.slug]),
      publishersByUrl,
      fiscalPeriodsByUrl,
    })];
  });
}

export default async function WatchlistPage() {
  const user = await requireAuthenticatedUser();
  const watchlist = await getFollowedCompanies(user.id);
  let quotes: Awaited<ReturnType<typeof getFollowedCompaniesMarketData>> = {};
  let records: FollowedOfficialRecords = {
    documentsUnavailable: false,
    byCompanyId: new Map(),
  };
  let holdings: Awaited<ReturnType<typeof loadPublicModelPortfolioHoldings>> = [];
  if (watchlist.isAvailable) {
    const loadHoldings = watchlist.companies.length > 0
      ? loadPublicModelPortfolioHoldings()
      : Promise.resolve([]);
    [quotes, records, holdings] = await Promise.all([
      getFollowedCompaniesMarketData(watchlist.companies.map((company) => company.slug)),
      loadFollowedOfficialRecords(watchlist.companies.map((company) => company.id)),
      loadHoldings,
    ]);
  }
  const profiles = watchlist.companies.flatMap((company) => {
    const profile = getCompanyProfile(company.slug);
    return profile ? [profile] : [];
  });
  const articles = watchlist.isAvailable ? articlesForFollowed(profiles, getNewsArticles()) : new Map();
  const catalog = getPilotCompanies().map((company) => ({
    slug: company.slug,
    marketDataSymbol: company.marketDataSymbol,
  }));
  const aiPortfolioLinks = companyAiPortfolioLinksBySlug(
    profiles.map((company) => ({ slug: company.slug, marketDataSymbol: company.marketDataSymbol })),
    holdings,
    catalog,
  );
  const feed = buildFollowFeed({
    followedCount: watchlist.isAvailable ? watchlist.companies.length : 0,
    available: watchlist.isAvailable,
    sourcesUnavailable: records.documentsUnavailable,
    companies: watchlist.isAvailable
      ? feedCompanies(watchlist.companies, records, quotes, articles)
      : [],
  });

  return (
    <AppShell user={user}>
      <CompanyWatchlist
        isAvailable={watchlist.isAvailable}
        followed={buildFollowedCompanyCards(watchlist.companies, quotes)}
        discovery={listDiscoveryCompanies()}
        feed={feed}
        aiPortfolioLinks={aiPortfolioLinks}
      />
    </AppShell>
  );
}
