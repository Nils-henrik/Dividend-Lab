import Link from "next/link";
import type { LearningArticleWithReadingTime } from "@/data/learning-articles";
import NewsArticleThumbnail from "@/components/news/NewsArticleThumbnail";

type Props = {
  article: LearningArticleWithReadingTime;
};

export default function LearningArticleRow({ article }: Props) {
  return (
    <article className="border-b divlab-border-neutral py-4 last:border-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {article.coverImage && (
          <NewsArticleThumbnail imageUrl={article.coverImage} variant="row" />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium leading-snug text-divlab-text">
            {article.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-divlab-text-secondary">
            {article.description}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-divlab-text-muted">
              {article.readingMinutes} min läsning
            </p>

            <Link
              href={`/learning/${article.slug}`}
              className="divlab-btn-ghost shrink-0 px-2.5 py-1 text-[11px]"
            >
              Läs artikel
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
