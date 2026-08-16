"use client";

import { useCallback, useRef, useState } from "react";
import AppIcon from "@/components/layout/AppIcon";
import {
  insertComposerText,
  shouldSubmitChatComposerKey,
} from "@/lib/messages/chat-composer";
import { MESSAGE_BODY_MAX_LENGTH } from "@/lib/messages/types";
import ChatEmojiPicker from "./ChatEmojiPicker";

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
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const canSend = !disabled && !pending && body.trim().length > 0;
  const nearLimit = body.length >= MESSAGE_BODY_MAX_LENGTH - 200;

  const rememberSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    selectionRef.current = {
      start: textarea.selectionStart ?? textarea.value.length,
      end: textarea.selectionEnd ?? textarea.value.length,
    };
  }, []);

  const closeEmojiPicker = useCallback(() => {
    setEmojiOpen(false);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const { start, end } = selectionRef.current;
      textareaRef.current?.setSelectionRange(start, end);
    });
  }, []);

  function insertEmoji(emoji: string) {
    const next = insertComposerText({
      value: body,
      insert: emoji,
      selectionStart: selectionRef.current.start,
      selectionEnd: selectionRef.current.end,
      maxLength: MESSAGE_BODY_MAX_LENGTH,
    });
    setBody(next.value);
    selectionRef.current = { start: next.caret, end: next.caret };
    setEmojiOpen(false);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(next.caret, next.caret);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextBody = body.trim();
    if (!nextBody || disabled || pending) {
      return;
    }

    const sent = await onSend(conversationId, nextBody);
    if (sent) {
      setBody("");
      selectionRef.current = { start: 0, end: 0 };
      setEmojiOpen(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      shouldSubmitChatComposerKey({
        key: event.key,
        shiftKey: event.shiftKey,
        isComposing: event.nativeEvent.isComposing,
        keyCode: event.keyCode,
      })
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "space-y-2" : "space-y-3"}
    >
      <div className="relative flex items-end gap-1.5">
        <div className="relative">
          <button
            type="button"
            aria-label="Öppna emoji"
            aria-haspopup="dialog"
            aria-expanded={emojiOpen}
            disabled={disabled || pending}
            onMouseDown={(event) => {
              rememberSelection();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              setEmojiOpen((open) => !open);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-divlab-text-muted transition hover:bg-white/[0.06] hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 disabled:opacity-60"
          >
            <AppIcon name="emoji" className="h-5 w-5" />
          </button>
          <ChatEmojiPicker
            open={emojiOpen}
            onClose={closeEmojiPicker}
            onSelect={insertEmoji}
          />
        </div>

        <label className="min-w-0 flex-1">
          <span className="sr-only">Skriv ett meddelande</span>
          <textarea
            ref={textareaRef}
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={rememberSelection}
            onClick={rememberSelection}
            onSelect={rememberSelection}
            onBlur={rememberSelection}
            maxLength={MESSAGE_BODY_MAX_LENGTH}
            rows={compact ? 1 : 2}
            disabled={disabled || pending}
            placeholder="Skriv ett meddelande..."
            className="max-h-24 min-h-9 w-full resize-none rounded-2xl border divlab-border-neutral bg-divlab-input px-3 py-2 text-sm leading-5 text-divlab-text placeholder:text-divlab-text-subtle outline-none transition focus:border-divlab-blue/40 disabled:opacity-60"
          />
        </label>

        <button
          type="submit"
          aria-label="Skicka"
          disabled={!canSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-divlab-blue text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <AppIcon name="send" className="h-4 w-4" />
          <span className="sr-only">{pending ? "Skickar..." : "Skicka"}</span>
        </button>
      </div>

      {nearLimit ? (
        <p className="text-[11px] text-divlab-text-muted">
          {body.length}/{MESSAGE_BODY_MAX_LENGTH}
        </p>
      ) : null}

      {errorMessage ? (
        <p role="status" className="text-xs text-red-300">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
