import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { NewsArticle } from "@/types/news";
import { getNewsCategoryLabel } from "@/lib/news/categories";
import { newsDisclaimer } from "@/lib/news/disclaimer";
import { formatNewsPublishedAt } from "@/lib/news/format";

type Props = {
  article: NewsArticle;
};

function MetadataIcon({ children }: { children: ReactNode }) {
  return (
    <span className="text-divlab-text-subtle" aria-hidden="true">
      {children}
    </span>
  );
}

function NewsArticleBreadcrumb({ category }: { category: NewsArticle["category"] }) {
  return (
    <nav aria-label="Brödsmulor">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        <li>
          <Link
            href="/news"
            className="divlab-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
          >
            Börsnyheter
          </Link>
        </li>
        <li aria-hidden="true" className="text-divlab-text-subtle">
          ›
        </li>
        <li aria-current="page" className="text-divlab-text-muted">
          {getNewsCategoryLabel(category)}
        </li>
      </ol>
    </nav>
  );
}

export default function NewsArticleView({ article }: Props) {
  const introParagraphs = article.intro ?? [];
  const sections = article.sections ?? [];
  const sources = article.sources ?? [];
  const showDisclaimer = article.showDisclaimer ?? false;

  return (
    <article className="mx-auto w-full max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
      <NewsArticleBreadcrumb category={article.category} />

      {article.imageUrl && article.imageAlt && (
        <figure className="space-y-2">
          <div className="overflow-hidden rounded-xl border divlab-border-neutral bg-divlab-surface">
            <Image
              src={article.imageUrl}
              alt={article.imageAlt}
              width={1600}
              height={900}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-auto w-full object-cover"
            />
          </div>
          {article.imageCaption && (
            <figcaption className="text-sm text-divlab-text-muted">
              {article.imageCaption}
            </figcaption>
          )}
        </figure>
      )}

      <header className="space-y-4">
        <p className="divlab-section-label text-divlab-blue-muted">
          {getNewsCategoryLabel(article.category)}
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-4xl sm:leading-[1.12]">
          {article.title}
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-divlab-text-secondary">
          {article.summary}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-divlab-text-muted">
          {article.readingMinutes != null && (
            <span className="inline-flex items-center gap-2">
              <MetadataIcon>
                <svg
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="8" cy="8" r="6.25" />
                  <path d="M8 4.5V8l2.25 2.25" strokeLinecap="round" />
                </svg>
              </MetadataIcon>
              {article.readingMinutes} min läsning
            </span>
          )}
          <span aria-hidden="true" className="text-divlab-text-subtle">
            ·
          </span>
          <time dateTime={article.publishedAt} className="inline-flex items-center gap-2">
            <MetadataIcon>
              <svg
                viewBox="0 0 16 16"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 2.75h10v11.5H3z" strokeLinejoin="round" />
                <path
                  d="M3 5.75h10M5.5 1.5v2.5M10.5 1.5v2.5"
                  strokeLinecap="round"
                />
              </svg>
            </MetadataIcon>
            {formatNewsPublishedAt(article.publishedAt)}
          </time>
          <span aria-hidden="true" className="text-divlab-text-subtle">
            ·
          </span>
          <span>{article.source}</span>
        </div>
      </header>

      <div className="space-y-10">
        {introParagraphs.length > 0 && (
          <div className="space-y-4">
            {introParagraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-base leading-7 text-divlab-text-secondary"
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {sections.map((section) => (
          <section key={section.heading} className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-divlab-text">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-base leading-7 text-divlab-text-secondary"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        {sources.length > 0 && (
          <section
            aria-labelledby="news-sources"
            className="space-y-4 border-t divlab-border-neutral pt-8"
          >
            <h2
              id="news-sources"
              className="text-2xl font-semibold text-divlab-text"
            >
              Källor
            </h2>
            <ul className="space-y-3">
              {sources.map((source) => (
                <li
                  key={source.href ?? source.text}
                  className="text-base leading-7 text-divlab-text-secondary"
                >
                  {source.href ? (
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="divlab-link underline decoration-divlab-blue/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                    >
                      {source.text}
                    </a>
                  ) : (
                    source.text
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {showDisclaimer && (
          <aside
            aria-label="Ansvarsfriskrivning"
            className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-4 text-sm leading-6 text-divlab-text-muted"
          >
            {newsDisclaimer}
          </aside>
        )}
      </div>
    </article>
  );
}
