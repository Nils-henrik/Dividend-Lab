"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/layout/AppIcon";
import CompanyLogo from "@/components/companies/CompanyLogo";
import PriceSparkline from "@/components/companies/PriceSparkline";
import {
  quoteToneClass,
  type DiscoveryCompany,
  type FollowControlModel,
  type FollowedCompanyCard,
  type FollowedNewsItem,
  type MarketFilter,
  type WatchlistSort,
  type WatchlistView,
} from "@/lib/companies/watchlist";

type Props = {
  isAvailable: boolean;
  followedCount: number | null;
  followed: readonly FollowedCompanyCard[];
  discovery: readonly (DiscoveryCompany & { isFollowing: boolean })[];
  news: readonly FollowedNewsItem[];
  filters: readonly MarketFilter[];
  query: string;
  sort: WatchlistSort;
  view: WatchlistView;
  filterId: string;
  showEmptyFollows: boolean;
  showNoFollowMatches: boolean;
  showNoDiscoveryMatches: boolean;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: WatchlistSort) => void;
  onViewChange: (view: WatchlistView) => void;
  onFilterChange: (filterId: string) => void;
  renderFollow: (company: FollowControlModel) => ReactNode;
};

const FEATURES = [
  ["Kurser", "Följ dagsutvecklingen", "chart"],
  ["Personligt flöde", "Nyheter och bolagshändelser", "news"],
  ["Rapportdatum", "Se kommande rapporter", "calendar"],
  ["Allt på ett ställe", "Bygg din egen bevakning", "watchlist"],
] as const satisfies readonly (readonly [string, string, AppIconName])[];

function companyPath(slug: string) {
  return `/bolag/${slug}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-divlab-text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-divlab-text" title={value}>
        {value}
      </dd>
    </div>
  );
}

function FollowedListCard({
  company,
  follow,
}: {
  company: FollowedCompanyCard;
  follow: ReactNode;
}) {
  const toneClass = quoteToneClass(company.tone);

  return (
    <article className="divlab-card p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <CompanyLogo name={company.name} logoPath={company.logoPath} size="compact" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-lg font-semibold tracking-[-0.03em] text-divlab-text">
              <Link
                href={companyPath(company.slug)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 hover:text-divlab-blue"
              >
                {company.displayName}
              </Link>
            </h3>
            {company.indexLabels.map((label) => (
              <span
                key={label}
                className="rounded-md bg-divlab-blue/10 px-2 py-0.5 text-xs font-semibold text-divlab-blue"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="mt-1 truncate text-sm text-divlab-text-secondary">
            {company.ticker}
            <span className="px-1.5 text-divlab-text-muted">·</span>
            {company.exchange}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums tracking-[-0.04em] text-divlab-text">
            {company.priceLabel}
          </p>
          <p className={`mt-1 text-sm font-semibold tabular-nums ${toneClass}`}>
            {company.changeLabel}
            <span className="ml-2">{company.changePctLabel}</span>
          </p>
          <p className="mt-1 text-xs text-divlab-text-muted">
            Fördröjd kurs · {company.timestampLabel}
          </p>
        </div>
        <PriceSparkline values={company.sparkline} tone={company.tone} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Stat label="Dagshögsta" value={company.dayHighLabel} />
        <Stat label="Dagslägsta" value={company.dayLowLabel} />
        <Stat label="Volym" value={company.volumeLabel} />
        <Stat label="Börsvärde" value={company.marketCapLabel} />
      </dl>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center [&_button]:w-full [&_form]:w-full sm:[&_button]:w-auto sm:[&_form]:w-auto">
        <Link
          href={companyPath(company.slug)}
          className="divlab-btn-primary min-h-11 w-full px-4 py-2.5 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 sm:w-auto"
        >
          Visa bolagssida
        </Link>
        {follow}
      </div>
    </article>
  );
}

function FollowedCompactRow({
  company,
  follow,
}: {
  company: FollowedCompanyCard;
  follow: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
      <Link
        href={companyPath(company.slug)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50"
      >
        <CompanyLogo name={company.name} logoPath={company.logoPath} size="compact" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="truncate font-semibold text-divlab-text">{company.displayName}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-divlab-text">
              {company.priceLabel}
            </span>
          </span>
          <span className="mt-0.5 flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-divlab-text-muted">{company.ticker}</span>
            <span className={`shrink-0 text-sm font-semibold tabular-nums ${quoteToneClass(company.tone)}`}>
              {company.changePctLabel}
            </span>
          </span>
          <span className="mt-2 hidden gap-4 text-xs text-divlab-text-muted md:flex">
            <span>Hög {company.dayHighLabel}</span>
            <span>Låg {company.dayLowLabel}</span>
            <span>Volym {company.volumeLabel}</span>
          </span>
        </span>
      </Link>
      <div className="flex shrink-0 gap-2">
        <Link
          href={companyPath(company.slug)}
          aria-label={`Öppna ${company.displayName}`}
          className="divlab-btn-secondary min-h-11 flex-1 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 sm:flex-none"
        >
          Öppna
        </Link>
        {follow}
      </div>
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
  news,
  filters,
  query,
  sort,
  view,
  filterId,
  showEmptyFollows,
  showNoFollowMatches,
  showNoDiscoveryMatches,
  onQueryChange,
  onSortChange,
  onViewChange,
  onFilterChange,
  renderFollow,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="divlab-hero">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-divlab-blue/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/4 h-48 w-80 rounded-full bg-divlab-blue/10 blur-3xl"
        />
        <div className="relative">
          <p className="divlab-section-label">Personligt</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.045em] text-divlab-text">
                Din följlista
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
                Samla bolagen du följer och få kurser, nyheter, rapporter och viktiga
                bolagshändelser på ett ställe.
              </p>
            </div>
            <div className="rounded-xl border divlab-border-neutral bg-divlab-card px-4 py-3 text-center sm:min-w-36">
              <p className="text-2xl font-semibold tabular-nums text-divlab-text">
                {followedCount === null ? "—" : followedCount}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
                Följda bolag
              </p>
            </div>
          </div>
        </div>
      </section>

      <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {FEATURES.map(([title, text, icon]) => (
          <li key={title} className="divlab-card p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-divlab-blue/10 text-divlab-blue">
              <AppIcon name={icon} className="h-4 w-4" />
            </span>
            <p className="mt-3 text-sm font-semibold text-divlab-text">{title}</p>
            <p className="mt-1 text-xs leading-5 text-divlab-text-secondary">{text}</p>
          </li>
        ))}
      </ul>

      <section className="divlab-card mt-4 p-4 sm:p-5" aria-label="Sök och filtrera bolag">
        <label htmlFor="watchlist-search" className="sr-only">
          Sök bolag
        </label>
        <input
          id="watchlist-search"
          type="search"
          value={query}
          placeholder="Sök bolag..."
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => onQueryChange(event.target.value)}
          className="divlab-input min-h-11 w-full px-4"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="watchlist-sort" className="sr-only">
            Sortering
          </label>
          <select
            id="watchlist-sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as WatchlistSort)}
            className="divlab-input min-h-11 px-3 sm:w-52"
          >
            <option value="name">A–Ö</option>
            <option value="exchange">Börs/marknad</option>
            <option value="recent">Senast följda</option>
          </select>
          <div
            role="radiogroup"
            aria-label="Visningsläge"
            className="flex rounded-xl border divlab-border-neutral p-1"
          >
            {(
              [
                ["list", "Lista"],
                ["compact", "Kompakt"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={view === value}
                onClick={() => onViewChange(value)}
                className={`min-h-11 flex-1 rounded-lg px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 sm:flex-none ${
                  view === value
                    ? "bg-divlab-blue text-white"
                    : "text-divlab-text-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
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
                onClick={() => onFilterChange(filter.id)}
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
            Sök eller bläddra bland bolagen nedan och följ dem direkt.
          </p>
        </section>
      ) : (
        <section className="mt-4" aria-labelledby="followed-heading">
          <h2 id="followed-heading" className="px-1 text-lg font-semibold text-divlab-text">
            Följda bolag ({followed.length})
          </h2>
          {showNoFollowMatches ? (
            <p className="divlab-card mt-3 px-5 py-8 text-center text-sm text-divlab-text-secondary">
              Inga följda bolag matchar sökningen.
            </p>
          ) : view === "compact" ? (
            <div className="divlab-card mt-3 divide-y divide-[var(--divlab-divider)] overflow-hidden">
              {followed.map((company) => (
                <FollowedCompactRow
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
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {followed.map((company) => (
                <FollowedListCard
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
            </div>
          )}
        </section>
      )}

      {news.length > 0 ? (
        <section className="divlab-card mt-4 p-5" aria-labelledby="followed-news-heading">
          <h2 id="followed-news-heading" className="text-base font-semibold text-divlab-text">
            Senaste från bolag du följer
          </h2>
          <ul className="mt-3 divide-y divide-[var(--divlab-divider)]">
            {news.map((article) => (
              <li key={article.id} className="py-3">
                {article.href ? (
                  <Link
                    href={article.href}
                    className="text-sm font-semibold text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 hover:text-divlab-blue"
                  >
                    {article.title}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-divlab-text">{article.title}</p>
                )}
                <p className="mt-1 text-xs text-divlab-text-muted">{article.publishedLabel}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
      </section>
    </div>
  );
}
