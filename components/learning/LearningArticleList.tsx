import { learningArticles } from "@/data/learning-articles";
import LearningArticleRow from "@/components/learning/LearningArticleRow";

export default function LearningArticleList() {
  return (
    <div className="space-y-6">
      <section className="divlab-hero">
        <p className="mb-3 divlab-section-label">Utbildning</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text">
          Lär dig mer om börsen och investeringar
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-divlab-text-secondary">
          Pedagogiska och sakliga guider om aktier, fonder, ETF:er, portföljer,
          risk och hur marknaden fungerar.
        </p>
        <blockquote className="mt-5 max-w-3xl border-0 p-0 text-sm leading-6 text-divlab-text-muted">
          <p>An investment in knowledge pays the best interest.</p>
          <footer className="mt-1.5 text-xs text-divlab-text-subtle">
            — Benjamin Franklin
          </footer>
        </blockquote>
      </section>

      <aside
        aria-label="Utvecklingsinformation"
        className="flex gap-3 rounded-xl border divlab-border-neutral bg-divlab-surface px-4 py-3.5"
      >
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-divlab-blue/30 bg-divlab-blue/10 text-divlab-blue"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 7.25v3.5" strokeLinecap="round" />
            <circle cx="8" cy="5.25" r="0.75" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-divlab-text">
            DivLab är under utveckling
          </p>
          <p className="mt-1 text-sm leading-6 text-divlab-text-muted">
            Utbildningsbiblioteket byggs ut och uppdateras löpande med nya
            guider om börsen, investeringar och marknaden.
          </p>
        </div>
      </aside>

      <div>
        {learningArticles.map((article) => (
          <LearningArticleRow key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
