import type { NewsArticle } from "@/types/news";
import { getNewsCategoryLabel } from "@/lib/news/categories";
import { formatNewsPublishedAt } from "@/lib/news/format";
import NewsArticleThumbnail from "./NewsArticleThumbnail";

type Props = {
  article: NewsArticle;
};

export default function NewsArticleRow({ article }: Props) {
  return (
    <article className="border-b divlab-border-neutral py-4 last:border-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {article.imageUrl && (
          <NewsArticleThumbnail imageUrl={article.imageUrl} variant="row" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border divlab-border-neutral px-2 py-0.5 text-[11px] font-medium text-divlab-text-muted">
              {getNewsCategoryLabel(article.category)}
            </span>
          </div>

          <h3 className="mt-2 text-[15px] font-medium leading-snug text-divlab-text">
            {article.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-divlab-text-secondary">
            {article.summary}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-divlab-text-muted">
              <span>{article.source}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={article.publishedAt}>
                {formatNewsPublishedAt(article.publishedAt)}
              </time>
            </div>

            {article.url ? (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="divlab-btn-ghost shrink-0 px-2.5 py-1 text-[11px]"
              >
                Läs mer
              </a>
            ) : (
              <span className="shrink-0 text-[11px] text-divlab-text-subtle">
                Extern länk kommer snart
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
