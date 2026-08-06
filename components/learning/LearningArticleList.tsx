import { learningArticles } from "@/data/learning-articles";
import LearningArticleRow from "@/components/learning/LearningArticleRow";

export default function LearningArticleList() {
  return (
    <div className="space-y-6">
      <section className="divlab-hero">
        <p className="mb-3 divlab-section-label">Utbildning</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text">
          Guider om aktier, fonder och privatekonomi
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-divlab-text-secondary">
          Sakliga guider om aktier, fonder, privatekonomi, pension, FIRE,
          konton och skatt samt långsiktigt sparande — utan köpråd.
        </p>
      </section>

      <div>
        {learningArticles.map((article) => (
          <LearningArticleRow key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
