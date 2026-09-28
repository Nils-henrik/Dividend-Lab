import type { CompanyProfile } from "@/lib/companies/types";
import { DAX40_COMPANIES } from "@/lib/companies/catalog/dax40";
import { NASDAQ100_COMPANIES } from "@/lib/companies/catalog/nasdaq100";
import { OMXS30_COMPANIES } from "@/lib/companies/catalog/omxs30";

function assertUniqueSlugs(companies: readonly CompanyProfile[]) {
  const seen = new Set<string>();

  for (const company of companies) {
    if (seen.has(company.slug)) {
      throw new Error(`Duplicate company slug: ${company.slug}`);
    }

    seen.add(company.slug);
  }
}

const COMPANY_CATALOG: readonly CompanyProfile[] = [
  ...OMXS30_COMPANIES,
  ...DAX40_COMPANIES,
  ...NASDAQ100_COMPANIES,
];

assertUniqueSlugs(COMPANY_CATALOG);

const COMPANY_BY_SLUG = new Map(
  COMPANY_CATALOG.map((company) => [company.slug, company]),
);

export function getCompanyCatalog(): readonly CompanyProfile[] {
  return COMPANY_CATALOG;
}

/** @deprecated The catalog is no longer a pilot. Use getCompanyCatalog. */
export function getPilotCompanies(): readonly CompanyProfile[] {
  return COMPANY_CATALOG;
}

export function getCompanyProfile(slug: string): CompanyProfile | null {
  return COMPANY_BY_SLUG.get(slug) ?? null;
}

export function getRelatedCompanies(
  company: CompanyProfile,
): readonly CompanyProfile[] {
  return (company.relatedSlugs ?? []).flatMap((slug) => {
    const related = COMPANY_BY_SLUG.get(slug);
    return related && related.slug !== company.slug ? [related] : [];
  });
}
