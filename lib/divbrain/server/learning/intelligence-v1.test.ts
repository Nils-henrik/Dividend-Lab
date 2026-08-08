import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assembleDivBrainLearningContext,
  retrieveDivBrainLearningSources,
} from "./index";

const CONVERSATION_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CONVERSATION_ID = "22222222-2222-4222-8222-222222222222";

describe("DivBrain Intelligence v1 — Learning retrieval", () => {
  it("grounds a plain utdelning question via curated Learning metadata", () => {
    const result = retrieveDivBrainLearningSources("Vad är en utdelning?");

    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.ok(result.sources.length >= 1);
    assert.equal(
      result.hits[0]?.slug,
      "direktavkastning-och-utdelningssakerhet",
    );
  });

  it("uses the latest user turn for a referential follow-up with no direct match", () => {
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
    if (!result.ok) return;

    assert.equal(
      result.data.includedSources.some(
        (source) => source.id === "learning:vad-ar-en-indexfond",
      ),
      true,
    );
  });

  it("does not inherit a stale topic for an unrelated question", () => {
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
    if (!result.ok) return;
    assert.deepEqual(result.data.includedSources, []);
  });

  it("never uses a different conversation as retrieval fallback", () => {
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
    if (!result.ok) return;
    assert.deepEqual(result.data.includedSources, []);
  });
});
