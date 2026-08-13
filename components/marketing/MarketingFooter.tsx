import Link from "next/link";
import DivLabWordmark from "@/components/brand/DivLabWordmark";

const linkGroups = [
  {
    title: "Utforska",
    links: [
      { label: "Börsnyheter", href: "/news" },
      { label: "Utbildning", href: "/learning" },
      { label: "AI-portföljer", href: "/portfolios" },
      {
        label: "Så arbetar DivLabs AI-portföljer",
        href: "/portfolios/sa-fungerar-ai-processen",
      },
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
    <footer className="border-t divlab-border-neutral bg-divlab-bg">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div className="lg:col-span-1">
            <DivLabWordmark
              asLink={false}
              logoClassName="text-2xl"
              textClassName="text-base"
            />
            <p className="mt-3 max-w-xs text-sm leading-6 text-divlab-text-muted">
              Svensk plattform för börsnyheter, utbildning och långsiktigt
              sparande.
            </p>
          </div>

          {linkGroups.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
                {group.title}
              </p>
              <ul className="mt-3 space-y-1.5">
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

        <div className="mt-6 border-t divlab-border-neutral pt-5">
          <p className="max-w-5xl text-xs leading-5 text-divlab-text-muted sm:leading-5">
            DivLab publicerar information, utbildning och verktyg för allmän
            kunskap. Innehållet utgör inte personlig finansiell rådgivning,
            investeringsrekommendation eller uppmaning att köpa, sälja eller
            behålla värdepapper. Marknadsinformation kan förändras efter
            publicering. Du ansvarar själv för dina beslut. Investeringar
            innebär risk. Historisk avkastning är ingen garanti för framtida
            resultat.
          </p>

          <div className="mt-4 flex flex-col gap-2 text-xs text-divlab-text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              <Link
                href="/contact"
                className="transition hover:text-divlab-blue-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
              >
                Kontakt
              </Link>
              <span aria-hidden="true"> · </span>
              <Link
                href="/editorial"
                className="transition hover:text-divlab-blue-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
              >
                Redaktionella riktlinjer
              </Link>
            </p>
            <p>© {new Date().getFullYear()} DivLab. Alla rättigheter förbehållna.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
