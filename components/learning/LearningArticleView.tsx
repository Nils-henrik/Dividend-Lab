import Link from "next/link";
import {
  getLearningArticle,
  learningDisclaimer,
  type LearningArticleWithReadingTime,
} from "@/data/learning-articles";

type Props = {
  article: LearningArticleWithReadingTime;
};

export default function LearningArticleView({ article }: Props) {
  return (
    <article className="space-y-6">
      <Link
        href="/learning"
        className="inline-flex text-sm text-gray-400 transition hover:text-[#D4AF37]"
      >
        ← Tillbaka till utbildning
      </Link>

      <header className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
          Utbildning
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
          {article.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-gray-300">
          {article.intro}
        </p>
        <p className="mt-3 text-xs text-gray-500">
          {article.readingMinutes} min läsning
        </p>
      </header>

      <div className="space-y-8 rounded-2xl border border-white/10 bg-[#161616] p-6">
        {article.sections.map((section, index) => (
          <section
            key={`${section.heading ?? "section"}-${index}`}
            className="space-y-4"
          >
            {section.heading && (
              <h2 className="text-xl font-semibold text-white">{section.heading}</h2>
            )}

            {section.intro?.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-7 text-gray-300">
                {paragraph}
              </p>
            ))}

            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-7 text-gray-300">
                {paragraph}
              </p>
            ))}

            {section.subsections?.map((subsection) => (
              <div key={subsection.subheading} className="space-y-3">
                <h3 className="text-base font-semibold text-white">
                  {subsection.subheading}
                </h3>
                {subsection.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-gray-300">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}

            {section.callout && (
              <blockquote className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 px-4 py-4 text-sm leading-7 text-gray-200">
                {section.callout}
              </blockquote>
            )}

            {section.calculation && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#D4AF37]">
                  {section.calculation.title}
                </p>
                <ul className="mt-3 space-y-2">
                  {section.calculation.lines.map((line) => (
                    <li
                      key={line}
                      className="font-mono text-xs leading-6 text-gray-300"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {section.relatedLinks?.map((link) => (
              <p key={link.slug} className="text-sm leading-7 text-gray-400">
                <Link
                  href={`/learning/${link.slug}`}
                  className="font-medium text-[#D4AF37] transition hover:text-[#F9D976]"
                >
                  {link.text}
                </Link>
              </p>
            ))}
          </section>
        ))}

        <section className="space-y-3 border-t border-white/10 pt-6">
          <h2 className="text-lg font-semibold text-white">Det viktigaste att ta med sig</h2>
          <ul className="space-y-2">
            {article.takeaways.map((takeaway) => (
              <li
                key={takeaway}
                className="flex gap-3 text-sm leading-7 text-gray-300"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]/70" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="border-t border-white/10 pt-5 text-xs leading-5 text-gray-500">
          {learningDisclaimer}
        </p>
      </div>
    </article>
  );
}

export function getLearningArticleOrThrow(slug: string) {
  return getLearningArticle(slug);
}
