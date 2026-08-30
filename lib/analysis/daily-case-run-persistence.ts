import type { DailyCaseRunAudit } from "./daily-case-audit";

export type DailyCaseRunInsertRow = {
  selection_date: string;
  run_key: string;
  as_of: string;
  audit_version: string;
  funnel_version: string;
  market_shortlist_version: string;
  desk_version: string;
  universe_count: number;
  selected_for_preflight_count: number;
  preflight_ready_count: number;
  selected_for_deep_research_count: number;
  audit_packet: DailyCaseRunAudit;
};

/** Deterministic DB row mapping. No timestamps or ids are generated here. */
export function buildDailyCaseRunInsertRow(
  audit: DailyCaseRunAudit,
): DailyCaseRunInsertRow {
  return {
    selection_date: audit.selectionDate,
    run_key: audit.runKey,
    as_of: audit.asOf,
    audit_version: audit.version,
    funnel_version: audit.funnel.version,
    market_shortlist_version: audit.funnel.marketShortlist.version,
    desk_version: audit.funnel.desk.version,
    universe_count: audit.stats.universe,
    selected_for_preflight_count: audit.stats.selectedForMethodologyPreflight,
    preflight_ready_count: audit.stats.methodologyPreflightReady,
    selected_for_deep_research_count: audit.stats.selectedForDeepResearch,
    audit_packet: audit,
  };
}
