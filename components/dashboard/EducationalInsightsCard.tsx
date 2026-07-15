import Link from "next/link";
import { getDashboardLearningInsights } from "@/data/learning-articles";

export default function EducationalInsightsCard() {
  const insights = getDashboardLearningInsights();

  return (
    <section className="divlab-card p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-3 divlab-section-label">UTBILDNING</p>
          <h2 className="text-lg font-semibold text-divlab-text">
            Förstå börsen – steg för steg
          </h2>
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
            Pedagogiska guider om aktier, fonder, risk och långsiktigt sparande.
            Börja med grunderna och bygg vidare i din egen takt.
          </p>
        </div>
        <Link href="/learning" className="divlab-btn-secondary shrink-0 px-3 py-2 text-xs">
          Alla artiklar
        </Link>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <article key={insight.slug} className="rounded-xl border divlab-inset p-4">
            <h3 className="text-sm font-medium text-divlab-text">{insight.title}</h3>
            <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
              {insight.excerpt}
            </p>
            <Link
              href={`/learning/${insight.slug}`}
              className="mt-3 inline-flex text-xs font-medium text-divlab-blue-muted transition hover:text-divlab-blue"
            >
              Läs mer
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
