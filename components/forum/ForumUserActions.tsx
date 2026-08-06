"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

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

type MenuPosition = {
  top: number;
  left: number;
};

const MENU_WIDTH = 128;
const MENU_ESTIMATED_HEIGHT = 140;
const VIEWPORT_PADDING = 8;

function canDesktopHoverOpen() {
  return window.matchMedia(
    "(hover: hover) and (pointer: fine) and (min-width: 1024px)",
  ).matches;
}

function getMenuPosition(anchor: HTMLElement): MenuPosition {
  const rect = anchor.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
  const openUpward =
    spaceBelow < MENU_ESTIMATED_HEIGHT && rect.top > spaceBelow;
  const top = openUpward
    ? Math.max(VIEWPORT_PADDING, rect.top - MENU_ESTIMATED_HEIGHT - 8)
    : Math.min(
        window.innerHeight - MENU_ESTIMATED_HEIGHT - VIEWPORT_PADDING,
        rect.bottom + 8,
      );
  const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING;
  const left = Math.min(Math.max(VIEWPORT_PADDING, rect.left), maxLeft);

  return { top, left };
}

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
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const authorGroupRef = useRef<HTMLElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const menuId = useId();
  const cleanUsername = username.replace(/^@/, "");

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const resolveAnchor = useCallback(() => {
    return (
      authorGroupRef.current ??
      triggerRef.current ??
      rootRef.current
    );
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimeout();
    const anchor = resolveAnchor();

    if (anchor) {
      setPosition(getMenuPosition(anchor));
    }

    setIsOpen(true);
  }, [clearCloseTimeout, resolveAnchor]);

  const closeMenu = useCallback(() => {
    clearCloseTimeout();
    setIsOpen(false);
  }, [clearCloseTimeout]);

  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, 140);
  }, [clearCloseTimeout]);

  useEffect(() => {
    authorGroupRef.current = rootRef.current?.closest(
      ".group\\/forum-author",
    ) as HTMLElement | null;

    const authorGroup = authorGroupRef.current;

    if (!authorGroup) {
      return;
    }

    function handleEnter() {
      if (canDesktopHoverOpen()) {
        openMenu();
      }
    }

    function handleLeave() {
      if (canDesktopHoverOpen()) {
        scheduleClose();
      }
    }

    function handleFocusIn() {
      if (canDesktopHoverOpen()) {
        openMenu();
      }
    }

    function handleFocusOut(event: FocusEvent) {
      if (!canDesktopHoverOpen()) {
        return;
      }

      const next = event.relatedTarget as Node | null;

      if (
        authorGroup?.contains(next) ||
        menuRef.current?.contains(next)
      ) {
        return;
      }

      scheduleClose();
    }

    authorGroup.addEventListener("mouseenter", handleEnter);
    authorGroup.addEventListener("mouseleave", handleLeave);
    authorGroup.addEventListener("focusin", handleFocusIn);
    authorGroup.addEventListener("focusout", handleFocusOut);

    return () => {
      authorGroup.removeEventListener("mouseenter", handleEnter);
      authorGroup.removeEventListener("mouseleave", handleLeave);
      authorGroup.removeEventListener("focusin", handleFocusIn);
      authorGroup.removeEventListener("focusout", handleFocusOut);
      clearCloseTimeout();
    };
  }, [clearCloseTimeout, openMenu, scheduleClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target) ||
        authorGroupRef.current?.contains(target)
      ) {
        return;
      }

      closeMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        triggerRef.current?.focus();
      }
    }

    function handleViewportChange() {
      const anchor = resolveAnchor();

      if (anchor) {
        setPosition(getMenuPosition(anchor));
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [closeMenu, isOpen, resolveAnchor]);

  const actions = (
    <>
      <Link
        href={profileHref}
        role="menuitem"
        onClick={closeMenu}
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
          role="menuitem"
          onClick={closeMenu}
          className="block rounded-lg px-3 py-2 text-left text-[11px] font-medium text-gray-300 transition hover:bg-white/[0.04] hover:text-white focus:bg-white/[0.04] focus:text-white focus:outline-none"
        >
          Meddelande
        </Link>
      )}
      {canQuote ? (
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onQuote();
            closeMenu();
          }}
          className="block w-full rounded-lg px-3 py-2 text-left text-[11px] font-medium text-gray-300 transition hover:bg-white/[0.04] hover:text-white focus:bg-white/[0.04] focus:text-white focus:outline-none"
        >
          Citera
        </button>
      ) : (
        <Link
          href={loginHref}
          role="menuitem"
          onClick={closeMenu}
          className="block rounded-lg px-3 py-2 text-left text-[11px] font-medium text-gray-300 transition hover:bg-white/[0.04] hover:text-white focus:bg-white/[0.04] focus:text-white focus:outline-none"
        >
          Citera
        </Link>
      )}
    </>
  );

  const menu =
    typeof document !== "undefined" && isOpen && position
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={`Åtgärder för @${cleanUsername}`}
            onMouseEnter={() => {
              if (canDesktopHoverOpen()) {
                openMenu();
              }
            }}
            onMouseLeave={() => {
              if (canDesktopHoverOpen()) {
                scheduleClose();
              }
            }}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: MENU_WIDTH,
              zIndex: 80,
            }}
            className="divlab-dropdown p-1"
          >
            {actions}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative z-10">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Öppna åtgärder för @${cleanUsername}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();

          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        className="mt-1 rounded-md border divlab-border-neutral px-2 py-0.5 text-[11px] font-medium text-divlab-text-muted transition hover:border-divlab-blue/40 hover:text-divlab-blue-muted focus:border-divlab-blue/40 focus:text-divlab-blue-muted focus:outline-none lg:hidden"
      >
        ⋯
      </button>
      {menu}
    </div>
  );
}
