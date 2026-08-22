import "server-only";

import { getYahooCrumbSession } from "@/lib/model-portfolios/engine/yahoo-research";
import {
  classifyCompanyMetadata,
  extractYahooCompanyMetadata,
  type DivLabCompanyClassification,
} from "./company-classification";
import type { FundamentalSnapshot } from "./fundamental-analysis";
import { parseYahooFinancialStatements } from "./financial-statement-normalizer";

const YAHOO_SUMMARY_ENDPOINT = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const YAHOO_LEGACY_SESSION_HOME = "https://finance.yahoo.com/";
const YAHOO_COOKIE_BOOTSTRAP = "https://fc.yahoo.com/";
const USER_AGENT =
  "Mozilla/5.0 (compatible; DivLab/1.0; +https://divlab.se) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

export type YahooFinancialStatementResearch = {
  snapshot: FundamentalSnapshot;
  /** Provider-metadata classification; source IDs are attached by the packet loader. */
  companyClassification: DivLabCompanyClassification;
  sourceUrl: string;
  fetchedAt: string;
};

function financialSessionFetch(fetchImpl: typeof fetch): typeof fetch {
  return ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const rewritten = typeof input === "string" && input === YAHOO_LEGACY_SESSION_HOME
      ? YAHOO_COOKIE_BOOTSTRAP
      : input;
    return fetchImpl(rewritten, init);
  }) as typeof fetch;
}

export async function fetchYahooFinancialStatements(input: {
  yahooSymbol: string;
  currency: string;
  currentPrice: number;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<YahooFinancialStatementResearch | null> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const now = input.now ?? new Date();
  const symbol = input.yahooSymbol.trim();
  if (!symbol || !Number.isFinite(input.currentPrice) || input.currentPrice <= 0) return null;

  // Vercel Preview runtime cannot fetch finance.yahoo.com for session bootstrap,
  // while fc.yahoo.com intentionally returns a cookie-bearing response that can
  // be exchanged for the same Yahoo crumb. Keep this rewrite local to DivLab
  // Analys; the shared session parser, cookie allowlist and fail-closed behavior
  // remain unchanged.
  const session = await getYahooCrumbSession(financialSessionFetch(fetchImpl), now);
  if (!session) return null;

  const url = new URL(`${YAHOO_SUMMARY_ENDPOINT}/${encodeURIComponent(symbol)}`);
  url.searchParams.set(
    "modules",
    [
      "incomeStatementHistory",
      "incomeStatementHistoryQuarterly",
      "balanceSheetHistory",
      "balanceSheetHistoryQuarterly",
      "cashflowStatementHistory",
      "cashflowStatementHistoryQuarterly",
      "defaultKeyStatistics",
      "financialData",
      "price",
      "summaryDetail",
      "assetProfile",
    ].join(","),
  );
  url.searchParams.set("formatted", "false");
  url.searchParams.set("crumb", session.crumb);

  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        Cookie: session.cookie,
      },
      next: { revalidate: 14_400 },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const snapshot = parseYahooFinancialStatements({
      payload,
      symbol,
      currency: input.currency,
      currentPrice: input.currentPrice,
      now,
    });
    if (!snapshot) return null;
    const companyClassification = classifyCompanyMetadata({
      metadata: extractYahooCompanyMetadata(payload),
    });
    return {
      snapshot,
      companyClassification,
      sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/financials/`,
      fetchedAt: now.toISOString(),
    };
  } catch {
    return null;
  }
}
