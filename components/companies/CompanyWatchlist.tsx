"use client";

import { useMemo, useState } from "react";
import FollowCompanyButton from "@/components/companies/FollowCompanyButton";
import WatchlistBoard from "@/components/companies/WatchlistBoard";
import type { CompanyAiPortfolioLink } from "@/lib/companies/ai-portfolio-crosslinks";
import type { FollowButtonMode } from "@/lib/companies/follow-label";
import type { FollowFeedModel } from "@/lib/companies/follow-feed";
import {
  listMarketFilters,
  matchesMarketFilter,
  searchCompanies,
  sortDiscoveryCompanies,
  sortFollowedCompanies,
  type DiscoveryCompany,
  type FollowControlModel,
  type FollowedCompanyCard,
  type WatchlistSort,
} from "@/lib/companies/watchlist";

type Props = {
  isAvailable: boolean;
  followed: readonly FollowedCompanyCard[];
  discovery: readonly DiscoveryCompany[];
  feed: FollowFeedModel;
  aiPortfolioLinks?: Readonly<Record<string, readonly CompanyAiPortfolioLink[]>>;
};

export default function CompanyWatchlist({
  isAvailable,
  followed,
  discovery,
  feed,
  aiPortfolioLinks = {},
}: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<WatchlistSort>("recent");
  const [filterId, setFilterId] = useState("all");
  const filters = useMemo(() => listMarketFilters(discovery), [discovery]);
  const unfiltered = query.trim() === "" && filterId === "all";
  const followedAtBySlug = useMemo(
    () => new Map(followed.map((company) => [company.slug, company.followedAt])),
    [followed],
  );
  const visibleFollowed = sortFollowedCompanies(
    searchCompanies(followed, query).filter((company) => matchesMarketFilter(company, filterId)),
    sort,
  );
  const visibleDiscovery = sortDiscoveryCompanies(
    searchCompanies(discovery, query)
      .filter((company) => matchesMarketFilter(company, filterId))
      .map((company) => ({
        ...company,
        isFollowing: followedAtBySlug.has(company.slug),
      })),
    sort,
    followedAtBySlug,
  );

  function renderFollow(company: FollowControlModel) {
    const mode: FollowButtonMode = company.followMode === "unfollow" ? "unfollow" : "discovery";

    return (
      <FollowCompanyButton
        companySlug={company.slug}
        companyName={company.displayName}
        isAuthenticated
        isAvailable={isAvailable}
        isFollowing={company.isFollowing}
        loginHref="/login?redirect=%2Fwatchlist"
        mode={mode}
      />
    );
  }

  return (
    <WatchlistBoard
      isAvailable={isAvailable}
      followedCount={isAvailable ? followed.length : null}
      followed={visibleFollowed}
        discovery={visibleDiscovery}
        feed={feed}
        aiPortfolioLinks={aiPortfolioLinks}
      filters={filters}
      query={query}
      sort={sort}
      filterId={filterId}
      showEmptyFollows={isAvailable && followed.length === 0 && unfiltered}
      showNoFollowMatches={isAvailable && followed.length > 0 && visibleFollowed.length === 0}
      showNoDiscoveryMatches={visibleDiscovery.length === 0}
      onQueryChange={setQuery}
      onSortChange={setSort}
      onFilterChange={setFilterId}
      renderFollow={renderFollow}
    />
  );
}
