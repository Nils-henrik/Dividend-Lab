import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelPortfolioEvidence } from "./decision";
import type { DelayedQuote } from "./eodhd";
import { fetchEodhdFundamentals } from "./eodhd";
import type { EodhdCallBudget, EodhdCallBudgetSnapshot, ModelPortfolioResearchPass } from "./eodhd-budget";
import { createScheduledEodhdBudget } from "./eodhd-budget";
import { fetchFxRateToSek } from "./fx-adapter";
import { searchGoogleCompanyResearch } from "./google-research";
import { rankResearchUniverse, type ResearchCandidate } from "./research";
import {
  mergeFundamentalScores,
  parseEodhdFundamentalsPayload,
  scoreEodhdFundamentals,
} from "./research-fundamentals";
import { buildMarketResearchCandidate } from "./research-market";
import {
  loadFreshCandidateBundle,
  persistCandidateBundle,
  persistGoogleResearchHit,
  storedBundleToEvidence,
  type ResearchFundamentalsSource,
} from "./research-store";
import { discoverYahooCandidates } from "./yahoo-discovery";
import { fetchYahooFundamentals, fetchYahooHistoryResearch, toYahooSymbol } from "./yahoo-research";

const NORDIC_CORE = [
  { symbol: "INVE-B", exchange: "ST", name: "Investor AB ser. B" },
  { symbol: "VOLV-B", exchange: "ST", name: "Volvo AB ser. B" },
  { symbol: "ATCO-A", exchange: "ST", name: "Atlas Copco AB ser. A" },
  { symbol: "SEB-A", exchange: "ST", name: "SEB AB ser. A" },
  { symbol: "ERIC-B", exchange: "ST", name: "Ericsson AB ser. B" },
  { symbol: "EVO", exchange: "ST", name: "Evolution AB" },
  { symbol: "TEL2-B", exchange: "ST", name: "Tele2 AB ser. B" },
] as const;

const US_QUALITY_CORE = [
  { symbol: "MSFT", exchange: "US", name: "Microsoft" },
  { symbol: "AAPL", exchange: "US", name: "Apple" },
  { symbol: "GOOGL", exchange: "US", name: "Alphabet" },
  { symbol: "AMZN", exchange: "US", name: "Amazon" },
  { symbol: "META", exchange: "US", name: "Meta Platforms" },
  { symbol: "JPM", exchange: "US", name: "JPMorgan Chase" },
  { symbol: "NVDA", exchange: "US", name: "NVIDIA" },
] as const;

const CACHE_TTL_MS = 4 * 60 * 60 * 1_000;
const MAX_SEEDS = 18;
const MAX_FUNDAMENTAL_TARGETS = 8;
const MAX_GOOGLE_TARGETS = 2;
const MAX_EODHD_FUNDAMENTAL_CALLS_PER_PASS = 2;

type HoldingSeed = {
  instrument_symbol: string;
  exchange: string;
  instrument_name: string;
};

type Seed = {
  symbol: string;
  exchange: string;
  name: string;
  yahooSymbol: string;
  discoveryMarketCapUsd?: number | null;
  discoveryPrice?: number | null;
  discoveryVolume?: number | null;
  discoveryChangePct?: number | null;
  held: boolean;
};

export type ResearchCandidateDiagnostic = {
  symbol: string;
  exchange: string;
  quoteAsOf: string | null;
  historyBars: number;
  cacheHit: boolean;
  fundamentalsSource: ResearchFundamentalsSource;
  googleHits: number;
  error?: string;
};

export type ModelPortfolioResearchPipelineResult = {
  pass: ModelPortfolioResearchPass;
  candidates: ResearchCandidate[];
  evidence: ModelPortfolioEvidence[];
  quotes: Map<string, DelayedQuote>;
  names: Map<string, string>;
  diagnostics: ResearchCandidateDiagnostic[];
  summary: string;
  eodhdBudget: EodhdCallBudgetSnapshot;
};

function key(symbol: string, exchange: string): string {
  return `${symbol}.${exchange}`.toUpperCase();
}

function normalizeExchange(exchange: string): string | null {
  const value = exchange.trim().toUpperCase();
  if (["ST", "STO", "XSTO"].includes(value)) return "ST";
  if (["CO", "CPH", "XCSE"].includes(value)) return "CO";
  if (["HE", "HEL", "XHEL"].includes(value)) return "HE";
  if (["OL", "OSL", "XOSL"].includes(value)) return "OL";
  if (["US", "NASDAQ", "NASDAQGS", "NASDAQGM", "NASDAQCM", "NYSE", "NYQ", "NMS", "NGM", "NCM"].includes(value)) return "US";
  return null;
}

function isUsPass(pass: ModelPortfolioResearchPass): boolean {
  return pass !== "nordic_morning";
}

function marketForEodhd(exchange: string): "US" | "SE" | "DK" | "FI" | "NO" | null {
  if (exchange === "US") return "US";
  if (exchange === "ST") return "SE";
  if (exchange === "CO") return "DK";
  if (exchange === "HE") return "FI";
  if (exchange === "OL") return "NO";
  return null;
}

function evidenceForCandidate(input: {
  candidate: ResearchCandidate;
  seed: Seed;
  quote: DelayedQuote | null;
  historyBars: number;
  fundamentalsSource: ResearchFundamentalsSource;
  verifiedAt: string;
  sourceUrl: string;
}): ModelPortfolioEvidence {
  const technical = input.candidate.technicalAnalysis;
  const publishedAt = input.quote?.timestamp ?? input.verifiedAt;
  const score = (value: number | undefined) =>
    Number.isFinite(value) ? (value as number).toFixed(3) : "saknas";
  const summary = [
    `${input.seed.name} (${input.seed.symbol}.${input.seed.exchange}).`,
    `Källa för marknadsdata: Yahoo Finance; research cache används när den är färsk.`,
    `Senaste observerade kurs ${input.quote?.close ?? input.seed.discoveryPrice ?? "saknas"}; dagsförändring ${input.quote?.changePct ?? input.seed.discoveryChangePct ?? "saknas"}%.`,
    `Historik: ${input.historyBars} dagsstaplar.`,
    technical
      ? `Teknisk regim ${technical.trend.regime}; komposit ${technical.scores.composite.toFixed(3)}, trend ${technical.scores.trend.toFixed(3)}, momentum ${technical.scores.momentum.toFixed(3)}, volym ${technical.scores.volume.toFixed(3)}, breakout ${technical.scores.breakout.toFixed(3)}, stabilitet ${technical.scores.stability.toFixed(3)}.`
      : "Teknisk analys saknas eller har otillräcklig historik.",
    technical && Number.isFinite(technical.momentum.rsi14)
      ? `RSI14 ${(technical.momentum.rsi14 as number).toFixed(1)}.`
      : "",
    `Fundamentalkälla: ${input.fundamentalsSource}. Kvalitet ${score(input.candidate.qualityScore)}, värdering ${score(input.candidate.valuationScore)}, revideringar ${score(input.candidate.earningsRevisionScore)}, utdelningskvalitet ${score(input.candidate.dividendQualityScore)}, katalysator ${score(input.candidate.catalystScore)}, balansräkning ${score(input.candidate.balanceSheetScore)}.`,
    "Teknisk analys är beslutsunderlag och får aldrig ensam utlösa köp eller sälj. Saknade fundamentala värden lämnas saknade.",
  ].filter(Boolean).join(" ");

  return {
    id: `research:${input.seed.symbol}:${input.seed.exchange}:${publishedAt}`,
    kind: "market_data",
    publisher:
      input.fundamentalsSource === "eodhd"
        ? "Yahoo Finance + EODHD + DivLab deterministic TA"
        : "Yahoo Finance + DivLab deterministic TA",
    publishedAt,
    verifiedAt: input.verifiedAt,
    title: `${input.seed.name} – marknadsdata, teknisk analys och fundamentals`,
    summary: summary.slice(0, 6000),
  };
}

function combineSeeds(seeds: Seed[]): Seed[] {
  const map = new Map<string, Seed>();
  for (const seed of seeds) {
    const seedKey = key(seed.symbol, seed.exchange);
    const previous = map.get(seedKey);
    if (!previous) {
      map.set(seedKey, seed);
      continue;
    }
    map.set(seedKey, {
      ...previous,
      ...seed,
      name: previous.name.length >= seed.name.length ? previous.name : seed.name,
      held: previous.held || seed.held,
    });
  }
  return [...map.values()].slice(0, MAX_SEEDS);
}

async function buildSeeds(pass: ModelPortfolioResearchPass, holdings: readonly HoldingSeed[], now: Date): Promise<Seed[]> {
  const holdingSeeds: Seed[] = holdings.flatMap((holding) => {
    const exchange = normalizeExchange(holding.exchange);
    if (!exchange) return [];
    const belongs = isUsPass(pass) ? exchange === "US" : exchange !== "US";
    if (!belongs) return [];
    return [{
      symbol: holding.instrument_symbol,
      exchange,
      name: holding.instrument_name,
      yahooSymbol: toYahooSymbol(holding.instrument_symbol, exchange),
      held: true,
    }];
  });

  if (!isUsPass(pass)) {
    return combineSeeds([
      ...holdingSeeds,
      ...NORDIC_CORE.map((item) => ({
        ...item,
        yahooSymbol: toYahooSymbol(item.symbol, item.exchange),
        held: false,
      })),
    ]);
  }

  const discovered = await discoverYahooCandidates({
    shortlistLimit: 12,
    perScreen: 20,
    now,
  });
  const moverSeeds: Seed[] = discovered.map((item) => ({
    symbol: item.symbol,
    exchange: "US",
    name: item.name,
    yahooSymbol: item.symbol,
    discoveryMarketCapUsd: item.marketCap,
    discoveryPrice: item.price,
    discoveryVolume: item.volume,
    discoveryChangePct: item.changePct,
    held: false,
  }));
  const qualitySeeds: Seed[] = US_QUALITY_CORE.map((item) => ({ ...item, yahooSymbol: item.symbol, held: false }));
  return combineSeeds([...holdingSeeds, ...moverSeeds, ...qualitySeeds]);
}

function selectFundamentalTargets(candidates: ResearchCandidate[], seeds: Seed[]): Set<string> {
  const selected = new Set<string>();
  const strategies = ["conservative", "balanced", "high_risk", "dividend"] as const;
  for (const strategy of strategies) {
    for (const candidate of rankResearchUniverse(candidates, strategy).slice(0, 3)) {
      selected.add(key(candidate.symbol, candidate.exchange));
      if (selected.size >= MAX_FUNDAMENTAL_TARGETS) return selected;
    }
  }
  for (const seed of seeds) {
    if (seed.held) selected.add(key(seed.symbol, seed.exchange));
    if (selected.size >= MAX_FUNDAMENTAL_TARGETS) break;
  }
  return selected;
}

function hasUsefulFundamentals(candidate: ResearchCandidate): boolean {
  return [
    candidate.marketCapSek,
    candidate.qualityScore,
    candidate.valuationScore,
    candidate.earningsRevisionScore,
    candidate.dividendQualityScore,
    candidate.catalystScore,
    candidate.balanceSheetScore,
  ].some((value) => Number.isFinite(value));
}

function researchSummary(input: {
  pass: ModelPortfolioResearchPass;
  seeds: number;
  cacheHits: number;
  technicalCount: number;
  fundamentalCount: number;
  yahooFundamentalCount: number;
  eodhdFundamentalCount: number;
  googleHits: number;
  budget: EodhdCallBudgetSnapshot;
}): string {
  const passLabel = input.pass === "nordic_morning" ? "Norden 09.20" : input.pass.replace("us_", "USA ").replace("_", ".");
  return [
    `${passLabel}: ${input.seeds} kandidater granskades.`,
    `${input.cacheHits} återanvändes från färsk cache och ${input.technicalCount} hade användbar teknisk analys.`,
    `${input.fundamentalCount} kandidater hade fundamentalt underlag (${input.yahooFundamentalCount} via Yahoo Finance, ${input.eodhdFundamentalCount} med EODHD-verifiering).`,
    input.googleHits > 0
      ? `Google användes selektivt och gav ${input.googleHits} kompletterande sökträffar; dessa behandlas som discovery-evidens och inte som verifierade nyckeltal.`
      : "Google behövdes inte eller var inte konfigurerat i denna körning.",
    `EODHD-budget ${input.budget.used}/${input.budget.limit} anrop användes.`,
  ].join(" ");
}

export async function runModelPortfolioResearchPipeline(input: {
  supabase: SupabaseClient;
  pass: ModelPortfolioResearchPass;
  holdings: readonly HoldingSeed[];
  now: Date;
}): Promise<ModelPortfolioResearchPipelineResult> {
  const budget: EodhdCallBudget = createScheduledEodhdBudget(input.pass);
  const seeds = await buildSeeds(input.pass, input.holdings, input.now);
  const usdFx = isUsPass(input.pass) ? await fetchFxRateToSek("USD", input.now) : null;
  const fxToSek = usdFx?.ok ? usdFx.quote.rate : 1;

  const candidates: ResearchCandidate[] = [];
  const evidence: ModelPortfolioEvidence[] = [];
  const quotes = new Map<string, DelayedQuote>();
  const names = new Map<string, string>();
  const diagnostics: ResearchCandidateDiagnostic[] = [];
  const newResearch = new Map<string, {
    seed: Seed;
    candidate: ResearchCandidate;
    quote: DelayedQuote | null;
    historyBars: number;
    sourceUrl: string;
    currency: string | null;
    fundamentalsSource: ResearchFundamentalsSource;
  }>();

  let cacheHits = 0;
  for (const seed of seeds) {
    names.set(key(seed.symbol, seed.exchange), seed.name);
    const cached = await loadFreshCandidateBundle({
      supabase: input.supabase,
      symbol: seed.symbol,
      exchange: seed.exchange,
      now: input.now,
    });
    if (cached) {
      cacheHits += 1;
      candidates.push(cached.candidate);
      evidence.push(storedBundleToEvidence(cached));
      if (cached.quote) quotes.set(key(seed.symbol, seed.exchange), cached.quote);
      diagnostics.push({
        symbol: seed.symbol,
        exchange: seed.exchange,
        quoteAsOf: cached.quote?.timestamp ?? null,
        historyBars: cached.candidate.technicalAnalysis?.sessions ?? 0,
        cacheHit: true,
        fundamentalsSource: cached.fundamentalsSource,
        googleHits: 0,
      });
      continue;
    }

    const market = await fetchYahooHistoryResearch(seed.yahooSymbol);
    if (!market || !market.history.length) {
      diagnostics.push({
        symbol: seed.symbol,
        exchange: seed.exchange,
        quoteAsOf: null,
        historyBars: 0,
        cacheHit: false,
        fundamentalsSource: "unavailable",
        googleHits: 0,
        error: "yahoo_history_unavailable",
      });
      continue;
    }

    const base: Partial<ResearchCandidate> = {
      marketCapSek:
        Number.isFinite(seed.discoveryMarketCapUsd) && seed.discoveryMarketCapUsd!
          ? Math.round(seed.discoveryMarketCapUsd! * fxToSek)
          : undefined,
    };
    const candidate = buildMarketResearchCandidate({
      symbol: seed.symbol,
      exchange: seed.exchange,
      history: market.history,
      quote: market.quote,
      fxToSek: seed.exchange === "US" ? fxToSek : 1,
      base,
    });
    candidates.push(candidate);
    if (market.quote) quotes.set(key(seed.symbol, seed.exchange), market.quote);
    newResearch.set(key(seed.symbol, seed.exchange), {
      seed,
      candidate,
      quote: market.quote,
      historyBars: market.history.length,
      sourceUrl: market.sourceUrl,
      currency: market.currency,
      fundamentalsSource: "market_only",
    });
  }

  const targets = selectFundamentalTargets(candidates, seeds);
  let yahooFundamentalCount = 0;
  for (const candidateKey of targets) {
    const row = newResearch.get(candidateKey);
    if (!row) continue;
    const yahoo = await fetchYahooFundamentals(row.seed.yahooSymbol, row.seed.exchange === "US" ? fxToSek : 1);
    if (!yahoo) continue;
    row.candidate = { ...row.candidate, ...mergeFundamentalScores(row.candidate, yahoo.scores) };
    row.fundamentalsSource = "yahoo";
    yahooFundamentalCount += 1;
    const index = candidates.findIndex((item) => key(item.symbol, item.exchange) === candidateKey);
    if (index >= 0) candidates[index] = row.candidate;
  }

  let eodhdFundamentalCount = 0;
  if (isUsPass(input.pass) && budget.snapshot().remaining > 0) {
    const fallbackTargets = [...targets]
      .map((candidateKey) => newResearch.get(candidateKey))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .filter((row) => !hasUsefulFundamentals(row.candidate))
      .slice(0, Math.min(MAX_EODHD_FUNDAMENTAL_CALLS_PER_PASS, budget.snapshot().remaining));

    for (const row of fallbackTargets) {
      const market = marketForEodhd(row.seed.exchange);
      if (!market || budget.snapshot().remaining <= 0) break;
      try {
        const payload = await fetchEodhdFundamentals(row.seed.symbol, market, budget);
        const parsed = parseEodhdFundamentalsPayload(payload);
        if (!parsed) continue;
        const scored = scoreEodhdFundamentals(parsed, row.seed.exchange === "US" ? fxToSek : 1);
        if (!Object.values(scored).some((value) => value !== undefined && value !== null)) continue;
        row.candidate = { ...row.candidate, ...mergeFundamentalScores(row.candidate, scored) };
        row.fundamentalsSource = "eodhd";
        eodhdFundamentalCount += 1;
        const index = candidates.findIndex((item) => key(item.symbol, item.exchange) === key(row.seed.symbol, row.seed.exchange));
        if (index >= 0) candidates[index] = row.candidate;
      } catch {
        // EODHD is an optional verification layer. Yahoo/TA data remains usable.
      }
    }
  }

  let googleHits = 0;
  const googleTargets = [...targets].slice(0, MAX_GOOGLE_TARGETS);
  for (const candidateKey of googleTargets) {
    const row = newResearch.get(candidateKey);
    if (!row) continue;
    const hits = await searchGoogleCompanyResearch({
      companyName: row.seed.name,
      symbol: row.seed.symbol,
      now: input.now,
    });
    for (const [index, hit] of hits.entries()) {
      googleHits += 1;
      evidence.push({
        id: `google:${row.seed.symbol}:${hit.fetchedAt}:${index}`,
        kind: "news",
        publisher: hit.publisher,
        publishedAt: hit.fetchedAt,
        verifiedAt: hit.fetchedAt,
        title: hit.title,
        summary: `${hit.snippet} Källa upptäckt via Google; uppgifterna är inte automatiskt verifierade som nyckeltal.`,
      });
      await persistGoogleResearchHit({
        supabase: input.supabase,
        symbol: row.seed.symbol,
        exchange: row.seed.exchange,
        name: row.seed.name,
        title: hit.title,
        snippet: hit.snippet,
        url: hit.url,
        fetchedAt: hit.fetchedAt,
      });
    }
  }

  for (const row of newResearch.values()) {
    const itemEvidence = evidenceForCandidate({
      candidate: row.candidate,
      seed: row.seed,
      quote: row.quote,
      historyBars: row.historyBars,
      fundamentalsSource: row.fundamentalsSource,
      verifiedAt: input.now.toISOString(),
      sourceUrl: row.sourceUrl,
    });
    evidence.unshift(itemEvidence);
    await persistCandidateBundle({
      supabase: input.supabase,
      symbol: row.seed.symbol,
      exchange: row.seed.exchange,
      name: row.seed.name,
      publisher: itemEvidence.publisher,
      sourceUrl: row.sourceUrl,
      publishedAt: itemEvidence.publishedAt,
      verifiedAt: input.now.toISOString(),
      summary: itemEvidence.summary,
      metadata: {
        research_kind: "candidate_bundle",
        expires_at: new Date(input.now.getTime() + CACHE_TTL_MS).toISOString(),
        primary_source: row.fundamentalsSource === "eodhd" ? "mixed" : "yahoo_finance",
        verification_state: row.fundamentalsSource === "eodhd" ? "verified" : "internally_curated",
        candidate: row.candidate,
        quote: row.quote,
        fundamentals_source: row.fundamentalsSource,
        yahoo_symbol: row.seed.yahooSymbol,
        currency: row.currency,
        source_urls: [row.sourceUrl],
      },
    });
    const diagnostic = diagnostics.find(
      (item) => item.symbol === row.seed.symbol && item.exchange === row.seed.exchange,
    );
    if (diagnostic) {
      diagnostic.fundamentalsSource = row.fundamentalsSource;
      diagnostic.googleHits = googleTargets.includes(key(row.seed.symbol, row.seed.exchange)) ? googleHits : 0;
    } else {
      diagnostics.push({
        symbol: row.seed.symbol,
        exchange: row.seed.exchange,
        quoteAsOf: row.quote?.timestamp ?? null,
        historyBars: row.historyBars,
        cacheHit: false,
        fundamentalsSource: row.fundamentalsSource,
        googleHits: 0,
      });
    }
  }

  if (!candidates.length) throw new Error("research_pipeline_no_candidates");

  const fundamentalCount = candidates.filter(hasUsefulFundamentals).length;
  const technicalCount = candidates.filter((item) => (item.technicalAnalysis?.sessions ?? 0) > 0).length;
  const summary = researchSummary({
    pass: input.pass,
    seeds: seeds.length,
    cacheHits,
    technicalCount,
    fundamentalCount,
    yahooFundamentalCount,
    eodhdFundamentalCount,
    googleHits,
    budget: budget.snapshot(),
  });

  return {
    pass: input.pass,
    candidates,
    evidence,
    quotes,
    names,
    diagnostics,
    summary,
    eodhdBudget: budget.snapshot(),
  };
}
