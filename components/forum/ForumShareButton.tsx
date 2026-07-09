"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ShareCopyIcon,
  ShareFacebookIcon,
  ShareXIcon,
} from "./ShareBrandIcons";

type Props = {
  label?: string;
  shareUrl?: string;
  shareTitle?: string;
};

function buildAbsoluteShareUrl(shareUrl?: string) {
  if (shareUrl) {
    if (shareUrl.startsWith("http://") || shareUrl.startsWith("https://")) {
      return shareUrl;
    }

    return `${window.location.origin}${shareUrl.startsWith("/") ? shareUrl : `/${shareUrl}`}`;
  }

  return window.location.href;
}

function getTwitterShareUrl(url: string, title?: string) {
  const params = new URLSearchParams({
    url,
  });

  if (title?.trim()) {
    params.set("text", title.trim());
  }

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

function getFacebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export default function ForumShareButton({
  label = "Dela",
  shareUrl,
  shareTitle,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [resolvedTitle, setResolvedTitle] = useState("");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);
  const titleId = useId();

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setCopyFeedback(false);
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  function openDialog() {
    setResolvedUrl(buildAbsoluteShareUrl(shareUrl));
    setResolvedTitle(shareTitle?.trim() || document.title);
    setCopyFeedback(false);
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDialog();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDialog, isOpen]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  async function handleCopyLink() {
    if (!resolvedUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopyFeedback(true);

      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }

      copyFeedbackTimeoutRef.current = window.setTimeout(() => {
        setCopyFeedback(false);
      }, 2000);
    } catch {
      setCopyFeedback(false);
    }
  }

  const twitterShareUrl = resolvedUrl
    ? getTwitterShareUrl(resolvedUrl, resolvedTitle)
    : undefined;
  const facebookShareUrl = resolvedUrl
    ? getFacebookShareUrl(resolvedUrl)
    : undefined;

  const shareActionClassName =
    "inline-flex min-w-[5.5rem] flex-col items-center gap-2 rounded-xl border divlab-border-neutral bg-divlab-surface px-3 py-3 text-center transition hover:border-divlab-blue/30 hover:bg-divlab-blue/[0.04] focus:border-divlab-blue/40 focus:outline-none";

  const dialog =
    isOpen && resolvedUrl ? (
      <div
        className="fixed inset-0 z-[200] overflow-y-auto bg-black/75 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeDialog();
          }
        }}
      >
        <div
          className="flex min-h-dvh items-center justify-center p-4 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="divlab-card relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 pb-7 sm:max-h-[calc(100dvh-3rem)]"
          >
            <button
              type="button"
              onClick={closeDialog}
              aria-label="Stäng delningsdialog"
              className="absolute right-4 top-4 divlab-btn-ghost px-2.5 py-1 text-xs"
            >
              Stäng
            </button>

            <div className="pr-16">
              <p className="divlab-section-label text-[10px]">Dela</p>
              <h2
                id={titleId}
                className="mt-2 text-lg font-semibold tracking-[-0.03em] text-divlab-text"
              >
                Dela diskussion
              </h2>
              <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
                Dela länken till den här diskussionen.
              </p>
            </div>

            <div className="mt-5">
              <label
                htmlFor="forum-share-link"
                className="text-[10px] font-medium uppercase tracking-[0.18em] text-divlab-text-muted"
              >
                Länk
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="forum-share-link"
                  readOnly
                  value={resolvedUrl}
                  className="divlab-input min-w-0 flex-1 px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="divlab-btn-primary inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs"
                >
                  <ShareCopyIcon className="h-3.5 w-3.5" />
                  {copyFeedback ? "Länk kopierad" : "Kopiera"}
                </button>
              </div>
            </div>

            <div className="mt-5 border-t divlab-border-neutral pt-5 pb-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
                Dela via
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {twitterShareUrl && (
                  <a
                    href={twitterShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Dela på X"
                    className={shareActionClassName}
                  >
                    <ShareXIcon />
                    <span className="text-[10px] font-medium text-divlab-text-muted">
                      X
                    </span>
                  </a>
                )}
                {facebookShareUrl && (
                  <a
                    href={facebookShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Dela på Facebook"
                    className={shareActionClassName}
                  >
                    <ShareFacebookIcon />
                    <span className="text-[10px] font-medium text-divlab-text-muted">
                      Facebook
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={openDialog}
        className="divlab-btn-ghost px-2 py-1 text-[11px]"
      >
        {label}
      </button>

      {typeof document !== "undefined" && dialog
        ? createPortal(dialog, document.body)
        : null}
    </>
  );
}
