import type { PortfolioTransparencyHolding } from "@/lib/model-portfolios/transparency";

function formatSek(minor: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 4 }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  }).format(new Date(value));
}

function development(holding: PortfolioTransparencyHolding): { amountMinor: number; pct: number | null } | null {
  if (holding.currentValueMinor === null) return null;
  const amountMinor = holding.currentValueMinor - holding.purchaseValueMinor;
  const pct = holding.purchaseValueMinor > 0
    ? (amountMinor / holding.purchaseValueMinor) * 100
    : null;
  return { amountMinor, pct };
}

export default function PortfolioHoldingsOverview({
  holdings,
  showAccount,
}: {
  holdings: readonly PortfolioTransparencyHolding[];
  showAccount: boolean;
}) {
  const columnCount = showAccount ? 8 : 7;

  return (
    <section className="border divlab-border-neutral bg-divlab-surface/45">
      <div className="px-5 pb-3 pt-5 sm:px-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-divlab-text-muted">Aktuella innehav</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-divlab-text">Portföljöversikt</h2>
        <p className="mt-1 max-w-4xl text-xs leading-5 text-divlab-text-muted">
          Inköp visar nuvarande innehavs kostnadsbas inklusive simulerat köpcourtage. Värdet mark-to-market-uppdateras i de fyra ordinarie AI-passen per handelsdag. Senast värderad visar när innehavets värdering senast sparades.
        </p>
      </div>

      <div className="overflow-x-auto px-5 pb-5 sm:px-7">
        <table className="w-full min-w-[920px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b divlab-border-neutral text-[10px] uppercase tracking-[0.14em] text-divlab-text-muted">
              <th className="py-3 pr-4 font-medium">Aktie</th>
              {showAccount ? <th className="py-3 pr-4 font-medium">Konto</th> : null}
              <th className="py-3 pr-4 font-medium">Antal</th>
              <th className="py-3 pr-4 font-medium">Inköp</th>
              <th className="py-3 pr-4 font-medium">Värde</th>
              <th className="py-3 pr-4 font-medium">Utveckling</th>
              <th className="py-3 pr-4 font-medium">Utdelningar</th>
              <th className="py-3 font-medium">Senast värderad</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length ? holdings.map((holding) => {
              const change = development(holding);
              const positive = (change?.amountMinor ?? 0) >= 0;
              return (
                <tr key={`${holding.instrumentSymbol}.${holding.exchange}`} className="border-b divlab-border-neutral text-divlab-text-secondary last:border-b-0">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-divlab-text">{holding.instrumentName}</span>{" "}
                    <span className="text-divlab-text-muted">({holding.instrumentSymbol})</span>
                  </td>
                  {showAccount ? <td className="py-3 pr-4 font-semibold text-divlab-text">{holding.accountType ?? "—"}</td> : null}
                  <td className="py-3 pr-4 tabular-nums">{formatQuantity(holding.quantity)}</td>
                  <td className="py-3 pr-4 tabular-nums">{formatSek(holding.purchaseValueMinor)}</td>
                  <td className="py-3 pr-4 tabular-nums">{holding.currentValueMinor === null ? "—" : formatSek(holding.currentValueMinor)}</td>
                  <td className={`py-3 pr-4 tabular-nums ${change ? (positive ? "text-emerald-400" : "text-red-400") : "text-divlab-text-muted"}`}>
                    {change ? (
                      <>
                        {positive ? "+" : ""}{formatSek(change.amountMinor)}
                        {change.pct === null ? null : <span className="ml-1 text-[11px]">({change.pct >= 0 ? "+" : ""}{change.pct.toFixed(2).replace(".", ",")}%)</span>}
                      </>
                    ) : "—"}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{formatSek(holding.dividendsMinor)}</td>
                  <td className="py-3">
                    <span className="whitespace-nowrap text-divlab-text-secondary">{formatDate(holding.loggedAt)}</span>
                    {holding.lastPriceAsOf ? <span className="mt-0.5 block whitespace-nowrap text-[10px] text-divlab-text-muted">Kursdata {formatDate(holding.lastPriceAsOf)}</span> : null}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={columnCount} className="py-12 text-center text-sm text-divlab-text-muted">
                  Portföljen har inga aktiva innehav ännu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
