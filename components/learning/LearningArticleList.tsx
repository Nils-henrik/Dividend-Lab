import Link from "next/link";
import { learningArticles } from "@/data/learning-articles";
import LearningArticleRow from "@/components/learning/LearningArticleRow";

export const LEARNING_ARTICLES_PER_PAGE = 8;

type Props = {
  currentPage?: number;
};

function pageHref(page: number): string {
  return page <= 1 ? "/learning" : `/learning?page=${page}`;
}

export default function LearningArticleList({ currentPage = 1 }: Props) {
  const totalPages = Math.max(
    1,
    Math.ceil(learningArticles.length / LEARNING_ARTICLES_PER_PAGE),
  );
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * LEARNING_ARTICLES_PER_PAGE;
  const visibleArticles = learningArticles.slice(
    startIndex,
    startIndex + LEARNING_ARTICLES_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <section className="divlab-hero">
        <p className="mb-3 divlab-section-label">Utbildning</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text">
          Guider om aktier, fonder och privatekonomi
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-divlab-text-secondary">
          Sakliga guider om aktier, fonder, privatekonomi, pension, FIRE,
          konton och skatt samt långsiktigt sparande — utan köpråd.
        </p>
      </section>

      <div>
        {visibleArticles.map((article) => (
          <LearningArticleRow key={article.slug} article={article} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Sidnavigering för utbildningsartiklar"
          className="flex flex-wrap items-center justify-between gap-4 border-t divlab-border-neutral pt-6"
        >
          {safePage > 1 ? (
            <Link
              href={pageHref(safePage - 1)}
              className="divlab-btn-ghost px-4 py-2 text-sm"
            >
              Föregående
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm text-divlab-text-muted opacity-50">
              Föregående
            </span>
          )}

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const isCurrent = page === safePage;

              return (
                <Link
                  key={page}
                  href={pageHref(page)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={
                    isCurrent
                      ? "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-divlab-blue px-3 text-sm font-semibold text-white"
                      : "divlab-btn-ghost inline-flex min-h-10 min-w-10 items-center justify-center px-3 text-sm"
                  }
                >
                  {page}
                </Link>
              );
            })}
          </div>

          {safePage < totalPages ? (
            <Link
              href={pageHref(safePage + 1)}
              className="divlab-btn-ghost px-4 py-2 text-sm"
            >
              Nästa
            </Link>
          ) : (
            <span className="px-4 py-2 text-sm text-divlab-text-muted opacity-50">
              Nästa
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
