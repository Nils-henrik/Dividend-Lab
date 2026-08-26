import type { Metadata } from "next";
import LearningPageShell from "@/components/learning/LearningPageShell";
import LearningArticleList, {
  LEARNING_ARTICLES_PER_PAGE,
} from "@/components/learning/LearningArticleList";
import { learningArticles } from "@/data/learning-articles";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

type LearningPageProps = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

function resolvePage(value: string | string[] | undefined): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const requestedPage = Number.parseInt(rawValue ?? "1", 10);
  const totalPages = Math.max(
    1,
    Math.ceil(learningArticles.length / LEARNING_ARTICLES_PER_PAGE),
  );

  if (!Number.isFinite(requestedPage) || requestedPage < 1) {
    return 1;
  }

  return Math.min(requestedPage, totalPages);
}

export async function generateMetadata({
  searchParams,
}: LearningPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = resolvePage(params.page);
  const isFirstPage = page === 1;
  const pageSuffix = isFirstPage ? "" : ` – sida ${page}`;
  const canonicalPath = isFirstPage ? "/learning" : `/learning?page=${page}`;
  const description =
    "Lär dig aktier, indexfonder, ETF:er, ISK, ränta på ränta, barnsparande, pension och FIRE. Svenska guider om börsen och privatekonomi utan köpråd.";

  return {
    title: `Utbildning om aktier, fonder och privatekonomi${pageSuffix}`,
    description,
    alternates: {
      canonical: getCanonicalUrl(canonicalPath),
    },
    openGraph: {
      title: `Utbildning${pageSuffix} | ${DIVLAB_BRAND_NAME}`,
      description,
      url: getCanonicalUrl(canonicalPath),
      type: "website",
      locale: "sv_SE",
    },
  };
}

export default async function LearningPage({ searchParams }: LearningPageProps) {
  const params = await searchParams;
  const page = resolvePage(params.page);

  return (
    <LearningPageShell>
      <LearningArticleList currentPage={page} />
    </LearningPageShell>
  );
}
