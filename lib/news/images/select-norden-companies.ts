import type { NewsArticle } from "@/types/news";

import { hasApprovedCompanyLogo } from "./company-logo-map";
import { NORDEN_I_CENTRUM_TEMPLATE_V2 } from "./templates";

export const MAX_NORDEN_LOGOS = NORDEN_I_CENTRUM_TEMPLATE_V2.maxCompanyLogos;

export type NordenCompanySelection = {
  requestedCompanies: string[];
  companiesUsed: string[];
  missingCompanyLogos: string[];
};

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (haystack.match(new RegExp(escaped, "giu")) ?? []).length;
}

function companyScore(article: NewsArticle, company: string, originalIndex: number): number {
  const firstIntro = article.intro?.[0] ?? "";
  const sectionHeadingHits = (article.sections ?? []).reduce(
    (sum, section) => sum + countOccurrences(section.heading, company),
    0,
  );
  const sectionBodyHits = (article.sections ?? []).reduce(
    (sum, section) => sum + countOccurrences(section.paragraphs.join(" "), company),
    0,
  );

  return (
    countOccurrences(article.title, company) * 1000 +
    countOccurrences(article.summary, company) * 500 +
    countOccurrences(firstIntro, company) * 250 +
    sectionHeadingHits * 100 +
    sectionBodyHits * 10 +
    Math.max(0, 50 - originalIndex)
  );
}

/**
 * Deterministic editorial selection from the final article metadata/copy.
 * Internal-linking companies are the canonical candidate set authored with the
 * fact-checked article. The template, not technical capacity, controls the
 * maximum visible company count.
 */
export function selectNordenCompanies(article: NewsArticle): NordenCompanySelection {
  const canonical = article.internalLinking?.companies ?? [];
  const seen = new Set<string>();
  const candidates = canonical
    .map((company) => company.trim())
    .filter(Boolean)
    .filter((company) => {
      const key = company.toLocaleLowerCase("sv-SE");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((company, index) => ({
      company,
      index,
      score: companyScore(article, company, index),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const requestedCompanies = candidates
    .slice(0, MAX_NORDEN_LOGOS)
    .map(({ company }) => company);

  const companiesUsed = requestedCompanies.filter(hasApprovedCompanyLogo);
  const missingCompanyLogos = requestedCompanies.filter(
    (company) => !hasApprovedCompanyLogo(company),
  );

  return { requestedCompanies, companiesUsed, missingCompanyLogos };
}

export function normalizeRequestedCompanies(companies: readonly string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const raw of companies) {
    const company = raw.trim();
    if (!company) continue;
    const key = company.toLocaleLowerCase("sv-SE");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(company);
    if (deduped.length === MAX_NORDEN_LOGOS) break;
  }

  return deduped;
}
