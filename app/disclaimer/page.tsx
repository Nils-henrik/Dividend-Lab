import type { Metadata } from "next";
import DisclaimerPageContent from "@/components/marketing/legal/DisclaimerPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

export const metadata: Metadata = {
  title: `Ansvarsfriskrivning | ${DIVLAB_BRAND_NAME}`,
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
