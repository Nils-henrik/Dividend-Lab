import Link from "next/link";
import { learningArticles } from "@/data/learning-articles";

export default function LearningArticleList() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
          Utbildning
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
          Lär dig mer om utdelning och FIRE
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-400">
          Saklig, långsiktig utbildning för investerare som tänker i år — inte
          dagar.
        </p>
      </section>

      <div className="grid gap-4">
        {learningArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/learning/${article.slug}`}
            className="rounded-2xl border border-white/10 bg-[#161616] p-6 transition hover:border-[#D4AF37]/30"
          >
            <h2 className="text-lg font-semibold text-white">{article.title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              {article.description}
            </p>
            <p className="mt-4 text-xs font-medium text-[#D4AF37]">
              {article.readingMinutes} min läsning · Läs artikel
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
