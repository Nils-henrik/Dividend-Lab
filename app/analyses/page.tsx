import type { Metadata } from "next";
import Link from "next/link";
import PublicContentShell from "@/components/layout/PublicContentShell";
import { listPublishedDivLabAnalyses } from "@/lib/analysis/public-read";
import { getCanonicalUrl } from "@/lib/seo/canonical";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Aktieanalyser – teknisk, fundamental och värdering | DivLab",
  description:
    "DivLabs aktieanalyser kombinerar fundamental analys, värdering, teknisk analys, stöd och motstånd samt AI-tolkning med verifierade källor.",
  alternates: { canonical: getCanonicalUrl("/analyses") },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Aktieanalyser | DivLab",
    description:
      "Fundamental analys, värdering och teknisk analys i en sammanhållen DivLab-analys.",
    type: "website",
    url: getCanonicalUrl("/analyses"),
    locale: "sv_SE",
    siteName: "DivLab",
  },
};

function date(value: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Stockholm",
  }).format(parsed);
}

function money(value: number, currency: string): string {
  return `${new Intl.NumberFormat("sv-SE", {
    maximumFractionDigits: value < 100 ? 2 : 1,
  }).format(value)} ${currency}`;
}

function viewLabel(view: "positive" | "neutral" | "negative") {
  if (view === "positive") return { label: "Positiv", className: "text-emerald-300" };
  if (view === "negative") return { label: "Negativ", className: "text-red-300" };
  return { label: "Neutral", className: "text-slate-300" };
}

export default async function AnalysesPage() {
  const analyses = await listPublishedDivLabAnalyses(24);

  return (
    <PublicContentShell publicContentClassName="bg-[#080b10] text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">DivLab Analys</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Aktieanalyser med hela bilden
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Fundamental utveckling, värdering, teknisk trend, volym och viktiga stöd- och motståndsområden i samma analys. AI:n tolkar underlaget, men varje publicerad analys måste först klara DivLabs kvalitetsgrindar.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 text-xs text-slate-400">
          {[
            "Fundamental analys",
            "Teknisk analys",
            "Stöd & motstånd",
            "Bear / Base / Bull",
            "Verifierade källor",
          ].map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5">{item}</span>
          ))}
        </div>

        {analyses.length ? (
          <section className="mt-12 grid gap-5 md:grid-cols-2" aria-label="Publicerade analyser">
            {analyses.map((analysis) => {
              const { packet, draft } = analysis;
              const view = viewLabel(draft.view);
              const base = packet.valuation.scenarios.find((scenario) => scenario.name === "base");
              return (
                <Link
                  key={analysis.versionId}
                  href={`/analyses/${analysis.slug}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-blue-400/30 hover:bg-white/[0.04] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {packet.instrument.symbol}.{packet.instrument.exchange}
                      </div>
                      <h2 className="mt-2 text-xl font-semibold text-slate-100 group-hover:text-white sm:text-2xl">
                        {packet.instrument.name}
                      </h2>
                    </div>
                    <span className={`text-sm font-semibold ${view.className}`}>{view.label}</span>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">
                    {draft.executiveSummary}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">Analyskurs</div>
                      <div className="mt-1 font-medium text-slate-200">{money(packet.instrument.currentPrice, packet.instrument.currency)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Basscenario</div>
                      <div className="mt-1 font-medium text-slate-200">
                        {base?.valuePerShare ? money(base.valuePerShare, packet.instrument.currency) : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Publicerad {date(analysis.publishedAt)}</span>
                    <span className="text-blue-400 group-hover:text-blue-300">Läs analys →</span>
                  </div>
                </Link>
              );
            })}
          </section>
        ) : (
          <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.025] p-7 sm:p-9">
            <h2 className="text-xl font-semibold text-slate-100">Första analysen förbereds</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Analysbiblioteket är aktiverat, men endast analyser som klarar både research- och analystkvalitetsgrinden publiceras här.
            </p>
          </section>
        )}
      </main>
    </PublicContentShell>
  );
}
