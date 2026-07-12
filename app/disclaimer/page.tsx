import type { Metadata } from "next";
import DisclaimerPageContent from "@/components/marketing/legal/DisclaimerPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export const metadata: Metadata = {
  title: "Ansvarsfriskrivning | DivLab",
  description:
    "Ansvarsfriskrivning för DivLab — begränsningar för information, verktyg och community-innehåll.",
};

export default function DisclaimerPage() {
  return (
    <MarketingPageShell>
      <DisclaimerPageContent />
    </MarketingPageShell>
  );
}
