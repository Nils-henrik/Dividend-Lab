"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  buildDivBrainHref,
  type DivBrainArchiveScope,
} from "@/lib/divbrain/brain-routes";
import { formatDivBrainConversationTimestamp } from "@/lib/divbrain/dates";
import {
  DIVBRAIN_HISTORY_DRAWER_DESKTOP_MEDIA_QUERY,
  focusDivBrainElementIfConnected,
  shouldRestoreDivBrainHistoryDrawerTriggerFocus,
  subscribeDivBrainDesktopMediaChange,
  trapDivBrainDialogTabKey,
  type DivBrainHistoryDrawerCloseReason,
} from "@/lib/divbrain/history-drawer-a11y";
import DivBrainCreateConversationButton from "./DivBrainCreateConversationButton";
import DivBrainScopeSwitch from "./DivBrainScopeSwitch";

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
  archiveScope: DivBrainArchiveScope;
};

export default function DivBrainHistoryDrawer({
  conversations,
  selectedConversationId,
  hasMoreConversations,
  archiveScope,
}: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const closeReasonRef = useRef<DivBrainHistoryDrawerCloseReason>("user");

  const closeDrawer = useCallback(
    (reason: DivBrainHistoryDrawerCloseReason = "user") => {
      closeReasonRef.current = reason;
      setOpen(false);
    },
    [],
  );

  // Close when the viewport enters the desktop (lg) layout.
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia(
      DIVBRAIN_HISTORY_DRAWER_DESKTOP_MEDIA_QUERY,
    );

    function closeForDesktop() {
      closeDrawer("desktop");
    }

    if (mediaQuery.matches) {
      closeForDesktop();
    }

    return subscribeDivBrainDesktopMediaChange(mediaQuery, closeForDesktop);
  }, [closeDrawer]);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Move focus into the dialog; prefer the explicit close control.
      focusDivBrainElementIfConnected(closeButtonRef.current);

      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeDrawer("user");
          return;
        }

        trapDivBrainDialogTabKey(
          event,
          dialogRef.current,
          document.activeElement,
        );
      }

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = previousOverflow;
      };
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      if (
        shouldRestoreDivBrainHistoryDrawerTriggerFocus(
          closeReasonRef.current,
          triggerButtonRef.current,
        )
      ) {
        focusDivBrainElementIfConnected(triggerButtonRef.current);
      }
    }
  }, [open, closeDrawer]);

  return (
    <div>
      <button
        ref={triggerButtonRef}
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
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/50"
            onClick={() => closeDrawer("user")}
          />

          <aside
            id={panelId}
            ref={dialogRef}
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
                ref={closeButtonRef}
                type="button"
                onClick={() => closeDrawer("user")}
                aria-label="Stäng historik"
                className="rounded-lg border divlab-border-neutral px-2.5 py-1.5 text-xs font-medium text-divlab-text-muted transition hover:border-divlab-border-strong hover:text-divlab-text"
              >
                Stäng
              </button>
            </div>

            <div className="border-b divlab-border-neutral px-4 py-3">
              <DivBrainCreateConversationButton />
              <DivBrainScopeSwitch archiveScope={archiveScope} />
            </div>

            <nav
              aria-label="Konversationshistorik"
              className="flex-1 overflow-y-auto px-2 py-2"
            >
              {conversations.length === 0 ? (
                <p className="px-3 py-4 text-sm leading-6 text-divlab-text-muted">
                  {archiveScope === "archived"
                    ? "Inga arkiverade konversationer."
                    : "Inga konversationer ännu."}
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
                          href={buildDivBrainHref({
                            archiveScope,
                            conversationId: conversation.id,
                          })}
                          aria-current={selected ? "page" : undefined}
                          onClick={() => closeDrawer("navigate")}
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
