import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelPortfolioEvidence } from "./decision";
import {
  buildInvestorFacingResearchSummary,
  buildOperationalResearchDiagnostics,
  toNarrativeCandidate,
  type NarrativeCandidate,
} from "./decision-narrative";
import type { DelayedQuote } from "./eodhd";
import { fetchEodhdFundamentals } from "./eodhd";
import type {
  EodhdCallBudgetSnapshot,
  ModelPortfolioResearchPass,
} from "./eodhd-budget";
import {
  claimScheduledEodhdBudget,
  recordScheduledEodhdUsage,
} from "./eodhd-ledger";
import { fetchFxRateToSek } from "./fx-adapter";
import { searchGoogleCompanyResearch } from "./google-research";
import {
  canonicalizeInstrumentSymbol,
  toInvestorFacingSymbol,
  toYahooTransportSymbol,
} from "./instrument-symbol";
import { fetchNordicPrimarySourceEvents } from "./nordic-primary-sources";
import {
  mergeNordicDeepResearchTargets,
  NORDIC_RESEARCH_BOUNDS,
  normalizeNordicExchange,
} from "./nordic-universe";
import { enrichNordicPrimarySourceHits } from "./primary-source-enrichment";
import { rankResearchUniverse, type ResearchCandidate } from "./research";
import {
  classifyNordicDiscoveryLane,
  classifyUsDiscoveryLane,
  selectLaneAwareFundamentalTargets,
  selectUsSharedSeedUnion,
  type ResearchLane,
} from "./research-lanes";
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
  persistPrimarySourceResearchHit,
  storedBundleToEvidence,
  type ResearchFundamentalsSource,
} from "./research-store";
import {
  discoverNordicYahooCandidates,
  discoverYahooCandidates,
  scoreYahooDiscoveryCandidate,
} from "./yahoo-discovery";
import {
  fetchYahooFundamentals,
  fetchYahooHistoryResearch,
} from "./yahoo-research";

// Must refresh between the 15:50, 18:30 and 21:30 decision windows while
// still suppressing accidental retries and duplicate fetches around one slot.
const US_CACHE_TTL_MS = 2 * 60 * 60 * 1_000;
const US_MAX_SEEDS = 18;
const US_MAX_FUNDAMENTAL_TARGETS = 8;
const US_MAX_GOOGLE_TARGETS = 2;
const MAX_EODHD_FUNDAMENTAL_CALLS_PER_PASS = 2;
/** Already-fetched Yahoo mover pool used for lane selection. Not a fourth screener call. */
const US_MOVER_DISCOVERY_POOL_LIMIT = 30;

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
  discoveryChangePct?: number | null;
  held: boolean;
  researchLane?: ResearchLane;
};

type NewResearchRow = {
  seed: Seed;
  candidate: ResearchCandidate;
  quote: DelayedQuote | null;
  historyBars: number;
  sourceUrl: string;
  currency: string | null;
  fundamentalsSource: ResearchFundamentalsSource;
};

export type ResearchCandidateDiagnostic = {
  symbol: string;
  exchange: string;
  quoteAsOf: string | null;
  historyBars: number;
  cacheHit: boolean;
  fundamentalsSource: ResearchFundamentalsSource;
  googleHits: number;
  primarySourceHits: number;
  error?: string;
};

export type ModelPortfolioResearchPipelineResult = {
  pass: ModelPortfolioResearchPass;
  candidates: ResearchCandidate[];
  evidence: ModelPortfolioEvidence[];
  quotes: Map<string, DelayedQuote>;
  names: Map<string, string>;
  diagnostics: ResearchCandidateDiagnostic[];
  /** Investor-facing Swedish narrative for Senaste beslut. */
  summary: string;
  /** Internal/admin operational diagnostics (API/cache/budget). */
  operationalSummary: string;
  eodhdBudget: EodhdCallBudgetSnapshot;
  discoveryScreenedCount: number;
  deepResearchCount: number;
};

function key(symbol: string, exchange: string): string {
  return `${symbol}.${exchange}`.toUpperCase();
}

function normalizeExchange(exchange: string): string | null {
  const nordic = normalizeNordicExchange(exchange);
  if (nordic) return nordic;
  const value = exchange.trim().toUpperCase();
  if ([
    "US",
    "NASDAQ",
    "NASDAQGS",
    "NASDAQGM",
    "NASDAQCM",
    "NYSE",
    "NYQ",
    "NMS",
    "NGM",
    "NCM",
  ].includes(value)) return "US";
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

function cacheTtlMs(pass: ModelPortfolioResearchPass): number {
  return pass === "nordic_morning" ? NORDIC_RESEARCH_BOUNDS.cacheTtlMs : US_CACHE_TTL_MS;
}

function evidenceForCandidate(input: {
  candidate: ResearchCandidate;
  seed: Seed;
  quote: DelayedQuote | null;
  historyBars: number;
  fundamentalsSource: ResearchFundamentalsSource;
  verifiedAt: string;
}): ModelPortfolioEvidence {
  const technical = input.candidate.technicalAnalysis;
  const publishedAt = input.quote?.timestamp ?? input.verifiedAt;
  const score = (value: number | undefined) =>
    Number.isFinite(value) ? (value as number).toFixed(3) : "saknas";
  const summary = [
    `${input.seed.name} (${toInvestorFacingSymbol(input.seed.symbol, input.seed.exchange)}).`,
    `Senaste observerade kurs ${input.quote?.close ?? input.seed.discoveryPrice ?? "saknas"}; dagsförändring ${input.quote?.changePct ?? input.seed.discoveryChangePct ?? "saknas"}%.`,
    `Historik: ${input.historyBars} dagsstaplar.`,
    technical
      ? `Teknisk regim ${technical.trend.regime}; komposit ${technical.scores.composite.toFixed(3)}, trend ${technical.scores.trend.toFixed(3)}, momentum ${technical.scores.momentum.toFixed(3)}, volym ${technical.scores.volume.toFixed(3)}, breakout ${technical.scores.breakout.toFixed(3)}, stabilitet ${technical.scores.stability.toFixed(3)}.`
      : "Teknisk analys saknas eller har otillräcklig historik.",
    technical && Number.isFinite(technical.momentum.rsi14)
      ? `RSI14 ${(technical.momentum.rsi14 as number).toFixed(1)}.`
      : "",
    `Kvalitet ${score(input.candidate.qualityScore)}, värdering ${score(input.candidate.valuationScore)}, revideringar ${score(input.candidate.earningsRevisionScore)}, utdelningskvalitet ${score(input.candidate.dividendQualityScore)}, katalysator ${score(input.candidate.catalystScore)}, balansräkning ${score(input.candidate.balanceSheetScore)}.`,
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

function combineSeeds(seeds: Seed[], maxSeeds: number): Seed[] {
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
      researchLane: previous.researchLane ?? seed.researchLane,
    });
  }
  return [...map.values()].slice(0, maxSeeds);
}

function holdingSeedsForPass(
  pass: ModelPortfolioResearchPass,
  holdings: readonly HoldingSeed[],
): Seed[] {
  return holdings.flatMap((holding) => {
    const exchange = normalizeExchange(holding.exchange);
    if (!exchange) return [];
    const belongs = isUsPass(pass) ? exchange === "US" : exchange !== "US";
    if (!belongs) return [];
    const canonical = canonicalizeInstrumentSymbol(holding.instrument_symbol, exchange);
    const seedBase = {
      symbol: canonical.baseSymbol,
      exchange: canonical.exchange,
      name: holding.instrument_name,
      yahooSymbol: toYahooTransportSymbol(canonical.baseSymbol, canonical.exchange),
      held: true as const,
    };
    return [{
      ...seedBase,
      researchLane: isUsPass(pass)
        ? classifyUsDiscoveryLane(seedBase)
        : classifyNordicDiscoveryLane(seedBase),
    }];
  });
}

async function buildNordicDeepSeeds(
  holdings: readonly HoldingSeed[],
  now: Date,
): Promise<{ seeds: Seed[]; screenedCount: number }> {
  const holdingSeeds = holdingSeedsForPass("nordic_morning", holdings);
  const discovery = await discoverNordicYahooCandidates({
    broadLimit: NORDIC_RESEARCH_BOUNDS.broadDiscoveryCandidateCount,
    shortlistLimit: NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount,
    perCountryMin: NORDIC_RESEARCH_BOUNDS.perCountryMinShortlist,
    perCountryMax: NORDIC_RESEARCH_BOUNDS.perCountryMaxShortlist,
    now,
  });

  const shortlistSeeds: Seed[] = discovery.shortlist.map((item) => ({
    symbol: item.symbol,
    exchange: item.exchange,
    name: item.name,
    yahooSymbol: item.yahooSymbol,
    discoveryMarketCapUsd: item.marketCap,
    discoveryPrice: item.price,
    discoveryChangePct: item.changePct,
    held: false,
    researchLane: classifyNordicDiscoveryLane(item),
  }));

  const merged = mergeNordicDeepResearchTargets(shortlistSeeds, holdingSeeds);
  // Holdings must never be truncated away by the deep-research cap.
  const held = merged.filter((item) => item.held);
  const discovered = merged.filter((item) => !item.held);
  const cappedDiscovered = discovered.slice(0, NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount);
  const seeds = combineSeeds(
    [...held, ...cappedDiscovered],
    held.length + NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount,
  );
  return { seeds, screenedCount: discovery.screened.length };
}

async function buildUsSeeds(
  holdings: readonly HoldingSeed[],
  now: Date,
): Promise<{ seeds: Seed[]; screenedCount: number }> {
  const holdingSeeds = holdingSeedsForPass("us_1550", holdings);
  const discovered = await discoverYahooCandidates({
    shortlistLimit: US_MOVER_DISCOVERY_POOL_LIMIT,
    perScreen: 20,
    now,
  });
  const moverSeeds = discovered.map((item) => ({
    symbol: item.symbol,
    exchange: "US" as const,
    name: item.name,
    yahooSymbol: item.symbol,
    discoveryMarketCapUsd: item.marketCap,
    discoveryPrice: item.price,
    discoveryChangePct: item.changePct,
    discoveryScore: scoreYahooDiscoveryCandidate(item),
  }));
  const seeds = selectUsSharedSeedUnion({
    holdings: holdingSeeds,
    movers: moverSeeds,
    maxSeeds: US_MAX_SEEDS,
  });
  return {
    seeds,
    screenedCount: discovered.length,
  };
}

function hasUsefulFundamentals(candidate: ResearchCandidate): boolean {
  return [
    candidate.qualityScore,
    candidate.valuationScore,
    candidate.earningsRevisionScore,
    candidate.dividendQualityScore,
    candidate.catalystScore,
    candidate.balanceSheetScore,
  ].some((value) => Number.isFinite(value));
}

export async function runModelPortfolioResearchPipeline(input: {
  supabase: SupabaseClient;
  pass: ModelPortfolioResearchPass;
  holdings: readonly HoldingSeed[];
  now: Date;
}): Promise<ModelPortfolioResearchPipelineResult> {
  const budget = await claimScheduledEodhdBudget({
    supabase: input.supabase,
    pass: input.pass,
    now: input.now,
  });

  // Hard fail-closed: Nordic 09:20 must never consume EODHD calls.
  if (input.pass === "nordic_morning" && budget.snapshot().limit !== 0) {
    throw new Error("nordic_pass_eodhd_budget_must_be_zero");
  }

  const built = isUsPass(input.pass)
    ? await buildUsSeeds(input.holdings, input.now)
    : await buildNordicDeepSeeds(input.holdings, input.now);
  const seeds = built.seeds;
  const usdFx = isUsPass(input.pass) ? await fetchFxRateToSek("USD", input.now) : null;
  const fxToSek = usdFx?.ok ? usdFx.quote.rate : 1;
  const fundamentalTargetLimit = isUsPass(input.pass)
    ? US_MAX_FUNDAMENTAL_TARGETS
    : NORDIC_RESEARCH_BOUNDS.fundamentalsTargetCount;
  const googleTargetLimit = isUsPass(input.pass)
    ? US_MAX_GOOGLE_TARGETS
    : NORDIC_RESEARCH_BOUNDS.eventPrimarySourceTargetCount;

  const candidates: ResearchCandidate[] = [];
  const evidence: ModelPortfolioEvidence[] = [];
  const quotes = new Map<string, DelayedQuote>();
  const names = new Map<string, string>();
  const diagnostics: ResearchCandidateDiagnostic[] = [];
  const newResearch = new Map<string, NewResearchRow>();
  const heldKeys = new Set(
    seeds.filter((seed) => seed.held).map((seed) => key(seed.symbol, seed.exchange)),
  );

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
        primarySourceHits: 0,
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
        primarySourceHits: 0,
        error: "yahoo_history_unavailable",
      });
      continue;
    }

    const discoveryMarketCap = seed.discoveryMarketCapUsd;
    const base: Partial<ResearchCandidate> = {
      marketCapSek:
        Number.isFinite(discoveryMarketCap) && (discoveryMarketCap as number) > 0
          ? Math.round((discoveryMarketCap as number) * (seed.exchange === "US" ? fxToSek : 1))
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

  const targets = selectLaneAwareFundamentalTargets({
    candidates,
    seeds,
    maxTargets: fundamentalTargetLimit,
  });
  let yahooFundamentalCount = 0;
  for (const candidateKey of targets) {
    const row = newResearch.get(candidateKey);
    if (!row) continue;
    const yahoo = await fetchYahooFundamentals(
      row.seed.yahooSymbol,
      row.seed.exchange === "US" ? fxToSek : 1,
    );
    if (!yahoo) continue;
    row.candidate = {
      ...row.candidate,
      ...mergeFundamentalScores(row.candidate, yahoo.scores),
    };
    row.fundamentalsSource = "yahoo";
    yahooFundamentalCount += 1;
    const index = candidates.findIndex(
      (item) => key(item.symbol, item.exchange) === candidateKey,
    );
    if (index >= 0) candidates[index] = row.candidate;
  }

  let eodhdFundamentalCount = 0;
  // Nordic 09:20 is hard-gated to zero EODHD usage even if budget state drifts.
  if (isUsPass(input.pass) && budget.snapshot().remaining > 0) {
    const fallbackTargets: NewResearchRow[] = [];
    for (const candidateKey of targets) {
      const row = newResearch.get(candidateKey);
      if (!row || hasUsefulFundamentals(row.candidate)) continue;
      fallbackTargets.push(row);
      if (
        fallbackTargets.length >=
        Math.min(MAX_EODHD_FUNDAMENTAL_CALLS_PER_PASS, budget.snapshot().remaining)
      ) break;
    }

    for (const row of fallbackTargets) {
      const market = marketForEodhd(row.seed.exchange);
      if (!market || budget.snapshot().remaining <= 0) break;
      try {
        const payload = await fetchEodhdFundamentals(row.seed.symbol, market, budget);
        const parsed = parseEodhdFundamentalsPayload(payload);
        if (!parsed) continue;
        const scored = scoreEodhdFundamentals(
          parsed,
          row.seed.exchange === "US" ? fxToSek : 1,
        );
        if (!Object.values(scored).some((value) => value !== undefined && value !== null)) {
          continue;
        }
        row.candidate = {
          ...row.candidate,
          ...mergeFundamentalScores(row.candidate, scored),
        };
        row.fundamentalsSource = "eodhd";
        eodhdFundamentalCount += 1;
        const index = candidates.findIndex(
          (item) =>
            key(item.symbol, item.exchange) === key(row.seed.symbol, row.seed.exchange),
        );
        if (index >= 0) candidates[index] = row.candidate;
      } catch {
        // Optional verification layer; Yahoo/technical research remains usable.
      }
    }
  }

  await recordScheduledEodhdUsage({
    supabase: input.supabase,
    pass: input.pass,
    now: input.now,
    budget: budget.snapshot(),
  });

  let googleHits = 0;
  let primarySourceHits = 0;
  const googleHitsByCandidate = new Map<string, number>();
  const primaryHitsByCandidate = new Map<string, number>();
  // Primary-source exchange disclosures first; Google is optional supplemental only.
  const eventTargets = [...targets].slice(0, googleTargetLimit);
  for (const candidateKey of eventTargets) {
    const row = newResearch.get(candidateKey);
    if (!row) continue;

    if (!isUsPass(input.pass)) {
      const primaryHits = await fetchNordicPrimarySourceEvents({
        companyName: row.seed.name,
        symbol: row.seed.symbol,
        exchange: row.seed.exchange,
        now: input.now,
      });
      const enrichedHits = await enrichNordicPrimarySourceHits({
        hits: primaryHits,
      });
      primaryHitsByCandidate.set(candidateKey, enrichedHits.length);
      for (const [index, enriched] of enrichedHits.entries()) {
        primarySourceHits += 1;
        const { hit } = enriched;
        const publishedAt = hit.publishedAt ?? hit.fetchedAt;
        evidence.push({
          id: `primary:${row.seed.symbol}:${hit.fetchedAt}:${index}`,
          kind: enriched.evidenceKind,
          publisher: hit.publisher,
          publishedAt,
          verifiedAt: hit.fetchedAt,
          title: hit.title,
          summary: enriched.summary,
        });
        await persistPrimarySourceResearchHit({
          supabase: input.supabase,
          symbol: row.seed.symbol,
          exchange: row.seed.exchange,
          name: row.seed.name,
          kind: enriched.kind,
          publisher: hit.publisher,
          // Prefer the official message URL as the canonical disclosure source;
          // document URL is retained in metadata when a report PDF was read.
          sourceUrl: hit.url,
          publishedAt,
          verifiedAt: hit.fetchedAt,
          title: hit.title,
          summary: enriched.summary,
          metadata: {
            source_type: enriched.sourceType,
            document_retrieved: enriched.documentRetrieved,
            official_source: "nasdaq_nordic_cns",
            report_period: enriched.reportPeriod ?? undefined,
            report_year: enriched.reportYear ?? undefined,
            document_type: enriched.documentType,
            document_url: enriched.documentUrl ?? undefined,
            cns_category: hit.category ?? undefined,
            source_urls: [
              hit.url,
              ...(enriched.documentUrl ? [enriched.documentUrl] : []),
            ],
          },
        });
      }
    }

    const hits = await searchGoogleCompanyResearch({
      companyName: row.seed.name,
      symbol: row.seed.symbol,
      now: input.now,
    });
    googleHitsByCandidate.set(candidateKey, hits.length);
    for (const [index, hit] of hits.entries()) {
      googleHits += 1;
      evidence.push({
        id: `google:${row.seed.symbol}:${hit.fetchedAt}:${index}`,
        kind: "news",
        publisher: hit.publisher,
        publishedAt: hit.fetchedAt,
        verifiedAt: hit.fetchedAt,
        title: hit.title,
        summary: `${hit.snippet} Kompletterande discovery-träff; uppgifterna är inte automatiskt verifierade som nyckeltal.`,
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
        expires_at: new Date(input.now.getTime() + cacheTtlMs(input.pass)).toISOString(),
        primary_source: row.fundamentalsSource === "eodhd" ? "mixed" : "yahoo_finance",
        verification_state:
          row.fundamentalsSource === "eodhd" ? "verified" : "internally_curated",
        candidate: row.candidate,
        quote: row.quote,
        fundamentals_source: row.fundamentalsSource,
        yahoo_symbol: row.seed.yahooSymbol,
        currency: row.currency,
        source_urls: [row.sourceUrl],
      },
    });

    const candidateKey = key(row.seed.symbol, row.seed.exchange);
    const diagnostic = diagnostics.find(
      (item) => item.symbol === row.seed.symbol && item.exchange === row.seed.exchange,
    );
    if (diagnostic) {
      diagnostic.fundamentalsSource = row.fundamentalsSource;
      diagnostic.googleHits = googleHitsByCandidate.get(candidateKey) ?? 0;
      diagnostic.primarySourceHits = primaryHitsByCandidate.get(candidateKey) ?? 0;
    } else {
      diagnostics.push({
        symbol: row.seed.symbol,
        exchange: row.seed.exchange,
        quoteAsOf: row.quote?.timestamp ?? null,
        historyBars: row.historyBars,
        cacheHit: false,
        fundamentalsSource: row.fundamentalsSource,
        googleHits: googleHitsByCandidate.get(candidateKey) ?? 0,
        primarySourceHits: primaryHitsByCandidate.get(candidateKey) ?? 0,
      });
    }
  }

  if (!candidates.length) throw new Error("research_pipeline_no_candidates");

  const fundamentalCount = candidates.filter(hasUsefulFundamentals).length;
  const technicalCount = candidates.filter(
    (item) => (item.technicalAnalysis?.sessions ?? 0) > 0,
  ).length;

  const narrativeInvestigated: NarrativeCandidate[] = candidates.map((candidate) => {
    const seedKey = key(candidate.symbol, candidate.exchange);
    const seed = seeds.find((item) => key(item.symbol, item.exchange) === seedKey);
    const quote = quotes.get(seedKey);
    return toNarrativeCandidate(candidate, names, {
      held: heldKeys.has(seedKey) || Boolean(seed?.held),
      changePct: quote?.changePct ?? seed?.discoveryChangePct ?? null,
    });
  });

  const topRanked = rankResearchUniverse(candidates, "balanced").slice(0, 4);
  const topNarrative = topRanked.map((candidate) => {
    const seedKey = key(candidate.symbol, candidate.exchange);
    const seed = seeds.find((item) => key(item.symbol, item.exchange) === seedKey);
    const quote = quotes.get(seedKey);
    return {
      ...toNarrativeCandidate(candidate, names, {
        held: heldKeys.has(seedKey) || Boolean(seed?.held),
        changePct: quote?.changePct ?? seed?.discoveryChangePct ?? null,
      }),
      reasons: candidate.reasons,
    };
  });

  const summary = buildInvestorFacingResearchSummary({
    pass: input.pass,
    investigated: narrativeInvestigated,
    topCandidates: topNarrative,
  });
  const operationalSummary = buildOperationalResearchDiagnostics({
    pass: input.pass,
    seeds: built.screenedCount || seeds.length,
    deepTargets: seeds.length,
    cacheHits,
    technicalCount,
    fundamentalCount,
    yahooFundamentalCount,
    eodhdFundamentalCount,
    googleHits,
    primarySourceHits,
    eodhdUsed: budget.snapshot().used,
    eodhdLimit: budget.snapshot().limit,
  });

  if (input.pass === "nordic_morning" && budget.snapshot().used !== 0) {
    throw new Error("nordic_pass_used_eodhd_calls");
  }

  return {
    pass: input.pass,
    candidates,
    evidence,
    quotes,
    names,
    diagnostics,
    summary,
    operationalSummary,
    eodhdBudget: budget.snapshot(),
    discoveryScreenedCount: built.screenedCount,
    deepResearchCount: seeds.length,
  };
}
