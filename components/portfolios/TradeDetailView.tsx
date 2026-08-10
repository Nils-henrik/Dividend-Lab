import Link from "next/link";
import type { PortfolioTradeDetail } from "@/lib/model-portfolios/transparency";

function formatSek(minor: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function tradeLabel(type: string): string {
  if (type === "buy") return "Köp";
  if (type === "sell") return "Sälj";
  if (type === "dividend") return "Utdelning";
  return "Avgift";
}

function decisionLabel(type: string): string {
  const labels: Record<string, string> = {
    buy: "Köp",
    sell: "Sälj",
    hold: "Behåll",
    rebalance: "Ombalansera",
    trim: "Minska",
    deposit: "Insättning",
  };
  return labels[type] ?? type;
}

function evidenceItems(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  }
  return [];
}

function textField(item: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export default function TradeDetailView({ detail }: { detail: PortfolioTradeDetail }) {
  const { portfolio, trade, decision } = detail;
  const isBuy = trade.transactionType === "buy";
  const actionClass = isBuy ? "text-emerald-400" : trade.transactionType === "sell" ? "text-red-400" : "text-divlab-blue";
  const evidence = evidenceItems(decision?.evidence);

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 pb-8">
      <div className="flex flex-wrap items-center gap-2 text-xs text-divlab-text-muted">
        <Link href="/portfolios" className="hover:text-divlab-text">Modellportföljer</Link>
        <span>/</span>
        <Link href={`/portfolios/${portfolio.slug}`} className="hover:text-divlab-text">{portfolio.name}</Link>
        <span>/</span>
        <span className="text-divlab-text-secondary">Affär {trade.id.slice(0, 8)}</span>
      </div>

      <section className="border divlab-border-neutral bg-divlab-surface/45 px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold uppercase tracking-[0.14em] ${actionClass}`}>{tradeLabel(trade.transactionType)}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-divlab-text">{trade.instrumentName}</h1>
            <p className="mt-1 text-sm text-divlab-text-muted">{trade.instrumentSymbol} · {trade.exchange}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums text-divlab-text">{formatSek(trade.grossAmountMinor)}</p>
            <p className="mt-1 text-xs text-divlab-text-muted">Genomförd {formatDate(trade.executedAt)}</p>
          </div>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Kurs" value={trade.priceMinor === null ? "—" : `${formatSek(trade.priceMinor)} / st`} />
          <Metric label="Antal" value={new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 4 }).format(trade.quantity)} />
          <Metric label="Courtage" value={formatSek(trade.feeMinor)} />
          <Metric label="Marknadsdata" value={formatDate(trade.marketDataAsOf)} />
        </div>
        {trade.nativeCurrency && trade.nativeCurrency !== "SEK" ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 border-t divlab-border-neutral pt-5">
            <Metric
              label="Ursprungskurs"
              value={
                trade.nativePriceMinor === null
                  ? "—"
                  : `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 }).format(trade.nativePriceMinor / 100)} ${trade.nativeCurrency}`
              }
            />
            <Metric
              label="FX till SEK"
              value={trade.fxRateToSek === null ? "—" : trade.fxRateToSek.toFixed(4)}
            />
            <Metric label="FX-källa" value={trade.fxSourcePublisher ?? "—"} />
            <Metric label="Fill" value={trade.fillLabel ?? "SIMULATED"} />
          </div>
        ) : trade.fillLabel ? (
          <p className="mt-4 text-xs text-divlab-text-muted">Simulerad modellfill ({trade.fillLabel}), inte verklig mäklarorder.</p>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="border divlab-border-neutral bg-divlab-surface/45 px-5 py-6 sm:px-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-divlab-text-muted">Varför AI:n gjorde affären</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-divlab-text">Beslutsmotivering</h2>
            <p className="mt-4 text-sm leading-7 text-divlab-text-secondary">{decision?.rationale ?? trade.rationale}</p>
          </div>

          <div className="border divlab-border-neutral bg-divlab-surface/45 px-5 py-6 sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-divlab-text-muted">Verifierat underlag</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-divlab-text">Källor och signaler</h2>
              </div>
              <span className="text-xs text-divlab-text-muted">{evidence.length} poster</span>
            </div>

            {evidence.length ? (
              <div className="mt-5 space-y-4">
                {evidence.map((item, index) => {
                  const title = textField(item, "title", "name", "label") ?? `Underlag ${index + 1}`;
                  const publisher = textField(item, "publisher", "source", "provider");
                  const summary = textField(item, "summary", "text", "reason");
                  const publishedAt = textField(item, "publishedAt", "published_at", "verifiedAt", "verified_at");
                  return (
                    <article key={`${title}-${index}`} className="border-l-2 border-divlab-blue/30 pl-4">
                      <h3 className="text-sm font-semibold text-divlab-text">{title}</h3>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-divlab-text-muted">
                        {publisher ? <span>{publisher}</span> : null}
                        {publishedAt ? <span>{formatDate(publishedAt)}</span> : null}
                      </div>
                      {summary ? <p className="mt-2 text-xs leading-5 text-divlab-text-secondary">{summary}</p> : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-divlab-text-muted">Inget separat källunderlag finns sparat för den här affären.</p>
            )}
          </div>
        </div>

        <aside className="border divlab-border-neutral bg-divlab-surface/45 px-5 py-6">
          <h2 className="text-base font-semibold text-divlab-text">Beslutslogg</h2>
          <dl className="mt-5 space-y-4 text-xs">
            <Row label="Portfölj" value={portfolio.name} />
            <Row label="Riskprofil" value={portfolio.riskLabel} />
            <Row label="Beslut" value={decision ? decisionLabel(decision.decisionType) : tradeLabel(trade.transactionType)} />
            <Row label="Status" value={decision?.status ?? "Genomförd"} />
            <Row label="AI-modell" value={decision?.modelName ?? "Ej sparad"} />
            <Row label="Provider" value={decision?.modelProvider ?? "Ej sparad"} />
            <Row label="Promptversion" value={decision?.promptVersion ?? "Ej sparad"} />
            <Row label="Beslut skapat" value={formatDate(decision?.createdAt ?? null)} />
            <Row label="Beslut genomfört" value={formatDate(decision?.executedAt ?? trade.executedAt)} />
            <Row label="Data verifierad" value={formatDate(decision?.marketDataAsOf ?? trade.marketDataAsOf)} />
          </dl>
          <p className="mt-6 text-[11px] leading-5 text-divlab-text-muted">
            Sidan återger det beslutsunderlag som sparades när modellaffären skapades. Historiken är till för transparens och är inte personlig investeringsrådgivning.
          </p>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] uppercase tracking-[0.14em] text-divlab-text-muted">{label}</p><p className="mt-1 text-sm font-semibold text-divlab-text">{value}</p></div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><dt className="text-divlab-text-muted">{label}</dt><dd className="max-w-[180px] text-right font-semibold text-divlab-text">{value}</dd></div>;
}
