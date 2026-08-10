import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import ModelPortfoliosOverview from "@/components/portfolios/ModelPortfoliosOverview";
import { resolveCombinedMarketStatus } from "@/lib/model-portfolios/engine/market-hours";
import { loadModelPortfoliosOverview } from "@/lib/model-portfolios/server";

export const metadata: Metadata = {
  title: "Modellportföljer",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ModelPortfoliosPage() {
  const result = await loadModelPortfoliosOverview();
  const marketStatus = resolveCombinedMarketStatus();

  return (
    <AppShell>
      {result.ok ? (
        <ModelPortfoliosOverview
          portfolios={result.portfolios}
          recentTransactions={result.recentTransactions}
          marketStatus={marketStatus}
        />
      ) : (
        <section className="divlab-card px-5 py-8 sm:px-7">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-divlab-text">
            Modellportföljer kunde inte laddas
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-divlab-text-secondary">
            Portföljdatan är tillfälligt otillgänglig. Ingen modelltransaktion kan
            göras från den här vyn. Försök igen om en stund.
          </p>
        </section>
      )}
    </AppShell>
  );
}
