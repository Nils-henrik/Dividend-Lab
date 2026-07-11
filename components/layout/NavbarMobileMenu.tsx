"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AuthenticatedUser } from "@/lib/auth/user";

const navLinks = [
  { href: "#", label: "Funktioner" },
  { href: "#", label: "Så fungerar det" },
  { href: "#", label: "Om oss" },
  { href: "/forum", label: "Forum" },
] as const;

type Props = {
  user: AuthenticatedUser | null;
};

export default function NavbarMobileMenu({ user }: Props) {
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

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="marketing-mobile-nav"
        aria-label={isOpen ? "Stäng meny" : "Öppna meny"}
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-lg border divlab-border-neutral px-3 py-2 text-sm text-divlab-text-secondary transition hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      >
        Meny
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Stäng meny"
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setIsOpen(false)}
          />
          <nav
            id="marketing-mobile-nav"
            className="fixed right-0 top-0 z-50 flex h-full w-[min(100%,20rem)] flex-col border-l divlab-border-neutral bg-divlab-shell px-5 py-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-divlab-text">Meny</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-divlab-text-muted transition hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                Stäng
              </button>
            </div>

            <ul className="mt-6 space-y-1">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-divlab-text-secondary transition hover:bg-white/[0.04] hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-auto space-y-3 pt-6">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="divlab-btn-primary w-full px-6 py-3 text-sm font-semibold"
                >
                  Öppna DivLab
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="divlab-btn-primary w-full px-6 py-3 text-sm font-semibold"
                  >
                    Skapa konto
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full rounded-xl border divlab-border-neutral px-6 py-3 text-center text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  >
                    Logga in
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
