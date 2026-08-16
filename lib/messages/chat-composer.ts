export type ChatComposerKeyIntent = {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  keyCode?: number;
};

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
