import type { Metadata } from "next";
import PublicContentShell from "@/components/layout/PublicContentShell";
import ModelPortfoliosOverview from "@/components/portfolios/ModelPortfoliosOverview";
import { ModelPortfoliosPublicFallback } from "@/components/portfolios/ModelPortfoliosPublicFallback";
import JsonLdScript from "@/components/seo/JsonLd";
import { buildModelPortfolioHubMetadata } from "@/lib/model-portfolios/public";
import { loadModelPortfoliosOverview } from "@/lib/model-portfolios/server";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildModelPortfolioHubMetadata();

export const dynamic = "force-dynamic";

export default async function ModelPortfoliosPage() {
  const result = await loadModelPortfoliosOverview();

  return (
    <PublicContentShell>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Hem", path: "/" },
          { name: "AI-portföljer", path: "/portfolios" },
        ])}
      />
      {result.ok ? (
        <ModelPortfoliosOverview
          portfolios={result.portfolios}
          recentTransactions={result.recentTransactions}
          isAuthenticated={result.isAuthenticated}
        />
      ) : (
        <ModelPortfoliosPublicFallback />
      )}
    </PublicContentShell>
  );
}
