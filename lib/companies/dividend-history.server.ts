import "server-only";

import { cache } from "react";
import { parseYahooDividendChart, type PaidDividend } from "@/lib/companies/dividend-view";
import {
  dividendSlotsForSymbol,
  EXISTING_DIVIDEND_CACHE_MAX_AGE_MS,
  resolveSourceFailover,
  YAHOO_DIVIDEND_PROVIDER,
} from "@/lib/companies/source-chain";

const USER_AGENT = "Mozilla/5.0 (compatible; DivLab/1.0; +https://divlab.se) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

function sameDividendSeries(left: readonly PaidDividend[], right: readonly PaidDividend[]) {
  if (left.length !== right.length) return false;
  return left.every((item, index) => {
    const other = right[index];
    return other?.exDate === item.exDate && other.amount === item.amount && other.currency === item.currency;
  });
}

async function loadPaidDividends(symbol: string): Promise<PaidDividend[]> {
  const trimmed = symbol.trim();
  if (!trimmed) return [];
  const resolution = await resolveSourceFailover({
    slots: dividendSlotsForSymbol(trimmed),
    valuesAgree: sameDividendSeries,
    read: async (slot) => {
      if (slot.providerId !== YAHOO_DIVIDEND_PROVIDER || !slot.endpoint) {
        return { status: "unavailable", reason: "no_reader" };
      }
      try {
        const response = await fetch(slot.endpoint, {
          headers: { Accept: "application/json", "User-Agent": USER_AGENT },
          next: { revalidate: EXISTING_DIVIDEND_CACHE_MAX_AGE_MS / 1000 },
          signal: AbortSignal.timeout(8_000),
        });
        if (!response.ok) return { status: "unavailable", reason: `http_${response.status}` };
        const parsed = parseYahooDividendChart(await response.json());
        if (!parsed.currency) return { status: "missing", reason: "missing_currency" };
        return {
          status: "ok",
          value: parsed.events.map((event) => ({ ...event, currency: parsed.currency as string })),
          asOf: new Date().toISOString(),
        };
      } catch {
        return { status: "unavailable", reason: "provider_error" };
      }
    },
  });
  if (resolution.status !== "ok") return [];
  return resolution.value;
}

export const fetchPaidDividends = cache(loadPaidDividends);
