import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import NewsArticleView from "@/components/news/NewsArticleView";
import {
  getNewsArticleBySlug,
  getNewsArticlesWithSlug,
} from "@/lib/news/get-articles";
import { getSiteUrlFromEnv } from "@/lib/auth/site-url";
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

  const siteUrl = getSiteUrlFromEnv();
  const pageTitle = article.seoTitle ?? article.title;
  const description = article.seoDescription ?? article.summary;
  const canonical = `${siteUrl}/news/${article.slug}`;
  const imageUrl = article.imageUrl
    ? article.imageUrl.startsWith("http")
      ? article.imageUrl
      : `${siteUrl}${article.imageUrl}`
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
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);

  if (!article || !article.slug) {
    notFound();
  }

  return (
    <AppShell allowGuest>
      <NewsArticleView article={article} />
    </AppShell>
  );
}
