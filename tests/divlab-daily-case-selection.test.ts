import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  selectDailyAnalysisCases,
  type DailyCaseSelectionCandidate,
  type DailyCaseSignalKey,
} from "../lib/analysis/daily-case-selection";

const SOURCE_IDS = ["market", "report", "fundamental", "analytics"] as const;

function signal(value: number, sourceId = "market") {
  return {
    value,
    sourceIds: [sourceId],
    asOf: "2026-08-15T00:00:00.000Z",
  };
}

function strongCandidate(
  symbol: string,
  overrides: Partial<Record<DailyCaseSignalKey, ReturnType<typeof signal> | null>> = {},
  exchange = "ST",
): DailyCaseSelectionCandidate {
  return {
    symbol,
    exchange,
    name: `${symbol} AB`,
    methodologyStatus: "supported",
    knownSourceIds: SOURCE_IDS,
    signals: {
      freshReport: signal(0.8, "report"),
      catalyst: signal(0.6, "report"),
      valuationDislocation: signal(0.7, "fundamental"),
      estimateRevisions: signal(0.6, "fundamental"),
      technicalSetup: signal(0.6),
      abnormalVolume: signal(0.4),
      priceMove: signal(0.4),
      fundamentalOpportunity: signal(0.8, "fundamental"),
      readerInterest: signal(0.6, "analytics"),
      dataReadiness: signal(0.9, "fundamental"),
      ...overrides,
    },
  };
}

describe("DivLab daily case selection", () => {
  it("selects at most four strong cases without forcing a weak fifth case", () => {
    const candidates = [
      strongCandidate("REPORT"),
      strongCandidate("CAT", { freshReport: signal(0.1, "report"), catalyst: signal(1, "report") }),
      strongCandidate("TECH", {
        freshReport: signal(0.1, "report"),
        catalyst: signal(0.1, "report"),
        technicalSetup: signal(1),
      }),
      strongCandidate("REV", {
        freshReport: signal(0.1, "report"),
        catalyst: signal(0.1, "report"),
        estimateRevisions: signal(1, "fundamental"),
      }),
      {
        ...strongCandidate("WEAK"),
        signals: {
          readerInterest: signal(1, "analytics"),
          dataReadiness: signal(0.9, "fundamental"),
        },
      },
    ];

    const result = selectDailyAnalysisCases(candidates);
    assert.equal(result.version, "daily-case-selection-v1");
    assert.equal(result.selected.length, 4);
    assert.equal(result.blocked.length, 1);
    assert.equal(result.blocked[0]?.symbol, "WEAK");
    assert.ok(result.blocked[0]?.blockers.includes("missing_why_now_signal"));
    assert.ok(result.blocked[0]?.blockers.includes("selection_score_below_threshold"));
  });

  it("can return fewer cases instead of filling the quota", () => {
    const result = selectDailyAnalysisCases([
      strongCandidate("ONE"),
      strongCandidate("TWO", { freshReport: signal(0.1, "report"), catalyst: signal(1, "report") }),
      {
        ...strongCandidate("READER"),
        signals: {
          readerInterest: signal(1, "analytics"),
          dataReadiness: signal(0.95, "fundamental"),
        },
      },
    ]);

    assert.equal(result.selected.length, 2);
    assert.equal(result.stats.candidates, 3);
    assert.equal(result.stats.blocked, 1);
  });

  it("penalizes missing evidence instead of renormalizing sparse signals", () => {
    const sparse = strongCandidate("SPARSE", {
      freshReport: signal(1, "report"),
      catalyst: null,
      valuationDislocation: null,
      estimateRevisions: null,
      technicalSetup: null,
      abnormalVolume: null,
      priceMove: null,
      fundamentalOpportunity: null,
      readerInterest: null,
      dataReadiness: signal(0.9, "fundamental"),
    });

    const result = selectDailyAnalysisCases([sparse]);
    assert.equal(result.selected.length, 0);
    assert.equal(result.blocked[0]?.symbol, "SPARSE");
    assert.ok(result.blocked[0]?.score !== undefined && result.blocked[0].score < 0.45);
    assert.ok(result.blocked[0]?.signalCoverage !== undefined && result.blocked[0].signalCoverage < 0.3);
  });

  it("blocks unsupported methodology before heavy research selection", () => {
    const bank = {
      ...strongCandidate("BANK"),
      methodologyStatus: "specialized_required" as const,
    };
    const result = selectDailyAnalysisCases([bank]);
    assert.equal(result.selected.length, 0);
    assert.deepEqual(result.blocked[0]?.blockers.includes("methodology_not_supported"), true);
  });

  it("rejects a signal that cites an unknown source id", () => {
    const candidate = strongCandidate("BAD_SOURCE", {
      catalyst: signal(1, "invented-source"),
    });
    assert.throws(
      () => selectDailyAnalysisCases([candidate]),
      /daily_case_signal_source_unknown/,
    );
  });

  it("uses deterministic symbol and exchange ordering for exact score ties", () => {
    const result = selectDailyAnalysisCases([
      strongCandidate("BBB", { freshReport: signal(0.1, "report"), catalyst: signal(1, "report") }),
      strongCandidate("AAA", { freshReport: signal(0.1, "report"), catalyst: signal(1, "report") }),
    ]);
    assert.deepEqual(result.selected.map((candidate) => candidate.symbol), ["AAA", "BBB"]);
  });

  it("rejects duplicate instrument identities", () => {
    assert.throws(
      () =>
        selectDailyAnalysisCases([
          strongCandidate("DUP"),
          strongCandidate("dup", {}, "st"),
        ]),
      /daily_case_duplicate_identity:DUP@ST/,
    );
  });

  it("enforces primary-driver diversity without substituting a weak case", () => {
    const catalystPrimary = (symbol: string) =>
      strongCandidate(symbol, {
        freshReport: signal(0.05, "report"),
        catalyst: signal(1, "report"),
        estimateRevisions: signal(0.2, "fundamental"),
        technicalSetup: signal(0.2),
      });

    const result = selectDailyAnalysisCases(
      [catalystPrimary("CAT1"), catalystPrimary("CAT2"), catalystPrimary("CAT3")],
      { maxSamePrimaryDriver: 2 },
    );

    assert.equal(result.selected.length, 2);
    assert.equal(result.eligibleNotSelected.length, 1);
    assert.equal(
      result.eligibleNotSelected[0]?.notSelectedReason,
      "primary_driver_diversity_limit",
    );
  });

  it("keeps the daily heavy-research budget hard-capped at four", () => {
    assert.throws(
      () => selectDailyAnalysisCases([strongCandidate("ONE")], { maxSelections: 5 }),
      /daily_case_config_invalid:maxSelections/,
    );
  });
});
