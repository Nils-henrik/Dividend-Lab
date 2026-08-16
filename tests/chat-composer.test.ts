import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldSubmitChatComposerKey } from "../lib/messages/chat-composer";

describe("chat composer IME safety", () => {
  it("sends on plain Enter when not composing", () => {
    assert.equal(
      shouldSubmitChatComposerKey({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
      }),
      true,
    );
  });

  it("inserts a newline on Shift+Enter instead of sending", () => {
    assert.equal(
      shouldSubmitChatComposerKey({
        key: "Enter",
        shiftKey: true,
        isComposing: false,
      }),
      false,
    );
  });

  it("does not send while an IME composition is active", () => {
    assert.equal(
      shouldSubmitChatComposerKey({
        key: "Enter",
        shiftKey: false,
        isComposing: true,
      }),
      false,
    );
    assert.equal(
      shouldSubmitChatComposerKey({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        keyCode: 229,
      }),
      false,
    );
  });
});
