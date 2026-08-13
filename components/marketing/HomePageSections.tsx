import Image from "next/image";
import Link from "next/link";
import AppIcon from "@/components/layout/AppIcon";
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
import { formatReplyCountLabel } from "@/lib/i18n/swedish-counts";
import type { ForumThread } from "@/types/forum";
import type { NewsArticle } from "@/types/news";
import { formatSek } from "@/lib/dashboard/fire-calculator";

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

const swedishContextItems = [
  "ISK och KF",
  "Pension",
  "Indexfonder",
  "Sparkvot",
  "FIRE",
  "Svenska börsnyheter",
] as const;

const accountBenefits = [
  "Följ AI-portföljer",
  "Delta i forumet",
  "Kommentera",
  "Bygg din DivLab-miljö",
] as const;

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="divlab-section-label text-[10px] tracking-[0.22em]">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-2.5 text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-2.5 text-sm leading-6 text-divlab-text-secondary sm:text-base sm:leading-7">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default async function HomePageSections() {
  const latestNews = getLatestNewsArticle();
  const latestLearning = getLatestLearningArticle();
  const latestThread = await getLatestPublicForumThread();

  const newsHref = latestNews ? getNewsArticleHref(latestNews) : null;
  const newsImage =
    latestNews?.thumbnailImageUrl ?? latestNews?.imageUrl ?? null;

  return (
    <>
      <section
        aria-labelledby="aktuellt-heading"
        className="border-t divlab-border-neutral bg-divlab-bg"
      >
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-14">
          <SectionHeading
            id="aktuellt-heading"
            eyebrow="Aktuellt"
            title="Aktuellt på DivLab"
            description="Senaste publicerade innehållet från Börsnyheter, Utbildning och Forum."
          />

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            <article className="rounded-xl border divlab-border-neutral bg-white/[0.02] p-3.5 sm:p-4">
              {latestNews && newsHref ? (
                isInternalNewsArticleHref(newsHref) ? (
                  <Link
                    href={newsHref}
                    className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                  >
                    {newsImage ? (
                      <div className="relative mb-3 aspect-[2/1] overflow-hidden rounded-lg border divlab-border-neutral bg-divlab-surface">
                        <Image
                          src={newsImage}
                          alt=""
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : null}
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-blue-muted">
                      Börsnyheter
                      <span aria-hidden="true"> · </span>
                      {getNewsCategoryLabel(latestNews.category)}
                    </p>
                    <h3 className="mt-2 text-base font-semibold leading-snug tracking-[-0.02em] text-divlab-text transition group-hover:text-white">
                      {latestNews.title}
                    </h3>
                    <p className="mt-2 text-sm text-divlab-text-muted">
                      <time dateTime={latestNews.publishedAt}>
                        {formatNewsPublishedAt(latestNews.publishedAt)}
                      </time>
                    </p>
                  </Link>
                ) : (
                  <a
                    href={newsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-blue-muted">
                      Börsnyheter
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-divlab-text">
                      {latestNews.title}
                    </h3>
                  </a>
                )
              ) : (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-blue-muted">
                    Börsnyheter
                  </p>
                  <p className="mt-2 text-sm text-divlab-text-secondary">
                    Inga artiklar just nu.
                  </p>
                  <Link href="/news" className="divlab-link mt-3 inline-flex text-sm">
                    Till Börsnyheter
                  </Link>
                </div>
              )}
            </article>

            <article className="rounded-xl border divlab-border-neutral bg-white/[0.02] p-3.5 sm:p-4">
              {latestLearning ? (
                <Link
                  href={`/learning/${latestLearning.slug}`}
                  className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-blue-muted">
                    Utbildning
                  </p>
                  <h3 className="mt-2 text-base font-semibold leading-snug text-divlab-text transition group-hover:text-white">
                    {latestLearning.title}
                  </h3>
                  <p className="mt-2 text-sm text-divlab-text-muted">
                    {latestLearning.readingMinutes} min läsning
                  </p>
                </Link>
              ) : (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-blue-muted">
                    Utbildning
                  </p>
                  <Link href="/learning" className="divlab-link mt-3 inline-flex text-sm">
                    Till Utbildning
                  </Link>
                </div>
              )}
            </article>

            <article className="flex flex-col rounded-xl border divlab-border-neutral bg-white/[0.02] p-3.5 sm:p-4">
              {latestThread ? (
                <Link
                  href={`/forum/${latestThread.slug}`}
                  className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-blue-muted">
                    Forum
                  </p>
                  <h3 className="mt-2 text-base font-semibold leading-snug text-divlab-text transition group-hover:text-white">
                    {latestThread.title}
                  </h3>
                  <p className="mt-2 text-sm text-divlab-text-muted">
                    {latestThread.category}
                    <span aria-hidden="true"> · </span>
                    {formatReplyCountLabel(latestThread.replies)}
                  </p>
                </Link>
              ) : (
                <Link
                  href="/forum"
                  className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-blue-muted">
                    Forum
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-divlab-text transition group-hover:text-white">
                    Diskutera marknaden med andra sparintresserade
                  </h3>
                </Link>
              )}

              <div className="mt-auto border-t divlab-border-neutral pt-3.5">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
                  Med ett gratis konto
                </p>
                <ul className="mt-2 space-y-1">
                  {accountBenefits.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-divlab-text-secondary"
                    >
                      <AppIcon
                        name="check"
                        className="h-3.5 w-3.5 shrink-0 text-divlab-blue"
                        strokeWidth={1.75}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="frihet-heading"
        className="border-t divlab-border-neutral bg-divlab-bg"
      >
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-12 md:px-8 md:py-14 lg:grid-cols-2 lg:gap-5 lg:items-stretch">
          <div className="rounded-xl border divlab-border-neutral bg-white/[0.02] p-5 sm:p-5">
            <SectionHeading
              id="frihet-heading"
              eyebrow="Frihetsmaskinen"
              title="Vägen mot ekonomisk frihet"
              description="Testa hur kapital, sparkvot och avkastningsantaganden påverkar tidslinjen. Exemplet är illustrativt — justera siffrorna själv."
            />

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b divlab-border-neutral pb-2">
                <dt className="text-divlab-text-secondary">Kapital</dt>
                <dd className="tabular-nums text-divlab-text">
                  {formatSek(250_000)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b divlab-border-neutral pb-2">
                <dt className="text-divlab-text-secondary">Månadssparande</dt>
                <dd className="tabular-nums text-divlab-text">
                  {formatSek(5_000)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-divlab-text-secondary">
                  Önskad månadsutdelning
                </dt>
                <dd className="tabular-nums text-divlab-text">
                  {formatSek(25_000)}
                </dd>
              </div>
            </dl>

            <p className="mt-3.5 text-sm leading-6 text-divlab-text-secondary">
              Resultatet beror på dina egna antaganden om avkastning och
              utgifter. Det är en uppskattning — inte ett löfte.
            </p>

            <Link
              href="/frihetsmaskinen#kalkylator"
              className="divlab-btn-primary mt-4 inline-flex min-h-11 items-center px-6 py-3 text-sm font-semibold"
            >
              Öppna Frihetsmaskinen
            </Link>
          </div>

          <div className="rounded-xl border divlab-border-neutral bg-white/[0.02] p-5 sm:p-5">
            <SectionHeading
              id="sweden-heading"
              eyebrow="Svensk kontext"
              title="Byggt för svenska sparare"
              description="DivLab utgår från svensk privatekonomi: ISK och KF, pensionssparande, indexfonder, sparkvot och långsiktigt investerande."
            />

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {swedishContextItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm leading-6 text-divlab-text-secondary"
                >
                  <AppIcon
                    name="check"
                    className="h-3.5 w-3.5 shrink-0 text-divlab-blue"
                    strokeWidth={1.75}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="cta-heading"
        className="border-t divlab-border-neutral bg-divlab-bg"
      >
        <div className="relative mx-auto max-w-3xl overflow-hidden px-6 py-12 text-center md:px-8 md:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,132,255,0.12),transparent_55%)]"
          />
          <div className="relative">
            <h2
              id="cta-heading"
              className="text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl"
            >
              Börja använda hela DivLab
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-divlab-text-secondary sm:text-base sm:leading-7">
              Följ AI-portföljerna, delta i forumet och bygg din egen
              DivLab-miljö. Gratis under betan.
            </p>
            <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="divlab-btn-primary inline-flex min-h-11 items-center justify-center px-8 py-3.5 text-base font-semibold"
              >
                Skapa gratis konto
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border divlab-border-neutral px-6 py-3.5 text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text"
              >
                Om DivLab
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
