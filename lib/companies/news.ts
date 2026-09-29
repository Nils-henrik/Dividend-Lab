import type { CompanyProfile } from "@/lib/companies/types";
import type { NewsArticle } from "@/types/news";

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("sv")
    .replace(/[^a-z0-9]/g, "");
}

function loose(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("sv")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wholeTokenMatch(title: string, key: string) {
  const needle = loose(key);
  if (needle.length < 2) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:[^a-z0-9]|$)`, "i").test(loose(title));
}

/**
 * Long-name title hits. Needles under five characters stay rejected here so
 * short words are not matched unless they are a verified ticker or short name.
 */
export function titleMentionsCompany(title: string, key: string) {
  const needle = loose(key);
  if (needle.length < 5) return false;
  return wholeTokenMatch(title, key);
}

/** Canonical names and aliases whose letters are a short symbol, such as ABB or H&M. */
function isShortCanonicalName(key: string) {
  const compact = normalize(key);
  return compact.length >= 2 && compact.length <= 4;
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

  const title = article.title;
  const longNameHit = [company.name, ...company.aliases].some((key) => titleMentionsCompany(title, key));
  const shortNameHit = [company.name, ...company.aliases]
    .filter(isShortCanonicalName)
    .some((key) => wholeTokenMatch(title, key));
  const tickerHit = [company.ticker, ...company.tickerAliases].some((ticker) => wholeTokenMatch(title, ticker));

  return (
    article.internalLinking?.companies?.some((name) =>
      companyKeys.has(normalize(name)),
    ) === true ||
    article.internalLinking?.tickers?.some((ticker) =>
      tickerKeys.has(normalize(ticker)),
    ) === true ||
    longNameHit ||
    shortNameHit ||
    tickerHit
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

export function getFollowedCompanyNews(
  companies: readonly CompanyProfile[],
  articles: readonly NewsArticle[],
  limit = 3,
) {
  const seen = new Set<string>();

  return [...articles]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .filter((article) => {
      if (seen.has(article.id)) {
        return false;
      }

      const matches = companies.some((company) => articleMatchesCompany(article, company));

      if (matches) {
        seen.add(article.id);
      }

      return matches;
    })
    .slice(0, limit);
}
