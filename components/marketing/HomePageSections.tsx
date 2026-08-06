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

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="divlab-section-label text-[10px] tracking-[0.22em]">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl"
      >
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-divlab-text-secondary">
        {description}
      </p>
    </div>
  );
}

function BenefitItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-t divlab-border-neutral pt-5">
      <h3 className="text-sm font-semibold text-divlab-text">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
        {description}
      </p>
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
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
          <SectionHeading
            id="aktuellt-heading"
            eyebrow="Aktuellt"
            title="Aktuellt på DivLab"
            description="Senaste publicerade innehållet från Börsnyheter, Utbildning och Forum."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              {latestNews && newsHref ? (
                isInternalNewsArticleHref(newsHref) ? (
                  <Link
                    href={newsHref}
                    className="group block space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                  >
                    {newsImage ? (
                      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border divlab-border-neutral bg-divlab-surface">
                        <Image
                          src={newsImage}
                          alt=""
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : null}
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
                      Börsnyheter
                      <span aria-hidden="true"> · </span>
                      {getNewsCategoryLabel(latestNews.category)}
                    </p>
                    <h3 className="text-lg font-semibold leading-snug tracking-[-0.02em] text-divlab-text transition group-hover:text-white">
                      {latestNews.title}
                    </h3>
                    <p className="text-sm text-divlab-text-muted">
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
                    className="group block space-y-4"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
                      Börsnyheter
                    </p>
                    <h3 className="text-lg font-semibold text-divlab-text">
                      {latestNews.title}
                    </h3>
                  </a>
                )
              ) : (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
                    Börsnyheter
                  </p>
                  <p className="mt-3 text-sm text-divlab-text-secondary">
                    Inga artiklar just nu.
                  </p>
                  <Link href="/news" className="divlab-link mt-3 inline-flex text-sm">
                    Till Börsnyheter
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-8 border-t divlab-border-neutral pt-6 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
              {latestLearning ? (
                <Link
                  href={`/learning/${latestLearning.slug}`}
                  className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
                    Utbildning
                  </p>
                  <h3 className="mt-3 text-base font-semibold leading-snug text-divlab-text transition group-hover:text-white">
                    {latestLearning.title}
                  </h3>
                  <p className="mt-2 text-sm text-divlab-text-muted">
                    {latestLearning.readingMinutes} min läsning
                  </p>
                </Link>
              ) : null}

              {latestThread ? (
                <Link
                  href={`/forum/${latestThread.slug}`}
                  className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
                    Forum
                  </p>
                  <h3 className="mt-3 text-base font-semibold leading-snug text-divlab-text transition group-hover:text-white">
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
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
                    Forum
                  </p>
                  <h3 className="mt-3 text-base font-semibold text-divlab-text transition group-hover:text-white">
                    Diskutera marknaden med andra sparintresserade
                  </h3>
                </Link>
              )}
            </div>

            <div className="flex flex-col justify-between border-t divlab-border-neutral pt-6 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
                  Utan konto
                </p>
                <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
                  Du kan läsa Börsnyheter, Utbildning, Forum och använda
                  Frihetsmaskinen utan att registrera dig.
                </p>
              </div>
              <Link
                href="/news"
                className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-divlab-blue transition hover:text-divlab-blue-hover"
              >
                Utforska öppet innehåll
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="frihet-heading"
        className="border-t divlab-border-neutral bg-[#0b0b0b]"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:px-8 md:py-20 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            id="frihet-heading"
            eyebrow="Frihetsmaskinen"
            title="Vägen mot ekonomisk frihet"
            description="Testa hur kapital, sparkvot och avkastningsantaganden påverkar tidslinjen. Exemplet nedan är illustrativt — justera siffrorna själv."
          />
          <div className="rounded-xl border divlab-border-neutral bg-white/[0.02] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
              Illustrativt exempel
            </p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-divlab-text-secondary">Kapital</dt>
                <dd className="tabular-nums text-divlab-text">
                  {formatSek(250_000)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
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
            <p className="mt-5 text-sm leading-6 text-divlab-text-secondary">
              Resultatet beror på dina egna antaganden om avkastning och
              utgifter. Det är en uppskattning — inte ett löfte.
            </p>
            <Link
              href="/frihetsmaskinen#kalkylator"
              className="divlab-btn-primary mt-6 inline-flex min-h-11 items-center px-6 py-3 text-sm font-semibold"
            >
              Öppna Frihetsmaskinen
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="benefits-heading"
        className="border-t divlab-border-neutral bg-divlab-bg"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
          <SectionHeading
            id="benefits-heading"
            eyebrow="Fördelar"
            title="Det här får du med DivLab"
            description="Funktioner som finns tillgängliga idag — utan överdrivna löften."
          />
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <BenefitItem
              title="Svenska börsnyheter"
              description="Aktuella artiklar om marknaden, bolag och makro — för allmän information."
            />
            <BenefitItem
              title="Utbildningsguider"
              description="Sakliga guider om aktier, fonder, privatekonomi, pension och FIRE."
            />
            <BenefitItem
              title="Frihetsmaskinen"
              description="Interaktiv kalkyl för att utforska ekonomisk frihet utifrån dina antaganden."
            />
            <BenefitItem
              title="Forum och kommentarer"
              description="Läs diskussioner öppet. Delta och kommentera efter registrering."
            />
            <BenefitItem
              title="Kontakter och meddelanden"
              description="Bygg nätverk och kommunicera privat i din DivLab-miljö."
            />
            <BenefitItem
              title="Personlig DivLab-miljö"
              description="Efter inloggning får du en samlad översikt med genvägar till aktiva verktyg."
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="sweden-heading"
        className="border-t divlab-border-neutral bg-[#0b0b0b]"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
          <SectionHeading
            id="sweden-heading"
            eyebrow="Sverige"
            title="Byggt för svenska sparare"
            description="DivLab utgår från svensk privatekonomi: ISK och KF, pensionssparande, indexfonder, sparkvot och långsiktigt investerande."
          />
          <ul className="mt-8 grid gap-3 text-sm text-divlab-text-secondary sm:grid-cols-2 lg:grid-cols-3">
            {[
              "ISK och kapitalförsäkring",
              "Pensionssparande och premiepension",
              "Indexfonder och långsiktigt sparande",
              "Sparkvot och budgetvanor",
              "FIRE och ekonomiskt oberoende",
              "Börsnyheter med svensk kontext",
            ].map((item) => (
              <li
                key={item}
                className="border-l border-divlab-blue/30 pl-4 leading-6"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="cta-heading"
        className="border-t divlab-border-neutral bg-divlab-bg"
      >
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:px-8 md:py-20">
          <h2
            id="cta-heading"
            className="text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl"
          >
            Skapa konto och fortsätt i DivLab
          </h2>
          <p className="mt-4 text-base leading-7 text-divlab-text-secondary">
            DivLab är för närvarande en kostnadsfri beta. Registrera dig för att
            använda forum, kommentarer, kontakter, meddelanden och din personliga
            DivLab-miljö.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="divlab-btn-primary inline-flex min-h-11 items-center justify-center px-8 py-3.5 text-base"
            >
              Skapa konto
            </Link>
            <Link
              href="/about"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border divlab-border-neutral px-6 py-3.5 text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text"
            >
              Om DivLab
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
