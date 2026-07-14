import type { Metadata } from "next";
import LearningPageShell from "@/components/learning/LearningPageShell";
import LearningArticleList from "@/components/learning/LearningArticleList";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

export const metadata: Metadata = {
  title: `Utbildning om utdelning och FIRE | ${DIVLAB_BRAND_NAME}`,
  description:
    "Saklig, långsiktig utbildning för svenska utdelningsinvesterare — utan köpråd och utan hype.",
};

export default function LearningPage() {
  return (
    <LearningPageShell>
      <LearningArticleList />
    </LearningPageShell>
  );
}
