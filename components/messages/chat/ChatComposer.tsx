"use client";

import { useState } from "react";
import { shouldSubmitChatComposerKey } from "@/lib/messages/chat-composer";
import { MESSAGE_BODY_MAX_LENGTH } from "@/lib/messages/types";

type Props = {
  conversationId: string;
  disabled?: boolean;
  pending?: boolean;
  errorMessage?: string | null;
  compact?: boolean;
  onSend: (conversationId: string, body: string) => Promise<boolean>;
};

export default function ChatComposer({
  conversationId,
  disabled = false,
  pending = false,
  errorMessage,
  compact = false,
  onSend,
}: Props) {
  const [body, setBody] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextBody = body.trim();
    if (!nextBody || disabled || pending) {
      return;
    }

    const sent = await onSend(conversationId, nextBody);
    if (sent) {
      setBody("");
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      shouldSubmitChatComposerKey({
        key: event.key,
        shiftKey: event.shiftKey,
        isComposing: event.nativeEvent.isComposing || event.isComposing,
        keyCode: event.keyCode,
      })
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "space-y-3"}>
      <label className="block">
        <span className="sr-only">Skriv ett meddelande</span>
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MESSAGE_BODY_MAX_LENGTH}
          rows={compact ? 2 : 3}
          disabled={disabled || pending}
          placeholder="Skriv ett meddelande..."
          className="w-full resize-none divlab-input px-3 py-2.5 text-sm leading-6 text-divlab-text placeholder:text-divlab-text-subtle"
        />
      </label>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-divlab-text-muted">
          {body.length}/{MESSAGE_BODY_MAX_LENGTH}
        </p>
        <button
          type="submit"
          disabled={disabled || pending || body.trim().length === 0}
          className="divlab-btn-primary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Skickar..." : "Skicka"}
        </button>
      </div>
      {errorMessage ? (
        <p role="status" className="text-xs text-red-300">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}