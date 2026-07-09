import type { Metadata } from "next";
import LearningPageShell from "@/components/learning/LearningPageShell";
import LearningArticleList from "@/components/learning/LearningArticleList";

export const metadata: Metadata = {
  title: "Utbildning om utdelning och FIRE | Dividend Lab",
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
