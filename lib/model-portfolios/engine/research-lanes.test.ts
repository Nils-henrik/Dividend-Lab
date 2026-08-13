import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  classifyDividendInstrument,
  DIVIDEND_PRIORITY_INSTRUMENTS,
  isDividendResearchCandidate,
} from "./dividend-universe";
import { NORDIC_SMALL_MID_OPPORTUNITY_SEEDS } from "./high-risk-universe";
import {
  NORDIC_RESEARCH_BOUNDS,
  NORDIC_SEED_UNIVERSE,
  type NordicCapSegment,
  type NordicCountry,
  type NordicExchange,
} from "./nordic-universe";
import type { ResearchCandidate } from "./research";
import {
  classifyNordicDiscoveryLane,
  classifyUsDiscoveryLane,
  FUNDAMENTAL_INCOME_RESERVED_COUNT,
  isUsLiquidSmallMidCap,
  NORDIC_RESEARCH_LANE_QUOTAS,
  selectLaneAwareFundamentalTargets,
  selectNordicLaneShortlist,
  selectUsSharedSeedUnion,
  US_INCOME_DISCOVERY_SEEDS,
  US_QUALITY_CORE,
  US_RESEARCH_LANE_QUOTAS,
} from "./research-lanes";

const DIR = path.dirname(fileURLToPath(import.meta.url));

type NordicCandidate = {
  symbol: string;
  exchange: NordicExchange;
  country: NordicCountry;
  score: number;
  segment: NordicCapSegment;
};

function nordic(
  symbol: string,
  exchange: NordicExchange,
  country: NordicCountry,
  score: number,
  segment: NordicCapSegment = "mid_cap",
): NordicCandidate {
  return { symbol, exchange, country, score, segment };
}

function candidate(symbol: string, exchange: string, extra: Partial<ResearchCandidate> = {}): ResearchCandidate {
  return { symbol, exchange, ...extra };
}

describe("strategy research lanes", () => {
  it("keeps Nordic and US deep-research budgets numerically unchanged", () => {
    const pipeline = readFileSync(path.join(DIR, "research-pipeline.ts"), "utf8");
    const discovery = readFileSync(path.join(DIR, "yahoo-discovery.ts"), "utf8");
    const budget = readFileSync(path.join(DIR, "eodhd-budget.ts"), "utf8");

    assert.equal(NORDIC_RESEARCH_BOUNDS.broadDiscoveryCandidateCount, 96);
    assert.equal(NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount, 14);
    assert.equal(NORDIC_RESEARCH_BOUNDS.fundamentalsTargetCount, 8);
    assert.equal(NORDIC_RESEARCH_BOUNDS.eventPrimarySourceTargetCount, 2);
    assert.equal(NORDIC_RESEARCH_BOUNDS.quoteBatchSize, 40);
    assert.match(pipeline, /const US_MAX_SEEDS = 18;/);
    assert.match(pipeline, /const US_MAX_FUNDAMENTAL_TARGETS = 8;/);
    assert.match(pipeline, /const US_MAX_GOOGLE_TARGETS = 2;/);
    assert.match(pipeline, /const MAX_EODHD_FUNDAMENTAL_CALLS_PER_PASS = 2;/);
    assert.match(discovery, /const DEFAULT_SCREENS: YahooDiscoveryScreen\[] = \["day_gainers", "day_losers", "most_actives"\];/);
    assert.doesNotMatch(discovery, /scrIds.*,.*,.*,/);
    assert.match(budget, /nordic_morning: 0,/);
    assert.match(budget, /us_1550: 7,/);
    assert.match(budget, /us_1830: 6,/);
    assert.match(budget, /us_2130: 7,/);

    const nordicQuotaSum = Object.values(NORDIC_RESEARCH_LANE_QUOTAS).reduce((sum, value) => sum + value, 0);
    const usQuotaSum = Object.values(US_RESEARCH_LANE_QUOTAS).reduce((sum, value) => sum + value, 0);
    assert.equal(nordicQuotaSum, NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount);
    assert.equal(usQuotaSum, 18);
    assert.equal(FUNDAMENTAL_INCOME_RESERVED_COUNT, 2);
    assert.ok(FUNDAMENTAL_INCOME_RESERVED_COUNT < NORDIC_RESEARCH_BOUNDS.fundamentalsTargetCount);
  });

  it("builds a 14-name Nordic deep union with all relevant lanes", () => {
    const universe: NordicCandidate[] = [
      nordic("SAGA-D", "ST", "SE", 0.11),
      nordic("CORE-D", "ST", "SE", 0.10),
      nordic("FPAR-D", "ST", "SE", 0.09),
      nordic("XACTHDIV", "ST", "SE", 0.12),
      nordic("MONTDIV", "ST", "SE", 0.12),
      nordic("YUBICO", "ST", "SE", 0.40),
      nordic("KIT", "OL", "NO", 0.39),
      nordic("HARVIA", "HE", "FI", 0.38),
      nordic("AMBU-B", "CO", "DK", 0.37),
      nordic("LAGR-B", "ST", "SE", 0.36),
      nordic("INVE-B", "ST", "SE", 0.95, "large_cap"),
      nordic("EQNR", "OL", "NO", 0.94, "large_cap"),
      nordic("NOKIA", "HE", "FI", 0.93, "large_cap"),
      nordic("NOVO-B", "CO", "DK", 0.92, "large_cap"),
      nordic("VOLV-B", "ST", "SE", 0.91, "large_cap"),
      nordic("DNB", "OL", "NO", 0.90, "large_cap"),
      nordic("SAMPO", "HE", "FI", 0.89, "large_cap"),
      nordic("DSV", "CO", "DK", 0.88, "large_cap"),
      nordic("MOVER-SE", "ST", "SE", 0.99, "large_cap"),
      nordic("MOVER-NO", "OL", "NO", 0.98, "large_cap"),
      nordic("MOVER-FI", "HE", "FI", 0.97, "large_cap"),
      nordic("MOVER-DK", "CO", "DK", 0.96, "large_cap"),
    ];

    const shortlist = selectNordicLaneShortlist(universe);
    assert.ok(shortlist.length <= NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount);
    assert.equal(shortlist.length, 14);

    const keys = shortlist.map((item) => `${item.symbol}.${item.exchange}`);
    const lanes = new Set(shortlist.map((item) => classifyNordicDiscoveryLane(item)));
    assert.ok(lanes.has("income"));
    assert.ok(lanes.has("high_risk_opportunity"));
    assert.ok(lanes.has("quality_core"));

    const prefD = shortlist.filter((item) => {
      const kind = classifyDividendInstrument(item)?.kind;
      return kind === "d_share" || kind === "preferred_share";
    });
    assert.ok(prefD.length >= 2, `expected >=2 pref/D, got ${prefD.map((item) => item.symbol).join(",")}`);

    const highRisk = shortlist.filter((item) => classifyNordicDiscoveryLane(item) === "high_risk_opportunity");
    const core = shortlist.filter((item) => classifyNordicDiscoveryLane(item) === "quality_core");
    assert.ok(highRisk.length >= 3, `high-risk crowded out: ${keys.join(",")}`);
    assert.ok(core.length >= 3, `core crowded out: ${keys.join(",")}`);

    const countries = new Set(shortlist.map((item) => item.country));
    assert.deepEqual([...countries].sort(), ["DK", "FI", "NO", "SE"]);
    const byCountry = { SE: 0, NO: 0, FI: 0, DK: 0 };
    for (const item of shortlist) byCountry[item.country] += 1;
    for (const country of ["SE", "NO", "FI", "DK"] as const) {
      assert.ok(byCountry[country] >= NORDIC_RESEARCH_BOUNDS.perCountryMinShortlist);
      assert.ok(byCountry[country] <= NORDIC_RESEARCH_BOUNDS.perCountryMaxShortlist);
    }

    const again = selectNordicLaneShortlist(universe);
    assert.deepEqual(
      again.map((item) => `${item.symbol}.${item.exchange}`),
      keys,
    );
  });

  it("lets pref/D outrank approved ETFs inside the income lane", () => {
    const universe: NordicCandidate[] = [
      nordic("XACTHDIV", "ST", "SE", 0.8),
      nordic("MONTDIV", "ST", "SE", 0.8),
      nordic("SAGA-D", "ST", "SE", 0.8),
      nordic("CORE-D", "ST", "SE", 0.8),
      nordic("INVE-B", "ST", "SE", 0.2, "large_cap"),
      nordic("EQNR", "OL", "NO", 0.2, "large_cap"),
      nordic("NOKIA", "HE", "FI", 0.2, "large_cap"),
      nordic("NOVO-B", "CO", "DK", 0.2, "large_cap"),
      nordic("YUBICO", "ST", "SE", 0.3),
      nordic("KIT", "OL", "NO", 0.3),
      nordic("HARVIA", "HE", "FI", 0.3),
      nordic("AMBU-B", "CO", "DK", 0.3),
    ];
    const shortlist = selectNordicLaneShortlist(universe, { shortlistLimit: 14 });
    const income = shortlist.filter((item) => classifyNordicDiscoveryLane(item) === "income");
    assert.ok(income.length >= 2);
    assert.ok(income.some((item) => item.symbol === "SAGA-D"));
    assert.ok(income.some((item) => item.symbol === "CORE-D"));
    const incomeIndex = (symbol: string) =>
      income.findIndex((item) => item.symbol === symbol);
    assert.ok(incomeIndex("SAGA-D") >= 0);
    assert.ok(incomeIndex("CORE-D") >= 0);
    if (incomeIndex("XACTHDIV") >= 0) {
      assert.ok(incomeIndex("SAGA-D") < incomeIndex("XACTHDIV"));
    }
  });

  it("flows unused lane quota to remaining candidates instead of leaving slots empty", () => {
    const universe: NordicCandidate[] = [
      nordic("INVE-B", "ST", "SE", 0.9, "large_cap"),
      nordic("VOLV-B", "ST", "SE", 0.8, "large_cap"),
      nordic("EQNR", "OL", "NO", 0.9, "large_cap"),
      nordic("DNB", "OL", "NO", 0.8, "large_cap"),
      nordic("NOKIA", "HE", "FI", 0.9, "large_cap"),
      nordic("SAMPO", "HE", "FI", 0.8, "large_cap"),
      nordic("NOVO-B", "CO", "DK", 0.9, "large_cap"),
      nordic("DSV", "CO", "DK", 0.8, "large_cap"),
      nordic("TEL2-B", "ST", "SE", 0.7, "large_cap"),
      nordic("TEL", "OL", "NO", 0.7, "large_cap"),
      nordic("KNEBV", "HE", "FI", 0.7, "large_cap"),
      nordic("MAERSK-B", "CO", "DK", 0.7, "large_cap"),
      nordic("SAND", "ST", "SE", 0.6, "large_cap"),
      nordic("MOWI", "OL", "NO", 0.6, "large_cap"),
    ];
    const shortlist = selectNordicLaneShortlist(universe);
    assert.equal(shortlist.length, 14);
    assert.equal(
      shortlist.filter((item) => classifyNordicDiscoveryLane(item) === "income").length,
      0,
    );
  });

  it("never duplicates an instrument across lanes", () => {
    const universe: NordicCandidate[] = [
      nordic("NETC", "CO", "DK", 0.9),
      ...NORDIC_SEED_UNIVERSE.slice(0, 20).map((seed, index) =>
        nordic(seed.symbol, seed.exchange, seed.country, 0.5 - index / 100, seed.segment),
      ),
    ];
    const shortlist = selectNordicLaneShortlist(universe);
    const keys = shortlist.map((item) => `${item.symbol}.${item.exchange}`);
    assert.equal(new Set(keys).size, keys.length);
  });

  it("keeps US quality core and liquid small/mid movers inside the shared 18-seed pool", () => {
    const megaMovers = Array.from({ length: 12 }, (_, index) => ({
      symbol: `MEGA${index}`,
      exchange: "US",
      name: `Mega ${index}`,
      yahooSymbol: `MEGA${index}`,
      discoveryMarketCapUsd: 400_000_000_000,
      discoveryScore: 0.99 - index / 100,
    }));
    const smallMovers = Array.from({ length: 6 }, (_, index) => ({
      symbol: `SMID${index}`,
      exchange: "US",
      name: `Smid ${index}`,
      yahooSymbol: `SMID${index}`,
      discoveryMarketCapUsd: 4_000_000_000,
      discoveryScore: 0.8 - index / 100,
    }));

    const seeds = selectUsSharedSeedUnion({
      holdings: [],
      movers: [...megaMovers, ...smallMovers],
      maxSeeds: 18,
    });

    assert.equal(seeds.length, 18);
    const symbols = new Set(seeds.map((item) => item.symbol));
    assert.equal(symbols.size, 18);
    const qualityHits = US_QUALITY_CORE.filter((item) => symbols.has(item.symbol));
    assert.ok(qualityHits.length >= 4, `quality core truncated: ${[...symbols].join(",")}`);
    const smidHits = smallMovers.filter((item) => symbols.has(item.symbol));
    assert.ok(smidHits.length >= 3, `small/mid crowded out: ${[...symbols].join(",")}`);
    const incomeHits = US_INCOME_DISCOVERY_SEEDS.filter((item) => symbols.has(item.symbol));
    assert.ok(incomeHits.length >= 2);
    assert.ok(incomeHits.length + qualityHits.length + smidHits.length <= 18);
  });

  it("never lets twelve mega-cap movers erase the quality core", () => {
    const movers = Array.from({ length: 12 }, (_, index) => ({
      symbol: `MOVER${index}`,
      exchange: "US",
      name: `Mover ${index}`,
      yahooSymbol: `MOVER${index}`,
      discoveryMarketCapUsd: 500_000_000_000,
      discoveryScore: 1,
    }));
    const seeds = selectUsSharedSeedUnion({ holdings: [], movers, maxSeeds: 18 });
    const symbols = new Set(seeds.map((item) => item.symbol));
    assert.ok(symbols.has("MSFT"));
    assert.ok(symbols.has("AAPL"));
    assert.ok(symbols.has("GOOGL"));
    assert.ok(symbols.has("AMZN"));
  });

  it("keeps current holdings outside lane-quota truncation", () => {
    const holdings = [
      {
        symbol: "HELD1",
        exchange: "US",
        name: "Held One",
        yahooSymbol: "HELD1",
        held: true as const,
      },
      {
        symbol: "HELD2",
        exchange: "US",
        name: "Held Two",
        yahooSymbol: "HELD2",
        held: true as const,
      },
    ];
    const movers = Array.from({ length: 20 }, (_, index) => ({
      symbol: `MOVER${index}`,
      exchange: "US",
      name: `Mover ${index}`,
      yahooSymbol: `MOVER${index}`,
      discoveryMarketCapUsd: 8_000_000_000,
      discoveryScore: 0.9,
    }));
    const seeds = selectUsSharedSeedUnion({ holdings, movers, maxSeeds: 18 });
    assert.equal(seeds.length, 18);
    assert.ok(seeds.some((item) => item.symbol === "HELD1" && item.held));
    assert.ok(seeds.some((item) => item.symbol === "HELD2" && item.held));
  });

  it("does not treat a static US income seed as dividend-eligible before fundamentals", () => {
    for (const seed of US_INCOME_DISCOVERY_SEEDS) {
      assert.equal(classifyDividendInstrument(seed), null);
      assert.equal(isDividendResearchCandidate(seed), false);
      assert.equal(classifyUsDiscoveryLane(seed), "income");
    }
    const sectors = new Set(US_INCOME_DISCOVERY_SEEDS.map((item) => item.symbol));
    assert.equal(sectors.size, US_INCOME_DISCOVERY_SEEDS.length);
    assert.ok(US_INCOME_DISCOVERY_SEEDS.length >= 6);
    assert.ok(US_INCOME_DISCOVERY_SEEDS.length <= 8);
    const incomeSymbols = new Set<string>(US_INCOME_DISCOVERY_SEEDS.map((item) => item.symbol));
    for (const core of US_QUALITY_CORE) {
      assert.equal(incomeSymbols.has(core.symbol), false);
    }
  });

  it("routes unknown-cap movers to the general lane rather than fabricating small/mid", () => {
    assert.equal(isUsLiquidSmallMidCap(null), false);
    assert.equal(isUsLiquidSmallMidCap(undefined), false);
    assert.equal(classifyUsDiscoveryLane({ symbol: "ZZZ", marketCapUsd: null }), "balanced_general");
    assert.equal(classifyUsDiscoveryLane({ symbol: "ZZZ", marketCapUsd: 4_000_000_000 }), "high_risk_opportunity");
    assert.equal(classifyUsDiscoveryLane({ symbol: "ZZZ", marketCapUsd: 400_000_000_000 }), "balanced_general");
  });

  it("reserves a fundamentals slot for an ordinary income seed before dividendQualityScore exists", () => {
    const crowded: ResearchCandidate[] = [
      candidate("MSFT", "US", { qualityScore: 0.99, balanceSheetScore: 0.99, valuationScore: 0.8 }),
      candidate("AAPL", "US", { qualityScore: 0.98, balanceSheetScore: 0.97, valuationScore: 0.8 }),
      candidate("GOOGL", "US", { qualityScore: 0.97, balanceSheetScore: 0.96, valuationScore: 0.8 }),
      candidate("AMZN", "US", { qualityScore: 0.96, catalystScore: 0.95 }),
      candidate("META", "US", { qualityScore: 0.95, catalystScore: 0.94 }),
      candidate("NVDA", "US", { qualityScore: 0.94, catalystScore: 0.99 }),
      candidate("JPM", "US", { qualityScore: 0.93, balanceSheetScore: 0.92 }),
      candidate("SMID0", "US", { catalystScore: 0.99, earningsRevisionScore: 0.99, marketCapSek: 20_000_000_000 }),
      candidate("JNJ", "US"),
    ];
    const targets = selectLaneAwareFundamentalTargets({
      candidates: crowded,
      seeds: [
        { symbol: "JNJ", exchange: "US", researchLane: "income" },
        { symbol: "MSFT", exchange: "US", researchLane: "quality_core" },
        { symbol: "SMID0", exchange: "US", researchLane: "high_risk_opportunity" },
      ],
      maxTargets: 8,
    });
    assert.ok(targets.has("JNJ.US"));
    assert.ok(targets.size <= 8);
    assert.equal(isDividendResearchCandidate({ symbol: "JNJ", exchange: "US" }), false);
  });

  it("still rejects an ordinary income seed through the Dividend hard gate when no current dividend is verified", () => {
    assert.equal(
      isDividendResearchCandidate({ symbol: "JNJ", exchange: "US" }),
      false,
    );
    assert.equal(
      isDividendResearchCandidate({ symbol: "JNJ", exchange: "US", dividendQualityScore: Number.NaN }),
      false,
    );
    assert.equal(
      isDividendResearchCandidate({ symbol: "JNJ", exchange: "US", dividendQualityScore: 0.7 }),
      true,
    );
    assert.equal(
      isDividendResearchCandidate({ symbol: "SAGA-D", exchange: "ST" }),
      true,
    );
  });

  it("keeps holdings first in the fundamental target set", () => {
    const targets = selectLaneAwareFundamentalTargets({
      candidates: [
        candidate("HELD", "US", { qualityScore: 0.1 }),
        candidate("MSFT", "US", { qualityScore: 0.99, balanceSheetScore: 0.99 }),
        candidate("JNJ", "US"),
      ],
      seeds: [
        { symbol: "HELD", exchange: "US", held: true },
        { symbol: "JNJ", exchange: "US", researchLane: "income" },
        { symbol: "MSFT", exchange: "US", researchLane: "quality_core" },
      ],
      maxTargets: 8,
    });
    assert.ok(targets.has("HELD.US"));
    assert.ok(targets.has("JNJ.US"));
  });
});

describe("lane membership sanity", () => {
  it("keeps dividend priority instruments on the income lane and opportunity names off it", () => {
    for (const item of DIVIDEND_PRIORITY_INSTRUMENTS) {
      assert.equal(classifyNordicDiscoveryLane(item), "income");
    }
    const yubico = NORDIC_SMALL_MID_OPPORTUNITY_SEEDS.find((item) => item.symbol === "YUBICO");
    assert.ok(yubico);
    assert.equal(classifyNordicDiscoveryLane(yubico), "high_risk_opportunity");
    const investor = NORDIC_SEED_UNIVERSE.find((item) => item.symbol === "INVE-B");
    assert.ok(investor);
    assert.equal(classifyNordicDiscoveryLane(investor), "quality_core");
  });
});
