import Link from "next/link";
import type { LearningArticleWithReadingTime } from "@/data/learning-articles";
import LearningArticleThumbnail from "@/components/learning/LearningArticleThumbnail";

type Props = {
  article: LearningArticleWithReadingTime;
};

export default function LearningArticleRow({ article }: Props) {
  const listImageUrl = article.thumbnailImageUrl ?? article.coverImage;

  return (
    <article className="border-b divlab-border-neutral last:border-0">
      <Link
        href={`/learning/${article.slug}`}
        className="group block cursor-pointer rounded-xl px-2 py-5 transition-colors hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
          {listImageUrl && (
            <div className="shrink-0 [&>div]:transition-colors [&>div]:group-hover:border-divlab-border-strong">
              <LearningArticleThumbnail
                imageUrl={listImageUrl}
                objectPosition={article.thumbnailObjectPosition}
              />
            </div>
          )}

          <div className="min-w-0 flex-1 md:flex md:min-h-[180px] md:flex-col md:py-1">
            <h3 className="text-lg font-medium leading-snug text-divlab-text transition-colors group-hover:text-white">
              {article.title}
            </h3>

            <p className="mt-2.5 line-clamp-3 text-[15px] leading-7 text-divlab-text-secondary">
              {article.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 md:mt-auto">
              <p className="text-xs text-divlab-text-muted">
                {article.readingMinutes} min läsning
              </p>

              <span className="divlab-btn-ghost shrink-0 px-3 py-1.5 text-xs">
                Läs artikel
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
