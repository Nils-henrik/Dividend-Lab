"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Target = {
  symbol: string;
  exchange: string;
  name: string;
  yahooSymbol: string;
  currency?: string | null;
  exchangeLabel?: string | null;
  canPreflight: boolean;
  canRunAnalysis: boolean;
  unsupportedReason?: string | null;
};

type SearchResult = Target & {
  kind: "equity" | "index" | "etf" | "other";
  supported: boolean;
};

type SearchResponse = {
  status?: string;
  results?: SearchResult[];
};

type PreflightResult = {
  status?: string;
  supported?: boolean;
  companyType?: string;
  methodologyStatus?: string;
  methodologySupported?: boolean;
  researchCoverageReady?: boolean;
  analysisEngine?: string | null;
  message?: string;
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

const CURATED_TARGETS: Target[] = [
  {
    symbol: "ATCO-A",
    exchange: "ST",
    name: "Atlas Copco A",
    yahooSymbol: "ATCO-A.ST",
    currency: "SEK",
    exchangeLabel: "Stockholm",
    canPreflight: true,
    canRunAnalysis: true,
  },
  {
    symbol: "EVO",
    exchange: "ST",
    name: "Evolution",
    yahooSymbol: "EVO.ST",
    currency: "SEK",
    exchangeLabel: "Stockholm",
    canPreflight: true,
    canRunAnalysis: true,
  },
  {
    symbol: "EMBRAC-B",
    exchange: "ST",
    name: "Embracer B",
    yahooSymbol: "EMBRAC-B.ST",
    currency: "SEK",
    exchangeLabel: "Stockholm",
    canPreflight: true,
    canRunAnalysis: true,
  },
];

function quality(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value}/100` : "—";
}

function targetKey(target: Target): string {
  return target.yahooSymbol;
}

export default function AnalysisPreviewOperator() {
  const [target, setTarget] = useState<Target>(CURATED_TARGETS[0]!);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [preflighting, setPreflighting] = useState(false);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<OperatorResult | null>(null);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2 || searching) return;

    setSearching(true);
    setSearchMessage(null);
    setSearchResults([]);
    try {
      const response = await fetch(`/api/internal/analysis/search?q=${encodeURIComponent(trimmed)}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as SearchResponse;
      const results = Array.isArray(payload.results) ? payload.results : [];
      setSearchResults(results);
      if (!response.ok) {
        setSearchMessage("Sökningen kunde inte genomföras just nu.");
      } else if (!results.length) {
        setSearchMessage("Ingen noterad träff hittades.");
      }
    } catch {
      setSearchMessage("Sökningen kunde inte genomföras just nu.");
    } finally {
      setSearching(false);
    }
  }

  async function verifyMethodology(candidate: Target) {
    if (!candidate.canPreflight || preflighting) return;
    setPreflighting(true);
    setPreflight(null);
    setResult(null);
    try {
      const response = await fetch(
        `/api/internal/analysis/preflight?yahooSymbol=${encodeURIComponent(candidate.yahooSymbol)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => ({}))) as PreflightResult;
      setPreflight(payload);
    } catch {
      setPreflight({
        status: "failed",
        supported: false,
        message: "Metodik-preflight kunde inte genomföras.",
      });
    } finally {
      setPreflighting(false);
    }
  }

  function selectTarget(candidate: Target) {
    if (running) return;
    setTarget(candidate);
    setPreflight(null);
    setResult(null);
    if (candidate.canPreflight) void verifyMethodology(candidate);
  }

  async function run() {
    if (running || !target.canRunAnalysis || preflight?.supported === false) return;
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

  const runDisabled =
    running || !target.canRunAnalysis || preflight?.supported === false || preflighting;

  return (
    <div className="border border-white/10 bg-white/[0.025] p-5 sm:p-7">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Global Instrument Discovery v1
        </div>
        <h2 className="mt-2 text-xl font-semibold text-white">Sök valfri noterad aktie</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Sökningen är global. En träff får gå vidare till metodik-preflight, men full Deep Research hålls låst tills DivLab har verifierad primärkälle- och webbresearch för marknaden.
        </p>
      </div>

      <form onSubmit={search} className="mt-5 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Microsoft, MSFT, Toyota, 7203.T…"
          className="min-w-0 flex-1 border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400/60"
          maxLength={80}
        />
        <button
          type="submit"
          disabled={searching || query.trim().length < 2}
          className="border border-blue-400/40 bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {searching ? "Söker…" : "Sök"}
        </button>
      </form>

      {searchMessage ? <p className="mt-3 text-sm text-amber-200">{searchMessage}</p> : null}

      {searchResults.length ? (
        <div className="mt-4 divide-y divide-white/10 border border-white/10">
          {searchResults.map((candidate) => {
            const selected = targetKey(candidate) === targetKey(target);
            return (
              <button
                key={`${candidate.yahooSymbol}:${candidate.exchange}`}
                type="button"
                onClick={() => selectTarget(candidate)}
                className={`grid w-full gap-2 px-4 py-3 text-left transition sm:grid-cols-[1fr_auto] sm:items-center ${
                  selected ? "bg-blue-400/10" : "bg-black/10 hover:bg-white/[0.04]"
                }`}
              >
                <span>
                  <span className="block font-semibold text-slate-100">{candidate.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {candidate.yahooSymbol} · {candidate.exchangeLabel ?? candidate.exchange}
                    {candidate.currency ? ` · ${candidate.currency}` : ""}
                  </span>
                </span>
                <span className={`text-xs font-semibold ${candidate.canPreflight ? "text-emerald-300" : "text-slate-600"}`}>
                  {candidate.canRunAnalysis
                    ? "Research redo"
                    : candidate.canPreflight
                      ? "Metodik kan verifieras"
                      : "Separat metodik krävs"}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-7 border-t border-white/10 pt-5">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Snabbtest</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {CURATED_TARGETS.map((candidate) => {
            const selected = targetKey(candidate) === targetKey(target);
            return (
              <button
                key={candidate.yahooSymbol}
                type="button"
                onClick={() => selectTarget(candidate)}
                className={`border px-4 py-3 text-left transition ${
                  selected
                    ? "border-blue-400/50 bg-blue-400/10 text-white"
                    : "border-white/10 bg-black/10 text-slate-300 hover:border-white/20"
                }`}
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {candidate.yahooSymbol}
                </span>
                <span className="mt-1 block font-semibold">{candidate.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Valt instrument</div>
            <div className="mt-1 font-semibold text-white">{target.name}</div>
            <div className="mt-1 text-xs text-slate-500">
              {target.yahooSymbol} · {target.exchangeLabel ?? target.exchange}
              {target.currency ? ` · ${target.currency}` : ""}
            </div>
          </div>
          {target.canPreflight ? (
            <button
              type="button"
              onClick={() => void verifyMethodology(target)}
              disabled={preflighting}
              className="border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-white/30 disabled:opacity-50"
            >
              {preflighting ? "Verifierar…" : "Verifiera metodik"}
            </button>
          ) : null}
        </div>

        {preflight ? (
          <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-6">
            <div className="grid gap-2 sm:grid-cols-3">
              <div><span className="text-slate-500">Bolagstyp:</span> <span className="text-slate-200">{preflight.companyType ?? "—"}</span></div>
              <div><span className="text-slate-500">Motor:</span> <span className="text-slate-200">{preflight.analysisEngine ?? "—"}</span></div>
              <div><span className="text-slate-500">Research:</span> <span className={preflight.researchCoverageReady ? "text-emerald-300" : "text-amber-300"}>{preflight.researchCoverageReady ? "redo" : "låst"}</span></div>
            </div>
            {preflight.message ? <p className="mt-3 text-slate-400">{preflight.message}</p> : null}
          </div>
        ) : target.unsupportedReason ? (
          <p className="mt-4 text-sm leading-6 text-amber-200">{target.unsupportedReason}</p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={runDisabled}
          className="border border-blue-400/40 bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {running ? "Analyserar…" : `Skapa & publicera ${target.name}`}
        </button>
        <span className="text-xs leading-5 text-slate-500">
          Kör riktig Deep Research + Analyst i Preview och skriver endast till dividend-lab-dev.
        </span>
      </div>

      {result ? (
        <div className="mt-6 border border-white/10 bg-black/20 p-4">
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
                className="border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/15"
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
            <div className="mt-5 border border-fuchsia-400/20 bg-fuchsia-400/[0.06] p-4">
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
            <div className="mt-5 border border-red-400/20 bg-red-400/[0.06] p-4">
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
            <div className="mt-4 border border-sky-300/15 bg-sky-300/[0.05] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">Research warnings</div>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-sky-100/90">
                {result.researchWarnings.map((warning) => <li key={warning}>• {warning}</li>)}
              </ul>
            </div>
          ) : null}

          {result.warnings?.length ? (
            <div className="mt-4 border border-amber-300/15 bg-amber-300/[0.05] p-4">
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
