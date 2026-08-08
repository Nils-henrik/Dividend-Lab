import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assembleDivBrainLearningContext } from "../learning/context-assembler";
import { retrieveDivBrainNewsSources } from "./retrieve";

describe("DivBrain Intelligence v3 Börsnyheter grounding", () => {
  it("retrieves a clearly named company from published DivLab news", () => {
    const result = retrieveDivBrainNewsSources("Vad hände med Sivers den här veckan?");
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.ok(
      result.data.sources.some(
        (source) => source.id === "news:sivers-rusar-ai-fotonik-usa-importregler",
      ),
    );
    for (const source of result.data.sources) {
      assert.equal(source.category, "divlab_article");
      assert.equal(source.verificationState, "internally_curated");
      assert.equal(source.freshnessState, "dated");
      assert.ok(source.internalRoute?.startsWith("/news/"));
      assert.ok(source.publishedAt);
    }
  });

  it("does not inject Börsnyheter into a timeless index-fund definition", () => {
    const result = retrieveDivBrainNewsSources("Vad är en indexfond?");
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.deepEqual(result.data.sources, []);
  });

  it("adds a trusted freshness warning whenever dated news enters context", () => {
    const result = assembleDivBrainLearningContext({
      currentUserMessage: "Vad hände med Sivers den här veckan?",
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.ok(
      result.data.includedSources.some(
        (source) => source.id === "news:sivers-rusar-ai-fotonik-usa-importregler",
      ),
    );
    assert.ok(
      result.data.sections.some(
        (section) =>
          section.kind === "freshness_warning" &&
          section.trust === "trusted_system" &&
          section.content.includes("inte som livekurs"),
      ),
    );
  });
});
