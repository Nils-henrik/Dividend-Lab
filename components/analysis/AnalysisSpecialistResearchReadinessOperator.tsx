"use client";

import { useState } from "react";

type MetricRow = {
  name: string;
  status: string;
  value: number | null;
  unit: string;
  sourceIds: string[];
};

type CanaryResponse = {
  status?: string;
  canaryReady?: boolean;
  message?: string;
  target?: string;
  expectedType?: string;
  detectedType?: string;
  classificationReady?: boolean;
  researchStatus?: string;
  provenanceReady?: boolean;
  sourceCount?: number;
  primarySourceCount?: number;
  evidenceCount?: number;
  marketSourceIds?: string[];
  primaryEvidence?: Array<{
    sourceId: string;
    reportPeriod: string | null;
    reportYear: number | null;
    documentType: string | null;
  }>;
  blockers?: string[];
  warnings?: string[];
  metrics?: MetricRow[];
  persistence?: null;
  publication?: null;
};

const TARGETS = [
  { key: "SEB-A.ST", label: "SEB", note: "Bank · Fact Book + release" },
  { key: "INVE-B.ST", label: "Investor", note: "Investment company · NAV/share" },
  { key: "EQT.ST", label: "EQT", note: "Asset manager · regression" },
] as const;

function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 4 }).format(value);
}

export default function AnalysisSpecialistResearchReadinessOperator() {
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<CanaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCanary(target: string) {
    if (running) return;
    setRunning(target);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/internal/analysis/specialist-research-canary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ target }),
      });
      const payload = (await response.json().catch(() => ({}))) as CanaryResponse;
      setResult(payload);
      if (!response.ok) {
        setError(payload.message ?? "Specialist-canaryn kunde inte slutföras.");
      }
    } catch {
      setError("Specialist-canaryn kunde inte slutföras.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <section className="border border-cyan-400/20 bg-cyan-400/[0.035] p-5 sm:p-7">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
        Specialist Research Readiness v2 · Preview canary
      </div>
      <h2 className="mt-2 text-xl font-semibold text-white">
        Verifiera SEB, Investor och EQT utan AI, persistence eller publicering
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        Den här canaryn kör endast den bounded deterministiska Research-kedjan. SEB måste behålla source-bound bankmått, Investor måste ha verifierad NAV/share plus spårbar marknadskurs för den deterministiska rabatten och EQT måste fortsätta vara research_ready.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {TARGETS.map((target) => (
          <button
            key={target.key}
            type="button"
            onClick={() => void runCanary(target.key)}
            disabled={running !== null}
            className="border border-cyan-300/25 bg-cyan-300/[0.07] px-4 py-3 text-left hover:bg-cyan-300/[0.11] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="text-sm font-semibold text-cyan-100">
              {running === target.key ? `Kör ${target.label}…` : `Kör ${target.label}-canary`}
            </div>
            <div className="mt-1 text-xs text-slate-500">{target.note}</div>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Endast de tre låsta målen accepteras av endpointen. Den här canaryn anropar ingen Analyst-modell och har ingen skrivväg till analyslagring eller publicering.
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
              <div className="text-xs text-slate-500">Specialist canary</div>
              <div className={`mt-1 text-lg font-semibold ${result.canaryReady ? "text-emerald-300" : "text-amber-300"}`}>
                {result.canaryReady ? "READY" : "BLOCKED"}
              </div>
              <div className="mt-1 text-xs text-slate-500">{result.target ?? "–"}</div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-right text-xs sm:grid-cols-4">
              <div>
                <div className="text-slate-500">Research</div>
                <div className="mt-1 font-semibold text-slate-200">{result.researchStatus ?? "–"}</div>
              </div>
              <div>
                <div className="text-slate-500">Provenance</div>
                <div className={`mt-1 font-semibold ${result.provenanceReady ? "text-emerald-300" : "text-amber-300"}`}>
                  {result.provenanceReady ? "BEVARAD" : "EJ BEVISAD"}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Persistence</div>
                <div className="mt-1 font-semibold text-emerald-300">{result.persistence === null ? "AV" : "OVÄNTAD"}</div>
              </div>
              <div>
                <div className="text-slate-500">Publicering</div>
                <div className="mt-1 font-semibold text-emerald-300">{result.publication === null ? "AV" : "OVÄNTAD"}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
            <div className="border border-white/10 bg-white/[0.02] px-3 py-2">
              <div className="text-slate-500">Klassificering</div>
              <div className="mt-1 text-slate-200">
                {result.detectedType ?? "–"} {result.classificationReady ? "✓" : "≠"} {result.expectedType ?? "–"}
              </div>
            </div>
            <div className="border border-white/10 bg-white/[0.02] px-3 py-2">
              <div className="text-slate-500">Källor</div>
              <div className="mt-1 text-slate-200">{result.sourceCount ?? "–"} totalt · {result.primarySourceCount ?? "–"} primära</div>
            </div>
            <div className="border border-white/10 bg-white/[0.02] px-3 py-2">
              <div className="text-slate-500">Evidens</div>
              <div className="mt-1 text-slate-200">{result.evidenceCount ?? "–"} poster</div>
            </div>
          </div>

          {result.metrics?.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {result.metrics.map((metric) => (
                <div key={metric.name} className="border border-white/10 bg-white/[0.02] px-3 py-3 text-xs">
                  <div className="font-semibold text-slate-300">{metric.name}</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {formatValue(metric.value)}{metric.value === null ? "" : ` ${metric.unit}`}
                  </div>
                  <div className={metric.status === "confirmed" || metric.status === "traceable" ? "mt-1 text-emerald-300" : "mt-1 text-amber-300"}>
                    {metric.status}
                  </div>
                  <div className="mt-2 break-all text-[10px] leading-4 text-slate-600">
                    {metric.sourceIds.length ? metric.sourceIds.join(" · ") : "ingen sourceId"}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {result.primaryEvidence?.length ? (
            <div className="mt-4 border-t border-white/10 pt-3 text-xs leading-5">
              <div className="mb-2 font-semibold text-slate-400">Primär evidens</div>
              {result.primaryEvidence.map((item) => (
                <div key={`${item.sourceId}:${item.reportPeriod}:${item.reportYear}`} className="break-all text-slate-600">
                  {item.sourceId} · {item.reportPeriod ?? "–"} {item.reportYear ?? ""} · {item.documentType ?? "–"}
                </div>
              ))}
            </div>
          ) : null}

          {result.blockers?.length ? (
            <div className="mt-4 border border-amber-400/20 bg-amber-400/[0.05] p-3 text-xs leading-5 text-amber-100">
              {result.blockers.map((blocker) => <div key={blocker}>• {blocker}</div>)}
            </div>
          ) : null}

          {result.warnings?.length ? (
            <div className="mt-3 border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-slate-500">
              {result.warnings.map((warning) => <div key={warning}>• {warning}</div>)}
            </div>
          ) : null}

          <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-slate-500">
            {result.message ?? result.status ?? "Canaryn avslutades."}
          </p>
        </div>
      ) : null}
    </section>
  );
}
