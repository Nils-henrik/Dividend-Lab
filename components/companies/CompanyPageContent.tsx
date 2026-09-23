import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/layout/AppIcon";
import CompanyLogo from "@/components/companies/CompanyLogo";
import CompanyPriceChart from "@/components/companies/CompanyPriceChart";
import FollowCompanyButton from "@/components/companies/FollowCompanyButton";
import NewsArticleRow from "@/components/news/NewsArticleRow";
import type { InvestorOfficialData, OfficialItem } from "@/lib/companies/investor-official";
import type { CompanyMarketData } from "@/lib/companies/market-data";
import type { CompanyFollowState } from "@/lib/companies/server";
import type { CompanyProfile } from "@/lib/companies/types";
import type { NewsArticle } from "@/types/news";

type Props = {
  company: CompanyProfile;
  articles: readonly NewsArticle[];
  isAuthenticated: boolean;
  followState: CompanyFollowState;
  relatedCompanies: readonly CompanyProfile[];
  marketData: CompanyMarketData;
  relatedMarketData: Record<string, CompanyMarketData>;
  officialData: InvestorOfficialData | null;
};

const PAGE_TABS = [
  ["Kursutveckling", "#kursutveckling"],
  ["Om bolaget", "#om-bolaget"],
  ["Nyheter", "#nyheter"],
  ["Rapporter", "#rapporter"],
  ["Ägarstruktur", "#agarstruktur"],
  ["Nyckeltal", "#nyckeltal"],
  ["Kalender", "#kalender"],
] as const;

function number(value: number | null, options?: Intl.NumberFormatOptions) {
  return value === null ? "—" : new Intl.NumberFormat("sv-SE", options).format(value);
}

function money(value: number | null, currency = "SEK") {
  return value === null ? "—" : `${number(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function compactSek(value: number | null) {
  if (value === null) return "—";
  if (value >= 1_000_000_000) return `${number(value / 1_000_000_000, { maximumFractionDigits: 0 })} md SEK`;\n  return `${number(value / 1_000_000, { maximumFractionDigits: 0 })} mn SEK`;
}

function percent(value: number | null, signed = false) {
  if (value === null) return "—";
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${number(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

function date(value: string | null) {
  if (!value) return "Datum saknas";
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Stockholm" }).format(new Date(`${value}T12:00:00Z`));
}

function time(value: string | null) {
  if (!value) return "Fördröjd kurs";
  return new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" }).format(new Date(value));
}

function PanelHeading({ title, href, label = "Se alla" }: { title: string; href?: string; label?: string }) {
  return <div className="flex items-center justify-between gap-4"><h2 className="text-[15px] font-bold tracking-[-0.02em] text-divlab-text">{title}</h2>{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[11px] font-semibold text-divlab-blue hover:text-divlab-blue-hover">{label}</a> : null}</div>;
}

function FactIcon({ name }: { name: AppIconName }) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-divlab-blue/8 text-divlab-blue"><AppIcon name={name} className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>;
}

function OfficialList({ items, fallback, icon = "news" }: { items: OfficialItem[]; fallback: string; icon?: AppIconName }) {
  if (!items.length) return <p className="mt-4 text-xs leading-5 text-divlab-text-muted">{fallback}</p>;
  return <div className="mt-3 divide-y divide-[var(--divlab-divider)]">{items.slice(0, 4).map((item) => <a key={`${item.url}-${item.title}`} href={item.url} target="_blank" rel="noopener noreferrer" className="divlab-row-hover flex gap-3 rounded-lg py-3"><FactIcon name={icon} /><span className="min-w-0 flex-1"><span className="line-clamp-2 text-[13px] font-semibold leading-5 text-divlab-text">{item.title}</span><span className="mt-0.5 block text-[11px] text-divlab-text-muted">{item.date ? date(item.date) : "Officiellt dokument"}</span></span></a>)}</div>;
}

export default function CompanyPageContent({ company, articles, isAuthenticated, followState, relatedCompanies, marketData, relatedMarketData, officialData }: Props) {
  const loginHref = `/login?redirect=${encodeURIComponent(`/bolag/${company.slug}`)}`;
  const currency = marketData.currency ?? "SEK";
  const positive = (marketData.changePct ?? 0) >= 0;
  const sourceDocuments: OfficialItem[] = followState.documents.map((document) => ({ title: document.title, date: document.publishedAt?.slice(0, 10) ?? document.eventAt?.slice(0, 10) ?? null, url: document.url }));
  const reports = officialData?.reports ?? sourceDocuments.filter((item) => /report|rapport/i.test(item.title));
  const pressReleases = officialData?.pressReleases ?? sourceDocuments;
  const events = officialData?.events ?? [];
  const metrics = [
    ["Börsvärde", compactSek(marketData.marketCap)],
    ["P/E-tal", number(marketData.peRatio, { maximumFractionDigits: 1 })],
    ["Direktavkastning", marketData.dividendYield !== null ? percent(marketData.dividendYield * 100) : officialData?.dividendPerShare && marketData.price ? percent(officialData.dividendPerShare / marketData.price * 100) : "—"],
    ["52 veckors intervall", marketData.week52Low === null || marketData.week52High === null ? "—" : `${number(marketData.week52Low, { maximumFractionDigits: 2 })} – ${number(marketData.week52High, { maximumFractionDigits: 2 })}`],
    ["VD", officialData?.ceo ?? "—"],
    ["Sektor", company.sector],
  ] as const;
  const quickLinks = [
    ["Rapportkalender", company.calendarUrl, "calendar"],
    ["Senaste rapport", reports[0]?.url ?? company.reportsUrl, "news"],
    ["Pressmeddelanden", company.pressReleasesUrl, "messages"],
    ["Bolagsstyrning", company.governanceUrl ?? company.websiteUrl, "portfolio"],
    ["Investor Relations", company.websiteUrl, "chart"],
  ] as const satisfies readonly (readonly [string, string, AppIconName])[];
  const ownership = officialData?.ownership.slice(0, 5) ?? [];
  const ownerTotal = ownership.reduce((sum, owner) => sum + owner.capitalPct, 0);
  const donutStops = ownership.reduce<{ colors: string[]; total: number }>((state, owner, index) => { const colors = ["#075ccf", "#1188f7", "#5aa9f8", "#12b8c8", "#18bf8b"]; const start = state.total; const end = start + owner.capitalPct; state.colors.push(`${colors[index]} ${start}% ${end}%`); state.total = end; return state; }, { colors: [], total: 0 });
  donutStops.colors.push(`#dbe4ef ${donutStops.total}% 100%`);
  const maxOwnership = ownership.length ? Math.max(...ownership.map((item) => item.capitalPct)) : 1;

  return <div className="min-h-screen bg-[linear-gradient(135deg,var(--divlab-bg)_0%,var(--divlab-elevated)_52%,var(--divlab-bg)_100%)]">
    <div className="mx-auto w-full max-w-[1320px] px-3 py-4 sm:px-5 lg:px-7">
      <nav aria-label="Brödsmulor" className="mb-3 flex items-center gap-3 text-[11px] text-divlab-text-muted"><Link href="/">Hem</Link><span>›</span><Link href="/watchlist">Bolag</Link><span>›</span><span className="text-divlab-text">{company.name}</span></nav>

      <section className="divlab-card p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">{company.slug === "investor" ? <span aria-hidden="true" className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#063b78] text-xl font-bold text-white shadow-sm sm:h-28 sm:w-28">Investor</span> : <CompanyLogo name={company.name} logoPath={company.logoPath} size="hero" />}<div className="min-w-0">
            <div className="flex gap-2"><span className="rounded-md bg-divlab-elevated px-2 py-1 text-[10px] font-semibold uppercase text-divlab-text-secondary">Aktie</span><span className="rounded-md bg-divlab-elevated px-2 py-1 text-[10px] font-semibold text-divlab-text-secondary">{company.segment}</span></div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-divlab-text sm:text-[38px]">{company.displayName}</h1>
            <p className="mt-1 text-sm text-divlab-text-secondary">{company.ticker} <span className="px-1">•</span> {company.exchange}</p>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-divlab-text-secondary">{company.shortDescription}</p>
            <div className="mt-3 flex flex-wrap gap-2"><a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border divlab-border-neutral bg-divlab-surface px-2.5 text-[11px] font-semibold text-divlab-blue">◎ {company.websiteLabel}</a>{company.linkedinUrl ? <a aria-label={`${company.name} på LinkedIn`} href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border divlab-border-neutral bg-divlab-surface text-xs font-bold text-divlab-blue">in</a> : null}{company.xUrl ? <a aria-label={`${company.name} på X`} href={company.xUrl} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg border divlab-border-neutral bg-divlab-surface text-xs font-bold text-divlab-text">X</a> : null}</div>
          </div></div>
          <div className="flex flex-col items-start lg:items-end"><FollowCompanyButton companySlug={company.slug} isAuthenticated={isAuthenticated} isAvailable={followState.isAvailable} isFollowing={followState.isFollowing} loginHref={loginHref} /><div className="mt-7 text-left lg:text-right"><p className="text-3xl font-bold tracking-[-0.04em] text-divlab-text sm:text-4xl">{money(marketData.price, currency)}</p><p className={`mt-1.5 text-base font-bold ${positive ? "text-emerald-600" : "text-red-500"}`}>{marketData.change === null ? "—" : `${marketData.change > 0 ? "+" : ""}${number(marketData.change, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} <span className="ml-1">{percent(marketData.changePct, true)}</span> <span className="text-xs font-normal text-divlab-text-muted">(senast)</span></p><p className="mt-2 text-[10px] text-divlab-text-muted"><span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${positive ? "bg-emerald-500" : "bg-red-500"}`} />Fördröjd marknadsdata · {time(marketData.marketTimestamp)}</p></div></div>
        </div>
      </section>

      <dl id="nyckeltal" className="mt-4 grid overflow-hidden rounded-2xl border divlab-border-neutral bg-divlab-card shadow-[var(--divlab-card-shadow)] sm:grid-cols-2 xl:grid-cols-6">{metrics.map(([label, value]) => <div key={label} className="border-b border-r divlab-border-neutral px-5 py-3.5 last:border-r-0 sm:[&:nth-child(even)]:border-r-0 xl:border-b-0 xl:[&:nth-child(even)]:border-r xl:last:border-r-0"><dt className="text-[10px] text-divlab-text-muted">{label}</dt><dd className="mt-0.5 truncate text-[13px] font-bold text-divlab-text" title={value}>{value}</dd></div>)}</dl>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,2.4fr)_minmax(270px,0.95fr)]">
        <main className="min-w-0 space-y-4">
          <section id="kursutveckling" className="divlab-card overflow-hidden scroll-mt-28">
            <nav className="flex gap-1 overflow-x-auto border-b divlab-border-neutral px-4 pt-1" aria-label="Bolagsinformation">{PAGE_TABS.map(([label, href], index) => <a key={href} href={href} className={`shrink-0 border-b-2 px-3 py-3 text-[11px] font-semibold ${index === 0 ? "border-divlab-blue text-divlab-blue" : "border-transparent text-divlab-text-muted hover:text-divlab-text"}`}>{label}</a>)}</nav>
            <div className="flex justify-end px-5 pt-4"><a href={marketData.sourceUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border divlab-border-neutral px-3 py-2 text-[10px] font-medium text-divlab-text-secondary">Källa: Yahoo Finance ↗</a></div>
            <div className="px-2 pb-2 pt-1 sm:px-4"><CompanyPriceChart companyName={company.displayName} symbol={company.tradingViewSymbol} /></div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(250px,0.75fr)]">
            <section id="nyheter" className="divlab-card scroll-mt-28 p-5"><PanelHeading title={`Senaste nyheter om ${company.name}`} href="/news" />{articles.length ? <div className="mt-2">{articles.slice(0, 4).map((article) => <NewsArticleRow key={article.id} article={article} />)}</div> : <p className="mt-5 text-xs leading-5 text-divlab-text-muted">Inga publicerade DivLab-nyheter matchar bolaget just nu.</p>}</section>
            <div className="space-y-4">
              <section id="kalender" className="divlab-card scroll-mt-28 p-5"><PanelHeading title="Kommande händelser" href={company.calendarUrl} />{events.length ? <ol className="mt-3 border-l-2 border-divlab-blue/20 pl-4">{events.slice(0, 3).map((event) => <li key={`${event.date}-${event.title}`} className="relative py-2"><span className="absolute -left-[21px] top-3.5 h-2 w-2 rounded-full bg-divlab-blue ring-4 ring-divlab-card" /><a href={event.url} target="_blank" rel="noopener noreferrer" className="grid grid-cols-[80px_1fr] gap-2 text-[11px]"><time className="text-divlab-text-secondary">{date(event.date)}</time><span className="font-semibold leading-4 text-divlab-text">{event.title}</span></a></li>)}</ol> : <p className="mt-4 text-xs text-divlab-text-muted">Kalendern kunde inte hämtas just nu.</p>}</section>
              <section id="rapporter" className="divlab-card scroll-mt-28 p-5"><PanelHeading title="Senaste rapporter" href={company.reportsUrl} /><OfficialList items={reports} fallback="Rapporter kunde inte hämtas just nu." /></section>
            </div>
          </div>

          <section id="agarstruktur" className="divlab-card scroll-mt-28 p-5 sm:p-6"><PanelHeading title="Ägarstruktur (största ägare)" href={company.ownershipUrl} label="Officiell källa" />{ownership.length ? <div className="mt-5 grid items-center gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(290px,0.8fr)]"><div className="space-y-3">{ownership.map((owner, index) => <div key={owner.owner} className="grid grid-cols-[minmax(120px,190px)_1fr_54px] items-center gap-3 text-[11px]"><span className="truncate text-divlab-text-secondary" title={owner.owner}>{owner.owner}</span><span className="h-4 overflow-hidden rounded-sm bg-divlab-elevated"><span className="block h-full rounded-sm bg-divlab-blue" style={{ width: `${Math.min(100, owner.capitalPct / maxOwnership * 100)}%`, opacity: 1 - index * 0.11 }} /></span><strong className="text-right text-divlab-text">{number(owner.capitalPct, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %</strong></div>)}</div><div className="flex items-center justify-center gap-5"><div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: `conic-gradient(${donutStops.colors.join(",")})` }}><div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-divlab-card text-[11px] text-divlab-text-muted">Totalt<strong className="text-lg text-divlab-text">100 %</strong></div></div><div className="space-y-2 text-[10px]">{ownership.map((owner, index) => <div key={owner.owner} className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm" style={{ background: ["#075ccf", "#1188f7", "#5aa9f8", "#12b8c8", "#18bf8b"][index] }} /><span className="max-w-28 truncate text-divlab-text-secondary">{owner.owner}</span><strong className="ml-auto text-divlab-text">{number(owner.capitalPct, { maximumFractionDigits: 2 })} %</strong></div>)}<div className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-slate-200" /><span className="text-divlab-text-secondary">Övriga</span><strong className="ml-auto text-divlab-text">{number(100 - ownerTotal, { maximumFractionDigits: 2 })} %</strong></div></div></div></div> : <p className="mt-4 text-xs text-divlab-text-muted">Verifierad ägardata kunde inte hämtas just nu.</p>}{officialData?.ownershipAsOf ? <p className="mt-4 text-[10px] text-divlab-text-muted">Ägardata per {date(officialData.ownershipAsOf)} från Investor AB.</p> : null}</section>
          <section className="divlab-card p-5"><PanelHeading title="Senaste pressmeddelanden" href={company.pressReleasesUrl} label="Officiell källa" /><OfficialList items={pressReleases} fallback="Pressmeddelanden kunde inte hämtas just nu." icon="messages" /></section>
        </main>

        <aside className="min-w-0 space-y-4">
          <section id="om-bolaget" className="divlab-card scroll-mt-28 p-5"><PanelHeading title="Kort om bolaget" /><dl className="mt-4 space-y-3">{[["Grundat", company.founded, "portfolio"], ["Huvudkontor", `🇸🇪 ${company.headquarters}`, "dashboard"], ["VD", officialData?.ceo ?? "—", "account"], ["Hemsida", company.websiteLabel, "chart"]].map(([label, value, icon]) => <div key={label} className="flex items-center gap-3"><FactIcon name={icon as AppIconName} /><div><dt className="text-[10px] text-divlab-text-muted">{label}</dt><dd className="text-xs font-semibold text-divlab-text">{value}</dd></div></div>)}</dl><p className="mt-4 text-xs leading-5 text-divlab-text-secondary">{company.description}</p><a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-xs font-semibold text-divlab-blue">Läs mer om bolaget →</a></section>
          <section className="divlab-card p-5"><PanelHeading title="Snabblänkar" /><div className="mt-2 divide-y divide-[var(--divlab-divider)]">{quickLinks.map(([label, href, icon]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="divlab-row-hover flex items-center gap-3 py-2.5"><FactIcon name={icon} /><span className="flex-1 text-xs font-medium text-divlab-text">{label}</span><span className="text-divlab-text-muted">›</span></a>)}</div></section>
          <section className="divlab-card p-5"><PanelHeading title="Liknande bolag" /><div className="mt-2 space-y-1">{relatedCompanies.map((related) => { const change = relatedMarketData[related.slug]?.changePct ?? null; return <Link key={related.slug} href={`/bolag/${related.slug}`} className="divlab-row-hover flex items-center gap-3 rounded-lg py-2"><CompanyLogo name={related.name} logoPath={related.logoPath} size="compact" /><span className="min-w-0 flex-1 truncate text-xs font-semibold text-divlab-text">{related.displayName}</span><span className={`text-[11px] font-bold ${change === null ? "text-divlab-text-muted" : change >= 0 ? "text-emerald-600" : "text-red-500"}`}>{percent(change, true)}</span></Link>; })}</div></section>
        </aside>
      </div>
      <p className="mt-4 text-[10px] leading-4 text-divlab-text-muted">Kursdata från Yahoo Finance och TradingView kan vara fördröjd. Bolagsdata hämtas från Investor AB:s officiella webbplats. Informationen utgör inte investeringsrådgivning.</p>
    </div>
  </div>;
}
