import type { Metadata } from "next";
import CompanyDirectory from "@/components/companies/CompanyDirectory";
import AppShell from "@/components/layout/AppShell";
import JsonLdScript from "@/components/seo/JsonLd";
import { getPilotCompanies } from "@/lib/companies/catalog";
import { recentlyMentionedCompanies } from "@/lib/companies/hub";
import { loadUpcomingCompanyReports } from "@/lib/companies/hub.server";
import { getNewsArticles } from "@/lib/news/get-articles";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";

const title = "Bolag – kurs, utdelning och rapporter";
const description = "Sök svenska bolag i DivLab. Fördröjd kurs, utdelning, rapporter och officiella källor på varje bolagssida. Informationen är inte investeringsrådgivning.";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  alternates: { canonical: getCanonicalUrl("/bolag") },
  openGraph: {
    title,
    description,
    type: "website",
    url: getCanonicalUrl("/bolag"),
    locale: "sv_SE",
  },
};

export default async function CompanyHubPage() {
  const companies = getPilotCompanies();
  const [upcoming, mentioned] = await Promise.all([
    loadUpcomingCompanyReports(),
    Promise.resolve(recentlyMentionedCompanies(getNewsArticles(), companies)),
  ]);

  return (
    <AppShell allowGuest>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Hem", path: "/" },
            { name: "Bolag", path: "/bolag" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url: absoluteUrl("/bolag"),
            inLanguage: "sv-SE",
          },
        ]}
      />
      <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-divlab-text-muted">DivLab</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-divlab-text">Bolag</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
          Sök och öppna bolagssidor med fördröjd kurs, utdelning, rapporter och officiella källor. Listan är den följbara katalogen, inte en rankning.
        </p>
        <div className="mt-5">
          <CompanyDirectory companies={companies} upcoming={upcoming} mentioned={mentioned} />
        </div>
      </div>
    </AppShell>
  );
}
