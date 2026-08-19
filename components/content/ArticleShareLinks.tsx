"use client";

import { useEffect, useRef, useState } from "react";
import {
  ShareCopyIcon,
  ShareFacebookIcon,
  ShareXIcon,
} from "@/components/forum/ShareBrandIcons";
import { absoluteUrl } from "@/lib/seo/site";

type Props = {
  path: string;
  title: string;
  className?: string;
};

function getXShareUrl(url: string, title: string) {
  const params = new URLSearchParams({ url, text: title });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

function getFacebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export default function ArticleShareLinks({
  path,
  title,
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<number | null>(null);
  const shareUrl = absoluteUrl(path);
  const xShareUrl = getXShareUrl(shareUrl, title);
  const facebookShareUrl = getFacebookShareUrl(shareUrl);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }

      copiedTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

  const actionClassName =
    "inline-flex items-center gap-1.5 rounded-lg border divlab-border-neutral bg-divlab-surface px-2.5 py-1.5 text-xs font-medium text-divlab-text-muted transition hover:border-divlab-blue/30 hover:bg-divlab-blue/[0.04] hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40";

  return (
    <div
      aria-label="Dela artikel"
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      <span className="mr-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-subtle">
        Dela
      </span>
      <button type="button" onClick={handleCopy} className={actionClassName}>
        <ShareCopyIcon className="h-3.5 w-3.5" />
        <span>{copied ? "Kopierad" : "Kopiera länken"}</span>
      </button>
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Dela artikeln på X"
        className={actionClassName}
      >
        <ShareXIcon className="h-4 w-4" />
        <span>X</span>
      </a>
      <a
        href={facebookShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Dela artikeln på Facebook"
        className={actionClassName}
      >
        <ShareFacebookIcon className="h-4 w-4" />
        <span>Facebook</span>
      </a>
    </div>
  );
}
