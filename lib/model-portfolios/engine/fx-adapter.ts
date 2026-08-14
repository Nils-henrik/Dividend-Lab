import "server-only";

import type { FxRateQuote, SupportedFxCurrency } from "./fx";

const FRANKFURTER_URL = "https://api.frankfurter.app/latest";
const CACHE_TTL_MS = 15 * 60 * 1_000;
const MAX_CACHE_ENTRIES = 8;

type CacheEntry = {
  expiresAt: number;
  quote: FxRateQuote;
};

const cache = new Map<string, CacheEntry>();

export type FxAdapterResult =
  | { ok: true; quote: FxRateQuote }
  | { ok: false; reason: "fx_unavailable" | "unsupported_pair" };

function cacheKey(base: SupportedFxCurrency): string {
  return `${base}->SEK`;
}

function remember(key: string, quote: FxRateQuote): FxRateQuote {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, quote });
  return quote;
}

/** Test helper — clears the in-process FX cache. */
export function clearFxAdapterCache(): void {
  cache.clear();
}

/**
 * Server-only FX adapter backed by Frankfurter (ECB reference rates).
 * Fail-closed: never invents a 1.0 rate for foreign currencies.
 * An injected fetch implementation keeps higher-level research tests fully
 * deterministic without changing existing portfolio callers. Injected fetches
 * deliberately bypass the shared runtime cache so test fixtures can never
 * poison or consume real server FX cache entries.
 */
export async function fetchFxRateToSek(
  base: SupportedFxCurrency,
  now = new Date(),
  fetchImpl: typeof fetch = fetch,
): Promise<FxAdapterResult> {
  if (base === "SEK") {
    return {
      ok: true,
      quote: {
        base: "SEK",
        quote: "SEK",
        rate: 1,
        asOf: now.toISOString(),
        sourcePublisher: "identity",
        provider: "identity",
      },
    };
  }

  const useSharedCache = fetchImpl === fetch;
  const key = cacheKey(base);
  if (useSharedCache) {
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return { ok: true, quote: cached.quote };
    }
  }

  try {
    const response = await fetchImpl(`${FRANKFURTER_URL}?from=${encodeURIComponent(base)}&to=SEK`, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
    });
    if (!response.ok) return { ok: false, reason: "fx_unavailable" };

    const body = (await response.json()) as {
      amount?: unknown;
      base?: unknown;
      date?: unknown;
      rates?: { SEK?: unknown };
    };

    if (typeof body.base === "string" && body.base.trim().toUpperCase() !== base) {
      return { ok: false, reason: "fx_unavailable" };
    }

    const rate = typeof body.rates?.SEK === "number" ? body.rates.SEK : Number(body.rates?.SEK);
    if (!Number.isFinite(rate) || rate <= 0) return { ok: false, reason: "fx_unavailable" };

    const date = typeof body.date === "string" && body.date.trim() ? body.date.trim() : null;
    const asOf = date ? `${date}T16:00:00.000Z` : now.toISOString();

    const quote: FxRateQuote = {
      base,
      quote: "SEK",
      rate,
      asOf,
      sourcePublisher: "European Central Bank via Frankfurter",
      provider: "frankfurter",
    };
    return { ok: true, quote: useSharedCache ? remember(key, quote) : quote };
  } catch {
    return { ok: false, reason: "fx_unavailable" };
  }
}
