"use client";

import { useMemo, useState } from "react";
import type { NewsArticle, NewsCategoryFilter as NewsCategoryFilterValue } from "@/types/news";
import NewsArticleRow from "./NewsArticleRow";
import NewsCategoryFilter from "./NewsCategoryFilter";
import NewsEmptyState from "./NewsEmptyState";
import NewsFeaturedStory from "./NewsFeaturedStory";

type Props = {
  articles: NewsArticle[];
};

function sortArticlesByDate(articles: NewsArticle[]) {
  return [...articles].sort(
    (left, right) =>
      new Date(right.publishedAt).getTime() -
      new Date(left.publishedAt).getTime(),
  );
}

export default function NewsPageContent({ articles }: Props) {
  const [category, setCategory] = useState<NewsCategoryFilterValue>("all");

  const filteredArticles = useMemo(() => {
    const scoped =
      category === "all"
        ? articles
        : articles.filter((article) => article.category === category);

    return sortArticlesByDate(scoped);
  }, [articles, category]);

  const leadStory = useMemo(() => {
    if (filteredArticles.length === 0) {
      return null;
    }

    if (category === "all") {
      return (
        filteredArticles.find((article) => article.featured) ??
        filteredArticles[0]
      );
    }

    return filteredArticles[0];
  }, [category, filteredArticles]);

  const feedArticles = useMemo(() => {
    if (!leadStory) {
      return [];
    }

    return filteredArticles.filter((article) => article.id !== leadStory.id);
  }, [filteredArticles, leadStory]);

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

        <NewsCategoryFilter value={category} onChange={setCategory} />
      </header>

      {filteredArticles.length === 0 ? (
        <NewsEmptyState />
      ) : (
        <div className="space-y-6">
          {leadStory && (
            <div className="mb-2">
              <NewsFeaturedStory article={leadStory} />
            </div>
          )}

          {feedArticles.length > 0 && (
            <section aria-label="Senaste nyheter">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
                  Senaste nyheter
                </h2>
                <span className="text-xs text-divlab-text-subtle tabular-nums">
                  {feedArticles.length} artikel
                  {feedArticles.length === 1 ? "" : "r"}
                </span>
              </div>

              <div>
                {feedArticles.map((article) => (
                  <NewsArticleRow key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
