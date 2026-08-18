import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHAT_COMPOSER_EMOJIS,
  insertComposerText,
  shouldDismissEmojiPickerForPointerTarget,
  shouldRestoreComposerFocusAfterEmojiPickerDismiss,
  shouldSubmitChatComposerKey,
} from "../lib/messages/chat-composer";
import { validateMessageBody } from "../lib/messages/validation";
import { MESSAGE_BODY_MAX_LENGTH } from "../lib/messages/types";

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

describe("chat composer emoji insertion", () => {
  it("inserts an emoji at the caret without losing surrounding text", () => {
    const result = insertComposerText({
      value: "Hej !",
      insert: "👍",
      selectionStart: 4,
      selectionEnd: 4,
    });

    assert.equal(result.value, "Hej 👍!");
    assert.equal(result.caret, 4 + "👍".length);
  });

  it("replaces the current selection when inserting an emoji", () => {
    const result = insertComposerText({
      value: "Hej där",
      insert: "😊",
      selectionStart: 4,
      selectionEnd: 7,
    });

    assert.equal(result.value, "Hej 😊");
    assert.equal(result.caret, 4 + "😊".length);
  });

  it("appends when no caret is provided at the end of the text", () => {
    const result = insertComposerText({
      value: "Klart",
      insert: "✅",
      selectionStart: 5,
      selectionEnd: 5,
    });

    assert.equal(result.value, "Klart✅");
  });

  it("does not drop existing text when the insert would exceed the max length", () => {
    const value = "x".repeat(MESSAGE_BODY_MAX_LENGTH);
    const result = insertComposerText({
      value,
      insert: "🔥",
      selectionStart: value.length,
      selectionEnd: value.length,
      maxLength: MESSAGE_BODY_MAX_LENGTH,
    });

    assert.equal(result.value, value);
  });

  it("sends emoji-only bodies through the existing text validation path", () => {
    assert.equal(validateMessageBody("👍", { required: true }).body, "👍");
    assert.equal(validateMessageBody("👍", { required: true }).error, null);
    assert.ok(CHAT_COMPOSER_EMOJIS.includes("👍"));
    assert.ok(CHAT_COMPOSER_EMOJIS.includes("❤️"));
    assert.equal(
      CHAT_COMPOSER_EMOJIS.some((emoji) => /[A-Za-z]/.test(emoji)),
      false,
    );
  });

  it("keeps the 2,000-character body limit when attachments are present", () => {
    const tooLong = "x".repeat(MESSAGE_BODY_MAX_LENGTH + 1);
    assert.ok(validateMessageBody(tooLong, { required: false }).error);
    assert.equal(validateMessageBody("", { required: false }).error, null);
  });
});

describe("chat emoji picker dismiss contract", () => {
  it("restores composer focus after Escape or select, but not after an outside click", () => {
    assert.equal(shouldRestoreComposerFocusAfterEmojiPickerDismiss("escape"), true);
    assert.equal(shouldRestoreComposerFocusAfterEmojiPickerDismiss("select"), true);
    assert.equal(shouldRestoreComposerFocusAfterEmojiPickerDismiss("outside"), false);
  });

  it("does not treat the picker panel or emoji trigger as an outside dismiss", () => {
    const inside = { nodeType: 1 };
    const panel = {
      contains(node: Node) {
        return node === (inside as unknown as Node);
      },
    };

    assert.equal(
      shouldDismissEmojiPickerForPointerTarget({
        target: inside as unknown as EventTarget,
        panel,
      }),
      false,
    );
    assert.equal(
      shouldDismissEmojiPickerForPointerTarget({
        target: {
          closest(selector: string) {
            return selector.includes("data-chat-emoji-trigger")
              ? ({} as Element)
              : null;
          },
        } as EventTarget,
        panel: { contains: () => false },
      }),
      false,
    );
    assert.equal(
      shouldDismissEmojiPickerForPointerTarget({
        target: {
          nodeType: 1,
          closest: () => null,
        } as unknown as EventTarget,
        panel: { contains: () => false },
      }),
      true,
    );
    assert.equal(
      shouldDismissEmojiPickerForPointerTarget({
        target: null,
        panel: null,
      }),
      true,
    );
  });
});
