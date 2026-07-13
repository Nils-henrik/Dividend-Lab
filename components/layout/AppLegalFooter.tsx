import Link from "next/link";
import ContactEmailLink from "@/components/marketing/ContactEmailLink";

const legalLinks = [
  { label: "Villkor", href: "/terms" },
  { label: "Integritet", href: "/privacy" },
  { label: "Cookies", href: "/cookies" },
  { label: "Ansvarsfriskrivning", href: "/disclaimer" },
] as const;

export default function AppLegalFooter() {
  return (
    <footer className="mt-10 border-t border-white/10 pt-6">
      <p className="max-w-2xl text-xs leading-5 text-gray-600">
        DivLab tillhandahåller information, verktyg och community — inte personlig
        finansiell rådgivning.
      </p>
      <p className="mt-3 text-xs text-gray-600">
        Kontakt: <ContactEmailLink kind="general" className="text-gray-500 hover:text-gray-400" />
        {" · "}
        <Link href="/contact" className="text-gray-500 transition hover:text-gray-400">
          Mer information
        </Link>
      </p>
      <nav
        className="mt-3 flex flex-wrap gap-x-4 gap-y-1"
        aria-label="Juridik"
      >
        {legalLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs text-gray-500 transition hover:text-gray-400"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
