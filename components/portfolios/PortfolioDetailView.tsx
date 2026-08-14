import Link from "next/link";
import MarketLiveBadge from "@/components/portfolios/MarketLiveBadge";
import PortfolioHoldingsOverview from "@/components/portfolios/PortfolioHoldingsOverview";
import PortfolioValueChart from "@/components/portfolios/PortfolioValueChart";
import { MODEL_PORTFOLIO_MANDATES } from "@/lib/model-portfolios/engine/mandates";
import { resolveMarketLiveStatus } from "@/lib/model-portfolios/engine/market-status";
import { MODEL_PORTFOLIO_TURNOVER_POLICY } from "@/lib/model-portfolios/engine/policy";
import {
  MODEL_PORTFOLIO_PROCESS_PATH,
  MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL,
  getModelPortfolioPublicEntry,
} from "@/lib/model-portfolios/public";
import type { PortfolioTransparencyDetail } from "@/lib/model-portfolios/transparency";

const accentBySlug: Record<string, string> = {
  forsiktig: "text-blue-400 border-blue-500/50 bg-blue-500/5",
  medelrisk: "text-cyan-400 border-cyan-500/50 bg-cyan-500/5",
  "hog-risk": "text-orange-400 border-orange-500/50 bg-orange-500/5",
  utdelning: "text-violet-400 border-violet-500/50 bg-violet-500/5",
};

function formatSek(minor: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function tradeLabel(type: string): string {
  if (type === "buy") return "Köp";
  if (type === "sell") return "Sälj";
  if (type === "dividend") return "Utdelning";
  return "Avgift";
}

function dividendAccountLabel(exchange: string): "ISK" | "KF" {
  return exchange.toUpperCase() === "ST" ? "ISK" : "KF";
}

export default function PortfolioDetailView({ detail }: { detail: PortfolioTransparencyDetail }) {
  const mandate = MODEL_PORTFOLIO_MANDATES[detail.strategyKey];
  const turnover = MODEL_PORTFOLIO_TURNOVER_POLICY[detail.strategyKey];
  const catalog = getModelPortfolioPublicEntry(detail.slug);
  const accent = accentBySlug[detail.slug] ?? accentBySlug.forsiktig;
  const marketStatus = resolveMarketLiveStatus(new Date());
  const launchLabel = detail.launchedAt
    ? new Intl.DateTimeFormat("sv-SE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(detail.launchedAt))
    : MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL;
  const showDividendAccount = detail.strategyKey === "dividend";

  return (
    <div className="mx-auto w-full max-w-[1380px] space-y-6 pb-8">
      <div className="flex flex-wrap items-center gap-2 text-xs text-divlab-text-muted">
        <Link href="/portfolios" className="hover:text-divlab-text">
          AI-portföljer
        </Link>
        <span>/</span>
        <span className="text-divlab-text-secondary">{detail.name}</span>
      </div>

      <section className={`border px-5 py-6 sm:px-7 ${accent}`}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text">
                {detail.name}
              </h1>
              <MarketLiveBadge initialStatus={marketStatus} />
              <span className="border border-current/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                {detail.riskLabel}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
              {catalog?.summary ?? detail.description}
            </p>
            <p className="mt-2 text-xs leading-5 text-divlab-text-muted">
              Simulerad AI-portfölj i SEK, live sedan {launchLabel}. Inte personlig rådgivning eller verkliga mäklaraffärer. Historiken är fortfarande kort. Modellportföljerna handlar endast hela aktier och använder 10 kr i simulerat courtage per genomfört köp.
            </p>
            {showDividendAccount ? (
              <p className="mt-2 text-xs leading-5 text-divlab-text-muted">
                Utdelningsportföljen bokför svenska innehav på simulerat ISK och utländska innehav på simulerat KF.
              </p>
            ) : null}
            <p className="mt-3 text-xs leading-5 text-divlab-text-secondary">
              <Link
                href={MODEL_PORTFOLIO_PROCESS_PATH}
                className="font-semibold text-divlab-blue hover:text-divlab-blue-muted"
              >
                Så arbetar DivLabs AI-portföljer
              </Link>{" "}
              · AI för aktieanalys inom ett fast mandat och en definierad tidshorisont, med deterministisk verifiering innan en simulerad affär bokförs.
            </p>
          </div>
          <div className="text-right text-xs text-divlab-text-muted">
            <p>Strategiversion {detail.strategyVersion}</p>
            <p className="mt-1">{detail.tradeCount} genomförda affärer</p>
            <p className="mt-1">Live {launchLabel}</p>
          </div>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-4">
          <Metric label="Tidshorisont" value={catalog?.horizonLabel ?? mandate.horizonLabel} />
          <Metric label="Startkapital" value={formatSek(detail.initialCapitalMinor)} />
          <Metric
            label="Månadsspar"
            value={`${formatSek(detail.monthlyContributionMinor)} den ${detail.contributionDay}:e`}
          />
          <Metric
            label="Senaste AI-beslut"
            value={detail.latestDecision ? formatDate(detail.latestDecision.createdAt) : "Inget beslut ännu"}
          />
        </div>
      </section>

      <PortfolioValueChart
        slug={detail.slug}
        portfolioName={detail.name}
        points={detail.valueHistory}
      />

      <PortfolioHoldingsOverview
        holdings={detail.holdings}
        showAccount={showDividendAccount}
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border divlab-border-neutral bg-divlab-surface/45 px-5 py-6 sm:px-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-divlab-text-muted">
            Strategin
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-divlab-text">
            Så arbetar {detail.name}-AI:n
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-divlab-text-secondary">
            {mandate.objective}
          </p>
          <div className="mt-5 border-l-2 border-divlab-blue/35 pl-4">
            <p className="text-xs font-semibold text-divlab-text">
              Tidshorisont: {mandate.horizonLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
              {catalog?.workStyle ?? mandate.horizonGuidance}
            </p>
            <p className="mt-2 text-xs leading-5 text-divlab-text-muted">
              Tidshorisonten styr hur AI:n tolkar risk, fundamenta, momentum och katalysatorer. Den är inte ett automatiskt sista säljdatum.
            </p>
          </div>
          <div className="mt-7 grid gap-6 lg:grid-cols-3">
            <MandatePanel
              title="Det här letar AI:n efter"
              lead={mandate.searchMission}
              items={mandate.preferredSetups}
            />
            <MandatePanel title="Så investerar den" items={mandate.entryTactics} />
            <MandatePanel title="AI:n avstår när" items={mandate.rejectionSignals} />
          </div>
          <div className="mt-7 grid gap-7 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-divlab-text">AI:n prioriterar</h3>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-divlab-text-secondary">
                {mandate.behavior.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-emerald-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-divlab-text">AI:n får inte</h3>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-divlab-text-secondary">
                {mandate.explicitDoNot.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-red-400">×</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <aside className="border divlab-border-neutral bg-divlab-surface/45 px-5 py-6">
          <h2 className="text-base font-semibold text-divlab-text">Handelsdisciplin</h2>
          <dl className="mt-4 space-y-4 text-xs">
            <PolicyRow label="Tidshorisont" value={mandate.horizonLabel} />
            <PolicyRow label="Max beslutskörningar/dag" value={String(turnover.maxRunsPerTradingDay)} />
            <PolicyRow label="Eventkörningar utöver primär" value={String(turnover.maxAdditionalEventRuns)} />
            <PolicyRow label="Minsta affär" value={`${turnover.minTradePctOfPortfolio}% av portföljen`} />
            <PolicyRow label="Aktieantal" value="Endast hela aktier" />
            <PolicyRow label="Courtage" value="10 kr per köp" />
            {showDividendAccount ? <PolicyRow label="Konton" value="Sverige ISK · utland KF" /> : null}
            <PolicyRow
              label="Köp/ersätt-tröskel"
              value={`${Math.round(turnover.replacementThresholdScore * 100)} / 100`}
            />
            <PolicyRow label="Cooldown per instrument" value={`${turnover.cooldownHours} timmar`} />
          </dl>
          <p className="mt-6 text-xs leading-5 text-divlab-text-muted">
            Ett beslut att inte handla är ett fullvärdigt utfall. Riskregler och verifiering kan stoppa ett AI-förslag innan någon modellaffär bokförs.
          </p>
        </aside>
      </section>

      {detail.latestDecision ? (
        <section className="border divlab-border-neutral bg-divlab-surface/45 px-5 py-5 sm:px-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-divlab-text-muted">
            Senaste beslut
          </p>
          <DecisionNarrative value={detail.latestDecision.rationale} />
        </section>
      ) : null}

      <section className="border divlab-border-neutral bg-divlab-surface/45">
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-3 pt-5 sm:px-7">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-divlab-text">Affärshistorik</h2>
            <p className="mt-1 text-xs text-divlab-text-muted">
              25 affärer per sida. Varje rad går att öppna för fullständigt beslutsunderlag.
            </p>
          </div>
          <p className="text-xs text-divlab-text-muted">
            Sida {detail.page} av {detail.pageCount}
          </p>
        </div>
        <div className="overflow-x-auto px-5 pb-5 sm:px-7">
          <table className="w-full min-w-[980px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b divlab-border-neutral text-[10px] uppercase tracking-[0.14em] text-divlab-text-muted">
                <th className="py-3 pr-4 font-medium">Datum</th>
                <th className="py-3 pr-4 font-medium">Typ</th>
                <th className="py-3 pr-4 font-medium">Aktie</th>
                <th className="py-3 pr-4 font-medium">Belopp</th>
                <th className="py-3 pr-4 font-medium">Avgift</th>
                <th className="py-3 pr-4 font-medium">Antal</th>
                <th className="py-3 pr-4 font-medium">Kurs</th>
                {showDividendAccount ? <th className="py-3 pr-4 font-medium">Konto</th> : null}
                <th className="py-3 font-medium">AI-anledning</th>
              </tr>
            </thead>
            <tbody>
              {detail.trades.length ? (
                detail.trades.map((trade) => {
                  const href = `/portfolios/${detail.slug}/trades/${trade.id}`;
                  return (
                    <tr
                      key={trade.id}
                      className="border-b divlab-border-neutral last:border-b-0 hover:bg-white/[0.025]"
                    >
                      <Cell href={href}>{formatDate(trade.executedAt)}</Cell>
                      <Cell
                        href={href}
                        className={
                          trade.transactionType === "buy"
                            ? "text-emerald-400"
                            : trade.transactionType === "sell"
                              ? "text-red-400"
                              : ""
                        }
                      >
                        {tradeLabel(trade.transactionType)}
                      </Cell>
                      <Cell href={href}>
                        <span className="text-divlab-text">{trade.instrumentName}</span>{" "}
                        <span className="text-divlab-text-muted">({trade.instrumentSymbol})</span>
                      </Cell>
                      <Cell href={href}>{formatSek(trade.grossAmountMinor)}</Cell>
                      <Cell href={href}>{formatSek(trade.feeMinor)}</Cell>
                      <Cell href={href}>
                        {new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(trade.quantity)}
                      </Cell>
                      <Cell href={href}>
                        {trade.priceMinor === null ? "—" : `${formatSek(trade.priceMinor)} / st`}
                      </Cell>
                      {showDividendAccount ? (
                        <Cell href={href}>{dividendAccountLabel(trade.exchange)}</Cell>
                      ) : null}
                      <Cell href={href} className="max-w-[300px] truncate">
                        {trade.rationale}
                      </Cell>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={showDividendAccount ? 9 : 8}
                    className="py-12 text-center text-sm text-divlab-text-muted"
                  >
                    Inga affärer har genomförts ännu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t divlab-border-neutral px-5 py-4 sm:px-7">
          {detail.page > 1 ? (
            <Link
              href={`/portfolios/${detail.slug}?page=${detail.page - 1}`}
              className="border divlab-border-neutral px-3 py-2 text-xs font-semibold text-divlab-text hover:border-divlab-blue/50 hover:text-divlab-blue"
            >
              ← Föregående
            </Link>
          ) : (
            <span />
          )}
          {detail.page < detail.pageCount ? (
            <Link
              href={`/portfolios/${detail.slug}?page=${detail.page + 1}`}
              className="border divlab-border-neutral px-3 py-2 text-xs font-semibold text-divlab-text hover:border-divlab-blue/50 hover:text-divlab-blue"
            >
              Nästa →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </section>
    </div>
  );
}

function DecisionNarrative({ value }: { value: string }) {
  const sections = value
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);

  if (sections.length <= 1) {
    return (
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-divlab-text-secondary">
        {value}
      </p>
    );
  }

  return (
    <div className="mt-3 divide-y divlab-border-neutral">
      {sections.map((section, index) => {
        const [heading, ...bodyLines] = section.split("\n");
        const body = bodyLines.join("\n").trim();
        return (
          <div key={`${heading}-${index}`} className="py-4 first:pt-0 last:pb-0">
            <h3 className="text-sm font-semibold text-divlab-text">{heading}</h3>
            {body ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-divlab-text-secondary">
                {body}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function MandatePanel({
  title,
  lead,
  items,
}: {
  title: string;
  lead?: string;
  items: readonly string[];
}) {
  return (
    <div className="border divlab-border-neutral bg-black/10 px-4 py-4">
      <h3 className="text-sm font-semibold text-divlab-text">{title}</h3>
      {lead ? (
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">{lead}</p>
      ) : null}
      <ul className="mt-3 space-y-2 text-sm leading-6 text-divlab-text-secondary">
        {items.slice(0, 4).map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-divlab-blue" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-divlab-text-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-divlab-text">{value}</p>
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-divlab-text-muted">{label}</dt>
      <dd className="text-right font-semibold text-divlab-text">{value}</dd>
    </div>
  );
}

function Cell({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`p-0 text-divlab-text-secondary ${className}`}>
      <Link href={href} className="block px-0 py-3 pr-4">
        {children}
      </Link>
    </td>
  );
}
