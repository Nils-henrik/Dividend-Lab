"use client";

import { useEffect, useId, useRef } from "react";
import { formatForumTimestamp } from "@/lib/forum/format";

export type ForumRevisionHistoryItem = {
  version: number;
  title?: string;
  body: string;
  timestamp: string;
  isCurrent: boolean;
  isOriginal: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  items: ForumRevisionHistoryItem[];
  isLoading?: boolean;
  errorMessage?: string | null;
  showTitle?: boolean;
};

export default function ForumRevisionHistoryModal({
  open,
  onClose,
  title,
  items,
  isLoading = false,
  errorMessage = null,
  showTitle = false,
}: Props) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-end justify-center overflow-y-auto bg-black/70 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6 sm:py-8">
      <button
        type="button"
        aria-label="Stäng redigeringshistorik"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(88dvh,44rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl divlab-card shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-3 border-b divlab-border-neutral px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="divlab-section-label text-[11px]">Historik</p>
            <h2
              id={titleId}
              className="mt-1 text-base font-semibold tracking-[-0.03em] text-divlab-text"
            >
              {title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="divlab-btn-ghost px-2.5 py-1 text-[11px]"
          >
            Stäng
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          {isLoading ? (
            <p className="text-sm text-divlab-text-muted">Laddar historik...</p>
          ) : errorMessage ? (
            <p className="text-sm text-divlab-text-muted">{errorMessage}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-divlab-text-muted">
              Ingen redigeringshistorik hittades.
            </p>
          ) : (
            <ol className="space-y-4">
              {items.map((item) => (
                <li
                  key={`${item.version}-${item.timestamp}`}
                  className="border-b divlab-border-neutral pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="text-[11px] text-divlab-text-muted">
                      {formatForumTimestamp(item.timestamp)}
                    </p>
                    {item.isCurrent && (
                      <span className="rounded-md border border-divlab-blue/25 bg-divlab-blue/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-divlab-blue-muted">
                        Nuvarande
                      </span>
                    )}
                    {item.isOriginal && (
                      <span className="rounded-md border divlab-border-neutral px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-divlab-text-muted">
                        Original
                      </span>
                    )}
                    <span className="text-[10px] tabular-nums text-divlab-text-subtle">
                      v{item.version}
                    </span>
                  </div>

                  {showTitle && item.title != null && (
                    <p className="mb-2 text-sm font-medium text-divlab-text">
                      {item.title}
                    </p>
                  )}

                  <p className="whitespace-pre-wrap text-sm leading-6 text-divlab-text-secondary">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
