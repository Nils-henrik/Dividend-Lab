import type { ReactNode } from "react";
import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/layout/AppIcon";
import CompanyLogo from "@/components/companies/CompanyLogo";
import CompanyPriceChart from "@/components/companies/CompanyPriceChart";
import FollowCompanyButton from "@/components/companies/FollowCompanyButton";
import NewsArticleRow from "@/components/news/NewsArticleRow";
import { classifyCompanyDocuments, companySourceDisclaimer } from "@/lib/companies/documents-view";
import type { OfficialItem } from "@/lib/companies/investor-official";
import type { CompanyOfficialData, CompanyOfficialSection } from "@/lib/companies/official-data";
import { officialPanelCopy, type OfficialPanel } from "@/lib/companies/official-copy";
import type { CompanyPageModel, MarketChangeDirection, SourcedRow } from "@/lib/companies/page-model";
import { formatPaidDividend, partitionValuationMetrics } from "@/lib/companies/page-model";
import type { JsonLd } from "@/lib/seo/json-ld";
import { formatStatementAmount, formatSvNumber } from "@/lib/companies/valuation";
import type { CompanyFollowState } from "@/lib/companies/server";
import type { CompanyProfile } from "@/lib/companies/types";
import type { NewsArticle } from "@/types/news";

type Props = {
  company: CompanyProfile;
  articles: readonly NewsArticle[];
  isAuthenticated: boolean;
  followState: CompanyFollowState;
  peers: readonly CompanyProfile[];
  model: CompanyPageModel;
  officialData: CompanyOfficialData;
  jsonLd: JsonLd[];
  children?: ReactNode;
};

const PAGE_TABS = [
  ["Kurs", "#kursutveckling"],
  ["Nyckeltal", "#nyckeltal"],
  ["Finansiellt", "#finansiell-utveckling"],
  ["Utdelning", "#utdelning"],
  ["Aktuellt", "#aktuellt"],
  ["Rapporter", "#rapporter"],
  ["Ägare", "#agarstruktur"],
  ["Nyheter", "#nyheter"],
] as const;

function date(value: string | null) {
  if (!value) return "Datum saknas";
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Stockholm",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

function time(value: string | null) {
  if (!value) return "tidpunkt saknas";
  return new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  }).format(new Date(value));
}

function PanelHeading({ title, href, label = "Se alla", badge }: { title: string; href?: string; label?: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-[15px] font-bold tracking-[-0.02em] text-divlab-text">{title}</h2>
      <span className="flex items-center gap-3">
        {badge ? <span className="rounded-md bg-divlab-elevated px-2 py-1 text-[10px] font-semibold uppercase text-divlab-text-secondary">{badge}</span> : null}
        {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[11px] font-semibold text-divlab-blue hover:text-divlab-blue-hover">{label}</a> : null}
      </span>
    </div>
  );
}

function PanelState({ panel, section }: { panel: OfficialPanel; section: CompanyOfficialSection<unknown> }) {
  if (section.status === "available_with_items") return null;
  const copy = officialPanelCopy(panel, section.status);
  if (copy.showLink && section.sourceUrl) {
    return <p className="mt-4 text-xs leading-5 text-divlab-text-muted"><a href={section.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-divlab-blue">{copy.text}</a></p>;
  }
  return <p className="mt-4 text-xs leading-5 text-divlab-text-muted">{copy.text}</p>;
}

function amountCell(value: number | null, digits = 0) {
  if (value === null || !Number.isFinite(value)) return "—";
  return formatSvNumber(value, { maximumFractionDigits: digits });
}

function changeTone(direction: MarketChangeDirection) {
  if (direction === "positive") return { text: "text-emerald-600", dot: "bg-emerald-500" };
  if (direction === "negative") return { text: "text-red-500", dot: "bg-red-500" };
  return { text: "text-divlab-text-secondary", dot: "bg-divlab-text-muted" };
}

function rowsFromOfficial(items: OfficialItem[], publisher: string | null, documentType: string | null): SourcedRow[] {
  return items.map((item) => ({
    title: item.title,
    date: item.date,
    url: item.url,
    publisher,
    documentType,
  }));
}

function SourceLine({ row }: { row: SourcedRow }) {
  return (
    <a href={row.url} target="_blank" rel="noopener noreferrer" className="divlab-row-hover grid gap-1 rounded-lg py-3 sm:grid-cols-[108px_minmax(0,1fr)]">
      <time className="text-[11px] text-divlab-text-secondary">{row.date ? date(row.date) : "Datum saknas"}</time>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-5 text-divlab-text">{row.title}</span>
        <span className="mt-0.5 block text-[11px] text-divlab-text-muted">
          {[row.documentType, row.publisher].filter(Boolean).join(" · ") || "Officiell källa"}
        </span>
      </span>
    </a>
  );
}

export default function CompanyPageContent({
  company,
  articles,
  isAuthenticated,
  followState,
  peers,
  model,
  officialData,
  jsonLd,
  children,
}: Props) {
  const loginHref = `/login?redirect=${encodeURIComponent(`/bolag/${company.slug}`)}`;
  const classifiedDocuments = classifyCompanyDocuments(followState.documents);
  const reports = model.reports.length
    ? model.reports
    : rowsFromOfficial(classifiedDocuments.reports, officialData.reports.sourcePublisher, null);
  const pressReleases = model.press.length
    ? model.press
    : rowsFromOfficial(classifiedDocuments.pressReleases, officialData.pressReleases.sourcePublisher, "Pressmeddelande");
  const events = model.events.length
    ? model.events
    : rowsFromOfficial(classifiedDocuments.events, officialData.events.sourcePublisher, "Kalenderhändelse");
  const revenuePoints = model.financials.points.filter((point) => point.revenue !== null);
  const maxRevenue = revenuePoints.reduce((max, point) => Math.max(max, Math.abs(point.revenue ?? 0)), 0);
  const reportingCurrencies = [...new Set(model.financials.points.flatMap((point) => point.currency ? [point.currency] : []))];
  const currency = reportingCurrencies.length === 1 ? reportingCurrencies[0] : null;
  const valuationGroups = partitionValuationMetrics(model.metrics);
  const change = changeTone(model.changeDirection);
  const ceo = model.management[0];
  const json = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,var(--divlab-bg)_0%,var(--divlab-elevated)_52%,var(--divlab-bg)_100%)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      <div className="mx-auto w-full max-w-[1320px] px-3 py-4 sm:px-5 lg:px-7">
        <nav aria-label="Brödsmulor" className="mb-3 flex min-w-0 items-center gap-3 text-[11px] text-divlab-text-muted">
          <Link href="/">Hem</Link>
          <span>›</span>
          <Link href="/watchlist">Bolag</Link>
          <span>›</span>
          <span className="truncate text-divlab-text">{company.name}</span>
        </nav>

        <section className="divlab-card p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <CompanyLogo name={company.name} logoPath={company.logoPath} size="hero" />
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-divlab-elevated px-2 py-1 text-[10px] font-semibold uppercase text-divlab-text-secondary">Aktie</span>
                  <span className="rounded-md bg-divlab-elevated px-2 py-1 text-[10px] font-semibold text-divlab-text-secondary">{company.segment}</span>
                  <span className="rounded-md bg-divlab-elevated px-2 py-1 text-[10px] font-semibold text-divlab-text-secondary">{company.countryName}</span>
                </div>
                <h1 className="mt-2 break-words text-3xl font-bold tracking-[-0.045em] text-divlab-text sm:text-[38px]">{company.displayName}</h1>
                <p className="mt-1 text-sm text-divlab-text-secondary">{company.ticker} <span className="px-1">•</span> {company.exchange} <span className="px-1">•</span> {company.sector}</p>
                <p className="mt-2 max-w-2xl text-[13px] leading-5 text-divlab-text-secondary">{company.shortDescription}</p>
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end">
              <FollowCompanyButton companySlug={company.slug} isAuthenticated={isAuthenticated} isAvailable={followState.isAvailable} isFollowing={followState.isFollowing} loginHref={loginHref} />
              <div className="mt-7 text-left lg:text-right">
                <p className="text-3xl font-bold tracking-[-0.04em] text-divlab-text sm:text-4xl">{model.priceText}</p>
                <p className={`mt-1.5 text-base font-bold ${change.text}`}>
                  {model.changeText} <span className="ml-1">{model.changePctText}</span>
                </p>
                <p className="mt-2 text-[10px] text-divlab-text-muted">
                  <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${change.dot}`} />
                  Fördröjd marknadsdata · {time(model.marketTimestamp)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,2.4fr)_minmax(270px,0.95fr)]">
          <main className="min-w-0 space-y-4">
            <section id="kursutveckling" className="divlab-card overflow-hidden scroll-mt-28">
              <nav className="flex gap-1 overflow-x-auto border-b divlab-border-neutral px-4 pt-1" aria-label="Bolagsinformation">
                {PAGE_TABS.map(([label, href]) => (
                  <a key={href} href={href} className="shrink-0 border-b-2 border-transparent px-3 py-3 text-[11px] font-semibold text-divlab-text-muted hover:text-divlab-text">{label}</a>
                ))}
              </nav>
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
                <p className="max-w-xl text-[10px] leading-4 text-divlab-text-muted">Grafen kommer från TradingView. Kurs, förändring och nyckeltal kommer från Yahoo Finance.</p>
                <div className="flex flex-wrap justify-end gap-2">
                  <a href={model.marketSourceUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border divlab-border-neutral px-3 py-2 text-[10px] font-medium text-divlab-text-secondary">Kurs och nyckeltal: Yahoo Finance ↗</a>
                  <span className="rounded-lg border divlab-border-neutral px-3 py-2 text-[10px] font-medium text-divlab-text-secondary">Graf: TradingView</span>
                </div>
              </div>
              <div className="px-2 pb-2 pt-1 sm:px-4">
                <CompanyPriceChart companyName={company.displayName} symbol={company.tradingViewSymbol} />
              </div>
            </section>

            <section id="nyckeltal" className="divlab-card scroll-mt-28 p-5 sm:p-6">
              <PanelHeading title="Nyckeltal" href={model.marketSourceUrl} label="Yahoo Finance" />
              <p className="mt-2 text-[11px] leading-5 text-divlab-text-muted">Värden visas bara när leverantören har dem. Saknad data är —. Inga tal räknas om mellan valutor.</p>
              {valuationGroups.available.length ? (
                <dl className="mt-4 grid gap-px overflow-hidden rounded-xl border divlab-border-neutral bg-[var(--divlab-divider)] sm:grid-cols-2 xl:grid-cols-3">
                  {valuationGroups.available.map((metric) => (
                    <div key={metric.id} className="bg-divlab-card px-4 py-3" title={metric.definition}>
                      <dt className="text-[10px] text-divlab-text-muted">{metric.label}</dt>
                      <dd className="mt-0.5 truncate text-[13px] font-bold text-divlab-text">{metric.value}</dd>
                      <dd className="mt-1 text-[10px] text-divlab-text-muted">{metric.source}</dd>
                    </div>
                  ))}
                </dl>
              ) : <p className="mt-4 text-xs leading-5 text-divlab-text-muted">Inga nyckeltal finns tillgängliga just nu.</p>}
              {valuationGroups.unavailable.length ? (
                <details className="mt-4 text-[11px] leading-5 text-divlab-text-muted">
                  <summary className="cursor-pointer font-semibold text-divlab-text-secondary">Nyckeltal som saknas ({valuationGroups.unavailable.length})</summary>
                  <dl className="mt-3 grid gap-px overflow-hidden rounded-xl border divlab-border-neutral bg-[var(--divlab-divider)] sm:grid-cols-2">
                    {valuationGroups.unavailable.map((metric) => (
                      <div key={metric.id} className="bg-divlab-card px-4 py-3" title={metric.definition}>
                        <dt className="text-[10px] text-divlab-text-muted">{metric.label}</dt>
                        <dd className="mt-0.5 text-[13px] font-bold text-divlab-text-secondary">{metric.value}</dd>
                        <dd className="mt-1 text-[10px] text-divlab-text-muted">{metric.source}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ) : null}
              <details className="mt-4 text-[11px] leading-5 text-divlab-text-muted">
                <summary className="cursor-pointer font-semibold text-divlab-text-secondary">Vad nyckeltalen betyder</summary>
                <dl className="mt-3 space-y-2">
                  {model.metrics.map((metric) => (
                    <div key={metric.id}>
                      <dt className="font-semibold text-divlab-text">{metric.label}</dt>
                      <dd>{metric.definition}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </section>

            <section id="finansiell-utveckling" className="divlab-card scroll-mt-28 p-5 sm:p-6">
              <PanelHeading title="Finansiell utveckling" href={company.reportsUrl} label="Rapporter" />
              <p className="mt-2 text-[11px] leading-5 text-divlab-text-muted">
                Årsserie från Yahoo Finance{currency ? ` i rapporteringsvalutan ${currency}` : ". Rapporteringsvaluta saknas, så ingen valuta visas"}. Belopp i miljoner (mn) eller miljarder (md). Rörelseresultat är fältet operatingIncome. Fritt kassaflöde är leverantörens eget fält, eller kassaflöde från löpande verksamhet plus investeringar när investeringarna är noll eller negativa. Nettoskuld är skuld minus likvida medel för samma rapport. Tomma år fylls inte i.
              </p>
              {model.financials.points.length ? (
                <div className="mt-4 overflow-x-auto">
                  {revenuePoints.length >= 2 && maxRevenue > 0 ? (
                    <div className="mb-4 flex min-w-[280px] items-end gap-2">
                      {revenuePoints.map((point) => (
                        <div key={point.fiscalYear} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                          <div className="flex h-24 w-full items-end rounded-md bg-divlab-elevated">
                            <span className="block w-full rounded-md bg-divlab-blue/80" style={{ height: `${Math.max(8, Math.abs(point.revenue ?? 0) / maxRevenue * 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-divlab-text-muted">{point.fiscalYear}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <table className="w-full min-w-[640px] text-left text-[11px]">
                    <thead className="text-divlab-text-muted">
                      <tr>
                        <th className="py-2 pr-3 font-medium">År</th>
                        <th className="py-2 pr-3 font-medium">Omsättning</th>
                        <th className="py-2 pr-3 font-medium">Rörelseresultat</th>
                        <th className="py-2 pr-3 font-medium">Nettoresultat</th>
                        <th className="py-2 pr-3 font-medium">EPS</th>
                        <th className="py-2 pr-3 font-medium">Fritt kassaflöde</th>
                        <th className="py-2 pr-3 font-medium">Nettoskuld</th>
                        <th className="py-2 pr-3 font-medium">Rörelsemarginal</th>
                        <th className="py-2 font-medium">Vinstmarginal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.financials.points.map((point) => (
                        <tr key={point.fiscalYear} className="border-t divlab-border-neutral">
                          <td className="py-2 pr-3 font-semibold text-divlab-text">{point.fiscalYear}</td>
                          <td className="py-2 pr-3">{formatStatementAmount(point.revenue, point.currency)}</td>
                          <td className="py-2 pr-3">{formatStatementAmount(point.operatingIncome, point.currency)}</td>
                          <td className="py-2 pr-3">{formatStatementAmount(point.netIncome, point.currency)}</td>
                          <td className="py-2 pr-3">{amountCell(point.eps, 2)}</td>
                          <td className="py-2 pr-3">{formatStatementAmount(point.freeCashFlow, point.currency)}</td>
                          <td className="py-2 pr-3">{formatStatementAmount(point.netDebt, point.currency)}</td>
                          <td className="py-2 pr-3">{point.operatingMargin === null ? "—" : `${formatSvNumber(point.operatingMargin * 100, { maximumFractionDigits: 1 })} %`}</td>
                          <td className="py-2">{point.profitMargin === null ? "—" : `${formatSvNumber(point.profitMargin * 100, { maximumFractionDigits: 1 })} %`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 text-xs leading-5 text-divlab-text-muted">
                  {model.financials.status === "unavailable"
                    ? "Årsserien kunde inte hämtas från Yahoo Finance just nu."
                    : "Yahoo Finance har ingen verifierad årsserie för bolaget."}
                </p>
              )}
            </section>

            <section id="utdelning" className="divlab-card scroll-mt-28 p-5 sm:p-6">
              <PanelHeading title="Utdelning" href={model.dividend.sourceUrl ?? company.websiteUrl} label="Officiell källa" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-[10px] text-divlab-text-muted">{model.dividend.kindLabel}</p>
                  <p className="mt-1 text-sm font-bold text-divlab-text">{model.dividend.perShareText}{model.dividend.year ? ` · ${model.dividend.year}` : ""}</p>
                </div>
                <div>
                  <p className="text-[10px] text-divlab-text-muted">Direktavkastning (officiell)</p>
                  <p className="mt-1 text-sm font-bold text-divlab-text">{model.metrics.find((metric) => metric.id === "official_yield")?.value}</p>
                </div>
                <div>
                  <p className="text-[10px] text-divlab-text-muted">Utdelningsandel</p>
                  <p className="mt-1 text-sm font-bold text-divlab-text">{model.dividend.payoutText}</p>
                  <p className="mt-1 text-[10px] leading-4 text-divlab-text-muted">Enligt Yahoo Finance, och bara när värdet redan är en andel.</p>
                </div>
                <div>
                  <p className="text-[10px] text-divlab-text-muted">Tillväxt</p>
                  <p className="mt-1 text-sm font-bold text-divlab-text">{model.dividend.growthText ?? "—"}</p>
                </div>
              </div>
              {model.dividend.kind === "board_proposal" ? <p className="mt-3 text-xs leading-5 text-divlab-text-muted">Källan beskriver ett styrelseförslag. Beloppet visas inte som en beslutad utdelning.</p> : null}
              {model.dividend.yieldBlocked ? <p className="mt-3 text-xs leading-5 text-divlab-text-muted">{model.metrics.find((metric) => metric.id === "official_yield")?.definition}</p> : null}
              {model.dividend.sourcePublisher ? <p className="mt-3 text-[10px] text-divlab-text-muted">Källa: {model.dividend.sourcePublisher}{model.dividend.asOf ? ` · ${date(model.dividend.asOf)}` : ""}.</p> : null}
              <h3 className="mt-5 text-[13px] font-bold text-divlab-text">Historiskt utbetalda utdelningar</h3>
              <p className="mt-1 text-[11px] leading-5 text-divlab-text-muted">X-dag och belopp från Yahoo Finance. Avstämningsdag och utbetalningsdag visas bara när en officiell källa anger dem.</p>
              {model.dividend.history.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-[11px]">
                    <thead className="text-divlab-text-muted">
                      <tr>
                        <th className="py-2 pr-3 font-medium">X-dag</th>
                        <th className="py-2 pr-3 font-medium">Belopp</th>
                        <th className="py-2 font-medium">Typ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.dividend.history.map((dividend) => (
                        <tr key={`${dividend.exDate}-${dividend.amount}`} className="border-t divlab-border-neutral">
                          <td className="py-2 pr-3">{date(dividend.exDate)}</td>
                          <td className="py-2 pr-3 font-semibold text-divlab-text">{formatPaidDividend(dividend.amount, dividend.currency)}</td>
                          <td className="py-2">Historiskt utbetald</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="mt-3 text-xs leading-5 text-divlab-text-muted">Ingen verifierad utdelningshistorik från Yahoo Finance.</p>}
            </section>

            <section id="aktuellt" className="divlab-card scroll-mt-28 p-5 sm:p-6">
              <PanelHeading title="Aktuellt för bolaget" />
              {model.currentEvents.length ? (
                <ul className="mt-3 divide-y divide-[var(--divlab-divider)]">
                  {model.currentEvents.map((event) => (
                    <li key={`${event.kind}-${event.href}`}>
                      <a href={event.href} className="divlab-row-hover grid gap-1 py-3 sm:grid-cols-[108px_minmax(0,1fr)]">
                        <time className="text-[11px] text-divlab-text-secondary">{event.date ? date(event.date) : "Datum saknas"}</time>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold leading-5 text-divlab-text">{event.title}</span>
                          <span className="mt-0.5 block text-[11px] text-divlab-text-muted">{event.sourceLabel}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-4 text-xs leading-5 text-divlab-text-muted">Inga aktuella händelser kunde härledas från kalender, rapporter, press, DivLab-nyheter eller en stor dagsrörelse.</p>}
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section id="rapporter" className="divlab-card scroll-mt-28 p-5">
                <PanelHeading title="Rapporter" href={company.reportsUrl} label="Officiell källa" />
                {reports.length ? <div className="mt-2 divide-y divide-[var(--divlab-divider)]">{reports.slice(0, 5).map((row, index) => <div key={row.url} className={index === 0 ? "rounded-xl bg-divlab-blue/5 px-2" : ""}><SourceLine row={row} /></div>)}</div> : <PanelState panel="reports" section={officialData.reports} />}
              </section>
              <section id="kalender" className="divlab-card scroll-mt-28 p-5">
                <PanelHeading title="Kalender" href={company.calendarUrl} label="Officiell källa" />
                {events.length ? <div className="mt-2 divide-y divide-[var(--divlab-divider)]">{events.slice(0, 5).map((row) => <SourceLine key={`${row.date}-${row.title}`} row={row} />)}</div> : <PanelState panel="calendar" section={officialData.events} />}
              </section>
            </div>

            <section className="divlab-card p-5">
              <PanelHeading title="Officiella pressmeddelanden" href={company.pressReleasesUrl} label="Officiell källa" badge="Bolaget" />
              {pressReleases.length ? <div className="mt-2 divide-y divide-[var(--divlab-divider)]">{pressReleases.slice(0, 5).map((row) => <SourceLine key={row.url} row={row} />)}</div> : <PanelState panel="press" section={officialData.pressReleases} />}
            </section>

            <section id="agarstruktur" className="divlab-card scroll-mt-28 p-5 sm:p-6">
              <PanelHeading title="Ägare" href={model.ownership.sourceUrl ?? company.ownershipUrl ?? company.websiteUrl} label="Officiell källa" />
              {model.ownership.rows.length ? (
                <div className="mt-4 space-y-3">
                  {model.ownership.rows.map((owner) => (
                    <div key={owner.owner} className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-3 text-[12px]">
                      <span className="truncate text-divlab-text" title={owner.owner}>{owner.owner}</span>
                      <strong className="text-right text-divlab-text">{formatSvNumber(owner.capitalPct, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %</strong>
                    </div>
                  ))}
                  <p className="text-[10px] text-divlab-text-muted">
                    Samma avstämning{model.ownership.asOf ? ` per ${date(model.ownership.asOf)}` : ""}{model.ownership.sourcePublisher ? ` från ${model.ownership.sourcePublisher}` : ""}.
                  </p>
                </div>
              ) : <PanelState panel="ownership" section={officialData.ownership} />}
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section id="ledning" className="divlab-card scroll-mt-28 p-5">
                <PanelHeading title="Ledning" href={ceo?.sourceUrl ?? company.governanceUrl ?? company.websiteUrl} label="Officiell källa" />
                {ceo ? (
                  <div className="mt-4">
                    <p className="text-[10px] text-divlab-text-muted">{ceo.role}</p>
                    <p className="mt-1 text-sm font-bold text-divlab-text">{ceo.name}</p>
                    <p className="mt-2 text-[11px] text-divlab-text-muted">{ceo.sourcePublisher ?? "Officiell källa"}{ceo.asOf ? ` · per ${date(ceo.asOf)}` : ""}</p>
                  </div>
                ) : <p className="mt-4 text-xs leading-5 text-divlab-text-muted">{officialData.ceo.sourceUrl ? <a className="font-semibold text-divlab-blue" href={officialData.ceo.sourceUrl}>Se bolagets officiella ledningsinformation</a> : "Ingen verifierad VD-uppgift."}</p>}
              </section>
              <section id="insyn" className="divlab-card scroll-mt-28 p-5">
                <PanelHeading title="Insyn" href={model.insiders.url} label={model.insiders.publisher} />
                <p className="mt-4 text-xs leading-5 text-divlab-text-muted">{model.insiders.reason}</p>
              </section>
            </div>

            <section id="nyheter" className="divlab-card scroll-mt-28 p-5">
              <PanelHeading title={`DivLabs nyheter om ${company.name}`} href="/news" badge="DivLab" />
              {articles.length ? <div className="mt-2">{articles.map((article) => <NewsArticleRow key={article.id} article={article} />)}</div> : <p className="mt-5 text-xs leading-5 text-divlab-text-muted">Inga publicerade DivLab-nyheter matchar bolaget just nu.</p>}
            </section>
          </main>

          <aside className="min-w-0 space-y-4">
            <section id="om-bolaget" className="divlab-card scroll-mt-28 p-5">
              <PanelHeading title="Kort om bolaget" />
              <dl className="mt-4 space-y-3">
                {([
                  ["Sektor", company.sector, "portfolio"],
                  ["Land", company.countryName, "dashboard"],
                  ["Grundat", company.founded, "portfolio"],
                  ["Huvudkontor", company.headquarters, "dashboard"],
                  ["VD", ceo?.name ?? "—", "account"],
                ] as const).map(([label, value, icon]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-divlab-blue/8 text-divlab-blue"><AppIcon name={icon as AppIconName} className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
                    <div className="min-w-0">
                      <dt className="text-[10px] text-divlab-text-muted">{label}</dt>
                      <dd className="truncate text-xs font-semibold text-divlab-text">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs leading-5 text-divlab-text-secondary">{company.description}</p>
            </section>
            <section className="divlab-card p-5">
              <PanelHeading title="Bolag i samma sektor" />
              <p className="mt-2 text-[11px] text-divlab-text-muted">{company.sector}. Ordningen är alfabetisk, inte en bedömning.</p>
              {peers.length ? (
                <div className="mt-2 space-y-1">
                  {peers.map((peer) => (
                    <Link key={peer.slug} href={`/bolag/${peer.slug}`} className="divlab-row-hover flex items-center gap-3 rounded-lg py-2">
                      <CompanyLogo name={peer.name} logoPath={peer.logoPath} size="compact" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-divlab-text">{peer.displayName}</span>
                        <span className="block text-[10px] text-divlab-text-muted">{peer.ticker}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : <p className="mt-4 text-xs text-divlab-text-muted">Inga andra följbara bolag i samma sektor.</p>}
            </section>
          </aside>
        </div>
        <p className="mt-4 text-[10px] leading-4 text-divlab-text-muted">{companySourceDisclaimer(company)}</p>
        {children}
      </div>
    </div>
  );
}
