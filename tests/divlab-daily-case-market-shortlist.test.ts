import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shortlistDailyCasePreflights,
  type DailyCaseMarketShortlistCandidate,
  type DailyCaseMarketSignalKey,
} from "../lib/analysis/daily-case-market-shortlist";

const NOW = new Date("2026-08-15T01:00:00.000Z");
const AS_OF = "2026-08-15T00:00:00.000Z";
const SOURCES = ["market", "report", "catalyst", "revisions"] as const;

function signal(value: number, sourceId: string, asOf = AS_OF) {
  return { value, sourceIds: [sourceId], asOf };
}

function candidate(
  symbol: string,
  signals: Partial<Record<DailyCaseMarketSignalKey, ReturnType<typeof signal> | null>> = {},
  exchange = "ST",
): DailyCaseMarketShortlistCandidate {
  return {
    symbol,
    exchange,
    yahooSymbol: `${symbol}.${exchange}`,
    name: `${symbol} AB`,
    knownSourceIds: SOURCES,
    signals: {
      freshReport: signal(0.8, "report"),
      catalyst: signal(0.7, "catalyst"),
      estimateRevisions: signal(0.7, "revisions"),
      technicalSetup: signal(0.7, "market"),
      abnormalVolume: signal(0.7, "market"),
      priceMove: signal(0.7, "market"),
      ...signals,
    },
  };
}

describe("DivLab daily case market shortlist", () => {
  it("hard-caps the cheap preflight shortlist at twenty", () => {
    const universe = Array.from({ length: 25 }, (_, index) => candidate(`CASE${index + 1}`));
    const result = shortlistDailyCasePreflights(universe, {
      now: NOW,
      maxSameExchange: 20,
      maxSamePrimaryDriver: 20,
    });

    assert.equal(result.version, "daily-case-market-shortlist-v1");
    assert.equal(result.selected.length, 20);
    assert.equal(result.eligibleNotSelected.length, 5);
    assert.ok(
      result.eligibleNotSelected.every(
        (item) => item.notSelectedReason === "preflight_budget_exhausted",
      ),
    );
  });

  it("can shortlist a report-only event but not a weak price-only blip", () => {
    const reportOnly = candidate("REPORT", {
      catalyst: null,
      estimateRevisions: null,
      technicalSetup: null,
      abnormalVolume: null,
      priceMove: null,
      freshReport: signal(1, "report"),
    });
    const priceOnly = candidate("PRICE", {
      freshReport: null,
      catalyst: null,
      estimateRevisions: null,
      technicalSetup: null,
      abnormalVolume: null,
      priceMove: signal(1, "market"),
    });

    const result = shortlistDailyCasePreflights([reportOnly, priceOnly], { now: NOW });
    assert.deepEqual(result.selected.map((item) => item.symbol), ["REPORT"]);
    assert.equal(result.blocked[0]?.symbol, "PRICE");
    assert.ok(
      result.blocked[0]?.blockers.includes("market_shortlist_score_below_threshold"),
    );
  });

  it("expires stale event signals and records them for audit", () => {
    const result = shortlistDailyCasePreflights(
      [
        candidate("STALE", {
          freshReport: signal(1, "report", "2026-08-01T00:00:00.000Z"),
          catalyst: null,
          estimateRevisions: null,
          technicalSetup: null,
          abnormalVolume: null,
          priceMove: null,
        }),
      ],
      { now: NOW },
    );

    assert.equal(result.selected.length, 0);
    assert.ok(result.blocked[0]?.staleSignals.includes("freshReport"));
    assert.ok(result.blocked[0]?.blockers.includes("missing_fresh_why_now_signal"));
  });

  it("rejects invented signal provenance", () => {
    assert.throws(
      () =>
        shortlistDailyCasePreflights(
          [candidate("BAD", { catalyst: signal(1, "invented") })],
          { now: NOW },
        ),
      /daily_case_market_signal_source_unknown:BAD@ST:catalyst:invented/,
    );
  });

  it("rejects materially future-dated market evidence", () => {
    assert.throws(
      () =>
        shortlistDailyCasePreflights(
          [
            candidate("FUTURE", {
              freshReport: signal(1, "report", "2026-08-15T01:06:00.000Z"),
            }),
          ],
          { now: NOW },
        ),
      /daily_case_market_signal_from_future:FUTURE@ST:freshReport/,
    );
  });

  it("rejects duplicate canonical instrument identities", () => {
    assert.throws(
      () =>
        shortlistDailyCasePreflights(
          [candidate("DUP"), candidate("dup", {}, "st")],
          { now: NOW },
        ),
      /daily_case_market_duplicate_identity:DUP@ST/,
    );
  });

  it("uses stable symbol ordering for exact score ties", () => {
    const result = shortlistDailyCasePreflights(
      [candidate("BBB"), candidate("AAA")],
      { now: NOW },
    );
    assert.deepEqual(result.selected.map((item) => item.symbol), ["AAA", "BBB"]);
  });

  it("enforces the 300-name universe and 20-name preflight budget", () => {
    const tooLarge = Array.from({ length: 301 }, (_, index) => candidate(`C${index}`));
    assert.throws(
      () => shortlistDailyCasePreflights(tooLarge, { now: NOW }),
      /daily_case_market_universe_too_large/,
    );
    assert.throws(
      () => shortlistDailyCasePreflights([candidate("ONE")], { now: NOW, maxShortlistSize: 21 }),
      /daily_case_market_config_invalid:maxShortlistSize/,
    );
  });
});
