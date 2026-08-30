"use client";

import Link from "next/link";
import { useState } from "react";

type Target = {
  symbol: string;
  exchange: string;
  name: string;
};

type OperatorResult = {
  status?: string;
  reason?: string;
  publicPath?: string | null;
  researchQuality?: number;
  analystQuality?: number;
  view?: string;
  riskLevel?: string;
  confidence?: string;
  currentPrice?: number;
  currency?: string;
  dataAsOf?: string;
  model?: string;
  blockers?: string[];
  warnings?: string[];
  failedChecks?: string[];
  researchBlockers?: string[];
  researchWarnings?: string[];
  researchFailedChecks?: string[];
};

const TARGETS: Target[] = [
  { symbol: "ATCO-A", exchange: "ST", name: "Atlas Copco A" },
  { symbol: "EVO", exchange: "ST", name: "Evolution" },
  { symbol: "EMBRAC-B", exchange: "ST", name: "Embracer B" },
];

function quality(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value}/100` : "—";
}

export default function AnalysisPreviewOperator() {
  const [target, setTarget] = useState<Target>(TARGETS[0]!);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<OperatorResult | null>(null);

  async function run() {
    if (running) return;
    setRunning(true);
    setResult(null);
    try {
      const response = await fetch("/api/internal/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: target.symbol,
          exchange: target.exchange,
          persist: true,
          publish: true,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as OperatorResult;
      setResult(payload);
    } catch {
      setResult({ status: "failed", reason: "Kunde inte anropa Preview-analysmotorn." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
      <div className="grid gap-3 sm:grid-cols-3">
        {TARGETS.map((candidate) => {
          const selected = candidate.symbol === target.symbol;
          return (
            <button
              key={candidate.symbol}
              type="button"
              onClick={() => {
                if (!running) {
                  setTarget(candidate);
                  setResult(null);
                }
              }}
              className={`rounded-xl border px-4 py-4 text-left transition ${
                selected
                  ? "border-blue-400/50 bg-blue-400/10 text-white"
                  : "border-white/10 bg-black/10 text-slate-300 hover:border-white/20"
              }`}
            >
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {candidate.symbol}.{candidate.exchange}
              </span>
              <span className="mt-1 block font-semibold">{candidate.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-wait disabled:opacity-60"
        >
          {running ? "Analyserar…" : `Skapa & publicera ${target.name}`}
        </button>
        <span className="text-xs leading-5 text-slate-500">
          Kör riktig Deep Research + Analyst i Preview och skriver endast till dividend-lab-dev.
        </span>
      </div>

      {result ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Resultat</div>
              <div className={`mt-1 font-semibold ${result.status === "published" ? "text-emerald-300" : "text-amber-300"}`}>
                {result.status ?? "okänt"}
              </div>
            </div>
            {result.publicPath ? (
              <Link
                href={result.publicPath}
                className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/15"
              >
                Öppna publicerad analys →
              </Link>
            ) : null}
          </div>

          {result.reason ? <p className="mt-3 text-sm leading-6 text-red-300">{result.reason}</p> : null}

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-xs text-slate-500">Research quality</dt><dd className="mt-1 font-medium text-slate-200">{quality(result.researchQuality)}</dd></div>
            <div><dt className="text-xs text-slate-500">Analyst quality</dt><dd className="mt-1 font-medium text-slate-200">{quality(result.analystQuality)}</dd></div>
            <div><dt className="text-xs text-slate-500">AI-syn</dt><dd className="mt-1 font-medium text-slate-200">{result.view ?? "—"}</dd></div>
            <div><dt className="text-xs text-slate-500">Risk / confidence</dt><dd className="mt-1 font-medium text-slate-200">{result.riskLevel ?? "—"} / {result.confidence ?? "—"}</dd></div>
          </dl>

          {result.researchBlockers?.length ? (
            <div className="mt-5 rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/[0.06] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-300">Research blockers</div>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-fuchsia-100">
                {result.researchBlockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}
              </ul>
              {result.researchFailedChecks?.length ? (
                <p className="mt-3 text-xs text-fuchsia-200/70">Failed research checks: {result.researchFailedChecks.join(", ")}</p>
              ) : null}
            </div>
          ) : null}

          {result.blockers?.length ? (
            <div className="mt-5 rounded-lg border border-red-400/20 bg-red-400/[0.06] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-red-300">Analyst blockers</div>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-red-100">
                {result.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}
              </ul>
              {result.failedChecks?.length ? (
                <p className="mt-3 text-xs text-red-200/70">Failed checks: {result.failedChecks.join(", ")}</p>
              ) : null}
            </div>
          ) : null}

          {result.researchWarnings?.length ? (
            <div className="mt-4 rounded-lg border border-sky-300/15 bg-sky-300/[0.05] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">Research warnings</div>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-sky-100/90">
                {result.researchWarnings.map((warning) => <li key={warning}>• {warning}</li>)}
              </ul>
            </div>
          ) : null}

          {result.warnings?.length ? (
            <div className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/[0.05] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">Analyst warnings</div>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-100/90">
                {result.warnings.map((warning) => <li key={warning}>• {warning}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
