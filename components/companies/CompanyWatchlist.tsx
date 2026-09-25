"use client";

import { useMemo, useState } from "react";
import FollowCompanyButton from "@/components/companies/FollowCompanyButton";
import WatchlistBoard from "@/components/companies/WatchlistBoard";
import type { FollowButtonMode } from "@/lib/companies/follow-label";
import {
  listMarketFilters,
  matchesMarketFilter,
  searchCompanies,
  sortDiscoveryCompanies,
  sortFollowedCompanies,
  type DiscoveryCompany,
  type FollowControlModel,
  type FollowedCompanyCard,
  type FollowedNewsItem,
  type WatchlistSort,
  type WatchlistView,
} from "@/lib/companies/watchlist";

type Props = {
  isAvailable: boolean;
  followed: readonly FollowedCompanyCard[];
  discovery: readonly DiscoveryCompany[];
  news: readonly FollowedNewsItem[];
};

export default function CompanyWatchlist({
  isAvailable,
  followed,
  discovery,
  news,
}: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<WatchlistSort>("recent");
  const [view, setView] = useState<WatchlistView>("list");
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
      news={isAvailable && followed.length > 0 ? news : []}
      filters={filters}
      query={query}
      sort={sort}
      view={view}
      filterId={filterId}
      showEmptyFollows={isAvailable && followed.length === 0 && unfiltered}
      showNoFollowMatches={isAvailable && followed.length > 0 && visibleFollowed.length === 0}
      showNoDiscoveryMatches={visibleDiscovery.length === 0}
      onQueryChange={setQuery}
      onSortChange={setSort}
      onViewChange={setView}
      onFilterChange={setFilterId}
      renderFollow={renderFollow}
    />
  );
}
