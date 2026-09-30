import { articleMatchesCompany } from "@/lib/companies/news";
import type { CompanyProfile } from "@/lib/companies/types";
import type { NewsArticle } from "@/types/news";

export type UpcomingReport = {
  slug: string;
  name: string;
  ticker: string;
  title: string;
  date: string;
};

export type MentionedCompany = {
  slug: string;
  name: string;
  ticker: string;
  sector: string;
  articleTitle: string;
  publishedAt: string;
};

export function selectUpcomingReports(
  rows: readonly UpcomingReport[],
  today: string,
  withinDays = 60,
  limit = 8,
): UpcomingReport[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return [];
  const end = shiftIsoDay(today, withinDays);
  const seen = new Set<string>();
  return [...rows]
    .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && row.date >= today && row.date <= end && row.title.trim())
    .sort((left, right) => left.date.localeCompare(right.date) || left.name.localeCompare(right.name, "sv"))
    .filter((row) => {
      const key = `${row.slug}:${row.date}:${row.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function recentlyMentionedCompanies(
  articles: readonly NewsArticle[],
  companies: readonly CompanyProfile[],
  limit = 8,
): MentionedCompany[] {
  const ordered = [...articles].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  const seen = new Set<string>();
  const mentions: MentionedCompany[] = [];
  for (const article of ordered) {
    for (const company of companies) {
      if (seen.has(company.slug) || !articleMatchesCompany(article, company)) continue;
      seen.add(company.slug);
      mentions.push({
        slug: company.slug,
        name: company.displayName,
        ticker: company.ticker,
        sector: company.sector,
        articleTitle: article.title,
        publishedAt: article.publishedAt,
      });
      if (mentions.length >= limit) return mentions;
    }
  }
  return mentions;
}

export function groupCompaniesBySector(companies: readonly CompanyProfile[]) {
  const groups = new Map<string, CompanyProfile[]>();
  for (const company of companies) {
    const rows = groups.get(company.sector) ?? [];
    rows.push(company);
    groups.set(company.sector, rows);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "sv"))
    .map(([sector, rows]) => ({
      sector,
      companies: [...rows].sort((left, right) => left.displayName.localeCompare(right.displayName, "sv")),
    }));
}

export function groupCompaniesByLetter(companies: readonly CompanyProfile[]) {
  const groups = new Map<string, CompanyProfile[]>();
  const ordered = [...companies].sort((left, right) => left.displayName.localeCompare(right.displayName, "sv"));
  for (const company of ordered) {
    const letter = company.displayName.charAt(0).toLocaleUpperCase("sv");
    const rows = groups.get(letter) ?? [];
    rows.push(company);
    groups.set(letter, rows);
  }
  return [...groups.entries()].map(([letter, rows]) => ({ letter, companies: rows }));
}

function shiftIsoDay(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year!, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function articleCompanyLinks(
  article: NewsArticle,
  companies: readonly CompanyProfile[],
) {
  return companies
    .filter((company) => articleMatchesCompany(article, company))
    .map((company) => ({
      slug: company.slug,
      name: company.displayName,
      ticker: company.ticker,
      href: `/bolag/${company.slug}`,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "sv"));
}
