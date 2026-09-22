import Link from "next/link";
import CompanyLogo from "@/components/companies/CompanyLogo";
import CompanyPriceChart from "@/components/companies/CompanyPriceChart";
import FollowCompanyButton from "@/components/companies/FollowCompanyButton";
import NewsArticleRow from "@/components/news/NewsArticleRow";
import type {
  CompanyFollowState,
  CompanyOfficialDocument,
} from "@/lib/companies/server";
import type { CompanyProfile } from "@/lib/companies/types";
import type { NewsArticle } from "@/types/news";

type Props = {
  company: CompanyProfile;
  articles: readonly NewsArticle[];
  isAuthenticated: boolean;
  followState: CompanyFollowState;
};

const REPORT_TYPES = new Set<CompanyOfficialDocument["type"]>([
  "quarterly_report",
  "half_year_report",
  "annual_report",
]);

function formatDocumentDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeZone: "Europe/Stockholm",
  }).format(new Date(value));
}

function CompanySectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="divlab-section-label">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-divlab-text">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function EmptyOfficialData({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed divlab-border-neutral bg-divlab-surface px-5 py-8 text-center">
      <p className="text-sm leading-6 text-divlab-text-muted">{children}</p>
    </div>
  );
}

export default function CompanyPageContent({
  company,
  articles,
  isAuthenticated,
  followState,
}: Props) {
  const companyPath = `/bolag/${company.slug}`;
  const loginHref = `/login?redirect=${encodeURIComponent(companyPath)}`;
  const pressReleases = followState.documents
    .filter((document) => document.type === "press_release")
    .slice(0, 6);
  const latestReport = followState.documents.find((document) =>
    REPORT_TYPES.has(document.type),
  );
  const nextReport = followState.documents
    .filter(
      (document) =>
        document.type === "report_date" &&
        document.eventAt,
    )
    .sort(
      (first, second) =>
        new Date(first.eventAt ?? 0).getTime() -
        new Date(second.eventAt ?? 0).getTime(),
    )[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav aria-label="Brödsmulor" className="mb-4 text-sm text-divlab-text-muted">
        <Link href="/news" className="transition hover:text-divlab-text">
          Börsnyheter
        </Link>
        <span className="px-2" aria-hidden="true">
          /
        </span>
        <span className="text-divlab-text-secondary">{company.name}</span>
      </nav>

      <section className="divlab-hero">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <CompanyLogo name={company.name} logoPath={company.logoPath} />
            <div className="min-w-0">
              <p className="divlab-section-label">Bolagsöversikt</p>
              <h1 className="mt-2 truncate text-3xl font-semibold tracking-[-0.045em] text-divlab-text sm:text-4xl">
                {company.name}
              </h1>
              <p className="mt-2 text-sm text-divlab-text-secondary">
                {company.ticker} · {company.exchange}
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto md:min-w-48">
            <FollowCompanyButton
              companySlug={company.slug}
              isAuthenticated={isAuthenticated}
              isAvailable={followState.isAvailable}
              isFollowing={followState.isFollowing}
              loginHref={loginHref}
            />
            <p className="mt-2 text-center text-xs leading-5 text-divlab-text-muted">
              {followState.isFollowing
                ? "Bolaget finns i din personliga följlista."
                : isAuthenticated
                  ? "Få bolaget samlat i din personliga följlista."
                  : "Logga in för att spara bolaget i din följlista."}
            </p>
          </div>
        </div>

        <dl className="mt-7 grid gap-px overflow-hidden rounded-xl border divlab-border-neutral bg-[var(--divlab-border-subtle)] sm:grid-cols-3">
          {[
            ["Ticker", company.ticker],
            ["Marknad", company.exchange],
            ["Bevakning", "Pilotbolag"],
          ].map(([label, value]) => (
            <div key={label} className="bg-divlab-surface px-4 py-3.5">
              <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-divlab-text">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav
        aria-label="Bolagssidans innehåll"
        className="sticky top-0 z-10 mt-4 flex gap-1 overflow-x-auto rounded-xl border divlab-border-neutral bg-divlab-surface/95 p-1.5 shadow-sm backdrop-blur"
      >
        {[
          ["Översikt", "#oversikt"],
          ["DivLab-artiklar", "#artiklar"],
          ["Pressmeddelanden", "#pressmeddelanden"],
          ["Rapporter", "#rapporter"],
        ].map(([label, href], index) => (
          <a
            key={href}
            href={href}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
              index === 0
                ? "divlab-selected"
                : "text-divlab-text-muted hover:bg-[var(--divlab-hover)] hover:text-divlab-text"
            }`}
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="oversikt" className="divlab-card mt-4 scroll-mt-20 p-4 sm:p-6">
        <CompanySectionHeader
          eyebrow="Kursutveckling"
          title={`${company.name} på börsen`}
          description="Interaktiv kursgraf från TradingView. Marknadsdata kan vara fördröjd beroende på marknad och avtal."
        />
        <div className="mt-5">
          <CompanyPriceChart
            companyName={company.name}
            symbol={company.tradingViewSymbol}
          />
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <section id="artiklar" className="divlab-card scroll-mt-20 p-5 sm:p-6">
          <CompanySectionHeader
            eyebrow="Från DivLab"
            title="Senaste artiklar"
            description={`Redaktionellt material där ${company.name} är tydligt taggat i DivLabs artikeldata.`}
          />

          {articles.length > 0 ? (
            <div className="mt-3">
              {articles.map((article) => (
                <NewsArticleRow key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <EmptyOfficialData>
              Det finns ännu inga publicerade DivLab-artiklar som är kopplade till
              bolaget.
            </EmptyOfficialData>
          )}
        </section>

        <aside className="space-y-4">
          <section className="divlab-card p-5">
            <CompanySectionHeader eyebrow="Kalender" title="Nästa rapport" />
            {nextReport ? (
              <a
                href={nextReport.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 block rounded-xl border divlab-border-neutral bg-divlab-surface p-4 transition hover:border-divlab-blue/30"
              >
                <p className="text-sm font-semibold text-divlab-text">
                  {nextReport.title}
                </p>
                <p className="mt-2 text-sm text-divlab-blue">
                  {formatDocumentDate(nextReport.eventAt)}
                </p>
                <p className="mt-2 text-xs text-divlab-text-muted">
                  Källa: {nextReport.publisher}
                </p>
              </a>
            ) : (
              <EmptyOfficialData>
                Rapportdatum visas när den officiella IR-källan har verifierats.
              </EmptyOfficialData>
            )}
          </section>

          <section id="rapporter" className="divlab-card scroll-mt-20 p-5">
            <CompanySectionHeader eyebrow="Dokument" title="Senaste rapport" />
            {latestReport ? (
              <a
                href={latestReport.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 block rounded-xl border divlab-border-neutral bg-divlab-surface p-4 transition hover:border-divlab-blue/30"
              >
                <p className="text-sm font-semibold text-divlab-text">
                  {latestReport.title}
                </p>
                <p className="mt-2 text-xs text-divlab-text-muted">
                  {[latestReport.fiscalPeriod, formatDocumentDate(latestReport.publishedAt)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-2 text-xs text-divlab-blue">
                  Öppna hos {latestReport.publisher} ↗
                </p>
              </a>
            ) : (
              <EmptyOfficialData>
                Senaste kvartalsrapport länkas direkt till bolagets officiella källa.
              </EmptyOfficialData>
            )}
          </section>
        </aside>
      </div>

      <section
        id="pressmeddelanden"
        className="divlab-card mt-4 scroll-mt-20 p-5 sm:p-6"
      >
        <CompanySectionHeader
          eyebrow="Officiella källor"
          title="Senaste pressmeddelanden"
          description="DivLab visar endast verifierade originalkällor och sparar alltid länk och hämtningstid."
        />
        {pressReleases.length > 0 ? (
          <div className="mt-5 divide-y divide-[var(--divlab-divider)] overflow-hidden rounded-xl border divlab-border-neutral bg-divlab-surface">
            {pressReleases.map((document) => (
              <a
                key={document.id}
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="divlab-row-hover flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-6 text-divlab-text">
                    {document.title}
                  </p>
                  <p className="mt-1 text-xs text-divlab-text-muted">
                    {document.publisher}
                  </p>
                </div>
                <time
                  dateTime={document.publishedAt ?? undefined}
                  className="shrink-0 text-xs text-divlab-text-muted"
                >
                  {formatDocumentDate(document.publishedAt)}
                </time>
              </a>
            ))}
          </div>
        ) : (
          <EmptyOfficialData>
            Bevakningen av officiella pressmeddelanden aktiveras i datainsamlingssteget.
          </EmptyOfficialData>
        )}
      </section>

      <p className="mt-5 text-xs leading-5 text-divlab-text-muted">
        Informationen är allmän och utgör inte personlig investeringsrådgivning.
      </p>
    </div>
  );
}
