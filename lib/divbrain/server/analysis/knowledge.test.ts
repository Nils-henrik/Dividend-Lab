import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type { DivBrainSource } from "../../sources";
import {
  createDivBrainAnalysisKnowledgeRetriever,
  DIVBRAIN_ANALYSIS_KNOWLEDGE_MAX_SOURCES,
} from "./knowledge";

function source(id: string): DivBrainSource {
  return {
    id,
    title: `Source ${id}`,
    category: "internal_structured_data",
    verificationState: "internally_curated",
    freshnessState: "current",
    publisher: "DivLab",
    excerpt: "Verifierat analysunderlag.",
  };
}

describe("DivBrain analysis knowledge retriever", () => {
  it("does not call the loader without exactly one explicit identity", async () => {
    let calls = 0;
    const retriever = createDivBrainAnalysisKnowledgeRetriever({
      async loadApprovedSources() {
        calls += 1;
        return divBrainSuccess([source("analysis:test")]);
      },
    });

    const prose = await retriever.retrieve({ currentUserMessage: "Vad tycker du om Evolution?" });
    assert.equal(prose.ok, true);
    if (prose.ok) assert.deepEqual(prose.data, []);

    const compare = await retriever.retrieve({ currentUserMessage: "Jämför EVO.ST med ATCO-A.ST" });
    assert.equal(compare.ok, true);
    if (compare.ok) assert.deepEqual(compare.data, []);
    assert.equal(calls, 0);
  });

  it("loads the exact canonical identity once", async () => {
    const seen: string[] = [];
    const retriever = createDivBrainAnalysisKnowledgeRetriever({
      async loadApprovedSources(identity) {
        seen.push(`${identity.symbol}.${identity.exchange}`);
        return divBrainSuccess([source("analysis:evo")]);
      },
    });

    const result = await retriever.retrieve({ currentUserMessage: "Visa DivLab Analys för EVO.ST" });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.data[0]?.id, "analysis:evo");
    assert.deepEqual(seen, ["EVO.ST"]);
  });

  it("caps analysis knowledge at the global source capacity", async () => {
    const retriever = createDivBrainAnalysisKnowledgeRetriever({
      async loadApprovedSources() {
        return divBrainSuccess([
          source("analysis:main"),
          source("analysis:report"),
          source("analysis:market"),
          source("analysis:extra"),
        ]);
      },
    });

    const result = await retriever.retrieve({ currentUserMessage: "EVO.ST" });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.length, DIVBRAIN_ANALYSIS_KNOWLEDGE_MAX_SOURCES);
    assert.deepEqual(result.data.map((item) => item.id), [
      "analysis:main",
      "analysis:report",
      "analysis:market",
    ]);
  });

  it("fails closed when the loader throws, fails or returns malformed sources", async () => {
    const throwing = createDivBrainAnalysisKnowledgeRetriever({
      async loadApprovedSources() {
        throw new Error("db failed");
      },
    });
    const thrown = await throwing.retrieve({ currentUserMessage: "EVO.ST" });
    assert.equal(thrown.ok, false);
    if (!thrown.ok) assert.equal(thrown.error.code, "internal_error");

    const failing = createDivBrainAnalysisKnowledgeRetriever({
      async loadApprovedSources() {
        return divBrainFailureFromCode("internal_error");
      },
    });
    const failed = await failing.retrieve({ currentUserMessage: "EVO.ST" });
    assert.equal(failed.ok, false);

    const malformed = createDivBrainAnalysisKnowledgeRetriever({
      async loadApprovedSources() {
        return divBrainSuccess([
          { ...source("analysis:bad"), title: "" },
        ]);
      },
    });
    const invalid = await malformed.retrieve({ currentUserMessage: "EVO.ST" });
    assert.equal(invalid.ok, false);
  });
});
