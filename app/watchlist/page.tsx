import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import CompanyWatchlist from "@/components/companies/CompanyWatchlist";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getCompanyProfile } from "@/lib/companies/catalog";
import { getFollowedCompaniesMarketData } from "@/lib/companies/market-data";
import { getFollowedCompanyNews } from "@/lib/companies/news";
import { getFollowedCompanies } from "@/lib/companies/server";
import {
  buildFollowedCompanyCards,
  listDiscoveryCompanies,
  type FollowedNewsItem,
} from "@/lib/companies/watchlist";
import { formatNewsPublishedAt } from "@/lib/news/format";
import { getNewsArticleHref, getNewsArticles } from "@/lib/news/get-articles";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";
import type { CompanyProfile } from "@/lib/companies/types";

export const metadata: Metadata = noIndexMetadata("Följda bolag");

export const dynamic = "force-dynamic";

function followedNews(companies: readonly CompanyProfile[]): FollowedNewsItem[] {
  return getFollowedCompanyNews(companies, getNewsArticles()).map((article) => ({
    id: article.id,
    title: article.title,
    href: getNewsArticleHref(article),
    publishedLabel: formatNewsPublishedAt(article.publishedAt),
  }));
}

export default async function WatchlistPage() {
  const user = await requireAuthenticatedUser();
  const watchlist = await getFollowedCompanies(user.id);
  const quotes = watchlist.isAvailable
    ? await getFollowedCompaniesMarketData(watchlist.companies.map((company) => company.slug))
    : {};
  const profiles = watchlist.companies.flatMap((company) => {
    const profile = getCompanyProfile(company.slug);
    return profile ? [profile] : [];
  });

  return (
    <AppShell user={user}>
      <CompanyWatchlist
        isAvailable={watchlist.isAvailable}
        followed={buildFollowedCompanyCards(watchlist.companies, quotes)}
        discovery={listDiscoveryCompanies()}
        news={watchlist.isAvailable ? followedNews(profiles) : []}
      />
    </AppShell>
  );
}
