import Link from "next/link";
import DivLabWordmark from "@/components/brand/DivLabWordmark";

const linkGroups = [
  {
    title: "Utforska",
    links: [
      { label: "Börsnyheter", href: "/news" },
      { label: "Utbildning", href: "/learning" },
      { label: "AI-portföljer", href: "/portfolios" },
      { label: "Så arbetar DivLabs AI-portföljer", href: "/portfolios/sa-fungerar-ai-processen" },
      { label: "Frihetsmaskinen", href: "/frihetsmaskinen" },
      { label: "Forum", href: "/forum" },
      { label: "Funktioner", href: "/features" },
    ],
  },
  {
    title: "DivLab",
    links: [
      { label: "Om DivLab", href: "/about" },
      { label: "Kontakt", href: "/contact" },
      { label: "Redaktionella riktlinjer", href: "/editorial" },
    ],
  },
  {
    title: "Juridik",
    links: [
      { label: "Villkor", href: "/terms" },
      { label: "Integritetspolicy", href: "/privacy" },
      { label: "Cookiepolicy", href: "/cookies" },
      { label: "Ansvarsfriskrivning", href: "/disclaimer" },
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
            <p className="mt-4 max-w-xs text-sm leading-6 text-divlab-text-muted">
              Svensk plattform för börsnyheter, utbildning och långsiktigt
              sparande.
            </p>
          </div>

          {linkGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                {group.title}
              </p>
              <ul className="mt-4 space-y-2">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.href}`}>
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
            DivLab publicerar information, utbildning och verktyg för allmän
            kunskap. Innehållet utgör inte personlig finansiell rådgivning,
            investeringsrekommendation eller uppmaning att köpa, sälja eller
            behålla värdepapper. Marknadsinformation kan förändras efter
            publicering. Du ansvarar själv för dina beslut. Investeringar
            innebär risk. Historisk avkastning är ingen garanti för framtida
            resultat.
          </p>
          <p className="mt-6 text-xs leading-5 text-gray-600">
            <Link
              href="/contact"
              className="text-gray-500 transition hover:text-divlab-blue-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
            >
              Kontakt
            </Link>
            <span aria-hidden="true"> · </span>
            <Link
              href="/editorial"
              className="text-gray-500 transition hover:text-divlab-blue-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
            >
              Redaktionella riktlinjer
            </Link>
          </p>
          <p className="mt-3 text-xs text-gray-600">
            © {new Date().getFullYear()} DivLab. Alla rättigheter förbehållna.
          </p>
        </div>
      </div>
    </footer>
  );
}
