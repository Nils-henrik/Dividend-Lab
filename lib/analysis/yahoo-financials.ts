import "server-only";

import { getYahooCrumbSession } from "@/lib/model-portfolios/engine/yahoo-research";
import type { FundamentalSnapshot } from "./fundamental-analysis";
import { parseYahooFinancialStatements } from "./financial-statement-normalizer";

const YAHOO_SUMMARY_ENDPOINT = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const USER_AGENT =
  "Mozilla/5.0 (compatible; DivLab/1.0; +https://divlab.se) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

export type YahooFinancialStatementResearch = {
  snapshot: FundamentalSnapshot;
  sourceUrl: string;
  fetchedAt: string;
};

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

  const session = await getYahooCrumbSession(fetchImpl, now);
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
    return {
      snapshot,
      sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/financials/`,
      fetchedAt: now.toISOString(),
    };
  } catch {
    return null;
  }
}
