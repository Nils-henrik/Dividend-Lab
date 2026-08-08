import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isDivBrainOptimisticMessagePersisted,
  shouldSubmitDivBrainComposerKey,
} from "./chat-ux";

describe("DivBrain Chat UX v1", () => {
  it("submits plain Enter only when the composer can submit", () => {
    assert.equal(
      shouldSubmitDivBrainComposerKey({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        canSubmit: true,
      }),
      true,
    );
    assert.equal(
      shouldSubmitDivBrainComposerKey({
        key: "Enter",
        shiftKey: true,
        isComposing: false,
        canSubmit: true,
      }),
      false,
    );
    assert.equal(
      shouldSubmitDivBrainComposerKey({
        key: "Enter",
        shiftKey: false,
        isComposing: true,
        canSubmit: true,
      }),
      false,
    );
    assert.equal(
      shouldSubmitDivBrainComposerKey({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        canSubmit: false,
      }),
      false,
    );
  });

  it("replaces an optimistic message only with a new matching persisted row", () => {
    const optimistic = {
      content: "Vad är en indexfond?",
      createdAt: "2026-08-08T19:30:00.000Z",
      previousPersistedUserMessageId: "previous-message",
    };

    assert.equal(
      isDivBrainOptimisticMessagePersisted({
        optimistic,
        latestPersisted: {
          id: "new-message",
          content: "Vad är en indexfond?",
          createdAt: "2026-08-08T19:30:01.000Z",
        },
      }),
      true,
    );

    assert.equal(
      isDivBrainOptimisticMessagePersisted({
        optimistic,
        latestPersisted: {
          id: "previous-message",
          content: "Vad är en indexfond?",
          createdAt: "2026-08-08T19:29:59.000Z",
        },
      }),
      false,
    );

    assert.equal(
      isDivBrainOptimisticMessagePersisted({
        optimistic,
        latestPersisted: {
          id: "new-message",
          content: "Vad är en utdelning?",
          createdAt: "2026-08-08T19:30:01.000Z",
        },
      }),
      false,
    );
  });
});
