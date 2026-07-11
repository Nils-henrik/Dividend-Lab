import type { ForumCompanyDirectoryResult } from "@/lib/forum/companies/types";
import type { ForumCompanyCountryUrlValue } from "@/lib/forum/companies/filters";
import ForumBreadcrumbs from "@/components/forum/ForumBreadcrumbs";
import ForumPageHeader from "@/components/forum/ForumPageHeader";
import ForumSubnav from "@/components/forum/ForumSubnav";
import ForumCompanyDirectoryFilters from "./ForumCompanyDirectoryFilters";
import ForumCompanyRow from "./ForumCompanyRow";

type Props = {
  directory: ForumCompanyDirectoryResult;
  activeLand: ForumCompanyCountryUrlValue | null;
  activeLista: string | null;
  query: string;
};

export default function ForumCompanyDirectoryPage({
  directory,
  activeLand,
  activeLista,
  query,
}: Props) {
  const { companies, collections, isDirectoryUnavailable } = directory;
  const hasActiveFilters = Boolean(query || activeLand || activeLista);

  return (
    <div className="space-y-3">
      <ForumSubnav />

      <ForumBreadcrumbs
        items={[
          { label: "Forum", href: "/forum" },
          { label: "Bolag" },
        ]}
      />

      <ForumPageHeader
        title="Bolag"
        description="Hitta bolagsspecifika forumytor och sök efter svenska och amerikanska bolag efter namn, ticker, land eller utvald lista."
        showCreateAction={false}
      />

      <section className="divlab-surface-panel p-4">
        <ForumCompanyDirectoryFilters
          query={query}
          activeLand={activeLand}
          activeLista={activeLista}
          collections={collections}
        />
      </section>

      {isDirectoryUnavailable ? (
        <section className="divlab-card p-8 text-center">
          <p className="text-sm font-medium text-divlab-text">
            Bolagskatalogen är inte tillgänglig än
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-divlab-text-muted">
            Databasmigrationen för bolagskatalogen behöver appliceras innan
            katalogen kan läsas. Kontakta administratören om problemet kvarstår.
          </p>
        </section>
      ) : (
        <section className="divlab-surface-panel overflow-hidden">
          <div className="border-b divlab-border-neutral px-4 py-3">
            <h2 className="text-base font-semibold text-divlab-text">
              Utvalda bolag
            </h2>
            <p className="mt-1 text-xs leading-5 text-divlab-text-muted">
              {companies.length} bolag
              {hasActiveFilters ? " matchar dina filter" : " i den utvalda katalogen"}.
            </p>
          </div>

          {companies.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-divlab-text">
                Inga bolag hittades
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-divlab-text-muted">
                {hasActiveFilters
                  ? "Prova att rensa sökningen eller ändra land- och listfilter."
                  : "Det finns inga aktiva bolag i katalogen just nu."}
              </p>
            </div>
          ) : (
            <div>
              {companies.map((company) => (
                <ForumCompanyRow key={company.id} company={company} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
