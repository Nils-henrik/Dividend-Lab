import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  countLongCompoundTokenOverlap,
  expandDivBrainLearningQueryTokens,
  tokenizeDivBrainLearningText,
} from "./normalize";
import { retrieveDivBrainLearningSources } from "./retrieve";

describe("DivBrain Intelligence v2 Learning retrieval", () => {
  it("expands established finance equivalents without removing the user's terms", () => {
    assert.deepEqual(expandDivBrainLearningQueryTokens(["riskspridning"]), [
      "riskspridning",
      "diversifiering",
    ]);
    assert.deepEqual(expandDivBrainLearningQueryTokens(["isk"]), [
      "isk",
      "investeringssparkonto",
    ]);
    assert.deepEqual(expandDivBrainLearningQueryTokens(["kapitalförsäkring"]), [
      "kapitalförsäkring",
      "kf",
    ]);
  });

  it("normalizes common valuation notation", () => {
    assert.deepEqual(tokenizeDivBrainLearningText("P/E-tal och P/S"), [
      "pe",
      "tal",
      "ps",
    ]);
  });

  it("recognizes only long conservative Swedish compound prefixes", () => {
    assert.equal(
      countLongCompoundTokenOverlap(
        ["utdelning"],
        ["direktavkastning", "utdelningssäkerhet"],
      ),
      1,
    );
    assert.equal(
      countLongCompoundTokenOverlap(["fond"], ["fondavgift"]),
      0,
    );
  });

  it("grounds a natural utdelning question in the dedicated DivLab article", () => {
    const result = retrieveDivBrainLearningSources("Vad är en utdelning?");
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.ok(result.data.sources.length > 0);
    assert.ok(
      result.data.sources.some(
        (source) => source.id === "learning:direktavkastning-och-utdelningssakerhet",
      ),
    );
  });

  it("still returns honest no-match for unrelated generic queries", () => {
    const result = retrieveDivBrainLearningSources(
      "Hur bakar jag surdegsbröd i en gjutjärnsgryta?",
    );
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.deepEqual(result.data.sources, []);
  });
});
