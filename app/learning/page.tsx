import type { Metadata } from "next";
import LearningPageShell from "@/components/learning/LearningPageShell";
import LearningArticleList from "@/components/learning/LearningArticleList";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

export const metadata: Metadata = {
  title: `Utbildning om aktier, fonder och privatekonomi | ${DIVLAB_BRAND_NAME}`,
  description:
    "Guider om aktier, fonder, privatekonomi, pension, FIRE, konton och skatt samt långsiktigt sparande — sakligt och utan köpråd.",
  alternates: {
    canonical: getCanonicalUrl("/learning"),
  },
  openGraph: {
    title: `Utbildning | ${DIVLAB_BRAND_NAME}`,
    description:
      "Guider om aktier, fonder, privatekonomi, pension och FIRE för svenska sparare.",
    url: getCanonicalUrl("/learning"),
    type: "website",
    locale: "sv_SE",
  },
};

export default function LearningPage() {
  return (
    <LearningPageShell>
      <LearningArticleList />
    </LearningPageShell>
  );
}
