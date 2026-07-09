"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
    "rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] focus:border-[#D4AF37]/40 focus:text-[#D4AF37] focus:outline-none";

  const dialog =
    isOpen && resolvedUrl ? (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
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
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#161616] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        >
          <button
            type="button"
            onClick={closeDialog}
            aria-label="Stäng delningsdialog"
            className="absolute right-4 top-4 rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-gray-400 transition hover:border-white/20 hover:text-white focus:border-white/20 focus:text-white focus:outline-none"
          >
            Stäng
          </button>

          <div className="pr-16">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-[-0.03em] text-white"
            >
              Dela diskussion
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Dela länken till den här diskussionen.
            </p>
          </div>

          <div className="mt-5">
            <label
              htmlFor="forum-share-link"
              className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500"
            >
              Länk
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="forum-share-link"
                readOnly
                value={resolvedUrl}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-xs text-gray-300 outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] focus:border-[#D4AF37]/40 focus:text-[#D4AF37] focus:outline-none"
              >
                {copyFeedback ? "Länk kopierad" : "Kopiera"}
              </button>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
              Dela via
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {twitterShareUrl && (
                <a
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shareActionClassName}
                >
                  X/Twitter
                </a>
              )}
              {facebookShareUrl && (
                <a
                  href={facebookShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shareActionClassName}
                >
                  Facebook
                </a>
              )}
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
        className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-medium text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] focus:border-[#D4AF37]/40 focus:text-[#D4AF37] focus:outline-none"
      >
        {label}
      </button>

      {typeof document !== "undefined" && dialog
        ? createPortal(dialog, document.body)
        : null}
    </>
  );
}
