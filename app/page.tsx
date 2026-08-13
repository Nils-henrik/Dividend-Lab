import type { Metadata } from "next";
import FinanceFirstHero from "@/components/marketing/FinanceFirstHero";
import FinanceFirstFeatureGrid from "@/components/marketing/FinanceFirstFeatureGrid";
import FinanceFirstSections from "@/components/marketing/FinanceFirstSections";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import JsonLdScript from "@/components/seo/JsonLd";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

export const metadata: Metadata = {
  title: {
    absolute: `${DIVLAB_BRAND_NAME} | Börsnyheter, utbildning och investerarverktyg`,
  },
  description:
    "DivLab är en svensk plattform för börsnyheter, utbildning, investerarverktyg och diskussioner om marknaden och långsiktigt sparande.",
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
  openGraph: {
    title: `${DIVLAB_BRAND_NAME} | Börsnyheter, utbildning och investerarverktyg`,
    description:
      "Svensk plattform för börsnyheter, utbildning, investerarverktyg och långsiktigt sparande.",
    url: getCanonicalUrl("/"),
    type: "website",
    locale: "sv_SE",
    siteName: DIVLAB_BRAND_NAME,
  },
};

export default function Home() {
  return (
    <MarketingPageShell>
      <JsonLdScript data={[websiteJsonLd(), organizationJsonLd()]} />
      <FinanceFirstHero />
      <FinanceFirstFeatureGrid />
      <FinanceFirstSections />
    </MarketingPageShell>
  );
}
