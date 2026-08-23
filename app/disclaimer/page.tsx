import type { Metadata } from "next";
import DisclaimerPageContent from "@/components/marketing/legal/DisclaimerPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import { getCanonicalUrl } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  title: "Ansvarsfriskrivning",
  description:
    "Ansvarsfriskrivning för DivLab — begränsningar för information, verktyg och community-innehåll.",
  alternates: {
    canonical: getCanonicalUrl("/disclaimer"),
  },
};

export default function DisclaimerPage() {
  return (
    <MarketingPageShell>
      <DisclaimerPageContent />
    </MarketingPageShell>
  );
}
