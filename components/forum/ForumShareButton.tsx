"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  label?: string;
};

function getTwitterShareUrl(url: string) {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`;
}

function getFacebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

function openShareWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function ForumShareButton({ label = "Dela" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);

      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }

      copyFeedbackTimeoutRef.current = window.setTimeout(() => {
        setCopyFeedback(false);
      }, 2000);

      setIsOpen(false);
    } catch {
      setCopyFeedback(false);
    }
  }

  function handleShareTwitter() {
    openShareWindow(getTwitterShareUrl(window.location.href));
    setIsOpen(false);
  }

  function handleShareFacebook() {
    openShareWindow(getFacebookShareUrl(window.location.href));
    setIsOpen(false);
  }

  const menuItemClassName =
    "block w-full rounded-md px-2.5 py-1.5 text-left text-xs text-gray-400 transition hover:bg-white/[0.03] hover:text-white focus:bg-white/[0.03] focus:text-white focus:outline-none";

  const menuItems = (
    <>
      <button type="button" onClick={handleShareTwitter} className={menuItemClassName}>
        X
      </button>
      <button type="button" onClick={handleShareFacebook} className={menuItemClassName}>
        Facebook
      </button>
      <button type="button" onClick={handleCopyLink} className={menuItemClassName}>
        {copyFeedback ? "Länk kopierad" : "Kopiera länk"}
      </button>
    </>
  );

  const desktopMenuVisibility =
    "lg:pointer-events-none lg:invisible lg:opacity-0 lg:transition lg:duration-200 lg:ease-out lg:group-hover/forum-share:pointer-events-auto lg:group-hover/forum-share:visible lg:group-hover/forum-share:opacity-100 lg:group-focus-within/forum-share:pointer-events-auto lg:group-focus-within/forum-share:visible lg:group-focus-within/forum-share:opacity-100";

  return (
    <div ref={menuRef} className="group/forum-share relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => {
          if (window.matchMedia("(min-width: 1024px)").matches) {
            return;
          }

          setIsOpen((current) => !current);
        }}
        className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-medium text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] focus:border-[#D4AF37]/40 focus:text-[#D4AF37] focus:outline-none"
      >
        {label}
      </button>

      <div
        className={`absolute right-0 top-full z-10 hidden w-36 pt-2 lg:block ${desktopMenuVisibility}`}
      >
        <div
          role="menu"
          className="rounded-lg border border-white/10 bg-[#111111] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        >
          {menuItems}
        </div>
      </div>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-2 w-36 rounded-lg border border-white/10 bg-[#111111] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] lg:hidden"
        >
          {menuItems}
        </div>
      )}
    </div>
  );
}
