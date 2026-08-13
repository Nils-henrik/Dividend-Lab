import type { NewsArticle, NewsCategoryFilter as NewsCategoryFilterValue } from "@/types/news";
import type { ContentReaderCountMap } from "@/lib/content-readers/types";
import { formatArticleCountLabel } from "@/lib/i18n/swedish-counts";
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
  readerCounts?: ContentReaderCountMap;
};

export default function NewsPageContent({
  category,
  page,
  totalCount,
  totalPages,
  featuredArticle,
  rowArticles,
  readerCounts = {},
}: Props) {
  const hasArticles = totalCount > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 lg:px-0 lg:py-0">
      <header className="space-y-4 border-b divlab-border-neutral pb-5">
        <div>
          <p className="divlab-section-label text-[10px] tracking-[0.22em]">
            Marknadsinformation
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-divlab-text">
            Börsnyheter
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
            Aktuella händelser från börsen och finansmarknaden — för
            allmän information, inte personlig rådgivning.
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
              <NewsFeaturedStory
                article={featuredArticle}
                uniqueReaders={
                  featuredArticle.slug ? readerCounts[featuredArticle.slug] ?? 0 : 0
                }
              />
            </div>
          )}

          {rowArticles.length > 0 && (
            <section aria-label="Senaste nyheter">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
                  Senaste nyheter
                </h2>
                <span className="text-xs text-divlab-text-subtle tabular-nums">
                  {formatArticleCountLabel(totalCount)}
                </span>
              </div>

              <div>
                {rowArticles.map((article) => (
                  <NewsArticleRow
                    key={article.id}
                    article={article}
                    uniqueReaders={
                      article.slug ? readerCounts[article.slug] ?? 0 : 0
                    }
                  />
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
