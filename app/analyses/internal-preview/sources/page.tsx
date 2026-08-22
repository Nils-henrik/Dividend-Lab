import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalysisSourceDiscoveryOperator from "@/components/analysis/AnalysisSourceDiscoveryOperator";
import AnalysisSpecialistResearchReadinessOperator from "@/components/analysis/AnalysisSpecialistResearchReadinessOperator";
import AnalysisUsDeepResearchExecutionOperator from "@/components/analysis/AnalysisUsDeepResearchExecutionOperator";
import AnalysisUsResearchCoverageOperator from "@/components/analysis/AnalysisUsResearchCoverageOperator";
import PublicContentShell from "@/components/layout/PublicContentShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DivLab Analys – Global Source Discovery",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AnalysisSourceDiscoveryPreviewPage() {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") {
    notFound();
  }

  return (
    <PublicContentShell publicContentClassName="bg-[#080b10] text-slate-100">
      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <Link
          href="/analyses/internal-preview"
          className="text-sm font-medium text-blue-300 hover:text-blue-200"
        >
          ← Tillbaka till Analys-testcentret
        </Link>

        <div className="mt-8 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Preview only</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">
            Global Source Discovery
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Här verifierar DivLab officiella källor innan en ny global marknad får anslutas till Deep Research. Inga analyser publiceras från denna sida och inga quality gates sänks.
          </p>
        </div>

        <div className="mt-9">
          <AnalysisSourceDiscoveryOperator />
        </div>

        <div className="mt-6">
          <AnalysisUsResearchCoverageOperator />
        </div>

        <div className="mt-6">
          <AnalysisUsDeepResearchExecutionOperator />
        </div>

        <div className="mt-6">
          <AnalysisSpecialistResearchReadinessOperator />
        </div>

        <div className="mt-6 border border-amber-400/15 bg-amber-400/[0.04] p-4 text-xs leading-5 text-slate-500">
          SEC EDGAR används som första regulatoriska globalvertikal. MSFT är första och enda tillåtna amerikanska execution-target i v1. Specialist-canaryn är separat låst till SEB-A.ST, INVE-B.ST och EQT.ST och kör endast deterministisk Research. Persistence, publicering och generell global analyskörning är fortsatt avstängda i dessa canaryflöden.
        </div>
      </main>
    </PublicContentShell>
  );
}
