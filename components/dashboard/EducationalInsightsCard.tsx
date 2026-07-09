import Link from "next/link";
import { getDashboardLearningInsights } from "@/data/learning-articles";

export default function EducationalInsightsCard() {
  const insights = getDashboardLearningInsights();

  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
            Lär dig mer
          </p>
          <h2 className="text-lg font-semibold text-white">
            Insikter om utdelning och FIRE
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Generella perspektiv för långsiktiga utdelningsinvesterare — utan att
            utgå från din portfölj.
          </p>
        </div>
        <Link
          href="/learning"
          className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
        >
          Alla artiklar
        </Link>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <article
            key={insight.slug}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <h3 className="text-sm font-medium text-white">{insight.title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">{insight.excerpt}</p>
            <Link
              href={`/learning/${insight.slug}`}
              className="mt-3 inline-flex text-xs font-medium text-[#D4AF37] transition hover:text-[#F9D976]"
            >
              Läs mer
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
