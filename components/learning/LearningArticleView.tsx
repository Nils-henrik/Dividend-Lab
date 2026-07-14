import Link from "next/link";
import type { ReactNode } from "react";
import {
  getLearningArticle,
  getRelatedLearningArticles,
  learningDisclaimer,
  type LearningArticleWithReadingTime,
} from "@/data/learning-articles";
import LearningArticleEditorialCover from "@/components/learning/LearningArticleEditorialCover";
import {
  LearningArticleSectionContent,
  LearningArticleSubsectionContent,
} from "@/components/learning/LearningArticleSectionContent";
import { formatLearningArticleDate } from "@/data/learning/dates";

type Props = {
  article: LearningArticleWithReadingTime;
};

function getIntroParagraphs(intro: string | string[]) {
  return Array.isArray(intro) ? intro : [intro];
}

function TakeawayCheckIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-divlab-blue/30 bg-divlab-blue/10 text-divlab-blue">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function MetadataIcon({ children }: { children: ReactNode }) {
  return (
    <span className="text-divlab-text-subtle" aria-hidden="true">
      {children}
    </span>
  );
}

function LearningArticleBreadcrumb({ category }: { category?: string }) {
  return (
    <nav aria-label="Brödsmulor">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        <li>
          <Link
            href="/learning"
            className="divlab-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
          >
            Utbildning
          </Link>
        </li>
        {category && (
          <>
            <li aria-hidden="true" className="text-divlab-text-subtle">
              ›
            </li>
            <li aria-current="page" className="text-divlab-text-muted">
              {category}
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}

function LearningArticleKeyTakeaways({ items }: { items: string[] }) {
  return (
    <section
      aria-labelledby="learning-key-takeaways"
      className="divlab-elevated-panel p-6 md:p-8"
    >
      <h2
        id="learning-key-takeaways"
        className="text-xl font-semibold text-divlab-text"
      >
        Det viktigaste i korthet
      </h2>
      <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {items.map((takeaway) => (
          <li
            key={takeaway}
            className="flex gap-3 text-base leading-7 text-divlab-text-secondary"
          >
            <TakeawayCheckIcon />
            <span>{takeaway}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LearningArticleRelatedAside({
  articles,
  className = "",
}: {
  articles: LearningArticleWithReadingTime[];
  className?: string;
}) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <aside aria-labelledby="learning-related-topics" className={className}>
      <div className="rounded-2xl border divlab-border-neutral bg-divlab-elevated/40 p-5">
        <h2
          id="learning-related-topics"
          className="text-sm font-semibold uppercase tracking-[0.12em] text-divlab-text-muted"
        >
          Relaterade ämnen
        </h2>
        <ul className="mt-4 divide-y divide-white/[0.06]">
          {articles.map((related) => (
            <li key={related.slug}>
              <Link
                href={`/learning/${related.slug}`}
                className="block py-3 text-sm leading-6 text-divlab-text-secondary underline decoration-divlab-blue/30 underline-offset-4 transition hover:text-divlab-text hover:decoration-divlab-blue/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
              >
                {related.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default function LearningArticleView({ article }: Props) {
  const introParagraphs = getIntroParagraphs(article.intro);
  const showDefaultDisclaimer = article.showDefaultDisclaimer ?? true;
  const formattedUpdatedAt = article.updatedAt
    ? formatLearningArticleDate(article.updatedAt)
    : null;
  const relatedArticles = getRelatedLearningArticles(
    article.slug,
    article.relatedArticleSlugs,
  );

  return (
    <article className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
      <LearningArticleBreadcrumb category={article.category} />

      {article.coverImage && article.coverImageAlt && (
        <LearningArticleEditorialCover
          src={article.coverImage}
          alt={article.coverImageAlt}
          priority
        />
      )}

      <header className="max-w-4xl space-y-5">
        {article.category && (
          <p className="divlab-section-label text-divlab-blue-muted">
            {article.category}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-4xl lg:text-5xl lg:leading-[1.08]">
          {article.title}
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-divlab-text-secondary">
          {article.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-divlab-text-muted">
          <span className="inline-flex items-center gap-2">
            <MetadataIcon>
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6.25" />
                <path d="M8 4.5V8l2.25 2.25" strokeLinecap="round" />
              </svg>
            </MetadataIcon>
            {article.readingMinutes} min läsning
          </span>
          {formattedUpdatedAt && (
            <>
              <span aria-hidden="true" className="text-divlab-text-subtle">
                ·
              </span>
              <span className="inline-flex items-center gap-2">
                <MetadataIcon>
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 2.75h10v11.5H3z" strokeLinejoin="round" />
                    <path d="M3 5.75h10M5.5 1.5v2.5M10.5 1.5v2.5" strokeLinecap="round" />
                  </svg>
                </MetadataIcon>
                Uppdaterad: {formattedUpdatedAt}
              </span>
            </>
          )}
        </div>
      </header>

      {article.takeaways.length > 0 && (
        <LearningArticleKeyTakeaways items={article.takeaways} />
      )}

      <div className="grid gap-10 xl:grid-cols-[minmax(0,48rem)_280px] xl:items-start xl:justify-center">
        <div className="min-w-0 max-w-3xl space-y-10 xl:max-w-none">
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

          {article.sections.map((section, index) => (
            <section
              key={`${section.heading ?? "section"}-${index}`}
              className="space-y-4"
            >
              {section.heading && (
                <h2 className="text-2xl font-semibold tracking-[-0.02em] text-divlab-text">
                  {section.heading}
                </h2>
              )}

              <LearningArticleSectionContent
                intro={section.intro}
                paragraphs={section.paragraphs}
                bullets={section.bullets}
                numberedItems={section.numberedItems}
                paragraphsAfterLists={section.paragraphsAfterLists}
              />

              {section.subsections?.map((subsection) => (
                <LearningArticleSubsectionContent
                  key={subsection.subheading}
                  subheading={subsection.subheading}
                  paragraphs={subsection.paragraphs}
                  bullets={subsection.bullets}
                  numberedItems={subsection.numberedItems}
                  paragraphsAfterLists={subsection.paragraphsAfterLists}
                />
              ))}

              {section.callout && (
                <blockquote className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-4 text-base leading-7 text-divlab-text-secondary">
                  {section.callout}
                </blockquote>
              )}

              {section.calculation && (
                <div className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-4">
                  <p className="divlab-section-label tracking-[0.16em]">
                    {section.calculation.title}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {section.calculation.lines.map((line) => (
                      <li
                        key={line}
                        className="font-mono text-sm leading-6 text-divlab-text-secondary"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.relatedLinks?.map((link) => (
                <p
                  key={link.slug}
                  className="text-base leading-7 text-divlab-text-secondary"
                >
                  <Link
                    href={`/learning/${link.slug}`}
                    className="divlab-link font-medium underline decoration-divlab-blue/30 underline-offset-4"
                  >
                    {link.text}
                  </Link>
                </p>
              ))}

              {section.externalLinks?.map((link) => (
                <p
                  key={link.href}
                  className="text-base leading-7 text-divlab-text-secondary"
                >
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="divlab-link font-medium underline decoration-divlab-blue/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                  >
                    {link.text}
                  </a>
                </p>
              ))}
            </section>
          ))}

          {article.sources && article.sources.length > 0 && (
            <section
              aria-labelledby="learning-sources"
              className="space-y-4 border-t divlab-border-neutral pt-8"
            >
              <h2
                id="learning-sources"
                className="text-2xl font-semibold text-divlab-text"
              >
                Källor
              </h2>
              <ul className="space-y-3">
                {article.sources.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="divlab-link text-base leading-7 underline decoration-divlab-blue/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                    >
                      {source.text}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showDefaultDisclaimer && (
            <div className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-4">
              <p className="text-sm leading-6 text-divlab-text-muted">
                {learningDisclaimer}
              </p>
            </div>
          )}

          <LearningArticleRelatedAside
            articles={relatedArticles}
            className="xl:hidden"
          />
        </div>

        <LearningArticleRelatedAside
          articles={relatedArticles}
          className="hidden xl:block"
        />
      </div>
    </article>
  );
}

export function getLearningArticleOrThrow(slug: string) {
  return getLearningArticle(slug);
}
