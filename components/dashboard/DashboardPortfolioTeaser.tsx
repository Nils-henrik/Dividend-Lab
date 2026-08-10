import Link from "next/link";
import MarketLiveBadge from "@/components/portfolios/MarketLiveBadge";
import { resolveMarketLiveStatus } from "@/lib/model-portfolios/engine/market-status";
import { loadModelPortfoliosOverview } from "@/lib/model-portfolios/server";
import { createClient } from "@/lib/supabase/server";

const portfolioStyle: Record<string, { accent: string; border: string; soft: string }> = {
  forsiktig: {
    accent: "text-blue-400",
    border: "border-blue-500/50",
    soft: "bg-blue-500/5",
  },
  medelrisk: {
    accent: "text-cyan-400",
    border: "border-cyan-500/50",
    soft: "bg-cyan-500/5",
  },
  "hog-risk": {
    accent: "text-orange-400",
    border: "border-orange-500/50",
    soft: "bg-orange-500/5",
  },
  utdelning: {
    accent: "text-violet-400",
    border: "border-violet-500/50",
    soft: "bg-violet-500/5",
  },
};

type SnapshotRow = {
  portfolio_id: string;
  snapshot_at: string;
  total_value_minor: number | string;
};

function formatSek(minor: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function buildSparkline(values: readonly number[]): string {
  if (values.length < 2) return "4,22 108,22";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return values
    .map((value, index) => {
      const x = 4 + (104 * index) / Math.max(1, values.length - 1);
      const y = 38 - ((value - min) / range) * 30;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default async function DashboardPortfolioTeaser() {
  const overview = await loadModelPortfoliosOverview();
  if (!overview.ok || overview.portfolios.length === 0) return null;

  const supabase = await createClient();
  const portfolioIds = overview.portfolios.map((portfolio) => portfolio.id);
  const { data: snapshotData } = await supabase
    .from("model_portfolio_snapshots")
    .select("portfolio_id,snapshot_at,total_value_minor")
    .in("portfolio_id", portfolioIds)
    .order("snapshot_at", { ascending: true })
    .limit(160);

  const snapshotsByPortfolio = new Map<string, number[]>();
  for (const row of (snapshotData ?? []) as SnapshotRow[]) {
    const value = Number(row.total_value_minor);
    if (!Number.isFinite(value)) continue;
    const list = snapshotsByPortfolio.get(row.portfolio_id) ?? [];
    list.push(value);
    snapshotsByPortfolio.set(row.portfolio_id, list);
  }

  const marketStatus = resolveMarketLiveStatus(new Date());

  return (
    <section aria-labelledby="dashboard-portfolios-title" className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p id="dashboard-portfolios-title" className="text-xs font-semibold uppercase tracking-[0.12em] text-divlab-text">
            DivLabs AI-portföljer
          </p>
          <p className="mt-1 text-xs leading-5 text-divlab-text-secondary sm:text-sm">
            Fyra strategier. Fyra AI-förvaltare. Följ besluten när de händer.
          </p>
        </div>
        <MarketLiveBadge initialStatus={marketStatus} className="shrink-0" />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {overview.portfolios.map((portfolio) => {
          const style = portfolioStyle[portfolio.slug] ?? portfolioStyle.forsiktig;
          const snapshots = snapshotsByPortfolio.get(portfolio.id) ?? [];
          const positive = portfolio.performancePct >= 0;

          return (
            <Link
              key={portfolio.id}
              href={`/portfolios/${portfolio.slug}`}
              aria-label={`Öppna ${portfolio.name}`}
              className={`group relative min-w-0 overflow-hidden rounded-xl border divlab-border-neutral px-3 py-3 transition hover:border-white/25 ${style.soft}`}
            >
              <span className={`absolute inset-x-0 top-0 border-t ${style.border}`} aria-hidden="true" />
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-divlab-text group-hover:text-white">
                  {portfolio.name}
                </span>
                <span className={`text-sm ${style.accent}`} aria-hidden="true">→</span>
              </div>

              <p className={`mt-2 text-lg font-semibold tabular-nums ${positive ? "text-emerald-400" : "text-red-400"}`}>
                {positive ? "+" : ""}{portfolio.performancePct.toFixed(2).replace(".", ",")}%
              </p>

              <svg aria-hidden="true" viewBox="0 0 112 44" className={`mt-1 h-9 w-full ${style.accent}`} fill="none" preserveAspectRatio="none">
                <polyline
                  points={buildSparkline(snapshots)}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <p className="mt-1 truncate text-[11px] text-divlab-text-muted">
                Värde {formatSek(portfolio.totalValueMinor)}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-divlab-text-secondary">
        <FeatureItem icon="bolt">AI-drivna beslut</FeatureItem>
        <FeatureItem icon="refresh">Live-uppdateringar 4x/dag</FeatureItem>
        <FeatureItem icon="calendar">Automatiskt månadsspar 25:e</FeatureItem>
        <FeatureItem icon="bell">Följ och få notiser</FeatureItem>
        <Link href="/portfolios" className="ml-auto font-semibold text-divlab-blue transition hover:text-divlab-blue-muted">
          Se portföljerna →
        </Link>
      </div>
    </section>
  );
}

function FeatureItem({
  icon,
  children,
}: {
  icon: "bolt" | "refresh" | "calendar" | "bell";
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-divlab-blue" aria-hidden="true">
        <FeatureIcon type={icon} />
      </span>
      <span>{children}</span>
    </span>
  );
}

function FeatureIcon({ type }: { type: "bolt" | "refresh" | "calendar" | "bell" }) {
  const common = "h-3.5 w-3.5";

  if (type === "refresh") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 11a8 8 0 0 0-14.7-4.4L3 9" />
        <path d="M3 4v5h5" />
        <path d="M4 13a8 8 0 0 0 14.7 4.4L21 15" />
        <path d="M21 20v-5h-5" />
      </svg>
    );
  }

  if (type === "calendar") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
        <path d="M8 14h3M8 17h5" />
      </svg>
    );
  }

  if (type === "bell") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />
    </svg>
  );
}
