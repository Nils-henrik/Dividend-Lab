import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  learningArticles,
  type LearningArticleWithReadingTime,
} from "@/data/learning";
import {
  getNewsArticleHref,
  getNewsArticlesWithSlug,
  isInternalNewsArticleHref,
} from "@/lib/news/get-articles";
import { getNewsCategoryLabel } from "@/lib/news/categories";
import { formatNewsPublishedAt } from "@/lib/news/format";
import { sortNewsArticlesByPublishedAt } from "@/lib/news/list";
import {
  getForumThreadsByLatestActivity,
  mapThreadRecordToForumThread,
} from "@/lib/forum/queries";
import type { ForumThread } from "@/types/forum";
import type { NewsArticle } from "@/types/news";

function getLatestLearningArticle(): LearningArticleWithReadingTime | null {
  const sorted = [...learningArticles].sort((left, right) => {
    const leftTime = left.publishedAt
      ? new Date(left.publishedAt).getTime()
      : 0;
    const rightTime = right.publishedAt
      ? new Date(right.publishedAt).getTime()
      : 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return left.slug.localeCompare(right.slug, "sv");
  });

  return sorted[0] ?? null;
}

function getLatestNewsArticle(): NewsArticle | null {
  return sortNewsArticlesByPublishedAt(getNewsArticlesWithSlug())[0] ?? null;
}

async function getLatestPublicForumThread(): Promise<ForumThread | null> {
  try {
    const records = await getForumThreadsByLatestActivity(1);
    const record = records[0];

    if (!record) {
      return null;
    }

    return mapThreadRecordToForumThread(record);
  } catch {
    return null;
  }
}

function ModuleLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
      {children}
    </p>
  );
}

function NewsModule({ article }: { article: NewsArticle | null }) {
  if (!article) {
    return (
      <div className="rounded-lg border divlab-border-neutral bg-white/[0.02] p-4">
        <ModuleLabel>Börsnyheter</ModuleLabel>
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
          Följ aktuella händelser från börsen och finansmarknaden.
        </p>
        <Link
          href="/news"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-divlab-blue transition hover:text-divlab-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
        >
          Till Börsnyheter
        </Link>
      </div>
    );
  }

  const href = getNewsArticleHref(article);
  const listImageUrl = article.thumbnailImageUrl ?? article.imageUrl;
  const categoryLabel = getNewsCategoryLabel(article.category);
  const accessibleName = `Läs Börsnyheter: ${article.title}`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <ModuleLabel>Börsnyheter</ModuleLabel>
        <span className="rounded-md border divlab-border-neutral px-2 py-0.5 text-[10px] font-medium text-divlab-text-muted">
          {categoryLabel}
        </span>
      </div>

      <div className="mt-3 flex gap-3">
        {listImageUrl ? (
          <div className="relative h-[72px] w-[112px] shrink-0 overflow-hidden rounded-lg border divlab-border-neutral bg-divlab-surface sm:h-[80px] sm:w-[128px]">
            <Image
              src={listImageUrl}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.02em] text-divlab-text transition group-hover:text-white">
            {article.title}
          </h3>
          <p className="mt-2 text-xs text-divlab-text-muted">
            <time dateTime={article.publishedAt}>
              {formatNewsPublishedAt(article.publishedAt)}
            </time>
          </p>
        </div>
      </div>
    </>
  );

  if (!href) {
    return (
      <div className="rounded-lg border divlab-border-neutral bg-white/[0.02] p-4">
        {content}
      </div>
    );
  }

  if (isInternalNewsArticleHref(href)) {
    return (
      <Link
        href={href}
        aria-label={accessibleName}
        className="group block rounded-lg border divlab-border-neutral bg-white/[0.02] p-4 transition hover:border-divlab-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibleName}
      className="group block rounded-lg border divlab-border-neutral bg-white/[0.02] p-4 transition hover:border-divlab-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
    >
      {content}
    </a>
  );
}

function LearningModule({
  article,
}: {
  article: LearningArticleWithReadingTime | null;
}) {
  if (!article) {
    return (
      <div className="flex h-full flex-col rounded-lg border divlab-border-neutral bg-white/[0.02] p-3.5">
        <ModuleLabel>Utbildning</ModuleLabel>
        <p className="mt-2 text-sm leading-5 text-divlab-text-secondary">
          Sakliga guider om börsen och investeringar.
        </p>
        <Link
          href="/learning"
          className="mt-auto inline-flex min-h-11 items-center pt-2 text-xs font-medium text-divlab-blue transition hover:text-divlab-blue-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
        >
          Till Utbildning
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={`/learning/${article.slug}`}
      aria-label={`Läs utbildning: ${article.title}`}
      className="group flex h-full min-h-[7.5rem] flex-col rounded-lg border divlab-border-neutral bg-white/[0.02] p-3.5 transition hover:border-divlab-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
    >
      <ModuleLabel>Utbildning</ModuleLabel>
      <h3 className="mt-2 line-clamp-3 text-sm font-medium leading-5 text-divlab-text transition group-hover:text-white">
        {article.title}
      </h3>
      <p className="mt-auto pt-3 text-xs text-divlab-text-muted">
        {article.readingMinutes} min läsning
      </p>
    </Link>
  );
}

function FrihetsmaskinenModule() {
  return (
    <Link
      href="/frihetsmaskinen"
      aria-label="Öppna Frihetsmaskinen"
      className="group flex h-full min-h-[7.5rem] flex-col rounded-lg border divlab-border-neutral bg-white/[0.02] p-3.5 transition hover:border-divlab-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
    >
      <ModuleLabel>Frihetsmaskinen</ModuleLabel>
      <h3 className="mt-2 text-sm font-medium leading-5 text-divlab-text transition group-hover:text-white">
        Räkna på vägen till ekonomisk frihet.
      </h3>
      <div
        className="mt-auto flex items-end gap-1.5 pt-3"
        aria-hidden="true"
      >
        <span className="h-2 w-8 rounded-sm bg-white/[0.08]" />
        <span className="h-3.5 w-10 rounded-sm bg-divlab-blue/35" />
        <span className="h-2.5 w-7 rounded-sm bg-white/[0.08]" />
        <span className="mb-0.5 text-[10px] tabular-nums text-divlab-text-muted">
          %
        </span>
      </div>
    </Link>
  );
}

function ForumModule({ thread }: { thread: ForumThread | null }) {
  if (!thread) {
    return (
      <Link
        href="/forum"
        aria-label="Öppna Forum"
        className="group flex h-full min-h-[7.5rem] flex-col rounded-lg border divlab-border-neutral bg-white/[0.02] p-3.5 transition hover:border-divlab-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
      >
        <ModuleLabel>Forum</ModuleLabel>
        <h3 className="mt-2 text-sm font-medium leading-5 text-divlab-text transition group-hover:text-white">
          Diskutera marknaden med andra sparintresserade.
        </h3>
        <p className="mt-auto pt-3 text-xs text-divlab-text-muted">
          Till Forum
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={`/forum/${thread.slug}`}
      aria-label={`Öppna forumtråd: ${thread.title}`}
      className="group flex h-full min-h-[7.5rem] flex-col rounded-lg border divlab-border-neutral bg-white/[0.02] p-3.5 transition hover:border-divlab-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
    >
      <ModuleLabel>Forum</ModuleLabel>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-divlab-text transition group-hover:text-white">
        {thread.title}
      </h3>
      <p className="mt-auto pt-3 text-xs text-divlab-text-muted">
        {thread.category}
        <span aria-hidden="true"> · </span>
        {thread.replies} svar
      </p>
    </Link>
  );
}

export default async function ProductPreviewPanel() {
  const latestNews = getLatestNewsArticle();
  const latestLearning = getLatestLearningArticle();
  const latestThread = await getLatestPublicForumThread();

  return (
    <section
      aria-labelledby="product-preview-heading"
      className="w-full max-w-[560px]"
    >
      <div className="mb-5">
        <h2
          id="product-preview-heading"
          className="text-lg font-semibold tracking-[-0.02em] text-divlab-text"
        >
          Upptäck DivLab
        </h2>
        <p className="mt-1 text-sm leading-6 text-divlab-text-secondary">
          Nyheter, kunskap, verktyg och diskussioner på ett ställe.
        </p>
      </div>

      <div className="space-y-3">
        <NewsModule article={latestNews} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <LearningModule article={latestLearning} />
          <FrihetsmaskinenModule />
          <ForumModule thread={latestThread} />
        </div>
      </div>
    </section>
  );
}
