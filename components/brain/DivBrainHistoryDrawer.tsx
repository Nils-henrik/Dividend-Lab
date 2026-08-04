"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { formatDivBrainConversationTimestamp } from "@/lib/divbrain/dates";

export type DivBrainHistoryConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
  archived: boolean;
};

type Props = {
  conversations: readonly DivBrainHistoryConversationItem[];
  selectedConversationId: string | null;
  hasMoreConversations: boolean;
};

export default function DivBrainHistoryDrawer({
  conversations,
  selectedConversationId,
  hasMoreConversations,
}: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div>
      <button
        type="button"
        className="divlab-btn-ghost inline-flex min-h-10 items-center"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        Historik
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Stäng historik"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          <aside
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Konversationshistorik"
            className="relative ml-auto flex h-full w-[min(20rem,88vw)] flex-col border-l divlab-border-neutral bg-divlab-shell shadow-[0_0_60px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-center justify-between border-b divlab-border-neutral px-4 py-3">
              <p className="divlab-section-label tracking-[0.18em]">
                Konversationer
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Stäng historik"
                className="rounded-lg border divlab-border-neutral px-2.5 py-1.5 text-xs font-medium text-divlab-text-muted transition hover:border-divlab-border-strong hover:text-divlab-text"
              >
                Stäng
              </button>
            </div>

            <div className="border-b divlab-border-neutral px-4 py-3">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="divlab-btn-ghost flex w-full min-h-10 cursor-not-allowed items-center justify-between opacity-60"
              >
                <span>Ny konversation</span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-divlab-text-muted">
                  Nästa steg
                </span>
              </button>
            </div>

            <nav
              aria-label="Konversationshistorik"
              className="flex-1 overflow-y-auto px-2 py-2"
            >
              {conversations.length === 0 ? (
                <p className="px-3 py-4 text-sm leading-6 text-divlab-text-muted">
                  Inga konversationer ännu.
                </p>
              ) : (
                <ul className="space-y-1">
                  {conversations.map((conversation) => {
                    const selected =
                      conversation.id === selectedConversationId;
                    const timestamp = formatDivBrainConversationTimestamp(
                      conversation.updatedAt,
                    );

                    return (
                      <li key={conversation.id}>
                        <Link
                          href={`/brain?conversation=${encodeURIComponent(conversation.id)}`}
                          aria-current={selected ? "page" : undefined}
                          className={`block rounded-xl px-3 py-2.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-divlab-blue ${
                            selected
                              ? "bg-divlab-elevated text-divlab-text"
                              : "text-divlab-text-secondary hover:bg-divlab-elevated/70 hover:text-divlab-text"
                          }`}
                        >
                          <span className="block truncate text-sm font-medium">
                            {conversation.title}
                          </span>
                          <span className="mt-1 flex items-center gap-2 text-xs text-divlab-text-muted">
                            <time
                              className="tabular-nums"
                              dateTime={conversation.updatedAt}
                            >
                              {timestamp}
                            </time>
                            {conversation.archived ? (
                              <span>Arkiverad</span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </nav>

            {hasMoreConversations ? (
              <p className="border-t divlab-border-neutral px-4 py-3 text-xs leading-5 text-divlab-text-muted">
                Endast de senaste konversationerna visas i den här Alpha-vyn.
              </p>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
