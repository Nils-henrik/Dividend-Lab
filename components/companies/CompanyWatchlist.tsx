import Link from "next/link";
import CompanyLogo from "@/components/companies/CompanyLogo";
import FollowCompanyButton from "@/components/companies/FollowCompanyButton";
import type { FollowedCompany } from "@/lib/companies/server";

type Props = {
  companies: FollowedCompany[];
  isAvailable: boolean;
};

export default function CompanyWatchlist({ companies, isAvailable }: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="divlab-hero">
        <p className="divlab-section-label">Personligt</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] text-divlab-text">
              Din följlista
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
              Samla bolagen du vill följa. När den officiella bevakningen kopplas
              in blir detta också grunden för ditt personliga nyhetsflöde.
            </p>
          </div>
          <div className="rounded-xl border divlab-border-neutral bg-divlab-surface px-4 py-3 text-center">
            <p className="text-2xl font-semibold text-divlab-text">{companies.length}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
              Följda bolag
            </p>
          </div>
        </div>
      </section>

      {!isAvailable ? (
        <section className="divlab-card mt-4 p-8 text-center">
          <h2 className="text-lg font-semibold text-divlab-text">
            Följlistan väntar på databasmigreringen
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-divlab-text-muted">
            Gränssnittet är klart, men den säkra följtabellen behöver appliceras
            innan bolag kan sparas.
          </p>
        </section>
      ) : companies.length === 0 ? (
        <section className="divlab-card mt-4 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-divlab-blue/20 bg-divlab-blue/10 text-2xl text-divlab-blue">
            +
          </div>
          <h2 className="mt-5 text-lg font-semibold text-divlab-text">
            Din följlista är tom
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-divlab-text-muted">
            Öppna ett pilotbolag och välj Följ bolaget. Därefter hittar du det
            här nästa gång du loggar in.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              ["Investor", "/bolag/investor"],
              ["Volvo", "/bolag/volvo"],
              ["Ericsson", "/bolag/ericsson"],
              ["Atlas Copco", "/bolag/atlas-copco"],
              ["AstraZeneca", "/bolag/astrazeneca"],
            ].map(([name, href]) => (
              <Link key={href} href={href} className="divlab-btn-secondary">
                {name}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="divlab-card mt-4 overflow-hidden">
          <div className="border-b divlab-border-neutral px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-divlab-text">Följda bolag</h2>
          </div>
          <div className="divide-y divide-[var(--divlab-divider)]">
            {companies.map((company) => {
              const href = `/bolag/${company.slug}`;

              return (
                <article
                  key={company.id}
                  className="divlab-row-hover flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <Link href={href} className="flex min-w-0 items-center gap-4">
                    <CompanyLogo
                      name={company.name}
                      logoPath={company.logoPath}
                      size="compact"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-divlab-text">
                        {company.name}
                      </h3>
                      <p className="mt-1 truncate text-sm text-divlab-text-muted">
                        {company.ticker} · {company.exchange}
                      </p>
                    </div>
                  </Link>
                  <FollowCompanyButton
                    companySlug={company.slug}
                    isAuthenticated
                    isAvailable
                    isFollowing
                    loginHref={`/login?redirect=${encodeURIComponent(href)}`}
                    compact
                  />
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

