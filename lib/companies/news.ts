import type { CompanyProfile } from "@/lib/companies/types";
import type { NewsArticle } from "@/types/news";

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("sv")
    .replace(/[^a-z0-9]/g, "");
}

export function articleMatchesCompany(
  article: NewsArticle,
  company: CompanyProfile,
) {
  const companyKeys = new Set(
    [company.name, ...company.aliases].map(normalize),
  );
  const tickerKeys = new Set(
    [company.ticker, ...company.tickerAliases].map(normalize),
  );

  return (
    article.internalLinking?.companies?.some((name) =>
      companyKeys.has(normalize(name)),
    ) === true ||
    article.internalLinking?.tickers?.some((ticker) =>
      tickerKeys.has(normalize(ticker)),
    ) === true
  );
}

export function getCompanyNews(
  company: CompanyProfile,
  articles: readonly NewsArticle[],
  limit = 4,
) {
  return articles
    .filter((article) => articleMatchesCompany(article, company))
    .slice(0, limit);
}

