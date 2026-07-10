import type { NewsArticle } from "@/types/news";
import { getNewsCategoryLabel } from "@/lib/news/categories";
import { formatNewsPublishedAt } from "@/lib/news/format";

type Props = {
  article: NewsArticle;
};

export default function NewsFeaturedStory({ article }: Props) {
  return (
    <section
      aria-labelledby={`news-featured-${article.id}`}
      className="border-b divlab-border-neutral pb-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border divlab-border-neutral px-2 py-0.5 text-[11px] font-medium text-divlab-text-muted">
          {getNewsCategoryLabel(article.category)}
        </span>
        <span className="text-[11px] text-divlab-text-subtle">Utvald artikel</span>
      </div>

      <h2
        id={`news-featured-${article.id}`}
        className="mt-3 text-lg font-semibold leading-snug tracking-[-0.02em] text-divlab-text sm:text-xl"
      >
        {article.title}
      </h2>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-divlab-text-secondary">
        {article.summary}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-divlab-text-muted">
        <span>{article.source}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={article.publishedAt}>
          {formatNewsPublishedAt(article.publishedAt)}
        </time>
      </div>

      <div className="mt-4">
        {article.url ? (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="divlab-btn-ghost inline-flex px-3 py-1.5 text-xs"
          >
            Läs mer
          </a>
        ) : (
          <span className="text-xs text-divlab-text-muted">
            Extern länk kommer snart
          </span>
        )}
      </div>
    </section>
  );
}
