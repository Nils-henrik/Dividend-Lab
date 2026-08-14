import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildDivLabResearchPacket,
  type DivLabResearchPacket,
} from "./deep-research";
import {
  persistDivLabResearchPacket,
  type PersistedDivLabAnalysisVersion,
} from "./repository";
import {
  loadDivLabResearchInputs,
  type DivLabResearchLoadResult,
} from "./research-loader";
import type { ValuationScenarioInput } from "./valuation";

export type CreateDivLabAnalysisDraftResult =
  | {
      ok: true;
      packet: DivLabResearchPacket;
      persistence: PersistedDivLabAnalysisVersion | null;
    }
  | {
      ok: false;
      reason: Extract<DivLabResearchLoadResult, { ok: false }>["reason"];
    };

/**
 * Server-side orchestration entrypoint for DivLab Analys.
 *
 * Valuation assumptions remain explicit caller input by design: v1 must not
 * manufacture a fair value merely to complete the report. The research loader
 * supplies deterministic market/fundamental facts and verified source-linked
 * evidence; scenario assumptions can later come from the analysis AI after it
 * has read that immutable packet.
 */
export async function createDivLabAnalysisDraft(input: {
  symbol: string;
  exchange: string;
  name: string;
  valuationScenarios: ValuationScenarioInput[];
  fetchImpl?: typeof fetch;
  now?: Date;
  supabase?: SupabaseClient;
  slug?: string;
}): Promise<CreateDivLabAnalysisDraftResult> {
  const loaded = await loadDivLabResearchInputs({
    symbol: input.symbol,
    exchange: input.exchange,
    name: input.name,
    fetchImpl: input.fetchImpl,
    now: input.now,
  });
  if (!loaded.ok) return loaded;

  const research = loaded.value;
  const packet = buildDivLabResearchPacket({
    symbol: research.instrument.symbol,
    exchange: research.instrument.exchange,
    name: research.instrument.name,
    currency: research.instrument.currency,
    currentPrice: research.instrument.currentPrice,
    history: research.history,
    fundamentals: research.fundamentals,
    fxConversion: research.fxConversion,
    valuationScenarios: input.valuationScenarios,
    sources: research.sources,
    evidence: research.evidence,
    now: input.now,
  });

  const persistence = input.supabase
    ? await persistDivLabResearchPacket({
        supabase: input.supabase,
        packet,
        slug: input.slug,
      })
    : null;

  return {
    ok: true,
    packet,
    persistence,
  };
}
