"use client";

import { FormEvent, useState } from "react";

type SearchResult = {
  yahooSymbol: string;
  symbol: string;
  exchange: string;
  exchangeLabel: string | null;
  name: string;
  kind: "equity" | "index" | "etf" | "other";
  currency: string | null;
  canPreflight: boolean;
  canRunAnalysis: boolean;
};

type SearchResponse = {
  results?: SearchResult[];
};

type SourceItem = {
  id: string;
  kind: string;
  publisher: string;
  url: string;
  publishedAt: string | null;
  primary: boolean;
  form: string | null;
};

type DiscoveryResponse = {
  status?: string;
  researchCoverageReady?: boolean;
  evidenceExtractionReady?: boolean;
  message?: string;
  discovery?: {
    status: string;
    companyName: string;
    primarySourceCount: number;
    annualPrimaryCount: number;
    interimPrimaryCount: number;
    readyForEvidenceExtraction: boolean;
    sources: SourceItem[];
    reason: string;
  } | null;
};

type EvidenceResponse = {
  status?: string;
  evidenceQualityReady?: boolean;
  researchCoverageReady?: boolean;
  message?: string;
  extraction?: {
    bundle: {
      qualityGate: {
        ready: boolean;
        score: number;
        blockers: string[];
      };
      evidence: Array<{
        id: string;
        sourceId: string;
        title: string;
        documentType: string | null;
        documentExcerpt?: string | null;
      }>;
      documents: Array<{
        sourceId: string;
        bytes: number;
        contentType: string;
        truncated: boolean;
      }>;
    };
    failures: Array<{ sourceId: string; reason: string }>;
  } | null;
};

function statusLabel(item: SourceItem): string {
  if (item.primary) return item.form ? `Primärkälla · ${item.form}` : "Primärkälla";
  if (item.kind === "issuer_ir_candidate") return "IR-kandidat";
  return "Bolagsdomän";
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1_000) return `${Math.round(bytes)} B`;
  if (bytes < 1_000_000) return `${Math.round(bytes / 1_000)} kB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export default function AnalysisSourceDiscoveryOperator() {
  const [query, setQuery] = useState("MSFT");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2 || searching) return;
    setSearching(true);
    setResults([]);
    setSelected(null);
    setDiscovery(null);
    setEvidence(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/internal/analysis/search?q=${encodeURIComponent(trimmed)}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as SearchResponse;
      const equities = (payload.results ?? []).filter(
        (item) => item.kind === "equity" && item.canPreflight,
      );
      setResults(equities);
      if (!response.ok) setMessage("Instrument-sökningen kunde inte genomföras.");
      else if (!equities.length) setMessage("Ingen verifierbar aktieträff hittades.");
    } catch {
      setMessage("Instrument-sökningen kunde inte genomföras.");
    } finally {
      setSearching(false);
    }
  }

  async function discover(target: SearchResult) {
    if (discovering || extracting) return;
    setSelected(target);
    setDiscovery(null);
    setEvidence(null);
    setMessage(null);
    setDiscovering(true);
    try {
      const response = await fetch(
        `/api/internal/analysis/source-discovery?yahooSymbol=${encodeURIComponent(target.yahooSymbol)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => ({}))) as DiscoveryResponse;
      setDiscovery(payload);
      if (!response.ok) setMessage(payload.message ?? "Källverifieringen misslyckades.");
    } catch {
      setMessage("Källverifieringen kunde inte genomföras.");
    } finally {
      setDiscovering(false);
    }
  }

  async function extractEvidence() {
    if (!selected || extracting || !discovery?.evidenceExtractionReady) return;
    setExtracting(true);
    setEvidence(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/internal/analysis/evidence-extraction?yahooSymbol=${encodeURIComponent(selected.yahooSymbol)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => ({}))) as EvidenceResponse;
      setEvidence(payload);
      if (!response.ok) setMessage(payload.message ?? "Evidence extraction nådde inte quality gate.");
    } catch {
      setMessage("SEC-dokumenten kunde inte extraheras säkert.");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="border border-white/10 bg-white/[0.025] p-5 sm:p-7">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Global Source Discovery + Evidence v1
      </div>
      <h2 className="mt-2 text-xl font-semibold text-white">Verifiera och läs primärkällor före Research</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        USA verifieras mot SEC EDGAR. Ett separat steg hämtar högst två verifierade SEC-filings och gör bounded, sourceId-spårbar evidens. Inte ens en 100/100 evidence-gate startar Deep Research automatiskt.
      </p>

      <form onSubmit={search} className="mt-5 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="MSFT, Microsoft, 7203.T, Toyota…"
          maxLength={80}
          className="min-w-0 flex-1 border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400/60"
        />
        <button
          type="submit"
          disabled={searching || query.trim().length < 2}
          className="border border-blue-400/40 bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {searching ? "Söker…" : "Sök"}
        </button>
      </form>

      {message ? <p className="mt-3 text-sm text-amber-200">{message}</p> : null}

      {results.length ? (
        <div className="mt-4 divide-y divide-white/10 border border-white/10">
          {results.map((item) => (
            <button
              key={item.yahooSymbol}
              type="button"
              onClick={() => void discover(item)}
              disabled={discovering || extracting}
              className={`grid w-full gap-2 px-4 py-3 text-left sm:grid-cols-[1fr_auto] sm:items-center ${
                selected?.yahooSymbol === item.yahooSymbol
                  ? "bg-blue-400/10"
                  : "bg-black/10 hover:bg-white/[0.04]"
              } disabled:opacity-60`}
            >
              <span>
                <span className="block font-semibold text-slate-100">{item.name}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {item.yahooSymbol} · {item.exchangeLabel ?? item.exchange}
                  {item.currency ? ` · ${item.currency}` : ""}
                </span>
              </span>
              <span className="text-xs font-semibold text-blue-300">
                {discovering && selected?.yahooSymbol === item.yahooSymbol
                  ? "Verifierar…"
                  : item.canRunAnalysis
                    ? "Nordisk kedja redan redo"
                    : "Verifiera globala källor"}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {discovery ? (
        <div className="mt-6 border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <div className="text-xs text-slate-500">Primärkällor</div>
              <div className="mt-1 font-semibold text-white">
                {discovery.discovery?.primarySourceCount ?? (discovery.researchCoverageReady ? "Nordic" : 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Årsfiling</div>
              <div className="mt-1 font-semibold text-white">{discovery.discovery?.annualPrimaryCount ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Interimfiling</div>
              <div className="mt-1 font-semibold text-white">{discovery.discovery?.interimPrimaryCount ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Full Research</div>
              <div className={`mt-1 font-semibold ${discovery.researchCoverageReady ? "text-emerald-300" : "text-amber-300"}`}>
                {discovery.researchCoverageReady ? "redo" : "fortsatt låst"}
              </div>
            </div>
          </div>

          <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-slate-400">
            {discovery.message ?? discovery.discovery?.reason ?? "Ingen status tillgänglig."}
          </p>

          {discovery.discovery?.sources?.length ? (
            <div className="mt-4 divide-y divide-white/10 border border-white/10">
              {discovery.discovery.sources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="grid gap-2 px-4 py-3 text-sm hover:bg-white/[0.04] sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <span>
                    <span className="block font-medium text-slate-200">{source.publisher}</span>
                    <span className="mt-1 block break-all text-xs text-slate-500">{source.url}</span>
                  </span>
                  <span className={source.primary ? "text-xs font-semibold text-emerald-300" : "text-xs font-semibold text-amber-300"}>
                    {statusLabel(source)}
                  </span>
                </a>
              ))}
            </div>
          ) : null}

          {discovery.evidenceExtractionReady && !discovery.researchCoverageReady ? (
            <div className="mt-4 border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
              <p className="text-xs leading-5 text-emerald-100">
                Källorna är redo för bounded evidence extraction. Det öppnar fortfarande inte Deep Research automatiskt.
              </p>
              <button
                type="button"
                onClick={() => void extractEvidence()}
                disabled={extracting}
                className="mt-3 border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {extracting ? "Läser SEC-filings…" : "Extrahera verifierad evidens"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {evidence ? (
        <div className="mt-6 border border-white/10 bg-black/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Evidence extraction</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {evidence.extraction?.bundle.qualityGate.score ?? 0}/100
              </div>
            </div>
            <div className={`text-sm font-semibold ${evidence.evidenceQualityReady ? "text-emerald-300" : "text-amber-300"}`}>
              {evidence.evidenceQualityReady ? "Evidence redo för nästa gate" : "Evidence blockerad"}
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-400">{evidence.message}</p>

          {evidence.extraction?.bundle.qualityGate.blockers?.length ? (
            <div className="mt-4 border border-amber-400/20 bg-amber-400/[0.05] p-3 text-xs leading-5 text-amber-100">
              {evidence.extraction.bundle.qualityGate.blockers.map((blocker) => (
                <div key={blocker}>• {blocker}</div>
              ))}
            </div>
          ) : null}

          {evidence.extraction?.bundle.evidence?.length ? (
            <div className="mt-4 divide-y divide-white/10 border border-white/10">
              {evidence.extraction.bundle.evidence.map((item) => {
                const document = evidence.extraction?.bundle.documents.find((candidate) => candidate.sourceId === item.sourceId);
                return (
                  <div key={item.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-slate-200">{item.title}</div>
                      <div className="text-xs text-slate-500">
                        {item.documentType ?? "SEC"}
                        {document ? ` · ${formatBytes(document.bytes)}${document.truncated ? " · avkortad" : ""}` : ""}
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                      {(item.documentExcerpt ?? "").slice(0, 700)}
                      {(item.documentExcerpt?.length ?? 0) > 700 ? "…" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-slate-500">
            Full Research: {evidence.researchCoverageReady ? "redo" : "fortsatt låst"}. Evidence-gaten bevisar dokumenthämtning och proveniens, inte komplett fundamental Research-täckning.
          </div>
        </div>
      ) : null}
    </div>
  );
}
