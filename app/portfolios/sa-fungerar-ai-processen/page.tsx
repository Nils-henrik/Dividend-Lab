import type { Metadata } from "next";
import PublicContentShell from "@/components/layout/PublicContentShell";
import AiProcessPageContent from "@/components/portfolios/AiProcessPageContent";
import JsonLdScript from "@/components/seo/JsonLd";
import {
  buildModelPortfolioProcessMetadata,
  MODEL_PORTFOLIO_PROCESS_PATH,
} from "@/lib/model-portfolios/public";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildModelPortfolioProcessMetadata();

export default function AiPortfolioProcessPage() {
  return (
    <PublicContentShell>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Hem", path: "/" },
          { name: "AI-portföljer", path: "/portfolios" },
          {
            name: "Så arbetar AI-portföljerna",
            path: MODEL_PORTFOLIO_PROCESS_PATH,
          },
        ])}
      />
      <AiProcessPageContent />
    </PublicContentShell>
  );
}
