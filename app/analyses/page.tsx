import type { Metadata } from "next";
import Link from "next/link";
import AnalysisCreator from "@/components/analysis/AnalysisCreator";
import PublicContentShell from "@/components/layout/PublicContentShell";
import {
  analysisBaseValue,
  analysisExecutiveSummary,
  analysisView,
  listPublishedDivLabAnalyses,
} from "@/lib/analysis/public-read";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aktieanalyser – teknisk, fundamental och värdering | DivLab",
  description: "DivLabs aktieanalyser kombinerar fundamental analys, värdering, teknisk analys, stöd och motstånd samt AI-tolkning med verifierade källor.",
  alternates: { canonical: getCanonicalUrl("/analyses") },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Aktieanalyser | DivLab",
    description: "Fundamental analys, värdering och teknisk analys i en sammanhållen DivLab-analys.",
    type: "website", url: getCanonicalUrl("/analyses"), locale: "sv_SE", siteName: "DivLab",
  },
};

const CREATOR_ROLES = new Set(["founder", "ceo_divlab", "admin"]);
function date(value: string): string {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Stockholm" }).format(parsed) : value;
}
function money(value: number, currency: string): string {
  return `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: value < 100 ? 2 : 1 }).format(value)} ${currency}`;
}
function viewLabel(view: "positive" | "neutral" | "negative") {
  if (view === "positive") return { label: "Positiv", className: "text-emerald-300" };
  if (view === "negative") return { label: "Negativ", className: "text-red-300" };
  return { label: "Neutral", className: "text-slate-300" };
}
function methodologyLabel(kind: "operating_company" | "bank" | "financial_specialist", type: string): string {
  if (kind === "bank") return "Bank";
  if (kind === "financial_specialist") return type === "investment_company" ? "Investmentbolag" : "Kapitalförvaltare";
  return "Rörelsedrivande";
}
async function canCreateInPreview(): Promise<boolean> {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") return false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const roles = await getStaffRolesForUser(user.id);
    return roles.some((role) => CREATOR_ROLES.has(role));
  } catch { return false; }
}

export default async function AnalysesPage() {
  const [analyses, canCreate] = await Promise.all([listPublishedDivLabAnalyses(24), canCreateInPreview()]);
  return (
    <PublicContentShell publicContentClassName="bg-[#080b10] text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">DivLab Analys</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Analyscenter</h1>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">Skapa nya bolagsanalyser och läs tidigare publicerade analyser. Motorn väljer rätt bolagsmetodik före Deep Research och varje publicering måste klara Research 100/100 och Analyst 100/100.</p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-y border-white/10 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            <span>Fundamental analys</span><span>Teknisk analys</span><span>Stöd & motstånd</span><span>Bear / Base / Bull</span><span>Verifierade källor</span>
          </div>
        </div>
        {canCreate ? <div className="mt-9"><AnalysisCreator /></div> : null}

        <section className="mt-12" aria-labelledby="published-analyses-title">
          <div className="flex items-end justify-between gap-5 border-b border-white/12 pb-4">
            <div><div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">Arkiv</div><h2 id="published-analyses-title" className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-white">Publicerade analyser</h2></div>
            <span className="text-xs text-slate-600">{analyses.length} publicerade</span>
          </div>
          {analyses.length ? (
            <div>
              {analyses.map((analysis) => {
                const view = viewLabel(analysisView(analysis));
                const base = analysisBaseValue(analysis);
                return (
                  <Link key={analysis.versionId} href={`/analyses/${analysis.slug}`} className="group grid gap-4 border-b border-white/10 py-6 transition hover:bg-white/[0.015] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">{analysis.packet.instrument.symbol}.{analysis.packet.instrument.exchange}</span>
                        <span className={`text-xs font-semibold ${view.className}`}>{view.label}</span>
                        <span className="text-xs text-slate-600">{methodologyLabel(analysis.kind, analysis.packet.companyClassification.type)}</span>
                        <span className="text-xs text-slate-700">{date(analysis.publishedAt)}</span>
                      </div>
                      <h3 className="mt-2 text-xl font-semibold text-slate-100 group-hover:text-white sm:text-2xl">{analysis.packet.instrument.name}</h3>
                      <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">{analysisExecutiveSummary(analysis)}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm sm:text-right">
                      <div><div className="text-[10px] uppercase tracking-[0.14em] text-slate-700">Analyskurs</div><div className="mt-1 font-medium text-slate-300">{money(analysis.packet.instrument.currentPrice, analysis.packet.instrument.currency)}</div></div>
                      <div><div className="text-[10px] uppercase tracking-[0.14em] text-slate-700">Basscenario</div><div className="mt-1 font-medium text-slate-300">{base ? money(base, analysis.packet.instrument.currency) : "—"}</div></div>
                      <span className="hidden font-semibold text-blue-400 sm:block">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : <div className="border-b border-white/10 py-8 text-sm leading-6 text-slate-500">Inga publicerade analyser ännu.</div>}
        </section>
      </main>
    </PublicContentShell>
  );
}
