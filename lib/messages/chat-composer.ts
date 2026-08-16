import { MESSAGE_BODY_MAX_LENGTH } from "./types";

export type ChatComposerKeyIntent = {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  keyCode?: number;
};

export const CHAT_COMPOSER_EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😊",
  "🙂",
  "😉",
  "😍",
  "😘",
  "😎",
  "🤔",
  "😮",
  "😅",
  "😆",
  "😂",
  "😢",
  "😭",
  "😡",
  "👍",
  "👎",
  "👏",
  "🙌",
  "🙏",
  "💪",
  "🤝",
  "🔥",
  "❤️",
  "💙",
  "💚",
  "🎉",
  "✨",
  "⭐",
  "💯",
  "✅",
  "❌",
  "📈",
  "📉",
  "💰",
  "🏦",
  "☕",
  "🏠",
  "🌞",
  "🌙",
  "⚡",
  "💡",
  "📌",
] as const;

/**
 * Enter sends only when the user is not composing an IME candidate.
 * Shift+Enter inserts a newline (caller must not preventDefault).
 * keyCode 229 is the legacy composition sentinel used by some browsers.
 */
export function shouldSubmitChatComposerKey(
  intent: ChatComposerKeyIntent,
): boolean {
  return (
    intent.key === "Enter" &&
    !intent.shiftKey &&
    !intent.isComposing &&
    intent.keyCode !== 229
  );
}

export function insertComposerText(params: {
  value: string;
  insert: string;
  selectionStart: number;
  selectionEnd: number;
  maxLength?: number;
}): { value: string; caret: number } {
  const maxLength = params.maxLength ?? MESSAGE_BODY_MAX_LENGTH;
  const valueLength = params.value.length;
  const start = Math.max(0, Math.min(params.selectionStart, valueLength));
  const end = Math.max(start, Math.min(params.selectionEnd, valueLength));
  const next = `${params.value.slice(0, start)}${params.insert}${params.value.slice(end)}`;

  if (next.length > maxLength) {
    return { value: params.value, caret: end };
  }

  return {
    value: next,
    caret: start + params.insert.length,
  };
}

export type ChatEmojiPickerDismissReason = "escape" | "outside" | "select";

export function shouldRestoreComposerFocusAfterEmojiPickerDismiss(
  reason: ChatEmojiPickerDismissReason,
) {
  return reason !== "outside";
}

export function shouldDismissEmojiPickerForPointerTarget(params: {
  target: EventTarget | null;
  panel: { contains(node: Node): boolean } | null;
  triggerSelector?: string;
}) {
  const triggerSelector =
    params.triggerSelector ?? "[data-chat-emoji-trigger='true']";
  const target = params.target;

  if (target == null) {
    return true;
  }

  if (
    params.panel &&
    typeof (target as { nodeType?: unknown }).nodeType === "number" &&
    params.panel.contains(target as Node)
  ) {
    return false;
  }

  const closest = (target as { closest?: (selector: string) => Element | null })
    .closest;
  if (typeof closest === "function" && closest.call(target, triggerSelector)) {
    return false;
  }

  return true;
}
