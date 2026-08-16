"use client";

import { useEffect, useId, useRef } from "react";
import { CHAT_COMPOSER_EMOJIS } from "@/lib/messages/chat-composer";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
};

export default function ChatEmojiPicker({ open, onClose, onSelect }: Props) {
  const titleId = useId();
  const firstEmojiRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    firstEmojiRef.current?.focus();

    function handlePointerDown(event: MouseEvent) {
      if (panelRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onClose();
    }

    document.addEventListener("click", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("click", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      data-chat-emoji-picker="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="absolute bottom-full left-0 z-20 mb-2 w-[17.5rem] rounded-2xl border divlab-border-neutral bg-divlab-elevated p-3 shadow-[var(--divlab-shadow-panel)]"
    >
      <p id={titleId} className="mb-2 text-xs font-medium text-divlab-text-muted">
        Emoji
      </p>
      <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
        {CHAT_COMPOSER_EMOJIS.map((emoji, index) => (
          <button
            key={emoji}
            ref={index === 0 ? firstEmojiRef : undefined}
            type="button"
            onClick={() => onSelect(emoji)}
            aria-label={`Infoga ${emoji}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
