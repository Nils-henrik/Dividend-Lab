import type { Metadata } from "next";
import AboutPageContent from "@/components/marketing/AboutPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

export const metadata: Metadata = {
  title: `Om DivLab | ${DIVLAB_BRAND_NAME}`,
  description:
    "Lär känna DivLab – den svenska plattformen för börsnyheter, utbildning, Frihetsmaskinen och community kring långsiktigt sparande.",
  alternates: {
    canonical: getCanonicalUrl("/about"),
  },
  openGraph: {
    title: `Om DivLab | ${DIVLAB_BRAND_NAME}`,
    description:
      "Svensk plattform för börsnyheter, utbildning och långsiktigt sparande.",
    url: getCanonicalUrl("/about"),
    type: "website",
    locale: "sv_SE",
  },
};

export default function AboutPage() {
  return (
    <MarketingPageShell>
      <AboutPageContent />
    </MarketingPageShell>
  );
}
