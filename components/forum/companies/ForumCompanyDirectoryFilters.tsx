import Link from "next/link";
import type { ForumCompanyCollectionRecord } from "@/lib/forum/companies/types";
import {
  buildForumCompanyDirectoryHref,
  type ForumCompanyCountryUrlValue,
} from "@/lib/forum/companies/filters";
import type { ReactNode } from "react";

type Props = {
  query: string;
  activeLand: ForumCompanyCountryUrlValue | null;
  activeLista: string | null;
  collections: ForumCompanyCollectionRecord[];
};

function FilterPill({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "true" : undefined}
      className={`inline-flex shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-white/[0.06] text-divlab-text"
          : "text-divlab-text-muted hover:bg-white/[0.03] hover:text-divlab-text-secondary"
      }`}
    >
      {children}
    </Link>
  );
}

export default function ForumCompanyDirectoryFilters({
  query,
  activeLand,
  activeLista,
  collections,
}: Props) {
  const visibleCollections = collections.filter((collection) => {
    if (!activeLand) {
      return collection.companyCount > 0;
    }

    if (activeLand === "sverige") {
      return collection.countryCode === "SE" && collection.companyCount > 0;
    }

    return collection.countryCode === "US" && collection.companyCount > 0;
  });

  return (
    <div className="space-y-3">
      <form action="/forum/bolag" method="get" className="space-y-2">
        {activeLand && <input type="hidden" name="land" value={activeLand} />}
        {activeLista && <input type="hidden" name="lista" value={activeLista} />}

        <label htmlFor="forum-company-search" className="sr-only">
          Sök bolag eller ticker
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="forum-company-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Sök bolag eller ticker"
            className="min-w-0 flex-1 divlab-input px-3 py-2.5 text-divlab-text placeholder:text-divlab-text-subtle"
          />
          <button
            type="submit"
            className="divlab-btn-secondary shrink-0 px-4 py-2.5 text-sm sm:py-2"
          >
            Sök
          </button>
        </div>
        <p className="text-[11px] text-gray-600">
          Söker efter bolagsnamn och ticker i den utvalda katalogen. Forumtrådar
          och nyheter ingår inte.
        </p>
      </form>

      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
          Land
        </p>
        <div className="-mx-1 mt-2 flex flex-wrap gap-1 px-1">
          <FilterPill
            href={buildForumCompanyDirectoryHref({
              query,
              lista: activeLista,
            })}
            isActive={!activeLand}
          >
            Alla
          </FilterPill>
          <FilterPill
            href={buildForumCompanyDirectoryHref({
              query,
              land: "sverige",
              lista: activeLand === "sverige" ? activeLista : null,
            })}
            isActive={activeLand === "sverige"}
          >
            Sverige
          </FilterPill>
          <FilterPill
            href={buildForumCompanyDirectoryHref({
              query,
              land: "usa",
              lista: activeLand === "usa" ? activeLista : null,
            })}
            isActive={activeLand === "usa"}
          >
            USA
          </FilterPill>
        </div>
      </div>

      {visibleCollections.length > 0 && (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
            Listor och index
          </p>
          <div className="-mx-1 mt-2 flex flex-wrap gap-1 px-1">
            <FilterPill
              href={buildForumCompanyDirectoryHref({
                query,
                land: activeLand,
              })}
              isActive={!activeLista}
            >
              Alla listor
            </FilterPill>
            {visibleCollections.map((collection) => (
              <FilterPill
                key={collection.slug}
                href={buildForumCompanyDirectoryHref({
                  query,
                  land: activeLand,
                  lista: collection.slug,
                })}
                isActive={activeLista === collection.slug}
              >
                {collection.name}
              </FilterPill>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-divlab-text-muted">
            Utvalda bolag i varje lista. Katalogen visar ett urval av bolag och är
            inte en fullständig indexlista.
          </p>
        </div>
      )}
    </div>
  );
}
