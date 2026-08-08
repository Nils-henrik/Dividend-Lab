import { setModelPortfolioFollowAction } from "@/app/portfolios/actions";
import type { ModelPortfolioOverview } from "@/lib/model-portfolios/server";

function formatSek(minor: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function statusLabel(status: ModelPortfolioOverview["status"]): string {
  if (status === "active") return "Aktiv";
  if (status === "paused") return "Pausad";
  return "Förbereds";
}

function decisionLabel(type: string): string {
  const labels: Record<string, string> = {
    hold: "Behåll",
    buy: "Köp",
    sell: "Sälj",
    rebalance: "Ombalansera",
    deposit: "Insättning",
  };
  return labels[type] ?? type;
}

export default function ModelPortfoliosOverview({
  portfolios,
}: {
  portfolios: readonly ModelPortfolioOverview[];
}) {
  return (
    <div className="space-y-5">
      <section className="px-1 sm:px-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-4xl">
            Modellportföljer
          </h1>
          <span className="rounded-md border border-divlab-blue/25 bg-divlab-blue/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-divlab-blue">
            Alpha
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-divlab-text-secondary">
          Fyra transparenta DivLab-portföljer med samma regler för alla. AI:n ska
          förvalta modellkapitalet utifrån verifierad marknads- och rapportdata —
          inte utifrån din privata ekonomi och inte som personlig rådgivning.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Startkapital" value="10 000 kr" />
        <Metric label="Månadsspar" value="5 000 kr · den 25:e" />
        <Metric label="Beslutsprincip" value="AI + verifierade källor" />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {portfolios.map((portfolio) => (
          <article key={portfolio.id} className="divlab-card overflow-hidden">
            <div className="border-b divlab-border-neutral px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-divlab-text">
                      {portfolio.name}
                    </h2>
                    <span className="rounded-md border divlab-border-neutral bg-divlab-elevated px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-divlab-text-muted">
                      {portfolio.riskLabel}
                    </span>
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-divlab-text-secondary">
                    {portfolio.description}
                  </p>
                </div>
                <span className="rounded-full border border-divlab-blue/20 bg-divlab-blue/5 px-2.5 py-1 text-[11px] font-medium text-divlab-blue">
                  {statusLabel(portfolio.status)}
                </span>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PortfolioMetric label="Värde" value={formatSek(portfolio.totalValueMinor)} />
                <PortfolioMetric label="Kontanter" value={formatSek(portfolio.cashMinor)} />
                <PortfolioMetric label="Investerat" value={formatSek(portfolio.investedMinor)} />
                <PortfolioMetric label="Innehav" value={String(portfolio.holdingsCount)} />
              </div>

              <div>
                <p className="divlab-section-label">Strategins mål</p>
                <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
                  {portfolio.objective}
                </p>
              </div>

              <div className="rounded-2xl border divlab-border-neutral bg-divlab-elevated/55 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-divlab-text-muted">
                    Senaste AI-beslut
                  </p>
                  {portfolio.latestDecision ? (
                    <span className="text-xs font-medium text-divlab-blue">
                      {decisionLabel(portfolio.latestDecision.type)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
                  {portfolio.latestDecision?.rationale ??
                    "Inga modelltransaktioner ännu. Portföljen står i 10 000 kr kontanter tills den verifierade marknadsdatan och AI-exekveringen är aktiverade."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t divlab-border-neutral pt-4">
                <p className="text-xs leading-5 text-divlab-text-muted">
                  +{formatSek(portfolio.monthlyContributionMinor)} den {portfolio.contributionDay}:e varje månad.
                  E-post skickas endast vid genomförda köp/sälj när förvaltningen är aktiv.
                </p>
                <form action={setModelPortfolioFollowAction}>
                  <input type="hidden" name="portfolioId" value={portfolio.id} />
                  <input
                    type="hidden"
                    name="follow"
                    value={portfolio.isFollowing ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className={portfolio.isFollowing ? "divlab-btn-ghost" : "divlab-btn-primary"}
                  >
                    {portfolio.isFollowing ? "Sluta följa" : "Följ via e-post"}
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border divlab-border-neutral bg-divlab-elevated/40 px-5 py-4 text-xs leading-5 text-divlab-text-muted">
        Modellportföljerna är redaktionella simuleringar och är inte personliga
        investeringsrekommendationer. Alla framtida köp och sälj ska publiceras
        med samma beslutsunderlag, tidpunkt och motivering för alla följare.
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border divlab-border-neutral bg-divlab-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-divlab-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-divlab-text">{value}</p>
    </div>
  );
}

function PortfolioMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-divlab-text-muted">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold tabular-nums text-divlab-text">
        {value}
      </p>
    </div>
  );
}
