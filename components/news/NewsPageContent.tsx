import type { NewsArticle, NewsCategoryFilter as NewsCategoryFilterValue } from "@/types/news";
import NewsArticleRow from "./NewsArticleRow";
import NewsCategoryFilter from "./NewsCategoryFilter";
import NewsEmptyState from "./NewsEmptyState";
import NewsFeaturedStory from "./NewsFeaturedStory";
import NewsPagination from "./NewsPagination";

type Props = {
  category: NewsCategoryFilterValue;
  page: number;
  totalCount: number;
  totalPages: number;
  featuredArticle: NewsArticle | null;
  rowArticles: NewsArticle[];
};

export default function NewsPageContent({
  category,
  page,
  totalCount,
  totalPages,
  featuredArticle,
  rowArticles,
}: Props) {
  const hasArticles = totalCount > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="space-y-4 border-b divlab-border-neutral pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="divlab-section-label text-[10px] tracking-[0.22em]">
              Marknadsinformation
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-divlab-text">
              Börsnyheter
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
              Följ det senaste från marknaden.
            </p>
          </div>

          <p
            className="inline-flex w-fit shrink-0 items-center rounded-full border divlab-border-neutral px-2.5 py-1 text-[10px] font-medium text-divlab-text-muted"
            role="status"
          >
            Förhandsvisning med exempelartiklar
          </p>
        </div>

        <NewsCategoryFilter value={category} />
      </header>

      {!hasArticles ? (
        <NewsEmptyState />
      ) : (
        <div className="space-y-6">
          {featuredArticle && (
            <div className="mb-2">
              <NewsFeaturedStory article={featuredArticle} />
            </div>
          )}

          {rowArticles.length > 0 && (
            <section aria-label="Senaste nyheter">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
                  Senaste nyheter
                </h2>
                <span className="text-xs text-divlab-text-subtle tabular-nums">
                  {totalCount} artikel
                  {totalCount === 1 ? "" : "r"}
                </span>
              </div>

              <div>
                {rowArticles.map((article) => (
                  <NewsArticleRow key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}

          <NewsPagination
            category={category}
            page={page}
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
}
