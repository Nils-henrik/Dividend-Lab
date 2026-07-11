import Link from "next/link";
import DivLabWordmark from "@/components/brand/DivLabWordmark";

const linkGroups = [
  {
    title: "Juridik",
    links: [
      { label: "Villkor", href: "/terms" },
      { label: "Integritetspolicy", href: "/privacy" },
      { label: "Cookiepolicy", href: "/cookies" },
      { label: "Ansvarsfriskrivning", href: "/disclaimer" },
    ],
  },
  {
    title: "DivLab",
    links: [
      { label: "Om oss", href: "/about" },
      { label: "Forum", href: "/forum" },
      { label: "Kontakt", href: "/contact" },
    ],
  },
  {
    title: "Transparens",
    links: [
      { label: "Reklam och affiliates", href: "/disclaimer#reklam" },
    ],
  },
] as const;

export default function MarketingFooter() {
  return (
    <footer className="border-t divlab-border-neutral bg-divlab-shell">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <DivLabWordmark asLink={false} logoClassName="text-2xl" textClassName="text-base" />
          </div>

          {linkGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                {group.title}
              </p>
              <ul className="mt-4 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-divlab-text-secondary transition hover:text-divlab-blue-muted"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-8">
          <p className="max-w-4xl text-sm leading-7 text-gray-500">
            DivLab tillhandahåller information, verktyg, utbildning och
            community-diskussion. Innehållet utgör inte personlig finansiell
            rådgivning, investeringsrekommendationer eller köp-/säljråd.
            Investeringar innebär risk. Historisk avkastning är ingen garanti
            för framtida resultat.
          </p>
          <p className="mt-6 text-xs text-gray-600">
            © {new Date().getFullYear()} DivLab. Alla rättigheter förbehållna.
          </p>
        </div>
      </div>
    </footer>
  );
}
