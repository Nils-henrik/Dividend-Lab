import type { Metadata } from "next";
import Hero from "@/components/marketing/Hero";
import HomeFeatureGrid from "@/components/marketing/HomeFeatureGrid";
import HomePageSections from "@/components/marketing/HomePageSections";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import JsonLdScript from "@/components/seo/JsonLd";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

export const metadata: Metadata = {
  title: {
    absolute: `${DIVLAB_BRAND_NAME} | Börsnyheter, AI-portföljer och ekonomisk frihet`,
  },
  description:
    "DivLab är den svenska plattformen för börsnyheter, AI-portföljer, utbildning, investerarverktyg och community. Utforska öppet innehåll eller skapa ett gratis konto.",
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
  openGraph: {
    title: `${DIVLAB_BRAND_NAME} | Börsnyheter, AI-portföljer och ekonomisk frihet`,
    description:
      "Svensk plattform för börsnyheter, AI-portföljer, utbildning, investerarverktyg och community.",
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
      <Hero />
      <HomeFeatureGrid />
      <HomePageSections />
    </MarketingPageShell>
  );
}
