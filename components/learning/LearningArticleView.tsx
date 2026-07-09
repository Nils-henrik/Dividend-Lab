import Link from "next/link";
import {
  getLearningArticle,
  learningDisclaimer,
  type LearningArticle,
} from "@/data/learning-articles";

type Props = {
  article: LearningArticle;
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
        <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-400">
          {article.description}
        </p>
        <p className="mt-3 text-xs text-gray-500">
          {article.readingMinutes} min läsning
        </p>
      </header>

      <div className="space-y-6 rounded-2xl border border-white/10 bg-[#161616] p-6">
        {article.sections.map((section, index) => (
          <section key={`${section.heading ?? "intro"}-${index}`}>
            {section.heading && (
              <h2 className="text-lg font-semibold text-white">{section.heading}</h2>
            )}
            <div className={`space-y-4 ${section.heading ? "mt-3" : ""}`}>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-gray-300">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}

        <p className="border-t border-white/10 pt-5 text-xs leading-5 text-gray-500">
          {learningDisclaimer}
        </p>
      </div>
    </article>
  );
}

export function getLearningArticleOrThrow(slug: string) {
  const article = getLearningArticle(slug);

  if (!article) {
    return null;
  }

  return article;
}
