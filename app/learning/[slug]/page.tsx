import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import LearningArticleView, {
  getLearningArticleOrThrow,
} from "@/components/learning/LearningArticleView";
import { learningArticles } from "@/data/learning-articles";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return learningArticles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function LearningArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getLearningArticleOrThrow(slug);

  if (!article) {
    notFound();
  }

  return (
    <AppShell>
      <LearningArticleView article={article} />
    </AppShell>
  );
}
