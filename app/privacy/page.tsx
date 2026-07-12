import type { Metadata } from "next";
import PrivacyPageContent from "@/components/marketing/legal/PrivacyPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export const metadata: Metadata = {
  title: "Integritetspolicy | DivLab",
  description:
    "Integritetspolicy för DivLab — hur personuppgifter behandlas i den kostnadsfria betan.",
};

export default function PrivacyPage() {
  return (
    <MarketingPageShell>
      <PrivacyPageContent />
    </MarketingPageShell>
  );
}
