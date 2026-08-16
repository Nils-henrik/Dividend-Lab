"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SearchResult = {
  yahooSymbol: string;
  symbol: string;
  exchange: string;
  name: string;
  kind: "equity" | "index" | "etf" | "other";
  currency: string | null;
  supported: boolean;
  unsupportedReason: string | null;
};

type RunResult = {
  status?: string;
  reason?: string;
  publicPath?: string | null;
  researchQuality?: number;
  analystQuality?: number;
  view?: string;
  riskLevel?: string;
  confidence?: string;
};

function kindLabel(kind: SearchResult["kind"]): string {
  if (kind === "equity") return "Aktie";
  if (kind === "index") return "Index";
  if (kind === "etf") return "ETF";
  return "Instrument";
}

export default function AnalysisCreator() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const normalizedQuery = query.trim();
  const canRun = Boolean(selected?.supported && !running);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setResults([]);
      setSelected(null);
      setMessage(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      setMessage(null);
      void fetch(`/api/internal/analysis/search?q=${encodeURIComponent(normalizedQuery)}`, {
        signal: controller.signal,
        cache: "no-store",
      })
        .then(async (response) => {
          const payload = (await response.json().catch(() => ({}))) as {
            results?: SearchResult[];
            status?: string;
          };
          if (!response.ok) {
            throw new Error(payload.status ?? "search_failed");
          }
          setResults(payload.results ?? []);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setResults([]);
          setMessage("Kunde inte söka instrument just nu.");
        })
        .finally(() => setSearching(false));
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [normalizedQuery]);

  const selectedLabel = useMemo(() => {
    if (!selected) return null;
    return `${selected.name} · ${selected.yahooSymbol}`;
  }, [selected]);

  async function runAnalysis() {
    if (!selected?.supported || running) return;
    setRunning(true);
    setMessage(null);
    setRunResult(null);
    try {
      const response = await fetch("/api/internal/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selected.symbol,
          exchange: selected.exchange,
          persist: true,
          publish: true,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as RunResult;
      setRunResult(payload);
      if (!response.ok) {
        setMessage(payload.reason ?? payload.status ?? "Analysen stoppades av motorn.");
      }
    } catch {
      setMessage("Kunde inte starta analysmotorn.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="border-y border-white/12 py-6 sm:py-8" aria-labelledby="new-analysis-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">Ny analys</div>
          <h2 id="new-analysis-title" className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">
            Sök bolag eller marknadsindex
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
            Skriv namn eller ticker, till exempel Atlas Copco, EVO eller OMXS30. Nordiska aktier kan köras genom hela bolagsmotorn. Index visas separat tills indexmetodiken är verifierad.
          </p>
        </div>
      </div>

      <div className="mt-6 border border-white/12 bg-black/20">
        <label htmlFor="analysis-search" className="sr-only">Sök instrument</label>
        <div className="flex items-center border-b border-white/10">
          <span className="px-4 text-slate-600" aria-hidden="true">⌕</span>
          <input
            id="analysis-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
              setRunResult(null);
            }}
            placeholder="Sök namn eller ticker…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-0 py-4 text-base text-white outline-none placeholder:text-slate-600"
          />
          <span className="px-4 text-[10px] uppercase tracking-[0.14em] text-slate-600">
            {searching ? "Söker…" : "Yahoo"}
          </span>
        </div>

        {normalizedQuery.length >= 2 ? (
          <div>
            {results.length ? (
              results.map((result) => {
                const isSelected = selected?.yahooSymbol === result.yahooSymbol;
                return (
                  <button
                    key={`${result.yahooSymbol}-${result.kind}`}
                    type="button"
                    onClick={() => {
                      setSelected(result);
                      setMessage(result.supported ? null : result.unsupportedReason);
                      setRunResult(null);
                    }}
                    className={`flex w-full items-start justify-between gap-4 border-b border-white/10 px-4 py-4 text-left transition last:border-b-0 ${
                      isSelected ? "bg-blue-400/[0.07]" : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-100">{result.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {result.yahooSymbol} · {kindLabel(result.kind)}{result.currency ? ` · ${result.currency}` : ""}
                      </span>
                    </span>
                    <span className={`shrink-0 text-xs font-semibold ${result.supported ? "text-emerald-300" : "text-slate-600"}`}>
                      {result.supported ? "Kan analyseras" : "Separat metodik"}
                    </span>
                  </button>
                );
              })
            ) : !searching ? (
              <div className="px-4 py-5 text-sm text-slate-600">Inga instrument hittades.</div>
            ) : null}
          </div>
        ) : null}
      </div>

      {selected ? (
        <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-600">Valt instrument</div>
            <div className="mt-1 font-medium text-slate-200">{selectedLabel}</div>
            {!selected.supported && selected.unsupportedReason ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-200/80">{selected.unsupportedReason}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={!canRun}
            className="shrink-0 border border-blue-400/45 px-5 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-700"
          >
            {running ? "Deep Research kör…" : "Skapa & publicera analys"}
          </button>
        </div>
      ) : null}

      {message ? <p className="mt-4 text-sm leading-6 text-amber-200/80">{message}</p> : null}

      {runResult ? (
        <div className="mt-5 border-t border-white/12 pt-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className={runResult.status === "published" ? "font-semibold text-emerald-300" : "font-semibold text-amber-300"}>
              {runResult.status ?? "okänt resultat"}
            </span>
            <span className="text-slate-500">Research {runResult.researchQuality ?? "—"}/100</span>
            <span className="text-slate-500">Analyst {runResult.analystQuality ?? "—"}/100</span>
            {runResult.publicPath ? (
              <Link href={runResult.publicPath} className="font-semibold text-blue-400 hover:text-blue-300">
                Öppna publicerad analys →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
