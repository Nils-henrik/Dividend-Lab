import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DIVBRAIN_ATTACHMENT_COPY_SV } from "./attachments";
import {
  isDivBrainOptimisticMessagePersisted,
  resolveDivBrainComposerDiscardOutcome,
  shouldSubmitDivBrainComposerKey,
} from "./chat-ux";

describe("DivBrain Chat UX v1", () => {
  it("removes composer chip only after successful server discard", () => {
    assert.deepEqual(
      resolveDivBrainComposerDiscardOutcome({
        hasServerAttachmentId: false,
        discardResult: null,
      }),
      { remove: true },
    );

    assert.deepEqual(
      resolveDivBrainComposerDiscardOutcome({
        hasServerAttachmentId: true,
        discardResult: { ok: true },
      }),
      { remove: true },
    );

    const failed = resolveDivBrainComposerDiscardOutcome({
      hasServerAttachmentId: true,
      discardResult: {
        ok: false,
        safeMessage: DIVBRAIN_ATTACHMENT_COPY_SV.discardFailure,
      },
    });
    assert.deepEqual(failed, {
      remove: false,
      safeMessage: DIVBRAIN_ATTACHMENT_COPY_SV.discardFailure,
    });
    assert.equal(failed.remove, false);
    if (!failed.remove) {
      assert.equal(failed.safeMessage.includes("storage"), false);
      assert.equal(failed.safeMessage.includes("attachmentId"), false);
    }
  });

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
