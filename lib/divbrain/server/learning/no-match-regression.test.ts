import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { retrieveDivBrainLearningSources } from "./retrieve";

describe("DivBrain Learning no-match regressions", () => {
  it("does not turn one repeated company-name match into Learning relevance", () => {
    const result = retrieveDivBrainLearningSources(
      "hur konfigurerar man en Ericsson MINI-LINK",
    );

    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.deepEqual(result.data.hits, []);
    assert.deepEqual(result.data.sources, []);
  });
});
