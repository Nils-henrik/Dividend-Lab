import type { Metadata } from "next";
import Link from "next/link";
import PublicContentShell from "@/components/layout/PublicContentShell";
import JsonLdScript from "@/components/seo/JsonLd";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

const title = "Verktyg för sparande och investeringar | DivLab";
const description =
  "Använd DivLabs kostnadsfria verktyg för att räkna på ekonomisk frihet, GAV och andra viktiga delar av ditt långsiktiga sparande.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: getCanonicalUrl("/verktyg"),
  },
  openGraph: {
    title,
    description,
    url: getCanonicalUrl("/verktyg"),
    type: "website",
    locale: "sv_SE",
  },
};

const tools = [
  {
    title: "Frihetsmaskinen",
    description:
      "Uppskatta hur mycket kapital du kan behöva för ekonomisk frihet och se hur sparande, avkastning och utgifter påverkar tidslinjen.",
    cta: "Öppna Frihetsmaskinen",
    href: "/frihetsmaskinen",
  },
  {
    title: "GAV-kalkylator",
    description:
      "Räkna ut ditt genomsnittliga anskaffningsvärde med flera köp, courtage, försäljningar och split. Simulera även hur ett nytt köp påverkar ditt GAV.",
    cta: "Räkna ut GAV",
    href: "/verktyg/gav-kalkylator",
  },
] as const;

export default function ToolsPage() {
  return (
    <PublicContentShell>
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Hem", path: "/" },
          { name: "Verktyg", path: "/verktyg" },
        ])}
      />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="max-w-3xl space-y-5">
          <p className="divlab-section-label text-divlab-blue-muted">
            DivLabs verktyg
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-4xl lg:text-5xl lg:leading-[1.08]">
            Verktyg för sparande och investeringar
          </h1>
          <p className="text-lg leading-8 text-divlab-text-secondary">
            Räkna på ekonomisk frihet, genomsnittligt anskaffningsvärde och
            andra viktiga delar av ditt sparande. DivLabs verktyg är
            kostnadsfria och fungerar direkt utan konto.
          </p>
        </header>

        <section
          aria-labelledby="tools-list-heading"
          className="mt-10 border-t divlab-border-neutral pt-8"
        >
          <h2 id="tools-list-heading" className="sr-only">
            Tillgängliga verktyg
          </h2>
          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            {tools.map((tool) => (
              <article
                key={tool.href}
                className="divlab-card flex min-w-0 flex-col p-5 sm:p-6"
              >
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-divlab-text">
                  {tool.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-divlab-text-secondary">
                  {tool.description}
                </p>
                <Link
                  href={tool.href}
                  className="divlab-btn-primary mt-6 min-h-11 w-full px-5 py-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-divlab-card sm:w-fit"
                >
                  {tool.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PublicContentShell>
  );
}
