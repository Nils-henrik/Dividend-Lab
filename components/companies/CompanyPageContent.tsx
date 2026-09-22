import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/layout/AppIcon";
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
  relatedCompanies: readonly CompanyProfile[];
};

const REPORT_TYPES = new Set<CompanyOfficialDocument["type"]>([
  "quarterly_report",
  "half_year_report",
  "annual_report",
]);

const PAGE_TABS = [
  ["Kursutveckling", "#kursutveckling"],
  ["Om bolaget", "#om-bolaget"],
  ["Nyheter", "#nyheter"],
  ["Pressmeddelanden", "#pressmeddelanden"],
  ["Rapporter", "#rapporter"],
  ["Kalender", "#kalender"],
] as const;

function formatDocumentDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Stockholm",
  }).format(new Date(value));
}

function PanelHeading({
  title,
  href,
  linkLabel = "Se alla",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold tracking-[-0.02em] text-divlab-text sm:text-lg">
        {title}
      </h2>
      {href ? (
        <a
          href={href}
          className="shrink-0 text-xs font-semibold text-divlab-blue transition hover:text-divlab-blue-hover"
        >
          {linkLabel} <span aria-hidden="true">→</span>
        </a>
      ) : null}
    </div>
  );
}

function IconBadge({ name }: { name: AppIconName }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-divlab-blue/10 text-divlab-blue">
      <AppIcon name={name} className="h-5 w-5" strokeWidth={1.8} />
    </span>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed divlab-border-neutral bg-divlab-surface px-4 py-7 text-center">
      <p className="text-sm leading-6 text-divlab-text-muted">{children}</p>
    </div>
  );
}

function OfficialDocumentLink({
  document,
  icon = "news",
}: {
  document: CompanyOfficialDocument;
  icon?: AppIconName;
}) {
  return (
    <a
      href={document.url}
      target="_blank"
      rel="noopener noreferrer"
      className="divlab-row-hover flex items-center gap-3 rounded-xl px-2 py-2.5"
    >
      <IconBadge name={icon} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-divlab-text">
          {document.title}
        </span>
        <span className="mt-1 block text-xs text-divlab-text-muted">
          {[document.fiscalPeriod, formatDocumentDate(document.publishedAt)]
            .filter(Boolean)
            .join(" · ") || document.publisher}
        </span>
      </span>
      <span className="text-divlab-text-muted" aria-hidden="true">
        ↗
      </span>
    </a>
  );
}

export default function CompanyPageContent({
  company,
  articles,
  isAuthenticated,
  followState,
  relatedCompanies,
}: Props) {
  const companyPath = `/bolag/${company.slug}`;
  const loginHref = `/login?redirect=${encodeURIComponent(companyPath)}`;
  const pressReleases = followState.documents
    .filter((document) => document.type === "press_release")
    .slice(0, 6);
  const reports = followState.documents
    .filter((document) => REPORT_TYPES.has(document.type))
    .slice(0, 3);
  const reportDates = followState.documents
    .filter((document) => document.type === "report_date" && document.eventAt)
    .toSorted(
      (first, second) =>
        new Date(first.eventAt ?? 0).getTime() -
        new Date(second.eventAt ?? 0).getTime(),
    )
    .slice(0, 3);
  const countryFlag = company.countryCode === "SE" ? "🇸🇪" : "🌍";
  const facts = [
    ["Ticker", company.ticker],
    ["Marknad", company.exchange],
    ["Segment", company.segment],
    ["Sektor", company.sector],
    ["Grundat", company.founded],
    ["Land", company.countryName],
  ] as const;
  const companyOverviewFacts: ReadonlyArray<{
    label: string;
    value: string;
    icon: AppIconName;
  }> = [
    { label: "Grundat", value: company.founded, icon: "portfolio" },
    {
      label: "Huvudkontor",
      value: `${countryFlag} ${company.headquarters}`,
      icon: "dashboard",
    },
    { label: "Sektor", value: company.sector, icon: "chart" },
    { label: "Marknad", value: company.exchange, icon: "pieChart" },
  ];
  const quickLinks: ReadonlyArray<{
    label: string;
    href: string;
    icon: AppIconName;
  }> = [
    { label: "Rapportkalender", href: company.calendarUrl, icon: "calendar" },
    { label: "Senaste rapporter", href: company.reportsUrl, icon: "news" },
    {
      label: "Pressmeddelanden",
      href: company.pressReleasesUrl,
      icon: "messages",
    },
    { label: "Investor Relations", href: company.websiteUrl, icon: "chart" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <nav
        aria-label="Brödsmulor"
        className="mb-4 flex items-center gap-2 text-xs text-divlab-text-muted sm:text-sm"
      >
        <Link href="/" className="transition hover:text-divlab-text">
          Hem
        </Link>
        <span aria-hidden="true">›</span>
        <Link href="/watchlist" className="transition hover:text-divlab-text">
          Bolag
        </Link>
        <span aria-hidden="true">›</span>
        <span className="truncate text-divlab-text-secondary">{company.name}</span>
      </nav>

      <section className="divlab-card overflow-hidden p-5 sm:p-7">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <CompanyLogo
              name={company.name}
              logoPath={company.logoPath}
              size="hero"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-divlab-elevated px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-divlab-text-secondary">
                  Aktie
                </span>
                <span className="rounded-lg bg-divlab-elevated px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-divlab-text-secondary">
                  {company.segment}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-divlab-text sm:text-4xl">
                {company.name}
              </h1>
              <p className="mt-2 text-sm font-medium text-divlab-text-secondary">
                {company.ticker} <span className="px-1.5">·</span> {company.exchange}
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-divlab-text-secondary sm:text-[15px]">
                {company.shortDescription}
              </p>
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border divlab-border-neutral bg-divlab-surface px-3 py-2 text-xs font-semibold text-divlab-blue transition hover:border-divlab-blue/35"
              >
                <span aria-hidden="true">◎</span>
                {company.websiteLabel}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div className="lg:text-right">
            <FollowCompanyButton
              companySlug={company.slug}
              isAuthenticated={isAuthenticated}
              isAvailable={followState.isAvailable}
              isFollowing={followState.isFollowing}
              loginHref={loginHref}
            />
            <p className="mt-3 text-xs leading-5 text-divlab-text-muted">
              {followState.isFollowing
                ? "Bolaget finns i din personliga följlista."
                : isAuthenticated
                  ? "Få rapporter och bolagsnyheter samlade i din följlista."
                  : "Logga in för att följa bolaget och samla uppdateringar."}
            </p>
            <div className="mt-5 rounded-xl bg-divlab-elevated px-4 py-3 text-left lg:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-divlab-text-muted">
                Kursdata
              </p>
              <p className="mt-1 text-sm font-semibold text-divlab-text">
                Livegraf från TradingView
              </p>
            </div>
          </div>
        </div>
      </section>

      <dl className="mt-4 grid overflow-hidden rounded-2xl border divlab-border-neutral bg-divlab-card shadow-[var(--divlab-card-shadow)] sm:grid-cols-2 xl:grid-cols-6">
        {facts.map(([label, value]) => (
          <div
            key={label}
            className="border-b divlab-border-neutral px-5 py-4 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
          >
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-divlab-text-muted">
              {label}
            </dt>
            <dd className="mt-1.5 truncate text-sm font-semibold text-divlab-text">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <nav
        aria-label="Bolagssidans innehåll"
        className="sticky top-20 z-20 mt-4 flex gap-1 overflow-x-auto rounded-2xl border divlab-border-neutral bg-divlab-card/95 p-1.5 shadow-sm backdrop-blur"
      >
        {PAGE_TABS.map(([label, href], index) => (
          <a
            key={href}
            href={href}
            className={`shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition sm:text-sm ${
              index === 0
                ? "bg-divlab-blue text-white shadow-sm"
                : "text-divlab-text-muted hover:bg-[var(--divlab-hover)] hover:text-divlab-text"
            }`}
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.7fr)]">
        <main className="min-w-0 space-y-4">
          <section
            id="kursutveckling"
            className="divlab-card scroll-mt-36 p-4 sm:p-6"
          >
            <PanelHeading title="Kursutveckling" />
            <p className="mt-1 text-xs leading-5 text-divlab-text-muted">
              Interaktiv marknadsdata från TradingView. Data kan vara fördröjd.
            </p>
            <div className="mt-4">
              <CompanyPriceChart
                companyName={company.name}
                symbol={company.tradingViewSymbol}
              />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.8fr)]">
            <section
              id="nyheter"
              className="divlab-card scroll-mt-36 p-5 sm:p-6"
            >
              <PanelHeading title={`Senaste nyheter om ${company.name}`} />
              {articles.length > 0 ? (
                <div className="mt-2">
                  {articles.slice(0, 4).map((article) => (
                    <NewsArticleRow key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <EmptyState>
                  Det finns ännu inga publicerade DivLab-artiklar som är kopplade
                  till bolaget.
                </EmptyState>
              )}
            </section>

            <div className="space-y-4">
              <section
                id="kalender"
                className="divlab-card scroll-mt-36 p-5"
              >
                <PanelHeading
                  title="Kommande händelser"
                  href={company.calendarUrl}
                />
                {reportDates.length > 0 ? (
                  <ol className="mt-4 space-y-1 border-l-2 border-divlab-blue/25 pl-4">
                    {reportDates.map((document) => (
                      <li key={document.id} className="relative py-2">
                        <span className="absolute -left-[21px] top-4 h-2.5 w-2.5 rounded-full bg-divlab-blue ring-4 ring-divlab-card" />
                        <a
                          href={document.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block transition hover:text-divlab-blue"
                        >
                          <time
                            dateTime={document.eventAt ?? undefined}
                            className="text-xs font-semibold text-divlab-blue"
                          >
                            {formatDocumentDate(document.eventAt)}
                          </time>
                          <span className="mt-1 block text-sm font-semibold text-divlab-text">
                            {document.title}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <EmptyState>
                    Händelser visas när den officiella kalendern har verifierats.
                  </EmptyState>
                )}
              </section>

              <section
                id="rapporter"
                className="divlab-card scroll-mt-36 p-5"
              >
                <PanelHeading title="Senaste rapporter" href={company.reportsUrl} />
                {reports.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    {reports.map((document) => (
                      <OfficialDocumentLink
                        key={document.id}
                        document={document}
                        icon="news"
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState>
                    Rapporter länkas direkt från bolagets officiella källa.
                  </EmptyState>
                )}
              </section>
            </div>
          </div>

          <section
            id="pressmeddelanden"
            className="divlab-card scroll-mt-36 p-5 sm:p-6"
          >
            <PanelHeading
              title="Senaste pressmeddelanden"
              href={company.pressReleasesUrl}
              linkLabel="Officiell källa"
            />
            <p className="mt-1 text-xs leading-5 text-divlab-text-muted">
              Verifierade originalkällor med länk tillbaka till publicerande bolag.
            </p>
            {pressReleases.length > 0 ? (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {pressReleases.map((document) => (
                  <OfficialDocumentLink key={document.id} document={document} />
                ))}
              </div>
            ) : (
              <EmptyState>
                Bevakningen fylls på av DivLabs kontrollerade importflöde.
              </EmptyState>
            )}
          </section>
        </main>

        <aside className="min-w-0 space-y-4">
          <section
            id="om-bolaget"
            className="divlab-card scroll-mt-36 p-5 sm:p-6"
          >
            <PanelHeading title="Kort om bolaget" />
            <dl className="mt-5 space-y-4">
              {companyOverviewFacts.map((fact) => (
                <div key={fact.label} className="flex items-center gap-3">
                  <IconBadge name={fact.icon} />
                  <div className="min-w-0">
                    <dt className="text-xs text-divlab-text-muted">
                      {fact.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-divlab-text">
                      {fact.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-5 border-t divlab-border-neutral pt-5 text-sm leading-6 text-divlab-text-secondary">
              {company.description}
            </p>
            <a
              href={company.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-divlab-blue hover:text-divlab-blue-hover"
            >
              Läs mer om bolaget <span aria-hidden="true">→</span>
            </a>
          </section>

          <section className="divlab-card p-5 sm:p-6">
            <PanelHeading title="Snabblänkar" />
            <div className="mt-3 divide-y divide-[var(--divlab-divider)]">
              {quickLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="divlab-row-hover flex items-center gap-3 py-3"
                >
                  <IconBadge name={link.icon} />
                  <span className="min-w-0 flex-1 text-sm font-medium text-divlab-text">
                    {link.label}
                  </span>
                  <span className="text-divlab-text-muted" aria-hidden="true">
                    ›
                  </span>
                </a>
              ))}
            </div>
          </section>

          <section className="divlab-card p-5 sm:p-6">
            <PanelHeading title="Relaterade bolag" />
            <div className="mt-3 space-y-1">
              {relatedCompanies.map((relatedCompany) => (
                <Link
                  key={relatedCompany.slug}
                  href={`/bolag/${relatedCompany.slug}`}
                  className="divlab-row-hover flex items-center gap-3 rounded-xl px-2 py-2.5"
                >
                  <CompanyLogo
                    name={relatedCompany.name}
                    logoPath={relatedCompany.logoPath}
                    size="compact"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-divlab-text">
                      {relatedCompany.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-divlab-text-muted">
                      {relatedCompany.ticker} · {relatedCompany.sector}
                    </span>
                  </span>
                  <span className="text-divlab-blue" aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <p className="mt-5 text-xs leading-5 text-divlab-text-muted">
        Informationen är allmän och utgör inte personlig investeringsrådgivning.
        Kursdata kan vara fördröjd.
      </p>
    </div>
  );
}
