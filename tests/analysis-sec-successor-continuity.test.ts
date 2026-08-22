import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveSecDomesticSuccessorContinuity,
  SEC_SUCCESSOR_CONTINUITY_VERSION,
} from "../lib/analysis/sec-successor-continuity";

describe("SEC domestic successor continuity registry", () => {
  it("resolves only the exact verified XOM successor CIK", () => {
    const result = resolveSecDomesticSuccessorContinuity({
      ticker: "xom",
      currentCik: 2_115_436,
    });

    assert.ok(result);
    assert.equal(result.version, SEC_SUCCESSOR_CONTINUITY_VERSION);
    assert.equal(result.predecessorCik, 34_088);
    assert.equal(result.effectiveDate, "2026-07-01");
    assert.equal(
      result.evidenceUrl,
      "https://www.sec.gov/Archives/edgar/data/2115436/000119312526291990/d71068d8k12b.htm",
    );
  });

  it("fails closed on ticker or successor-CIK drift", () => {
    assert.equal(resolveSecDomesticSuccessorContinuity({ ticker: "XOM", currentCik: 34_088 }), null);
    assert.equal(resolveSecDomesticSuccessorContinuity({ ticker: "MSFT", currentCik: 789_019 }), null);
    assert.equal(resolveSecDomesticSuccessorContinuity({ ticker: "XOM", currentCik: 0 }), null);
  });
});
