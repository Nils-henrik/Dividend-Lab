"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import CompanyLogo from "@/components/companies/CompanyLogo";
import FollowFeedList from "@/components/companies/FollowFeedList";
import {
  FOLLOW_FEED_FILTERS,
  filterFollowFeed,
  type FollowFeedFilter,
  type FollowFeedModel,
} from "@/lib/companies/follow-feed";
import {
  quoteToneClass,
  type DiscoveryCompany,
  type FollowControlModel,
  type FollowedCompanyCard,
  type MarketFilter,
  type WatchlistSort,
} from "@/lib/companies/watchlist";

type Props = {
  isAvailable: boolean;
  followedCount: number | null;
  followed: readonly FollowedCompanyCard[];
  discovery: readonly (DiscoveryCompany & { isFollowing: boolean })[];
  feed: FollowFeedModel;
  filters: readonly MarketFilter[];
  query: string;
  sort: WatchlistSort;
  filterId: string;
  showEmptyFollows: boolean;
  showNoFollowMatches: boolean;
  showNoDiscoveryMatches: boolean;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: WatchlistSort) => void;
  onFilterChange: (filterId: string) => void;
  renderFollow: (company: FollowControlModel) => ReactNode;
};

function companyPath(slug: string) {
  return `/bolag/${slug}`;
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="divlab-card min-w-0 px-3 py-3 sm:px-4">
      <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-divlab-text-muted">
        {label}
      </dt>
      <dd className="mt-1 truncate text-xl font-semibold tabular-nums tracking-[-0.04em] text-divlab-text">
        {value}
      </dd>
    </div>
  );
}

function FollowedRow({
  company,
  follow,
}: {
  company: FollowedCompanyCard;
  follow: ReactNode;
}) {
  return (
    <article className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
      <Link
        href={companyPath(company.slug)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50"
      >
        <CompanyLogo name={company.name} logoPath={company.logoPath} size="compact" />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-divlab-text">{company.displayName}</span>
          <span className="mt-0.5 block truncate text-sm text-divlab-text-muted">
            {company.ticker}
            <span className="px-1">·</span>
            <span className="tabular-nums text-divlab-text">{company.priceLabel}</span>
            <span className={`ml-1 tabular-nums ${quoteToneClass(company.tone)}`}>{company.changePctLabel}</span>
          </span>
        </span>
      </Link>
      <Link
        href={companyPath(company.slug)}
        className="hidden text-xs font-semibold text-divlab-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 hover:text-divlab-blue sm:inline"
      >
        Visa bolagssida
      </Link>
      <div className="shrink-0">{follow}</div>
    </article>
  );
}

function DiscoveryRow({
  company,
  follow,
}: {
  company: DiscoveryCompany & { isFollowing: boolean };
  follow: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
      <Link
        href={companyPath(company.slug)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50"
      >
        <CompanyLogo name={company.name} logoPath={company.logoPath} size="compact" />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-divlab-text">{company.displayName}</span>
          <span className="mt-0.5 block truncate text-sm text-divlab-text-muted">
            {company.ticker}
            <span className="px-1">·</span>
            {company.exchange}
          </span>
          {company.indexLabels.length > 0 ? (
            <span className="mt-1 block text-xs font-semibold text-divlab-blue">
              {company.indexLabels.join(" · ")}
            </span>
          ) : null}
        </span>
      </Link>
      <div className="shrink-0">{follow}</div>
    </article>
  );
}

export default function WatchlistBoard({
  isAvailable,
  followedCount,
  followed,
  discovery,
  feed,
  filters,
  query,
  sort,
  filterId,
  showEmptyFollows,
  showNoFollowMatches,
  showNoDiscoveryMatches,
  onQueryChange,
  onSortChange,
  onFilterChange,
  renderFollow,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [discoveryExpanded, setDiscoveryExpanded] = useState(showEmptyFollows);
  const [showAllFollowed, setShowAllFollowed] = useState(false);
  const [feedFilter, setFeedFilter] = useState<FollowFeedFilter>("all");
  const browsingCompanies = query.trim() !== "" || filterId !== "all";
  const followRows = browsingCompanies || showAllFollowed ? followed : followed.slice(0, 5);
  const visibleFeed = filterFollowFeed(feed.items, feedFilter);
  const feedSlugs = new Set(visibleFeed.map((item) => item.companySlug));
  const followedWithoutFeed = followed.filter((company) => !feedSlugs.has(company.slug));

  function openDiscovery() {
    setDiscoveryExpanded(true);
    searchRef.current?.focus();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="divlab-hero">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-divlab-blue/15 blur-3xl"
        />
        <div className="relative">
          <p className="divlab-section-label">Personligt</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-divlab-text">
            Mitt DivLab
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
            Händelser från bolagen du följer. Bara officiella källor, DivLab-artiklar och
            kursrörelser som redan finns för de bolagen.
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <SummaryStat
              label="Följda bolag"
              value={followedCount === null ? "—" : String(followedCount)}
            />
            <SummaryStat
              label="Kommande rapporter"
              value={isAvailable ? String(feed.summary.upcomingReports) : "—"}
            />
            <SummaryStat
              label="Nya officiella"
              value={isAvailable ? String(feed.summary.newOfficialEvents) : "—"}
            />
          </dl>
        </div>
      </section>

      <section className="divlab-card mt-4 p-4 sm:p-5" aria-label="Sök bolag att följa">
        <label htmlFor="watchlist-search" className="sr-only">
          Sök bolag att följa
        </label>
        <input
          ref={searchRef}
          id="watchlist-search"
          type="search"
          value={query}
          placeholder="Sök bolag att följa"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => {
            const nextQuery = event.target.value;
            if (nextQuery.trim()) setDiscoveryExpanded(true);
            onQueryChange(nextQuery);
          }}
          className="divlab-input min-h-11 w-full px-4"
        />
        <div className="mt-3">
          <label htmlFor="watchlist-sort" className="sr-only">
            Sortering
          </label>
          <select
            id="watchlist-sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as WatchlistSort)}
            className="divlab-input min-h-11 w-full px-3 sm:w-52"
          >
            <option value="name">A–Ö</option>
            <option value="exchange">Börs/marknad</option>
            <option value="recent">Senast följda</option>
          </select>
        </div>
      </section>

      {!isAvailable ? (
        <section className="divlab-card mt-4 p-8 text-center">
          <h2 className="text-lg font-semibold text-divlab-text">
            Följlistan är tillfälligt otillgänglig
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-divlab-text-secondary">
            Vi kan inte läsa dina följda bolag just nu. Det betyder inte att listan är tom.
            Försök igen om en stund.
          </p>
        </section>
      ) : showEmptyFollows ? (
        <section className="divlab-card mt-4 p-8 text-center">
          <h2 className="text-lg font-semibold text-divlab-text">
            Du följer inga bolag ännu
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-divlab-text-secondary">
            Sök bland bolagen och följ det första. Flödet byggs bara av bolag du själv följer.
          </p>
          <button
            type="button"
            onClick={openDiscovery}
            className="divlab-btn-primary mt-4 min-h-11 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50"
          >
            Följ ditt första bolag
          </button>
        </section>
      ) : (
        <>
          <section className="mt-4" aria-labelledby="followed-heading">
            <h2 id="followed-heading" className="px-1 text-lg font-semibold text-divlab-text">
              Bolag du följer
            </h2>
            {showNoFollowMatches ? (
              <p className="divlab-card mt-3 px-5 py-8 text-center text-sm text-divlab-text-secondary">
                Inga följda bolag matchar sökningen.
              </p>
            ) : (
              <div className="divlab-card mt-3 divide-y divide-[var(--divlab-divider)] overflow-hidden">
                {followRows.map((company) => (
                  <FollowedRow
                    key={company.id}
                    company={company}
                    follow={renderFollow({
                      slug: company.slug,
                      displayName: company.displayName,
                      isFollowing: true,
                      followMode: "unfollow",
                    })}
                  />
                ))}
                {followed.length > 5 && !browsingCompanies ? (
                  <div className="px-4 py-3 sm:px-5">
                    <button
                      type="button"
                      onClick={() => setShowAllFollowed((open) => !open)}
                      className="text-sm font-semibold text-divlab-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50"
                    >
                      {showAllFollowed ? "Visa färre" : `Visa alla ${followed.length} följda bolag`}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <div
            className="sticky top-16 z-20 -mx-4 mt-4 border-b divlab-border-neutral bg-divlab-bg/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:top-20 lg:-mx-8 lg:px-8"
          >
            <div
              className="flex gap-2 overflow-x-auto"
              role="toolbar"
              aria-label="Filtrera flödet"
            >
              {FOLLOW_FEED_FILTERS.map((filter) => {
                const selected = filter.id === feedFilter;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFeedFilter(filter.id)}
                    className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 ${
                      selected
                        ? "divlab-selected"
                        : "divlab-border-neutral bg-divlab-surface text-divlab-text-secondary"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <section className="divlab-card mt-4 overflow-hidden" aria-labelledby="follow-feed-heading">
            <div className="flex items-baseline justify-between gap-3 px-4 pt-4 sm:px-5">
              <h2 id="follow-feed-heading" className="text-lg font-semibold text-divlab-text">
                {feed.mode === "calendar_fallback" ? "Nästa kända datum" : "Flöde"}
              </h2>
            </div>
            {feed.sourcesUnavailable ? (
              <p className="px-4 pt-3 text-sm leading-6 text-divlab-text-secondary sm:px-5">
                Officiella händelser kunde inte läsas just nu. Inget är ifyllt i deras ställe.
              </p>
            ) : null}
            {feed.mode === "calendar_fallback" ? (
              <p className="px-4 pt-3 text-sm leading-6 text-divlab-text-secondary sm:px-5">
                Inga nya händelser ännu. Här är nästa kända kalenderdatum från bolagen du följer.
              </p>
            ) : null}
            <div className="mt-2">
              <FollowFeedList items={visibleFeed} />
            </div>
            {feed.mode === "calendar_fallback" && feedFilter === "all" && followedWithoutFeed.length > 0 ? (
              <ul className="border-t divlab-border-neutral px-4 py-3 sm:px-5">
                {followedWithoutFeed.map((company) => (
                  <li key={company.id} className="py-2 text-sm">
                    <Link
                      href={companyPath(company.slug)}
                      className="font-semibold text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 hover:text-divlab-blue"
                    >
                      {company.displayName}
                    </Link>
                    <span className="text-divlab-text-muted"> · {company.ticker}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </>
      )}

      <section className="mt-8" aria-labelledby="discovery-heading">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <h2 id="discovery-heading" className="text-xl font-semibold tracking-[-0.03em] text-divlab-text">
              Upptäck bolag
            </h2>
            <p className="mt-1 text-sm text-divlab-text-secondary">
              {discovery.length} bolag som går att följa
            </p>
          </div>
          <button
            type="button"
            aria-expanded={discoveryExpanded}
            aria-controls="watchlist-discovery-list"
            onClick={() => setDiscoveryExpanded((expanded) => !expanded)}
            className="divlab-btn-secondary min-h-11 shrink-0 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50"
          >
            {discoveryExpanded ? "Dölj bolag" : `Visa bolag (${discovery.length})`}
            <span aria-hidden="true" className="ml-1">
              {discoveryExpanded ? "▴" : "▾"}
            </span>
          </button>
        </div>
        <div id="watchlist-discovery-list" hidden={!discoveryExpanded}>
          <div
            className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1"
            role="toolbar"
            aria-label="Marknadsfilter"
          >
            {filters.map((filter) => {
              const selected = filter.id === filterId;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    if (filter.id !== "all") setDiscoveryExpanded(true);
                    onFilterChange(filter.id);
                  }}
                  className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 ${
                    selected
                      ? "divlab-selected"
                      : "divlab-border-neutral bg-divlab-surface text-divlab-text-secondary"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          {showNoDiscoveryMatches ? (
            <p className="divlab-card mt-3 px-5 py-8 text-center text-sm text-divlab-text-secondary">
              Inga bolag matchar sökningen.
            </p>
          ) : (
            <div className="divlab-card mt-3 divide-y divide-[var(--divlab-divider)] overflow-hidden">
              {discovery.map((company) => (
                <DiscoveryRow
                  key={company.slug}
                  company={company}
                  follow={renderFollow({
                    slug: company.slug,
                    displayName: company.displayName,
                    isFollowing: company.isFollowing,
                    followMode: "discovery",
                  })}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
