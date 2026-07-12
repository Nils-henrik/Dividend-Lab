import type { Metadata } from "next";
import TermsPageContent from "@/components/marketing/legal/TermsPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export const metadata: Metadata = {
  title: "Användarvillkor | DivLab",
  description:
    "Användarvillkor för DivLab — kostnadsfri beta med verktyg, utbildning och community för dig som följer marknaden.",
};

export default function TermsPage() {
  return (
    <MarketingPageShell>
      <TermsPageContent />
    </MarketingPageShell>
  );
}
