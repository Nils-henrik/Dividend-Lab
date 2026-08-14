import { analyzeFundamentals } from "../lib/analysis/fundamental-analysis";
import type { CurrencyAwareFundamentalSnapshot } from "../lib/analysis/financial-statement-normalizer";
import { loadDivLabResearchInputs } from "../lib/analysis/research-loader";
import { analyzeSupportResistance } from "../lib/analysis/support-resistance";
import { fetchNordicPrimarySourceEvents } from "../lib/model-portfolios/engine/nordic-primary-sources";

const CASES = [
  { profile: "quality-large-cap", symbol: "ATCO-A", exchange: "ST", name: "Atlas Copco AB" },
  { profile: "high-margin-growth", symbol: "EVO", exchange: "ST", name: "Evolution AB" },
  { profile: "volatile-turnaround-event", symbol: "EMBRAC-B", exchange: "ST", name: "Embracer Group AB" },
] as const;

async function main() {
  const now = new Date();
  const cases = [];

  for (const item of CASES) {
    const loaded = await loadDivLabResearchInputs({ ...item, now });
    if (!loaded.ok) {
      cases.push({ profile: item.profile, symbol: item.symbol, ok: false, reason: loaded.reason });
      continue;
    }

    const snapshot = loaded.value.fundamentals as CurrencyAwareFundamentalSnapshot;
    const fundamental = analyzeFundamentals(snapshot);
    const levels = analyzeSupportResistance(loaded.value.history);
    const primarySources = loaded.value.sources.filter((source) => source.primary);
    const rawDiscovery = item.symbol === "EMBRAC-B"
      ? await fetchNordicPrimarySourceEvents({
          companyName: item.name,
          symbol: item.symbol,
          exchange: item.exchange,
          now,
          maxHits: 12,
          queryCount: 20,
        })
      : [];

    cases.push({
      profile: item.profile,
      ok: true,
      instrument: loaded.value.instrument,
      sourceCount: loaded.value.sources.length,
      primarySourceCount: primarySources.length,
      primarySources: primarySources.map((source) => ({
        kind: source.kind,
        publishedAt: source.publishedAt,
        publisher: source.publisher,
        url: source.url,
      })),
      currencies: {
        market: snapshot.currency,
        reporting: snapshot.reportingCurrency ?? null,
        epsTtm: snapshot.epsTtmCurrency ?? null,
      },
      historicalPeriodCoverage: snapshot.historicalPeriods?.map((period) => ({
        period: period.period,
        revenue: typeof period.revenue === "number",
        operatingIncome: typeof period.operatingIncome === "number",
        netIncome: typeof period.netIncome === "number",
        freeCashFlow: typeof period.freeCashFlow === "number",
        eps: typeof period.eps === "number",
        shares: typeof period.sharesOutstanding === "number",
      })) ?? [],
      trends: fundamental.trends,
      unknowns: fundamental.unknowns,
      resistanceState: levels.resistanceState,
      priorHigh: levels.priorHigh,
      nearestSupport: levels.supports[0]
        ? { lower: levels.supports[0].lower, upper: levels.supports[0].upper, strength: levels.supports[0].strength }
        : null,
      nearestResistance: levels.resistances[0]
        ? { lower: levels.resistances[0].lower, upper: levels.resistances[0].upper, strength: levels.resistances[0].strength }
        : null,
      rawPrimaryDiscovery: rawDiscovery.map((hit) => ({
        title: hit.title,
        category: hit.category,
        publishedAt: hit.publishedAt,
        attachments: hit.attachments.map((attachment) => ({
          mimeType: attachment.mimeType,
          fileName: attachment.fileName,
          url: attachment.url,
        })),
      })),
    });
  }

  console.log(JSON.stringify({
    status: "completed",
    readOnly: true,
    persistence: false,
    aiUsed: false,
    executedAt: now.toISOString(),
    cases,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
