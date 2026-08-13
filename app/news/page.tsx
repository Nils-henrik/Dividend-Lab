import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PublicContentShell from "@/components/layout/PublicContentShell";
import NewsPageContent from "@/components/news/NewsPageContent";
import { getContentReaderCounts } from "@/lib/content-readers/server";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { getNewsArticles } from "@/lib/news/get-articles";
import {
  buildNewsListHref,
  getNewsListPage,
  parseNewsCategoryParam,
  parseNewsPageParam,
} from "@/lib/news/list";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

type Props = {
  searchParams: Promise<{
    page?: string | string[];
    category?: string | string[];
  }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const category = parseNewsCategoryParam(resolvedSearchParams.category);
  const requestedPage = parseNewsPageParam(resolvedSearchParams.page);
  const listing = getNewsListPage(getNewsArticles(), {
    category,
    page: requestedPage,
  });
  const page = listing.page;
  const canonicalPath = buildNewsListHref({ category, page });
  const title =
    page > 1
      ? `Börsnyheter – sida ${page} | ${DIVLAB_BRAND_NAME}`
      : `Börsnyheter | ${DIVLAB_BRAND_NAME}`;

  return {
    title: {
      absolute: title,
    },
    description:
      "Följ aktuella händelser från börsen och finansmarknaden i DivLab. Svenska börsnyheter för allmän information.",
    alternates: {
      canonical: getCanonicalUrl(canonicalPath),
    },
    openGraph: {
      title,
      description:
        "Följ aktuella händelser från börsen och finansmarknaden i DivLab.",
      url: getCanonicalUrl(canonicalPath),
      type: "website",
      locale: "sv_SE",
    },
  };
}

export default async function NewsPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const category = parseNewsCategoryParam(resolvedSearchParams.category);
  const requestedPage = parseNewsPageParam(resolvedSearchParams.page);
  const listing = getNewsListPage(getNewsArticles(), {
    category,
    page: requestedPage,
  });

  if (requestedPage !== listing.page) {
    redirect(buildNewsListHref({ category, page: listing.page }));
  }

  const visibleSlugs = [listing.featuredArticle, ...listing.rowArticles]
    .map((article) => article?.slug)
    .filter((slug): slug is string => Boolean(slug));
  const readerCounts = await getContentReaderCounts("news", visibleSlugs);

  return (
    <PublicContentShell>
      <NewsPageContent
        category={listing.category}
        page={listing.page}
        totalCount={listing.totalCount}
        totalPages={listing.totalPages}
        featuredArticle={listing.featuredArticle}
        rowArticles={listing.rowArticles}
        readerCounts={readerCounts}
      />
    </PublicContentShell>
  );
}
