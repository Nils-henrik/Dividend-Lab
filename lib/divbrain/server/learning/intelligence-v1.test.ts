import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assembleDivBrainLearningContext } from "./index";

const CONVERSATION_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CONVERSATION_ID = "22222222-2222-4222-8222-222222222222";

function hasIndexFundSource(
  result: ReturnType<typeof assembleDivBrainLearningContext>,
): boolean {
  return (
    result.ok &&
    result.data.includedSources.some(
      (source) => source.id === "learning:vad-ar-en-indexfond",
    )
  );
}

describe("DivBrain Intelligence v1 — Learning follow-ups", () => {
  it("prefers same-conversation topic context for a referential follow-up", () => {
    const result = assembleDivBrainLearningContext({
      currentUserMessage: "Hur fungerar det då?",
      conversationId: CONVERSATION_ID,
      history: [
        {
          role: "user",
          content: "Vad är en indexfond?",
          conversationId: CONVERSATION_ID,
        },
        {
          role: "assistant",
          content: "En indexfond följer ett index.",
          conversationId: CONVERSATION_ID,
        },
      ],
    });

    assert.equal(result.ok, true);
    assert.equal(hasIndexFundSource(result), true);
  });

  it("does not carry the previous topic into an unrelated topic switch", () => {
    const result = assembleDivBrainLearningContext({
      currentUserMessage: "Hur byter man tändstift på en veteranmotorcykel?",
      conversationId: CONVERSATION_ID,
      history: [
        {
          role: "user",
          content: "Vad är en indexfond?",
          conversationId: CONVERSATION_ID,
        },
      ],
    });

    assert.equal(result.ok, true);
    assert.equal(hasIndexFundSource(result), false);
  });

  it("never borrows retrieval context from another conversation", () => {
    const result = assembleDivBrainLearningContext({
      currentUserMessage: "Hur fungerar det då?",
      conversationId: CONVERSATION_ID,
      history: [
        {
          role: "user",
          content: "Vad är en indexfond?",
          conversationId: OTHER_CONVERSATION_ID,
        },
      ],
    });

    assert.equal(result.ok, true);
    assert.equal(hasIndexFundSource(result), false);
  });
});
