import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AnalysisPreviewOperator from "@/components/analysis/AnalysisPreviewOperator";
import PublicContentShell from "@/components/layout/PublicContentShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DivLab Analys – Preview testcenter",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AnalysisInternalPreviewPage() {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") {
    notFound();
  }

  return (
    <PublicContentShell publicContentClassName="bg-[#080b10] text-slate-100">
      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Preview only</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">
            DivLab Analys – testcenter
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Här kör vi en riktig bolagsanalys genom Deep Research, Analyst, quality gates och DEV-publicering. Sidan finns aldrig i produktion och ingen analys kan passera om research- eller Analyst-kvaliteten faller under publiceringskraven.
          </p>
        </div>

        <div className="mt-9">
          <AnalysisPreviewOperator />
        </div>

        <div className="mt-6 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4 text-xs leading-5 text-slate-500">
          Testcentret använder endast curated targets och dividend-lab-dev. Det gör inga köp/sälj, ändrar inga AI-portföljer och finns inte på production runtime.
        </div>
      </main>
    </PublicContentShell>
  );
}
