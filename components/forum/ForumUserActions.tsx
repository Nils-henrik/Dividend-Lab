"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  username: string;
  profileHref: string;
  messageHref: string;
  loginHref: string;
  isSelf: boolean;
  canMessage: boolean;
  canQuote: boolean;
  onQuote: () => void;
};

export default function ForumUserActions({
  username,
  profileHref,
  messageHref,
  loginHref,
  isSelf,
  canMessage,
  canQuote,
  onQuote,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const cleanUsername = username.replace(/^@/, "");

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

  const actions = (
    <>
      <Link
        href={profileHref}
        className="block rounded-lg px-3 py-2 text-left text-[11px] font-medium text-gray-300 transition hover:bg-white/[0.04] hover:text-white focus:bg-white/[0.04] focus:text-white focus:outline-none"
      >
        Profil
      </Link>
      {!isSelf && (
        <Link
          href={
            canMessage
              ? messageHref
              : `/login?redirect=${encodeURIComponent(messageHref)}`
          }
          className="block rounded-lg px-3 py-2 text-left text-[11px] font-medium text-gray-300 transition hover:bg-white/[0.04] hover:text-white focus:bg-white/[0.04] focus:text-white focus:outline-none"
        >
          Meddelande
        </Link>
      )}
      {canQuote ? (
        <button
          type="button"
          onClick={() => {
            onQuote();
            setIsOpen(false);
          }}
          className="block w-full rounded-lg px-3 py-2 text-left text-[11px] font-medium text-gray-300 transition hover:bg-white/[0.04] hover:text-white focus:bg-white/[0.04] focus:text-white focus:outline-none"
        >
          Citera
        </button>
      ) : (
        <Link
          href={loginHref}
          className="block rounded-lg px-3 py-2 text-left text-[11px] font-medium text-gray-300 transition hover:bg-white/[0.04] hover:text-white focus:bg-white/[0.04] focus:text-white focus:outline-none"
        >
          Citera
        </Link>
      )}
    </>
  );

  const desktopMenuVisibility =
    "lg:pointer-events-none lg:invisible lg:opacity-0 lg:transition lg:duration-200 lg:ease-out lg:group-hover/forum-author:pointer-events-auto lg:group-hover/forum-author:visible lg:group-hover/forum-author:opacity-100 lg:group-focus-within/forum-author:pointer-events-auto lg:group-focus-within/forum-author:visible lg:group-focus-within/forum-author:opacity-100";

  return (
    <div ref={menuRef} className="relative z-10">
      <div
        className={`absolute left-0 top-full z-30 hidden w-32 pt-2 lg:block ${desktopMenuVisibility}`}
      >
        <div className="rounded-xl border border-white/10 bg-[#111111] p-1 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
          {actions}
        </div>
      </div>

      <button
        type="button"
        aria-label={`Öppna åtgärder för @${cleanUsername}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((value) => !value)}
        className="mt-1 rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-medium text-gray-500 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] focus:border-[#D4AF37]/40 focus:text-[#D4AF37] focus:outline-none lg:hidden"
      >
        ⋯
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-2 w-32 rounded-xl border border-white/10 bg-[#111111] p-1 shadow-[0_18px_50px_rgba(0,0,0,0.45)] lg:hidden"
        >
          {actions}
        </div>
      )}
    </div>
  );
}
