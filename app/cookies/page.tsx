import type { Metadata } from "next";
import CookiesPageContent from "@/components/marketing/legal/CookiesPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export const metadata: Metadata = {
  title: "Cookiepolicy | DivLab",
  description:
    "Cookiepolicy för DivLab — cookies och webbläsarlagring i den kostnadsfria betan.",
};

export default function CookiesPage() {
  return (
    <MarketingPageShell>
      <CookiesPageContent />
    </MarketingPageShell>
  );
}
