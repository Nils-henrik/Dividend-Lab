import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractExplicitDivBrainAnalysisIdentities,
  resolveSingleExplicitDivBrainAnalysisIdentity,
} from "./identity";

describe("DivBrain explicit analysis identity", () => {
  it("resolves one canonical explicit Nordic instrument", () => {
    assert.deepEqual(
      resolveSingleExplicitDivBrainAnalysisIdentity("Vad säger analysen om EVO.ST?"),
      { symbol: "EVO", exchange: "ST" },
    );
    assert.deepEqual(
      resolveSingleExplicitDivBrainAnalysisIdentity("Hur ser ATCO-A.ST ut tekniskt?"),
      { symbol: "ATCO-A", exchange: "ST" },
    );
  });

  it("accepts the explicit US convention without guessing a bare ticker", () => {
    assert.deepEqual(
      resolveSingleExplicitDivBrainAnalysisIdentity("Analysera JPM.US"),
      { symbol: "JPM", exchange: "US" },
    );
    assert.equal(resolveSingleExplicitDivBrainAnalysisIdentity("Analysera JPM"), null);
  });

  it("does not treat lowercase domains or prose as an instrument", () => {
    assert.equal(
      resolveSingleExplicitDivBrainAnalysisIdentity("Läs https://evo.st/rapport först"),
      null,
    );
    assert.equal(resolveSingleExplicitDivBrainAnalysisIdentity("Vad tycker du om Evolution?"), null);
  });

  it("deduplicates repeated references to the same instrument", () => {
    assert.deepEqual(
      extractExplicitDivBrainAnalysisIdentities("EVO.ST jämfört med sig själv EVO.ST"),
      [{ symbol: "EVO", exchange: "ST" }],
    );
    assert.deepEqual(
      resolveSingleExplicitDivBrainAnalysisIdentity("EVO.ST jämfört med sig själv EVO.ST"),
      { symbol: "EVO", exchange: "ST" },
    );
  });

  it("returns null when more than one distinct instrument is explicit", () => {
    assert.deepEqual(
      extractExplicitDivBrainAnalysisIdentities("Jämför EVO.ST med EMBRAC-B.ST"),
      [
        { symbol: "EVO", exchange: "ST" },
        { symbol: "EMBRAC-B", exchange: "ST" },
      ],
    );
    assert.equal(
      resolveSingleExplicitDivBrainAnalysisIdentity("Jämför EVO.ST med EMBRAC-B.ST"),
      null,
    );
  });

  it("ignores unsupported exchanges rather than inferring them", () => {
    assert.equal(resolveSingleExplicitDivBrainAnalysisIdentity("TEST.L"), null);
    assert.equal(resolveSingleExplicitDivBrainAnalysisIdentity("TEST.DE"), null);
  });
});
