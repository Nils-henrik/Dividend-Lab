import Link from "next/link";
import { setModelPortfolioFollowAction } from "@/app/portfolios/actions";
import MarketLiveBadge from "@/components/portfolios/MarketLiveBadge";
import {
  MODEL_PORTFOLIO_PROCESS_PATH,
  MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL,
  getModelPortfolioPublicEntry,
} from "@/lib/model-portfolios/public";
import { resolveMarketLiveStatus } from "@/lib/model-portfolios/engine/market-status";
import type {
  ModelPortfolioOverview,
  ModelPortfolioTransaction,
} from "@/lib/model-portfolios/server";

const portfolioStyle: Record<string, { accent: string; border: string; badge: string; soft: string; icon: "shield" | "balance" | "rocket" | "diamond" }> = {
  forsiktig: { accent: "text-blue-400", border: "border-blue-500/50", badge: "border-blue-500/35 bg-blue-500/10 text-blue-300", soft: "bg-blue-500/5", icon: "shield" },
  medelrisk: { accent: "text-cyan-400", border: "border-cyan-500/50", badge: "border-cyan-500/35 bg-cyan-500/10 text-cyan-300", soft: "bg-cyan-500/5", icon: "balance" },
  "hog-risk": { accent: "text-orange-400", border: "border-orange-500/50", badge: "border-orange-500/35 bg-orange-500/10 text-orange-300", soft: "bg-orange-500/5", icon: "rocket" },
  utdelning: { accent: "text-violet-400", border: "border-violet-500/50", badge: "border-violet-500/35 bg-violet-500/10 text-violet-300", soft: "bg-violet-500/5", icon: "diamond" },
};

function formatSek(minor: number): string {
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(minor / 100);
}
function formatNumber(value: number): string { return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 4 }).format(value); }
function formatDate(value: string): string { return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function statusLabel(status: ModelPortfolioOverview["status"]): string { if (status === "active") return "Aktiv"; if (status === "paused") return "Pausad"; return "Förbereds"; }
function transactionLabel(type: ModelPortfolioTransaction["transactionType"]): string { if (type === "buy") return "Köp"; if (type === "sell") return "Sälj"; if (type === "dividend") return "Utdelning"; return "Avgift"; }

export default function ModelPortfoliosOverview({ portfolios, recentTransactions, isAuthenticated = false }: { portfolios: readonly ModelPortfolioOverview[]; recentTransactions: readonly ModelPortfolioTransaction[]; isAuthenticated?: boolean; }) {
  const marketStatus = resolveMarketLiveStatus(new Date());
  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-5 pb-4">
      <section className="px-0.5 pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-divlab-blue-muted">Nyligen lanserade · Live sedan {MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL}</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-divlab-text sm:text-[32px]">Fyra AI-portföljer. Fyra olika strategier.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-divlab-text-secondary">
          DivLab har byggt fyra separata AI-förvaltade modellportföljer med varsin investeringsstrategi och tidshorisont: Försiktig, Medelrisk, Högrisk och Utdelning. Portföljerna gick live den {MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL} och har därför fortfarande en kort historik. Varje AI arbetar inom sitt eget mandat, analyserar marknaden och dokumenterar varför en modellaffär föreslås eller genomförs.
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-divlab-text-muted">Detta är allmän information om simulerade modellportföljer – inte personlig investeringsrådgivning eller verkliga mäklaraffärer. Historiken är för kort för att tolkas som långsiktig track record.</p>
      </section>

      <section className="grid overflow-hidden border divlab-border-neutral bg-divlab-surface/55 lg:grid-cols-[1fr_1fr_1.2fr]">
        <TopMetric label="Startkapital" value="10 000 kr" sub="Per portfölj" />
        <TopMetric label="Månadsspar" value="5 000 kr" sub="Den 25:e varje månad" />
        <div className="flex min-h-[96px] items-center justify-between gap-4 px-5 py-4 lg:border-l divlab-border-neutral">
          <div><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">Beslutsprincip</p><p className="mt-1 text-lg font-semibold text-divlab-text">AI + verifierade källor</p><p className="mt-1 text-xs text-divlab-text-muted">Transparens i varje beslut</p></div>
          <Link href={MODEL_PORTFOLIO_PROCESS_PATH} className="hidden shrink-0 items-center gap-2 border divlab-border-neutral px-3.5 py-2 text-xs font-semibold text-divlab-text transition hover:border-divlab-blue/50 hover:text-divlab-blue sm:inline-flex"><InfoIcon />Så fungerar det</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {portfolios.map((portfolio) => <PortfolioCard key={portfolio.id} portfolio={portfolio} marketStatus={marketStatus} isAuthenticated={isAuthenticated} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div id="historik" className="border divlab-border-neutral bg-divlab-surface/45">
          <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5"><div><h2 className="text-xl font-semibold tracking-[-0.03em] text-divlab-text">Senaste affärer</h2><p className="mt-1 text-xs text-divlab-text-muted">Klicka på en affär för att läsa hela beslutsunderlaget.</p></div></div>
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead><tr className="border-b divlab-border-neutral text-[10px] uppercase tracking-[0.14em] text-divlab-text-muted"><th className="py-3 pr-4 font-medium">Datum</th><th className="py-3 pr-4 font-medium">Portfölj</th><th className="py-3 pr-4 font-medium">Typ</th><th className="py-3 pr-4 font-medium">Aktie</th><th className="py-3 pr-4 font-medium">Belopp</th><th className="py-3 pr-4 font-medium">Antal</th><th className="py-3 pr-4 font-medium">Kurs</th><th className="py-3 pr-4 font-medium">AI-anledning</th></tr></thead>
              <tbody>{recentTransactions.length > 0 ? recentTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />) : <tr><td colSpan={8} className="py-12 text-center text-sm text-divlab-text-muted">Inga affärer har genomförts ännu. Historiken fylls automatiskt när simulerade modellaffärer bokförs och kan inte redigeras från den här vyn.</td></tr>}</tbody>
            </table>
          </div>
        </div>
        <aside id="ai-process" className="border divlab-border-neutral bg-divlab-surface/45 px-5 py-5">
          <h2 className="text-base font-semibold text-divlab-text">AI-beslutsprocessen</h2>
          <div className="mt-5 space-y-5"><ProcessStep number="1" title="Data & nyheter" text="Vi samlar marknadsdata och nyheter från verifierade källor." /><ProcessStep number="2" title="AI-analys" text="AI:n analyserar och föreslår förändringar utifrån portföljens mandat och tidshorisont." /><ProcessStep number="3" title="Verifiering" text="Regler och riskkontroller säkerställer varje beslut." /><ProcessStep number="4" title="Genomförande" text="Godkända modellaffärer bokförs och förklaringen sparas i historiken." /></div>
          <Link href={MODEL_PORTFOLIO_PROCESS_PATH} className="mt-6 block border divlab-border-neutral px-3 py-2.5 text-center text-xs font-semibold text-divlab-text transition hover:border-divlab-blue/50 hover:text-divlab-blue">Läs mer om processen</Link>
        </aside>
      </section>

      <section className="flex items-start gap-3 border border-divlab-blue/20 bg-divlab-blue/[0.08] px-4 py-3 text-xs leading-5 text-divlab-text-secondary"><span className="mt-0.5 text-divlab-blue"><InfoIcon /></span><p>Modellportföljerna är simulerade och uppdateras i fyra schemalagda pass per handelsdag. Sökfrekvensen är inte samma sak som portföljernas innehavstid: varje AI bedömer samma marknad genom sin egen tidshorisont. Varje köp belastar kassan med 10 kr i simulerad courtage. Vid materiella händelser kan AI:n göra riktade omprövningar, med en hård gräns på totalt 4 beslutskörningar per portfölj och dag. Alla genomförda affärer sparas i historiken. Detta är inte personlig investeringsrådgivning.</p></section>
    </div>
  );
}

function TopMetric({ label, value, sub }: { label: string; value: string; sub: string }) { return <div className="min-h-[96px] px-5 py-4 lg:border-r divlab-border-neutral"><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">{label}</p><p className="mt-1 text-lg font-semibold text-divlab-text">{value}</p><p className="mt-1 text-xs text-divlab-text-muted">{sub}</p></div>; }

function PortfolioCard({ portfolio, marketStatus, isAuthenticated }: { portfolio: ModelPortfolioOverview; marketStatus: ReturnType<typeof resolveMarketLiveStatus>; isAuthenticated: boolean; }) {
  const style = portfolioStyle[portfolio.slug] ?? portfolioStyle.forsiktig;
  const catalog = getModelPortfolioPublicEntry(portfolio.slug);
  const positive = portfolio.performancePct >= 0;
  const href = `/portfolios/${portfolio.slug}`;
  return (
    <article className={`group relative overflow-hidden border divlab-border-neutral bg-divlab-surface/55 transition hover:border-white/20 ${style.soft}`}>
      <Link href={href} aria-label={`Öppna ${portfolio.name}`} className="absolute inset-0 z-0" />
      <div className={`absolute inset-x-0 top-0 h-px ${style.border} border-t`} />
      <div className="pointer-events-none relative z-10 px-5 pb-4 pt-5">
        <div className="flex items-center gap-3"><span className={style.accent}><PortfolioIcon type={style.icon} /></span><h2 className="text-xl font-semibold tracking-[-0.03em] text-divlab-text group-hover:text-white">{portfolio.name}</h2><div className="ml-auto flex flex-wrap items-center justify-end gap-1.5"><MarketLiveBadge initialStatus={marketStatus} /><span className={`border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${style.badge}`}>{portfolio.riskLabel}</span></div></div>
        <div className="mt-7 flex items-end justify-between gap-4"><div><p className="text-[31px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-divlab-text">{formatSek(portfolio.totalValueMinor)}</p><div className="mt-2 flex items-center gap-2"><span className={`text-sm font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}>{positive ? "+" : ""}{portfolio.performancePct.toFixed(2).replace(".", ",")}%</span><span className="text-xs text-divlab-text-muted">sedan start (kort historik)</span></div></div><MiniSparkline accent={style.accent} points={portfolio.valueHistory} /></div>
        <dl className="mt-7 space-y-1 text-xs"><MetricRow label="Tidshorisont" value={catalog?.horizonLabel ?? "—"} /><MetricRow label="Kontanter" value={formatSek(portfolio.cashMinor)} /><MetricRow label="Investerat" value={formatSek(portfolio.investedMinor)} /><MetricRow label="Antal innehav" value={`${portfolio.holdingsCount} st`} /><MetricRow label="Senaste AI-beslut" value={portfolio.latestDecision ? formatDate(portfolio.latestDecision.createdAt) : statusLabel(portfolio.status)} /></dl>
        <div className="mt-5 pt-2"><p className="line-clamp-3 min-h-[60px] text-xs leading-5 text-divlab-text-secondary">{catalog?.workStyle ?? portfolio.latestDecision?.rationale ?? portfolio.objective}</p><p className={`mt-2 text-[11px] font-semibold ${style.accent}`}>Öppna strategi och historik →</p></div>
        {isAuthenticated ? <form action={setModelPortfolioFollowAction} className="pointer-events-auto mt-4"><input type="hidden" name="portfolioId" value={portfolio.id} /><input type="hidden" name="follow" value={portfolio.isFollowing ? "false" : "true"} /><button type="submit" className={`w-full border py-2.5 text-xs font-semibold transition ${style.border} ${style.accent} hover:bg-white/[0.03]`}>{portfolio.isFollowing ? "Följer portföljen ✓" : "Följ portfölj →"}</button></form> : <Link href={`/login?redirect=${encodeURIComponent(href)}`} className={`pointer-events-auto mt-4 block w-full border py-2.5 text-center text-xs font-semibold transition ${style.border} ${style.accent} hover:bg-white/[0.03]`}>Logga in för att följa →</Link>}
      </div>
    </article>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 py-1.5"><dt className="text-divlab-text-muted">{label}</dt><dd className="font-semibold tabular-nums text-divlab-text">{value}</dd></div>; }
function TransactionRow({ transaction }: { transaction: ModelPortfolioTransaction }) { const style = portfolioStyle[transaction.portfolioSlug] ?? portfolioStyle.forsiktig; const isBuy = transaction.transactionType === "buy"; const typeClass = transaction.transactionType === "sell" ? "text-red-400" : isBuy ? "text-emerald-400" : "text-divlab-text-secondary"; const href = `/portfolios/${transaction.portfolioSlug}/trades/${transaction.id}`; return <tr className="border-b divlab-border-neutral text-divlab-text-secondary last:border-b-0 hover:bg-white/[0.025]"><TradeCell href={href} className="whitespace-nowrap text-divlab-text">{formatDate(transaction.executedAt)}</TradeCell><TradeCell href={href} className={`whitespace-nowrap font-semibold ${style.accent}`}>{transaction.portfolioName}</TradeCell><TradeCell href={href} className={`whitespace-nowrap font-semibold ${typeClass}`}>{transactionLabel(transaction.transactionType)}</TradeCell><TradeCell href={href}><span className="text-divlab-text">{transaction.instrumentName}</span> <span className="text-divlab-text-muted">({transaction.instrumentSymbol})</span></TradeCell><TradeCell href={href} className="whitespace-nowrap">{formatSek(transaction.grossAmountMinor)}</TradeCell><TradeCell href={href} className="whitespace-nowrap">{formatNumber(transaction.quantity)}</TradeCell><TradeCell href={href} className="whitespace-nowrap">{transaction.priceMinor === null ? "—" : `${formatSek(transaction.priceMinor)} / st`}</TradeCell><TradeCell href={href} className="max-w-[280px] truncate" title={transaction.rationale}>{transaction.rationale}</TradeCell></tr>; }
function TradeCell({ href, children, className = "", title }: { href: string; children: React.ReactNode; className?: string; title?: string }) { return <td className={`p-0 ${className}`} title={title}><Link href={href} className="block py-3 pr-4">{children}</Link></td>; }
function ProcessStep({ number, title, text }: { number: string; title: string; text: string }) { return <div className="grid grid-cols-[30px_1fr] gap-3"><div className="flex h-7 w-7 items-center justify-center border border-divlab-blue/35 bg-divlab-blue/10 text-xs font-semibold text-divlab-blue">{number}</div><div><p className="text-xs font-semibold text-divlab-text">{number}. {title}</p><p className="mt-1 text-[11px] leading-4 text-divlab-text-muted">{text}</p></div></div>; }
function MiniSparkline({ accent, points }: { accent: string; points: ModelPortfolioOverview["valueHistory"] }) {
  const values = points.map((point) => point.totalValueMinor);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const span = max - min;
  const left = 4;
  const right = 108;
  const top = 6;
  const bottom = 36;
  const path = values.length <= 1 || span === 0
    ? `M${left} 22 L${right} 22`
    : values.map((value, index) => {
        const x = left + (index / Math.max(values.length - 1, 1)) * (right - left);
        const y = bottom - ((value - min) / span) * (bottom - top);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(" ");
  return <svg aria-hidden="true" viewBox="0 0 112 44" className={`h-11 w-28 ${accent}`} fill="none"><path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function PortfolioIcon({ type }: { type: "shield" | "balance" | "rocket" | "diamond" }) { if (type === "balance") return <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M5 6h14M7 6l-4 7h8L7 6Zm10 0-4 7h8l-4-7ZM7 17h10" /></svg>; if (type === "rocket") return <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 4c3-2 6-1 6-1s1 3-1 6l-6 6-4-4 5-7Z"/><path d="m9 11-4 1-2 3 5 1m5-1 1 5-3 2-1-5"/><circle cx="15.5" cy="7.5" r="1.5" /></svg>; if (type === "diamond") return <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 8 4-5h10l4 5-9 13L3 8Z"/><path d="M3 8h18M7 3l5 18 5-18"/></svg>; return <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path d="M12 7v10"/></svg>; }
function InfoIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>; }
