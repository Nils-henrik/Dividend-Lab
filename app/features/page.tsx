import type { Metadata } from "next";
import FeaturesPageContent from "@/components/marketing/FeaturesPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

export const metadata: Metadata = {
  title: "Funktioner",
  description:
    "Utforska DivLabs tillgängliga funktioner: Börsnyheter, utbildning, Frihetsmaskinen, forum, meddelanden och mer — samt vad som är under utveckling.",
  alternates: {
    canonical: getCanonicalUrl("/features"),
  },
  openGraph: {
    title: `Funktioner | ${DIVLAB_BRAND_NAME}`,
    description:
      "Se vad DivLab erbjuder idag och vad som är under utveckling.",
    url: getCanonicalUrl("/features"),
    type: "website",
    locale: "sv_SE",
  },
};

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <FeaturesPageContent />
    </MarketingPageShell>
  );
}
