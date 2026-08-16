import { NextResponse } from "next/server";
import { getCuratedPeerSet } from "@/lib/analysis/curated-peer-catalog";
import { analyzeSupportResistance } from "@/lib/analysis/support-resistance";
import {
  fetchYahooHistoryResearch,
  toYahooSymbol,
} from "@/lib/model-portfolios/engine/yahoo-research";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

/**
 * Preview-only deterministic TA diagnostics.
 *
 * This route performs no LLM call and no database write. It reuses the exact
 * Yahoo 18-month history transport and support/resistance engine used by
 * Deep Research so technicalLevelCoverage can be diagnosed without spending
 * another Analyst run.
 */
export async function GET(request: Request) {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") ?? "").trim().toUpperCase();
  const exchange = (url.searchParams.get("exchange") ?? "ST").trim().toUpperCase();
  const curated = getCuratedPeerSet({ symbol, exchange });
  if (!curated) {
    return noStore(
      NextResponse.json({ status: "target_not_curated", symbol, exchange }, { status: 404 }),
    );
  }

  const target = curated.registry.target;
  const yahooSymbol = toYahooSymbol(target.symbol, target.exchange);
  const market = await fetchYahooHistoryResearch(yahooSymbol);
  if (!market || market.history.length === 0) {
    return noStore(
      NextResponse.json({ status: "market_history_unavailable", yahooSymbol }, { status: 503 }),
    );
  }

  const levels = analyzeSupportResistance(market.history);
  const last = market.history.at(-1)!;
  const resolvedResistance =
    levels.resistances.length > 0 ||
    levels.resistanceState === "no_validated_resistance_above";
  const technicalLevelCoverage = levels.supports.length > 0 && resolvedResistance;

  return noStore(
    NextResponse.json({
      status: "ok",
      target: {
        symbol: target.symbol,
        exchange: target.exchange,
        name: target.name,
        yahooSymbol,
      },
      history: {
        sessions: market.history.length,
        firstDate: market.history[0]?.date ?? null,
        lastDate: last.date,
        lastRawClose: last.close,
        lastAdjustedClose: last.adjustedClose,
        quoteRegularPrice: market.quote?.close ?? null,
        currency: market.currency,
      },
      coverage: {
        technicalLevelCoverage,
        hasSupport: levels.supports.length > 0,
        resolvedResistance,
        supportCount: levels.supports.length,
        resistanceCount: levels.resistances.length,
        resistanceState: levels.resistanceState,
      },
      levels: {
        asOf: levels.asOf,
        currentPrice: levels.currentPrice,
        zoneTolerancePct: levels.zoneTolerancePct,
        priorHigh: levels.priorHigh,
        supports: levels.supports,
        resistances: levels.resistances,
      },
      latestBars: market.history.slice(-10).map((bar) => ({
        date: bar.date,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        adjustedClose: bar.adjustedClose,
        volume: bar.volume,
      })),
    }),
  );
}
