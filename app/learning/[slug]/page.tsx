import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LearningArticleComments from "@/components/learning/LearningArticleComments";
import LearningPageShell from "@/components/learning/LearningPageShell";
import LearningArticleView, {
  getLearningArticleOrThrow,
} from "@/components/learning/LearningArticleView";
import { getLearningArticle, learningArticles } from "@/data/learning-articles";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getProfileForUser } from "@/lib/profiles/profile";

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearningArticle(slug);

  if (!article) {
    return {};
  }

  const pageTitle = article.seoTitle ?? article.title;

  return {
    title: `${pageTitle} | Dividend Lab`,
    description: article.description,
    openGraph: {
      title: pageTitle,
      description: article.description,
      type: "article",
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
    },
  };
}

export default async function LearningArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getLearningArticleOrThrow(slug);

  if (!article) {
    notFound();
  }

  const user = await getAuthenticatedUser();
  const profile = user ? await getProfileForUser(user.id) : null;

  return (
    <LearningPageShell>
      <div className="space-y-6">
        <LearningArticleView article={article} />
        <LearningArticleComments
          articleSlug={article.slug}
          user={user}
          profile={profile}
        />
      </div>
    </LearningPageShell>
  );
}
