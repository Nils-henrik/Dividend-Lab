import Link from "next/link";
import {
  getLearningArticle,
  learningDisclaimer,
  type LearningArticleWithReadingTime,
} from "@/data/learning-articles";
import LearningArticleCover from "@/components/learning/LearningArticleCover";
import {
  LearningArticleSectionContent,
  LearningArticleSubsectionContent,
} from "@/components/learning/LearningArticleSectionContent";

type Props = {
  article: LearningArticleWithReadingTime;
};

function getIntroParagraphs(intro: string | string[]) {
  return Array.isArray(intro) ? intro : [intro];
}

export default function LearningArticleView({ article }: Props) {
  const introParagraphs = getIntroParagraphs(article.intro);
  const showDefaultDisclaimer = article.showDefaultDisclaimer ?? true;

  return (
    <article className="space-y-6">
      <Link href="/learning" className="divlab-link inline-flex text-sm">
        ← Tillbaka till utbildning
      </Link>

      {article.coverImage && article.coverImageAlt && (
        <LearningArticleCover
          src={article.coverImage}
          alt={article.coverImageAlt}
          priority
        />
      )}

      <header className="divlab-hero">
        <p className="mb-3 divlab-section-label">Utbildning</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text">
          {article.title}
        </h1>
        <div className="mt-4 max-w-3xl space-y-4">
          {introParagraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-7 text-divlab-text-secondary">
              {paragraph}
            </p>
          ))}
        </div>
        <p className="mt-3 text-xs text-divlab-text-muted">
          {article.readingMinutes} min läsning
          {article.updatedAt ? ` · Uppdaterad ${article.updatedAt}` : null}
        </p>
      </header>

      <div className="divlab-card space-y-8 p-6">
        {article.sections.map((section, index) => (
          <section
            key={`${section.heading ?? "section"}-${index}`}
            className="space-y-4"
          >
            {section.heading && (
              <h2 className="text-xl font-semibold text-divlab-text">
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
              <blockquote className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-4 text-sm leading-7 text-divlab-text-secondary">
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
                      className="font-mono text-xs leading-6 text-divlab-text-secondary"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {section.relatedLinks?.map((link) => (
              <p key={link.slug} className="text-sm leading-7 text-divlab-text-secondary">
                <Link href={`/learning/${link.slug}`} className="divlab-link font-medium">
                  {link.text}
                </Link>
              </p>
            ))}

            {section.externalLinks?.map((link) => (
              <p key={link.href} className="text-sm leading-7 text-divlab-text-secondary">
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="divlab-link font-medium"
                >
                  {link.text}
                </a>
              </p>
            ))}
          </section>
        ))}

        {article.takeaways.length > 0 && (
          <section className="space-y-3 border-t divlab-border-neutral pt-6">
            <h2 className="text-lg font-semibold text-divlab-text">
              Det viktigaste att ta med sig
            </h2>
            <ul className="space-y-2">
              {article.takeaways.map((takeaway) => (
                <li
                  key={takeaway}
                  className="flex gap-3 text-sm leading-7 text-divlab-text-secondary"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-divlab-blue/70" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {showDefaultDisclaimer && (
          <p className="border-t divlab-border-neutral pt-5 text-xs leading-5 text-divlab-text-muted">
            {learningDisclaimer}
          </p>
        )}
      </div>
    </article>
  );
}

export function getLearningArticleOrThrow(slug: string) {
  return getLearningArticle(slug);
}
