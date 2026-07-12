"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import DivLabWordmark from "@/components/brand/DivLabWordmark";
import type { AuthenticatedUser } from "@/lib/auth/user";

const navLinks = [
  { href: "#", label: "Funktioner" },
  { href: "#", label: "Så fungerar det" },
  { href: "#", label: "Om oss" },
  { href: "/forum", label: "Forum" },
] as const;

type Props = {
  user: AuthenticatedUser | null;
  desktopNav: ReactNode;
};

export default function NavbarMobileMenu({ user, desktopNav }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-8">
        <DivLabWordmark />
        {desktopNav}
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="marketing-mobile-nav"
          aria-label={isOpen ? "Stäng meny" : "Öppna meny"}
          onClick={() => setIsOpen((open) => !open)}
          className="rounded-lg border divlab-border-neutral px-3 py-2.5 text-sm text-divlab-text-secondary transition hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 lg:hidden"
        >
          Meny
        </button>
      </div>

      {isOpen ? (
        <nav
          id="marketing-mobile-nav"
          aria-label="Mobil navigering"
          className="border-t divlab-border-neutral bg-divlab-shell lg:hidden"
        >
          <div className="mx-auto max-w-7xl px-6 pb-6 pt-4 md:px-8">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-divlab-text-secondary transition hover:bg-white/[0.04] hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-3 border-t divlab-border-neutral pt-4">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className="divlab-btn-primary flex min-h-11 w-full items-center justify-center px-6 py-3 text-sm font-semibold"
                >
                  Öppna DivLab
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="divlab-btn-primary flex min-h-11 w-full items-center justify-center px-6 py-3 text-sm font-semibold"
                  >
                    Skapa konto
                  </Link>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="block min-h-11 w-full rounded-xl border divlab-border-neutral px-6 py-3 text-center text-sm font-medium leading-6 text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  >
                    Logga in
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      ) : null}
    </>
  );
}
