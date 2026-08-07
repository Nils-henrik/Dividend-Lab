import Link from "next/link";
import NewsArticleThumbnail from "@/components/news/NewsArticleThumbnail";
import { getNewsCategoryLabel } from "@/lib/news/categories";
import { formatNewsPublishedAt } from "@/lib/news/format";
import {
  getNewsArticleHref,
  getNewsArticles,
  isInternalNewsArticleHref,
} from "@/lib/news/get-articles";
import { sortNewsArticlesByPublishedAt } from "@/lib/news/list";

export default function DashboardNewsFocus() {
  const [article] = sortNewsArticlesByPublishedAt(getNewsArticles());

  if (!article) {
    return null;
  }

  const href = getNewsArticleHref(article);
  const imageUrl = article.thumbnailImageUrl ?? article.imageUrl;

  return (
    <section className="divlab-card overflow-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="divlab-section-label">I fokus</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-divlab-text">
            Senaste från DivLab
          </h2>
        </div>
        <Link
          href="/news"
          className="shrink-0 text-xs font-medium text-divlab-text-muted transition hover:text-divlab-blue-muted"
        >
          Alla nyheter →
        </Link>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[288px_minmax(0,1fr)] md:items-start">
        {imageUrl ? (
          <NewsArticleThumbnail
            imageUrl={imageUrl}
            variant="featured"
            objectPosition={article.thumbnailObjectPosition ?? "center 40%"}
            mobileObjectPosition={article.mobileThumbnailObjectPosition}
          />
        ) : null}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-divlab-text-muted">
            <span>{getNewsCategoryLabel(article.category)}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt}>
              {formatNewsPublishedAt(article.publishedAt)}
            </time>
            {article.readingMinutes ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{article.readingMinutes} min läsning</span>
              </>
            ) : null}
          </div>

          <h3 className="mt-3 text-xl font-semibold leading-snug tracking-[-0.025em] text-divlab-text sm:text-2xl">
            {href && isInternalNewsArticleHref(href) ? (
              <Link
                href={href}
                className="transition hover:text-divlab-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
              >
                {article.title}
              </Link>
            ) : (
              article.title
            )}
          </h3>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-divlab-text-secondary">
            {article.summary}
          </p>

          {href ? (
            isInternalNewsArticleHref(href) ? (
              <Link
                href={href}
                className="mt-4 inline-flex text-sm font-medium text-divlab-blue-muted transition hover:text-divlab-blue"
              >
                Läs artikeln →
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex text-sm font-medium text-divlab-blue-muted transition hover:text-divlab-blue"
              >
                Läs artikeln →
              </a>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}
