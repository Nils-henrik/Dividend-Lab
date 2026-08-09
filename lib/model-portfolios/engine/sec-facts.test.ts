import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractLatestSecFacts, summarizeSecFacts } from "./sec-facts";

describe("SEC Company Facts adapter", () => {
  const payload = {
    entityName: "Example Corp",
    facts: {
      "us-gaap": {
        NetIncomeLoss: {
          label: "Net Income (Loss)",
          units: {
            USD: [
              { val: 100, end: "2025-12-31", filed: "2026-02-01", form: "10-K", fy: 2025, fp: "FY" },
              { val: 35, end: "2026-06-30", filed: "2026-08-01", form: "10-Q", fy: 2026, fp: "Q2" },
            ],
          },
        },
        EarningsPerShareDiluted: {
          label: "Earnings Per Share, Diluted",
          units: {
            "USD/shares": [
              { val: 1.25, end: "2026-06-30", filed: "2026-08-01", form: "10-Q", fy: 2026, fp: "Q2" },
            ],
          },
        },
      },
    },
  };

  it("extracts the latest investment-relevant XBRL facts", () => {
    const facts = extractLatestSecFacts(payload);
    assert.equal(facts.length, 2);
    assert.equal(facts.find((fact) => fact.concept === "NetIncomeLoss")?.value, 35);
    assert.equal(facts.find((fact) => fact.concept === "EarningsPerShareDiluted")?.value, 1.25);
  });

  it("creates a compact deterministic primary-source summary", () => {
    const summary = summarizeSecFacts("Example Corp", extractLatestSecFacts(payload));
    assert.match(summary, /SEC XBRL Company Facts/);
    assert.match(summary, /Net Income/);
    assert.match(summary, /Earnings Per Share/);
  });
});
