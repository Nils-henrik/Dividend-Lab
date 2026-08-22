"use client";

import { useState } from "react";

type CoverageCheckName =
  | "usOperatingCompanyTarget"
  | "methodologyCoverage"
  | "currentFinancialCoverage"
  | "multiYearFinancialCoverage"
  | "currencyCoverage"
  | "marketAndTechnicalHistoryCoverage"
  | "classificationProvenance"
  | "valuationInputProvenance"
  | "freshPrimaryEvidenceCoverage";

type CoverageResponse = {
  status?: string;
  researchCoverageReady?: boolean;
  analysisExecutionEnabled?: boolean;
  message?: string;
  coverage?: {
    ready: boolean;
    score: number;
    blockers: string[];
    checks: Record<CoverageCheckName, boolean>;
    factsResearchQuality: {
      score: number;
      publishable: boolean;
      failedChecks: string[];
      valuationScenarioCoverageDeferred: boolean;
    };
  };
  researchSummary?: {
    marketCurrency: string;
    reportingCurrency: string | null;
    epsTtmCurrency: string | null;
    historicalPeriodsAnalyzed: number;
    yearsCovered: number | null;
    technicalSessions: number;
    sourceCount: number;
    primarySourceCount: number;
    evidenceCount: number;
    companyType: string;
    methodologyStatus: string;
  };
};

const CHECK_LABELS: Record<CoverageCheckName, string> = {
  usOperatingCompanyTarget: "US operating company",
  methodologyCoverage: "Befintlig metodik",
  currentFinancialCoverage: "Aktuell fundamentaldata",
  multiYearFinancialCoverage: "Flerårig fundamentaldata",
  currencyCoverage: "Valutor / FX",
  marketAndTechnicalHistoryCoverage: "Marknad + teknisk historik",
  classificationProvenance: "Klassificeringsproveniens",
  valuationInputProvenance: "Värderingsproveniens",
  freshPrimaryEvidenceCoverage: "Färsk SEC-evidens",
};

export default function AnalysisUsResearchCoverageOperator() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CoverageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCoverage() {
    if (running) return;
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch(
        "/api/internal/analysis/us-research-coverage?yahooSymbol=MSFT",
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => ({}))) as CoverageResponse;
      setResult(payload);
      if (!response.ok && !payload.coverage) {
        setError(payload.message ?? "US Research Coverage kunde inte verifieras.");
      }
    } catch {
      setError("US Research Coverage kunde inte verifieras.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="border border-blue-400/15 bg-blue-400/[0.035] p-5 sm:p-7">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
        US Research Coverage v1 · MSFT
      </div>
      <h2 className="mt-2 text-xl font-semibold text-white">
        Bevisa Research-inputs utan AI-körning
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        Kör hela Preview-kedjan för Microsoft: verifierad SEC discovery, bounded SEC-evidens, befintliga Yahoo-finansiella data, marknadshistorik, valuta, klassificering och värderingsproveniens. Inga Bear/Base/Bull-antaganden skapas här och ingen analys sparas eller publiceras.
      </p>

      <button
        type="button"
        onClick={() => void runCoverage()}
        disabled={running}
        className="mt-5 border border-blue-300/30 bg-blue-300/10 px-4 py-2.5 text-sm font-semibold text-blue-100 hover:bg-blue-300/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? "Verifierar MSFT…" : "Verifiera MSFT Research Coverage"}
      </button>

      {error ? (
        <p className="mt-4 border border-amber-400/20 bg-amber-400/[0.05] p-3 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      {result?.coverage ? (
        <div className="mt-5 border border-white/10 bg-black/25 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500">US Research Coverage</div>
              <div className="mt-1 text-2xl font-semibold text-white">
                {result.coverage.score}/100
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${result.researchCoverageReady ? "text-emerald-300" : "text-amber-300"}`}>
                {result.researchCoverageReady ? "Research-inputs redo" : "Research-inputs blockerade"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Analyskörning: {result.analysisExecutionEnabled ? "på" : "avstängd"}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(result.coverage.checks) as Array<[CoverageCheckName, boolean]>).map(([name, passed]) => (
              <div key={name} className="flex items-center justify-between gap-3 border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
                <span className="text-slate-400">{CHECK_LABELS[name]}</span>
                <span className={passed ? "font-semibold text-emerald-300" : "font-semibold text-amber-300"}>
                  {passed ? "OK" : "BLOCK"}
                </span>
              </div>
            ))}
          </div>

          {result.researchSummary ? (
            <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-3">
              <div>
                <div className="text-slate-500">Finansiell historik</div>
                <div className="mt-1 text-slate-200">
                  {result.researchSummary.historicalPeriodsAnalyzed} perioder · {result.researchSummary.yearsCovered ?? "?"} år
                </div>
              </div>
              <div>
                <div className="text-slate-500">Teknisk historik</div>
                <div className="mt-1 text-slate-200">{result.researchSummary.technicalSessions} sessioner</div>
              </div>
              <div>
                <div className="text-slate-500">Källor</div>
                <div className="mt-1 text-slate-200">
                  {result.researchSummary.sourceCount} totalt · {result.researchSummary.primarySourceCount} primära · {result.researchSummary.evidenceCount} evidens
                </div>
              </div>
              <div>
                <div className="text-slate-500">Valuta</div>
                <div className="mt-1 text-slate-200">
                  kurs {result.researchSummary.marketCurrency} · rapport {result.researchSummary.reportingCurrency ?? "okänd"} · EPS {result.researchSummary.epsTtmCurrency ?? "okänd"}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Bolagstyp</div>
                <div className="mt-1 text-slate-200">{result.researchSummary.companyType}</div>
              </div>
              <div>
                <div className="text-slate-500">Facts-packet</div>
                <div className="mt-1 text-slate-200">
                  {result.coverage.factsResearchQuality.score}/100 · scenario-gate {result.coverage.factsResearchQuality.valuationScenarioCoverageDeferred ? "korrekt uppskjuten" : "oväntat aktiv"}
                </div>
              </div>
            </div>
          ) : null}

          {result.coverage.blockers.length ? (
            <div className="mt-4 border border-amber-400/20 bg-amber-400/[0.05] p-3 text-xs leading-5 text-amber-100">
              {result.coverage.blockers.map((blocker) => (
                <div key={blocker}>• {blocker}</div>
              ))}
            </div>
          ) : null}

          <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-slate-500">
            {result.message}
          </p>
        </div>
      ) : null}
    </section>
  );
}
