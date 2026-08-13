import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LearningArticleComments from "@/components/learning/LearningArticleComments";
import LearningPageShell from "@/components/learning/LearningPageShell";
import LearningArticleView, {
  getLearningArticleOrThrow,
} from "@/components/learning/LearningArticleView";
import JsonLdScript from "@/components/seo/JsonLd";
import { getLearningArticle, learningArticles } from "@/data/learning-articles";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getContentReaderCount } from "@/lib/content-readers/server";
import { getProfileForUser } from "@/lib/profiles/profile";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

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
  const canonical = getCanonicalUrl(`/learning/${article.slug}`);
  const imagePath = article.coverImage;
  const imageUrl = imagePath
    ? imagePath.startsWith("http")
      ? imagePath
      : getCanonicalUrl(imagePath)
    : undefined;

  return {
    title: pageTitle,
    description: article.description,
    authors: [{ name: article.authorName ?? "DivLab Redaktion" }],
    alternates: {
      canonical,
    },
    openGraph: {
      title: pageTitle,
      description: article.description,
      type: "article",
      url: canonical,
      locale: "sv_SE",
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                alt: article.coverImageAlt ?? article.title,
              },
            ],
          }
        : {}),
    },
    ...(imageUrl
      ? {
          twitter: {
            card: "summary_large_image",
            title: pageTitle,
            description: article.description,
            images: [imageUrl],
          },
        }
      : {}),
  };
}

export default async function LearningArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getLearningArticleOrThrow(slug);

  if (!article) {
    notFound();
  }

  const [user, uniqueReaders] = await Promise.all([
    getAuthenticatedUser(),
    getContentReaderCount("learning", article.slug),
  ]);
  const profile = user ? await getProfileForUser(user.id) : null;
  const path = `/learning/${article.slug}`;

  return (
    <LearningPageShell>
      <JsonLdScript
        data={[
          articleJsonLd({
            title: article.title,
            description: article.description,
            path,
            publishedAt: article.publishedAt,
            updatedAt: article.updatedAt,
            imageUrl: article.coverImage,
            authorName: article.authorName,
          }),
          breadcrumbJsonLd([
            { name: "Hem", path: "/" },
            { name: "Utbildning", path: "/learning" },
            ...(article.category
              ? [{ name: article.category, path: "/learning" }]
              : []),
            { name: article.title, path },
          ]),
        ]}
      />
      <div className="space-y-6">
        <LearningArticleView
          article={article}
          initialUniqueReaders={uniqueReaders}
        />
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <LearningArticleComments
            articleSlug={article.slug}
            user={user}
            profile={profile}
          />
        </div>
      </div>
    </LearningPageShell>
  );
}
