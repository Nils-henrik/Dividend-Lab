import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AnalysisEvidence } from "../lib/analysis/evidence";
import type { CurrencyAwareFundamentalSnapshot } from "../lib/analysis/financial-statement-normalizer";
import { reconcilePrimaryReport } from "../lib/analysis/primary-report-reconciliation";

function evidence(overrides: Partial<AnalysisEvidence> = {}): AnalysisEvidence {
  return {
    id: "evidence:report",
    sourceId: "source:report",
    kind: "official_report_excerpt",
    title: "Half-year report 2026",
    content: "bounded summary",
    documentExcerpt: [
      "Amounts in SEK million",
      "Net sales 1,000 900",
      "Operating profit 200 180",
      "Net income 130 120",
      "Earnings per share, SEK 6.50 6.00",
    ].join("\n"),
    publishedAt: "2026-07-20T06:00:00.000Z",
    primary: true,
    documentRetrieved: true,
    reportPeriod: "H1",
    reportYear: 2026,
    documentType: "half_year_report",
    ...overrides,
  };
}

function h1Snapshot(): CurrencyAwareFundamentalSnapshot {
  return {
    asOf: "2026-06-30",
    currency: "SEK",
    reportingCurrency: "SEK",
    epsTtmCurrency: "SEK",
    quarterlyPeriods: [
      {
        period: "2026-06-30",
        revenue: 600_000_000,
        operatingIncome: 120_000_000,
        netIncome: 80_000_000,
        eps: 4,
      },
      {
        period: "2026-03-31",
        revenue: 400_000_000,
        operatingIncome: 80_000_000,
        netIncome: 50_000_000,
        eps: 2.5,
      },
      {
        period: "2025-12-31",
        revenue: 300_000_000,
        operatingIncome: 60_000_000,
        netIncome: 40_000_000,
        eps: 2,
      },
    ],
  };
}

describe("DivLab primary report reconciliation", () => {
  it("confirms same-basis H1 metrics without mutating provider values", () => {
    const snapshot = h1Snapshot();
    const before = structuredClone(snapshot);
    const result = reconcilePrimaryReport({ fundamentals: snapshot, evidence: [evidence()] });

    assert.equal(result.status, "confirmed");
    assert.equal(result.providerBasis, "ytd_2q");
    assert.deepEqual(result.providerPeriods, ["2026-06-30", "2026-03-31"]);
    assert.equal(result.amountScale, 1_000_000);
    assert.equal(result.confirmedMetrics, 4);
    assert.equal(result.eligibleMetrics, 4);
    assert.deepEqual(
      result.metrics.map((metric) => [metric.metric, metric.providerValue, metric.reportValue, metric.status]),
      [
        ["revenue", 1_000_000_000, 1_000_000_000, "confirmed"],
        ["operatingIncome", 200_000_000, 200_000_000, "confirmed"],
        ["netIncome", 130_000_000, 130_000_000, "confirmed"],
        ["eps", 6.5, 6.5, "confirmed"],
      ],
    );
    assert.deepEqual(snapshot, before);
  });

  it("uses a unique locale interpretation only when it matches the provider basis", () => {
    const snapshot: CurrencyAwareFundamentalSnapshot = {
      asOf: "2025-12-31",
      currency: "EUR",
      reportingCurrency: "EUR",
      epsTtmCurrency: "EUR",
      historicalPeriods: [
        {
          period: "2025-12-31",
          revenue: 1_250_500_000,
          operatingIncome: null,
          netIncome: null,
          eps: null,
        },
      ],
    };
    const result = reconcilePrimaryReport({
      fundamentals: snapshot,
      evidence: [
        evidence({
          title: "Annual report 2025",
          reportPeriod: "FY",
          reportYear: 2025,
          documentType: "annual_report",
          documentExcerpt: "Amounts in EUR million\nRevenue 1.250,5 1.100,0",
        }),
      ],
    });

    assert.equal(result.providerBasis, "fy");
    assert.equal(result.metrics.find((metric) => metric.metric === "revenue")?.status, "confirmed");
    assert.equal(result.metrics.find((metric) => metric.metric === "revenue")?.reportValue, 1_250_500_000);
  });

  it("does not infer ordinary spaces as thousands separators in flattened tables", () => {
    const snapshot: CurrencyAwareFundamentalSnapshot = {
      asOf: "2025-12-31",
      currency: "SEK",
      reportingCurrency: "SEK",
      epsTtmCurrency: "SEK",
      historicalPeriods: [
        { period: "2025-12-31", revenue: 123_456_000_000 },
      ],
    };
    const result = reconcilePrimaryReport({
      fundamentals: snapshot,
      evidence: [
        evidence({
          title: "Annual report 2025",
          reportPeriod: "FY",
          reportYear: 2025,
          documentType: "annual_report",
          documentExcerpt: "Amounts in SEK million\nNet sales 123 456 117 000",
        }),
      ],
    });

    assert.equal(result.metrics.find((metric) => metric.metric === "revenue")?.status, "not_confirmed");
    assert.equal(result.metrics.find((metric) => metric.metric === "revenue")?.reportValue, null);
  });

  it("requires an explicit amount scale but can still confirm explicitly-currency-labelled EPS", () => {
    const result = reconcilePrimaryReport({
      fundamentals: h1Snapshot(),
      evidence: [
        evidence({
          documentExcerpt: [
            "Net sales 1,000 900",
            "Operating profit 200 180",
            "Net income 130 120",
            "Earnings per share, SEK 6.50 6.00",
          ].join("\n"),
        }),
      ],
    });

    assert.equal(result.amountScale, null);
    assert.equal(result.status, "partial");
    assert.equal(result.confirmedMetrics, 1);
    assert.equal(result.metrics.find((metric) => metric.metric === "eps")?.status, "confirmed");
    assert.equal(result.metrics.find((metric) => metric.metric === "revenue")?.status, "not_confirmed");
  });

  it("stays not applicable when clean primary document text is unavailable", () => {
    const result = reconcilePrimaryReport({
      fundamentals: h1Snapshot(),
      evidence: [evidence({ documentExcerpt: null })],
    });
    assert.equal(result.status, "not_applicable");
    assert.equal(result.confirmedMetrics, 0);
    assert.match(result.notes[0] ?? "", /primärrapporttext/i);
  });

  it("does not turn an unmatched report number into a claimed accounting conflict", () => {
    const result = reconcilePrimaryReport({
      fundamentals: h1Snapshot(),
      evidence: [
        evidence({
          documentExcerpt: [
            "Amounts in SEK million",
            "Net sales 777 700",
            "Operating profit 111 100",
            "Net income 99 90",
            "Earnings per share, SEK 3.00 2.50",
          ].join("\n"),
        }),
      ],
    });
    assert.equal(result.status, "not_confirmed");
    assert.equal(result.confirmedMetrics, 0);
    assert.ok(result.metrics.every((metric) => metric.status !== "confirmed"));
  });
});
