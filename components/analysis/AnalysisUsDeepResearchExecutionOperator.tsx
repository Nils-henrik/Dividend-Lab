"use client";

import { useState } from "react";

type ExecutionResponse = {
  status?: string;
  executionReady?: boolean;
  message?: string;
  usResearchCoverage?: { ready: boolean; score: number };
  evidenceQuality?: number;
  researchQuality?: number;
  analystQuality?: number;
  secSourceProvenancePreserved?: boolean;
  secEvidenceProvenancePreserved?: boolean;
  sourceCount?: number;
  evidenceCount?: number;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsdMicros: number;
  };
  view?: string;
  riskLevel?: string;
  confidence?: string;
  scenarios?: Array<{
    name: string;
    valuePerShare: number | null;
    upsideDownsidePct: number | null;
  }>;
  persistence?: null;
  publication?: null;
  researchBlockers?: string[];
  analystBlockers?: string[];
};

function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: digits }).format(value);
}

export default function AnalysisUsDeepResearchExecutionOperator() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runExecution() {
    if (running) return;
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/internal/analysis/us-deep-research-execution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ yahooSymbol: "MSFT" }),
      });
      const payload = (await response.json().catch(() => ({}))) as ExecutionResponse;
      setResult(payload);
      if (!response.ok) {
        setError(payload.message ?? "MSFT Preview Deep Research kunde inte slutföras.");
      }
    } catch {
      setError("MSFT Preview Deep Research kunde inte slutföras.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="border border-violet-400/20 bg-violet-400/[0.035] p-5 sm:p-7">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
        US Preview Deep Research Execution v1 · MSFT
      </div>
      <h2 className="mt-2 text-xl font-semibold text-white">
        Kör hela Analyst-kedjan utan att spara eller publicera
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        Den här körningen verifierar SEC-källor och Research 100/100 först och får därefter anropa DivLabs befintliga Analyst-motor. Resultatet godkänns bara om både final Research och Analyst når 100/100 och SEC-proveniensen finns kvar. Ingen persistence eller publicering är tillåten.
      </p>

      <button
        type="button"
        onClick={() => void runExecution()}
        disabled={running}
        className="mt-5 border border-violet-300/30 bg-violet-300/10 px-4 py-2.5 text-sm font-semibold text-violet-100 hover:bg-violet-300/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? "Kör MSFT Deep Research…" : "Kör MSFT Preview Deep Research"}
      </button>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Knappen gör en riktig Preview-körning av Analyst-modellen och kan därför förbruka AI-tokens. Den kan inte spara eller publicera analysen.
      </p>

      {error ? (
        <p className="mt-4 border border-amber-400/20 bg-amber-400/[0.05] p-3 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-5 border border-white/10 bg-black/25 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500">Execution gate</div>
              <div className={`mt-1 text-lg font-semibold ${result.executionReady ? "text-emerald-300" : "text-amber-300"}`}>
                {result.executionReady ? "READY" : "BLOCKED"}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-right text-xs">
              <div>
                <div className="text-slate-500">US Research</div>
                <div className="mt-1 font-semibold text-slate-200">{result.usResearchCoverage?.score ?? "–"}/100</div>
              </div>
              <div>
                <div className="text-slate-500">Final Research</div>
                <div className="mt-1 font-semibold text-slate-200">{result.researchQuality ?? "–"}/100</div>
              </div>
              <div>
                <div className="text-slate-500">Analyst</div>
                <div className="mt-1 font-semibold text-slate-200">{result.analystQuality ?? "–"}/100</div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
              <div className="text-slate-500">SEC source-proveniens</div>
              <div className={result.secSourceProvenancePreserved ? "mt-1 font-semibold text-emerald-300" : "mt-1 font-semibold text-amber-300"}>
                {result.secSourceProvenancePreserved ? "BEVARAD" : "EJ BEVISAD"}
              </div>
            </div>
            <div className="border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
              <div className="text-slate-500">SEC evidens-proveniens</div>
              <div className={result.secEvidenceProvenancePreserved ? "mt-1 font-semibold text-emerald-300" : "mt-1 font-semibold text-amber-300"}>
                {result.secEvidenceProvenancePreserved ? "BEVARAD" : "EJ BEVISAD"}
              </div>
            </div>
            <div className="border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
              <div className="text-slate-500">Persistence</div>
              <div className="mt-1 font-semibold text-emerald-300">{result.persistence === null ? "AV" : "OVÄNTAD"}</div>
            </div>
            <div className="border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
              <div className="text-slate-500">Publicering</div>
              <div className="mt-1 font-semibold text-emerald-300">{result.publication === null ? "AV" : "OVÄNTAD"}</div>
            </div>
          </div>

          {result.executionReady ? (
            <>
              <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-3">
                <div>
                  <div className="text-slate-500">DivLab-syn</div>
                  <div className="mt-1 text-slate-200">{result.view ?? "–"}</div>
                </div>
                <div>
                  <div className="text-slate-500">Risk / confidence</div>
                  <div className="mt-1 text-slate-200">{result.riskLevel ?? "–"} · {result.confidence ?? "–"}</div>
                </div>
                <div>
                  <div className="text-slate-500">Källpaket</div>
                  <div className="mt-1 text-slate-200">{result.sourceCount ?? "–"} källor · {result.evidenceCount ?? "–"} evidens</div>
                </div>
                <div>
                  <div className="text-slate-500">Evidence gate</div>
                  <div className="mt-1 text-slate-200">{result.evidenceQuality ?? "–"}/100</div>
                </div>
                <div>
                  <div className="text-slate-500">AI-tokens</div>
                  <div className="mt-1 text-slate-200">{result.usage ? formatNumber(result.usage.totalTokens, 0) : "–"}</div>
                </div>
                <div>
                  <div className="text-slate-500">Estimerad modellkostnad</div>
                  <div className="mt-1 text-slate-200">
                    {result.usage ? `$${formatNumber(result.usage.estimatedCostUsdMicros / 1_000_000, 4)}` : "–"}
                  </div>
                </div>
              </div>

              {result.scenarios?.length ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {result.scenarios.map((scenario) => (
                    <div key={scenario.name} className="border border-white/10 bg-white/[0.02] px-3 py-3 text-xs">
                      <div className="font-semibold uppercase tracking-[0.12em] text-slate-400">{scenario.name}</div>
                      <div className="mt-2 text-sm font-semibold text-white">{formatNumber(scenario.valuePerShare)}</div>
                      <div className="mt-1 text-slate-500">{formatNumber(scenario.upsideDownsidePct)}%</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          {result.researchBlockers?.length ? (
            <div className="mt-4 border border-amber-400/20 bg-amber-400/[0.05] p-3 text-xs leading-5 text-amber-100">
              {result.researchBlockers.map((blocker) => <div key={blocker}>• {blocker}</div>)}
            </div>
          ) : null}
          {result.analystBlockers?.length ? (
            <div className="mt-4 border border-amber-400/20 bg-amber-400/[0.05] p-3 text-xs leading-5 text-amber-100">
              {result.analystBlockers.map((blocker) => <div key={blocker}>• {blocker}</div>)}
            </div>
          ) : null}

          <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-slate-500">
            {result.message ?? result.status ?? "Körningen avslutades."}
          </p>
        </div>
      ) : null}
    </section>
  );
}
