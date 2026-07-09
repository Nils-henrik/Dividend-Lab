import Link from "next/link";
import { learningArticles } from "@/data/learning-articles";

export default function LearningArticleList() {
  return (
    <div className="space-y-6">
      <section className="divlab-hero">
        <p className="mb-3 divlab-section-label">Utbildning</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text">
          Lär dig mer om utdelning och FIRE
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-divlab-text-secondary">
          Saklig, långsiktig utbildning för investerare som tänker i år — inte
          dagar.
        </p>
      </section>

      <div className="grid gap-4">
        {learningArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/learning/${article.slug}`}
            className="divlab-card p-6 transition hover:border-divlab-border-strong"
          >
            <h2 className="text-lg font-semibold text-divlab-text">{article.title}</h2>
            <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
              {article.description}
            </p>
            <p className="mt-4 text-xs font-medium text-divlab-blue-muted">
              {article.readingMinutes} min läsning · Läs artikel
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
