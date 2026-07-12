import type { Metadata } from "next";
import FeaturesPageContent from "@/components/marketing/FeaturesPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export const metadata: Metadata = {
  title: "Funktioner | DivLab",
  description:
    "Utforska DivLabs verktyg för marknadsöversikt, börsnyheter, utbildning och gemenskap – samt vad som är på väg.",
};

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <FeaturesPageContent />
    </MarketingPageShell>
  );
}
