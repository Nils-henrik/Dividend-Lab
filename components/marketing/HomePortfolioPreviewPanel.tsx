import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/layout/AppIcon";
import MarketLiveBadge from "@/components/portfolios/MarketLiveBadge";
import { resolveMarketLiveStatus } from "@/lib/model-portfolios/engine/market-status";
import { loadModelPortfoliosOverview, type ModelPortfolioOverview } from "@/lib/model-portfolios/server";

const styles: Record<string, { icon: AppIconName; accent: string; soft: string; badge: string }> = {
  forsiktig: { icon: "shield", accent: "text-blue-400", soft: "bg-blue-500/[0.035]", badge: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  medelrisk: { icon: "dashboard", accent: "text-cyan-400", soft: "bg-cyan-500/[0.035]", badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" },
  "hog-risk": { icon: "rocket", accent: "text-orange-400", soft: "bg-orange-500/[0.035]", badge: "border-orange-500/30 bg-orange-500/10 text-orange-300" },
  utdelning: { icon: "diamond", accent: "text-violet-400", soft: "bg-violet-500/[0.035]", badge: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
};

function formatSek(minor: number) {
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(minor / 100);
}

function buildSparkline(portfolio: ModelPortfolioOverview) {
  const values = portfolio.valueHistory.slice(-24).map((point) => point.totalValueMinor);
  if (values.length < 2) return "4,20 108,20";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  return values.map((value, index) => {
    const x = 4 + (104 * index) / Math.max(1, values.length - 1);
    const y = 36 - ((value - min) / range) * 28;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function decisionLabel(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("buy")) return "Köp";
  if (normalized.includes("sell")) return "Sälj";
  if (normalized.includes("hold")) return "Avvakta";
  return type;
}

export default async function HomePortfolioPreviewPanel() {
  const result = await loadModelPortfoliosOverview();
  if (!result.ok || result.portfolios.length === 0) {
    return (
      <section aria-labelledby="homepage-portfolios-heading">
        <h2 id="homepage-portfolios-heading" className="text-lg font-semibold text-divlab-text">DivLab AI-portföljer</h2>
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">Portföljdatan kunde inte hämtas just nu.</p>
        <Link href="/portfolios" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-divlab-blue">Öppna AI-portföljerna →</Link>
      </section>
    );
  }

  const marketStatus = resolveMarketLiveStatus(new Date());

  return (
    <section aria-labelledby="homepage-portfolios-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="homepage-portfolios-heading" className="text-lg font-semibold tracking-[-0.02em] text-divlab-text">DivLab AI-portföljer</h2>
          <p className="mt-1 text-sm leading-6 text-divlab-text-secondary">Fyra olika strategier. Följ utvecklingen och de senaste AI-besluten.</p>
        </div>
        <MarketLiveBadge initialStatus={marketStatus} className="shrink-0" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {result.portfolios.map((portfolio) => {
          const style = styles[portfolio.slug] ?? styles.forsiktig;
          const positive = portfolio.performancePct >= 0;
          return (
            <Link
              key={portfolio.id}
              href={`/portfolios/${portfolio.slug}`}
              className={`group rounded-xl border border-white/[0.11] bg-[rgba(7,14,25,0.86)] p-3.5 transition hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 ${style.soft}`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="inline-flex text-divlab-blue"
                >
                  <AppIcon name={style.icon} className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <h3 className="truncate text-sm font-semibold text-divlab-text group-hover:text-white">
                  {portfolio.name}
                </h3>
                <span
                  className={`ml-auto rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${style.badge}`}
                >
                  {portfolio.riskLabel}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-divlab-text-muted">
                    Portföljvärde
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-divlab-text">
                    {formatSek(portfolio.totalValueMinor)}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    positive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {positive ? "+" : ""}
                  {portfolio.performancePct.toFixed(2).replace(".", ",")}%
                </p>
              </div>
              <svg
                aria-hidden="true"
                viewBox="0 0 112 44"
                className="mt-1.5 h-7 w-full text-[#168cff]"
                fill="none"
                preserveAspectRatio="none"
              >
                <polyline
                  points={buildSparkline(portfolio)}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="mt-2 border-t divlab-border-neutral pt-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-divlab-text-muted">
                  Senaste AI-beslut
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-divlab-text-secondary">
                  {portfolio.latestDecision
                    ? decisionLabel(portfolio.latestDecision.type)
                    : "Inget beslut ännu"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/register"
        className="mt-3 flex min-h-9 items-center justify-center text-sm font-semibold text-divlab-blue transition hover:text-divlab-blue-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
      >
        Följ portföljerna med ett gratis konto →
      </Link>
    </section>
  );
}
