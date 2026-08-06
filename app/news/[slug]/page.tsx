import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicContentShell from "@/components/layout/PublicContentShell";
import NewsArticleView from "@/components/news/NewsArticleView";
import JsonLdScript from "@/components/seo/JsonLd";
import {
  getNewsArticleBySlug,
  getNewsArticlesWithSlug,
} from "@/lib/news/get-articles";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import {
  breadcrumbJsonLd,
  newsArticleJsonLd,
} from "@/lib/seo/json-ld";
import { getNewsCategoryLabel } from "@/lib/news/categories";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getNewsArticlesWithSlug().map((article) => ({
    slug: article.slug as string,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);

  if (!article) {
    return {};
  }

  const pageTitle = article.seoTitle ?? article.title;
  const description = article.seoDescription ?? article.summary;
  const canonical = getCanonicalUrl(`/news/${article.slug}`);
  const imageUrl = article.imageUrl
    ? article.imageUrl.startsWith("http")
      ? article.imageUrl
      : getCanonicalUrl(article.imageUrl)
    : undefined;

  return {
    title: `${pageTitle} | ${DIVLAB_BRAND_NAME}`,
    description,
    ...(article.seoKeywords ? { keywords: article.seoKeywords } : {}),
    alternates: {
      canonical,
    },
    openGraph: {
      title: pageTitle,
      description,
      type: "article",
      url: canonical,
      locale: "sv_SE",
      publishedTime: article.publishedAt,
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                alt: article.imageAlt ?? article.title,
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
            description,
            images: [imageUrl],
          },
        }
      : {}),
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);

  if (!article || !article.slug) {
    notFound();
  }

  const path = `/news/${article.slug}`;

  return (
    <PublicContentShell>
      <JsonLdScript
        data={[
          newsArticleJsonLd({
            title: article.title,
            description: article.summary,
            path,
            publishedAt: article.publishedAt,
            imageUrl: article.imageUrl ?? undefined,
            authorName: article.source,
          }),
          breadcrumbJsonLd([
            { name: "Hem", path: "/" },
            { name: "Börsnyheter", path: "/news" },
            {
              name: getNewsCategoryLabel(article.category),
              path: `/news?category=${article.category}`,
            },
            { name: article.title, path },
          ]),
        ]}
      />
      <NewsArticleView article={article} />
    </PublicContentShell>
  );
}
