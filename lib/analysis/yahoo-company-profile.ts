import "server-only";

import { getYahooCrumbSession } from "@/lib/model-portfolios/engine/yahoo-research";
import {
  buildCompanyProfilePreflightFromYahooPayload,
  type CompanyProfilePreflight,
} from "./company-profile-preflight";

const YAHOO_SUMMARY_ENDPOINT = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const USER_AGENT =
  "Mozilla/5.0 (compatible; DivLab/1.0; +https://divlab.se) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

/**
 * Lightweight methodology preflight. This intentionally requests only provider
 * company metadata, not financial statements, before Daily Case Selection.
 */
export async function fetchYahooCompanyProfilePreflight(input: {
  yahooSymbol: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<CompanyProfilePreflight | null> {
  const symbol = input.yahooSymbol.trim();
  if (!symbol) return null;
  const fetchImpl = input.fetchImpl ?? fetch;
  const now = input.now ?? new Date();
  if (!Number.isFinite(now.getTime())) return null;

  const session = await getYahooCrumbSession(fetchImpl, now);
  if (!session) return null;

  const url = new URL(`${YAHOO_SUMMARY_ENDPOINT}/${encodeURIComponent(symbol)}`);
  url.searchParams.set("modules", "assetProfile,price");
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
    return buildCompanyProfilePreflightFromYahooPayload({
      payload: await response.json(),
      yahooSymbol: symbol,
      fetchedAt: now,
    });
  } catch {
    return null;
  }
}
