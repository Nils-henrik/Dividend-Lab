import { NextResponse } from "next/server";
import { analyzeFundamentals } from "@/lib/analysis/fundamental-analysis";
import type { CurrencyAwareFundamentalSnapshot } from "@/lib/analysis/financial-statement-normalizer";
import { loadDivLabResearchInputs } from "@/lib/analysis/research-loader";
import { analyzeSupportResistance } from "@/lib/analysis/support-resistance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SMOKE_KEY = "three-company-v1";

const CASES = [
  {
    profile: "quality-large-cap",
    symbol: "ATCO-A",
    exchange: "ST",
    name: "Atlas Copco AB",
  },
  {
    profile: "high-margin-growth",
    symbol: "EVO",
    exchange: "ST",
    name: "Evolution AB",
  },
  {
    profile: "volatile-turnaround-event",
    symbol: "EMBRAC-B",
    exchange: "ST",
    name: "Embracer Group AB",
  },
] as const;

function zoneSummary(zone: ReturnType<typeof analyzeSupportResistance>["supports"][number]) {
  return {
    lower: zone.lower,
    upper: zone.upper,
    center: zone.center,
    distancePct: zone.distancePct,
    strength: zone.strength,
    strengthScore: zone.strengthScore,
    touches: zone.touches,
    roleReversal: zone.roleReversal,
    lastSeen: zone.lastSeen,
    averageVolumeRatio: zone.averageVolumeRatio,
  };
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (process.env.VERCEL_ENV !== "preview" || key !== SMOKE_KEY) {
    return new NextResponse(null, { status: 404 });
  }

  const startedAt = new Date();
  const results = [];

  for (const testCase of CASES) {
    const loaded = await loadDivLabResearchInputs({
      symbol: testCase.symbol,
      exchange: testCase.exchange,
      name: testCase.name,
      now: startedAt,
    });

    if (!loaded.ok) {
      results.push({
        profile: testCase.profile,
        symbol: `${testCase.symbol}.${testCase.exchange}`,
        ok: false,
        reason: loaded.reason,
      });
      continue;
    }

    const currencyAware = loaded.value.fundamentals as CurrencyAwareFundamentalSnapshot;
    const fundamental = analyzeFundamentals(loaded.value.fundamentals);
    const levels = analyzeSupportResistance(loaded.value.history);
    const primarySources = loaded.value.sources.filter((source) => source.primary);

    results.push({
      profile: testCase.profile,
      ok: true,
      instrument: loaded.value.instrument,
      loadedAt: loaded.value.loadedAt,
      marketSessions: loaded.value.history.length,
      sourceCount: loaded.value.sources.length,
      primarySourceCount: primarySources.length,
      sourceKinds: [...new Set(loaded.value.sources.map((source) => source.kind))],
      primarySources: primarySources.map((source) => ({
        kind: source.kind,
        publisher: source.publisher,
        publishedAt: source.publishedAt,
        url: source.url,
      })),
      fundamentals: {
        asOf: loaded.value.fundamentals.asOf,
        marketCurrency: loaded.value.fundamentals.currency,
        reportingCurrency: currencyAware.reportingCurrency ?? null,
        epsTtmCurrency: currencyAware.epsTtmCurrency ?? null,
        historicalPeriods: loaded.value.fundamentals.historicalPeriods?.length ?? 0,
        historicalPeriodCoverage: loaded.value.fundamentals.historicalPeriods?.map((period) => ({
          period: period.period,
          hasRevenue: typeof period.revenue === "number",
          hasOperatingIncome: typeof period.operatingIncome === "number",
          hasNetIncome: typeof period.netIncome === "number",
          hasFreeCashFlow: typeof period.freeCashFlow === "number",
          hasEps: typeof period.eps === "number",
          hasShares: typeof period.sharesOutstanding === "number",
        })) ?? [],
        scorecard: fundamental.scorecard,
        trends: fundamental.trends,
        metrics: fundamental.metrics,
        strengths: fundamental.strengths,
        concerns: fundamental.concerns,
        unknowns: fundamental.unknowns,
      },
      technicalLevels: {
        asOf: levels.asOf,
        sessions: levels.sessions,
        currentPrice: levels.currentPrice,
        zoneTolerancePct: levels.zoneTolerancePct,
        resistanceState: levels.resistanceState,
        priorHigh: levels.priorHigh,
        supports: levels.supports.map(zoneSummary),
        resistances: levels.resistances.map(zoneSummary),
      },
    });
  }

  return NextResponse.json({
    status: "completed",
    environment: "preview",
    readOnly: true,
    persistence: false,
    aiUsed: false,
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    cases: results,
  });
}
