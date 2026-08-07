import Link from "next/link";
import { getDashboardLearningInsights } from "@/data/learning-articles";

export default function EducationalInsightsCard() {
  const insights = getDashboardLearningInsights().slice(0, 3);

  return (
    <section className="divlab-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="divlab-section-label">Utbildning</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-divlab-text">
            Lär dig mer
          </h2>
        </div>
        <Link
          href="/learning"
          className="shrink-0 text-xs font-medium text-divlab-text-muted transition hover:text-divlab-blue-muted"
        >
          All utbildning →
        </Link>
      </div>

      <div className="mt-5">
        {insights.map((insight, index) => (
          <Link
            key={insight.slug}
            href={`/learning/${insight.slug}`}
            className={`group block py-4 first:pt-0 last:pb-0 ${
              index > 0 ? "border-t divlab-border-neutral" : ""
            }`}
          >
            <h3 className="text-sm font-medium leading-6 text-divlab-text transition group-hover:text-divlab-blue-muted">
              {insight.title}
            </h3>
            <p className="mt-1.5 line-clamp-1 text-xs leading-5 text-divlab-text-muted">
              {insight.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
