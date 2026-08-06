import type { Metadata } from "next";
import Hero from "@/components/marketing/Hero";
import HomePageSections from "@/components/marketing/HomePageSections";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import JsonLdScript from "@/components/seo/JsonLd";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

export const metadata: Metadata = {
  title: {
    absolute: `${DIVLAB_BRAND_NAME} | Börsnyheter, utbildning och ekonomisk frihet`,
  },
  description:
    "DivLab är den svenska plattformen för börsnyheter, utbildning, Frihetsmaskinen och community kring långsiktigt sparande. Läs öppet innehåll eller skapa konto.",
  alternates: {
    canonical: getCanonicalUrl("/"),
  },
  openGraph: {
    title: `${DIVLAB_BRAND_NAME} | Börsnyheter, utbildning och ekonomisk frihet`,
    description:
      "Svensk plattform för börsnyheter, utbildning, Frihetsmaskinen och community.",
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
      <HomePageSections />
    </MarketingPageShell>
  );
}
