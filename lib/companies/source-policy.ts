import {
  EODHD_FREE_ACCOUNT_DAILY_LIMIT,
  MODEL_PORTFOLIO_EODHD_PASS_LIMITS,
} from "@/lib/model-portfolios/engine/eodhd-budget";

/**
 * Source-policy decisions for the catalog completeness pass.
 * Bindings are frozen issuer identifiers. They are not derived from display names.
 * This module does not fetch external data and does not read credentials.
 */

export const SOURCE_POLICY_VERIFIED_ON = "2026-09-30";

export const EUROCLEAR_REGISTER_URL =
  "https://www.euroclear.com/sweden/en/om-euroclear-sweden/offentligaaktiebocker.html";

export const FI_INSIDER_SEARCH_URL = "https://marknadssok.fi.se/publiceringsklient";

export const NASDAQ_NORDIC_EQUITY_API_PAGE =
  "https://www.nasdaq.com/products/data/equities/nordic-baltic";

export const NASDAQ_COMPANY_NEWS_PAGE =
  "https://www.nasdaq.com/european-market-activity/news/company-news";

const NASDAQ_CNS_ORIGIN = "https://api.news.eu.nasdaq.com";

/** Official company-news page query. Automation stays closed. */
export const NASDAQ_CNS_QUERY_LIMIT = 20;

/**
 * Exact CNS company ids verified on 2026-09-30 against metadata.action
 * and a one-row Main Market Stockholm disclosure for each id.
 * ASSA ABLOY's id contains two spaces. Do not trim or rebuild these strings.
 */
export const NASDAQ_CNS_COMPANY_ID_BY_SLUG: Record<string, string> = {
  investor: "Investor AB",
  volvo: "Volvo, AB",
  ericsson: "Ericsson, Telefonab. L M",
  "atlas-copco": "Atlas Copco AB",
  astrazeneca: "AstraZeneca PLC",
  abb: "ABB Ltd",
  addtech: "Addtech AB",
  "alfa-laval": "Alfa Laval AB",
  "assa-abloy": "ASSA ABLOY  AB",
  boliden: "Boliden AB",
  epiroc: "Epiroc Aktiebolag",
  eqt: "EQT AB",
  essity: "Essity AB",
  evolution: "Evolution AB",
  handelsbanken: "Svenska Handelsbanken AB",
  hm: "Hennes & Mauritz AB, H & M",
  hexagon: "Hexagon AB",
  industrivarden: "Industrivärden, AB",
  lifco: "Lifco AB",
  nibe: "NIBE Industrier AB",
  nordea: "Nordea Bank Abp",
  saab: "SAAB AB",
  sandvik: "Sandvik AB",
  sca: "Svenska Cellulosa AB SCA",
  seb: "Skandinaviska Enskilda Banken AB",
  skanska: "Skanska AB",
  skf: "SKF, AB",
  swedbank: "Swedbank AB",
  tele2: "Tele2 AB",
  telia: "Telia Company AB",
};

export const NASDAQ_EUROPE_RSS = [
  {
    id: "mainMarketNotices",
    url: "https://api.news.eu.nasdaq.com/news/rss/mainMarketNotices",
    classification: "exchange_notice",
  },
  {
    id: "firstNorthNotices",
    url: "https://api.news.eu.nasdaq.com/news/rss/firstNorthNotices",
    classification: "exchange_notice",
  },
  {
    id: "itNotices",
    url: "https://api.news.eu.nasdaq.com/news/rss/itNotices",
    classification: "exchange_it_notice",
  },
  {
    id: "nasdaqNordicNews",
    url: "https://api.news.eu.nasdaq.com/news/rss/nasdaqNordicNews",
    classification: "nasdaq_own_investor_news",
  },
] as const;

export type NasdaqRssClassification = (typeof NASDAQ_EUROPE_RSS)[number]["classification"];

export const EODHD_NORDIC_DISPLAY_BLOCKER =
  "Hård kommersiell licensspärr. EODHD är inte verifierad för nordisk publik visning. Projektets nordiska budget är 0 och gratistaket är 20 anrop per dag, vilket inte täcker 30 bolag vid ett avbrott. Ingen ny betaltjänst läggs till.";

export const NASDAQ_EQUITY_API_BLOCKER =
  "Hård kommersiell licensspärr. Nasdaq Nordic Equity Web API är en betald marknadsdataprodukt och läggs inte till. Den publika nyhetsytan ger inte kursrättigheter.";

export const VALUATION_LICENSE_BLOCKER =
  "Hård kommersiell licensspärr. Ingen redan berättigad källa ger en nordisk värderingsögonblicksbild för publik visning. Utfärdarnas rapportsidor är inte en enhetlig maskinläsbar värdering.";

export const DIVIDEND_HISTORY_LICENSE_BLOCKER =
  "Hård kommersiell licensspärr. Ingen redan berättigad källa täcker betald utdelningshistorik för hela katalogen. En enstaka officiell utdelning är ett annat faktum och blandas inte in i historiken.";

export const NASDAQ_DISCLOSURE_BLOCKER =
  "Nasdaq publicerar emittentinsänt bolagsnyhetsflöde, men webbavtalet tillåter bara personlig icke-kommersiell användning och förbjuder automatisk kopiering för vidare spridning. Flödet hämtas inte.";

export const NASDAQ_DIVIDEND_NOTICE_BLOCKER =
  "Nasdaq-emittentmeddelanden är spärrade för automatisk hämtning enligt Nasdaqs webbvillkor. Förslag, beslut och utbetalning normaliseras inte till en betald utdelningshistorik.";

export const EUROCLEAR_OWNERSHIP_BLOCKER =
  "Euroclear är auktoritativ för svenska aktieböcker, men bolagsspecifika register är inte ett fritt maskinläsbart API. Beställning, avgift eller manuell hantering krävs. Ingen automatisk hämtning under noll-ny-kostnad.";

export const FI_INSIDER_SEARCH_BLOCKER =
  "Marknadssök är ett sökgränssnitt utan stabil bolagsspecifik feed. Insynsregistret automatiseras inte och matchas inte på visningsnamn.";

export function nasdaqCnsCompanyId(slug: string): string | null {
  return NASDAQ_CNS_COMPANY_ID_BY_SLUG[slug] ?? null;
}

/** Website terms forbid automated capture. This stays false. */
export function nasdaqCompanyNewsMayBeFetched(): false {
  return false;
}

export function nasdaqRssSuitableForIssuerDisclosures(
  classification: NasdaqRssClassification,
): false {
  void classification;
  return false;
}

export function nasdaqCompanyNewsQueryUrl(companyId: string): string | null {
  if (!Object.values(NASDAQ_CNS_COMPANY_ID_BY_SLUG).includes(companyId)) return null;
  const url = new URL(`${NASDAQ_CNS_ORIGIN}/news/query.action`);
  url.searchParams.set("countResults", "true");
  url.searchParams.set("globalGroup", "exchangeNotice");
  url.searchParams.set("displayLanguage", "en");
  url.searchParams.set("timeZone", "CET");
  url.searchParams.set("dateMask", "yyyy-MM-dd HH:mm:ss");
  url.searchParams.set("limit", String(NASDAQ_CNS_QUERY_LIMIT));
  url.searchParams.set("start", "0");
  url.searchParams.set("dir", "DESC");
  url.searchParams.set("globalName", "NordicAllMarkets");
  url.searchParams.set("company", companyId);
  return url.toString();
}

export function nordicEodhdDisplayDecision(catalogSize: number): {
  status: "licensing_blocked";
  nordicBudget: number;
  freeDailyLimit: number;
  catalogSize: number;
  coversOutage: false;
  publicDisplayEntitlement: "unverified";
} {
  const nordicBudget = MODEL_PORTFOLIO_EODHD_PASS_LIMITS.nordic_morning;
  const freeDailyLimit = EODHD_FREE_ACCOUNT_DAILY_LIMIT;
  return {
    status: "licensing_blocked",
    nordicBudget,
    freeDailyLimit,
    catalogSize,
    coversOutage: false,
    publicDisplayEntitlement: "unverified",
  };
}

/** A disclosure sentence is not a paid-dividend history row. */
export function paidDividendHistoryFromDisclosure(): null {
  return null;
}
