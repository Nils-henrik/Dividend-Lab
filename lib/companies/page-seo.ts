import type { CompanyPageModel } from "@/lib/companies/page-model";
import type { CompanyProfile } from "@/lib/companies/types";
import { breadcrumbJsonLd, type JsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";

export function companyPageMetadataCopy(company: CompanyProfile, model: Pick<CompanyPageModel, "indexable">) {
  const title = `${company.name} aktie (${company.ticker}) – kurs, utdelning och rapport`;
  const description = `Följ ${company.displayName} (${company.ticker}) på ${company.exchange}. ${company.sector} i ${company.countryName}. Fördröjd kurs, nyckeltal, utdelning, rapporter och officiella pressmeddelanden. Informationen är inte investeringsrådgivning.`;
  return {
    title,
    description,
    robots: model.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export function companyPageJsonLd(company: CompanyProfile): JsonLd[] {
  const sameAs = [company.linkedinUrl, company.xUrl].filter((url): url is string => Boolean(url));
  return [
    breadcrumbJsonLd([
      { name: "Hem", path: "/" },
      { name: "Bolag", path: "/bolag" },
      { name: company.displayName, path: `/bolag/${company.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Corporation",
      name: company.name,
      tickerSymbol: company.ticker,
      url: company.websiteUrl,
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${company.name} aktie`,
      url: absoluteUrl(`/bolag/${company.slug}`),
      inLanguage: "sv-SE",
      isPartOf: absoluteUrl("/"),
    },
  ];
}
