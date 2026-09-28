import "server-only";

import { cache } from "react";
import { parseYahooDividendChart, type PaidDividend } from "@/lib/companies/dividend-view";

const CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";
const USER_AGENT = "Mozilla/5.0 (compatible; DivLab/1.0; +https://divlab.se) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

async function loadPaidDividends(symbol: string): Promise<PaidDividend[]> {
  const trimmed = symbol.trim();
  if (!trimmed) return [];
  const url = new URL(`${CHART_ENDPOINT}/${encodeURIComponent(trimmed)}`);
  url.searchParams.set("range", "10y");
  url.searchParams.set("interval", "1mo");
  url.searchParams.set("events", "div");
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return [];
    const parsed = parseYahooDividendChart(await response.json());
    if (!parsed.currency) return [];
    return parsed.events.map((event) => ({ ...event, currency: parsed.currency as string }));
  } catch {
    return [];
  }
}

export const fetchPaidDividends = cache(loadPaidDividends);
