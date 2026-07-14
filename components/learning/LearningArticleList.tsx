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

      <div>
        {learningArticles.map((article) => (
          <LearningArticleRow key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
