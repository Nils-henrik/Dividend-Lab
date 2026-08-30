import type { AnalysisSource } from "./quality-gate";
import type { DailyCaseFunnelResult } from "./daily-case-funnel";

export const DIVLAB_DAILY_CASE_RUN_AUDIT_VERSION = "daily-case-run-audit-v1" as const;

export type DailyCaseRunAudit = {
  version: typeof DIVLAB_DAILY_CASE_RUN_AUDIT_VERSION;
  selectionDate: string;
  runKey: string;
  asOf: string;
  funnel: DailyCaseFunnelResult;
  sources: AnalysisSource[];
  stats: DailyCaseFunnelResult["stats"];
};

function validSelectionDate(value: string): string {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error("daily_case_audit_selection_date_invalid");
  }
  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) {
    throw new Error("daily_case_audit_selection_date_invalid");
  }
  return normalized;
}

function validRunKey(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 96 || !/^[A-Za-z0-9._:-]+$/.test(normalized)) {
    throw new Error("daily_case_audit_run_key_invalid");
  }
  return normalized;
}

function validAsOf(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("daily_case_audit_as_of_invalid");
  return date.toISOString();
}

function validateSource(source: AnalysisSource): AnalysisSource {
  const id = source.id.trim();
  const publisher = source.publisher.trim();
  const url = source.url.trim();
  if (!id || !publisher || !url) throw new Error("daily_case_audit_source_invalid");
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new Error("https required");
  } catch {
    throw new Error(`daily_case_audit_source_url_invalid:${id}`);
  }
  const publishedAt = validAsOf(source.publishedAt);
  const verifiedAt = validAsOf(source.verifiedAt);
  return {
    ...source,
    id,
    publisher,
    url,
    publishedAt,
    verifiedAt,
  };
}

function sameSource(a: AnalysisSource, b: AnalysisSource): boolean {
  return (
    a.id === b.id &&
    a.kind === b.kind &&
    a.publisher === b.publisher &&
    a.url === b.url &&
    a.publishedAt === b.publishedAt &&
    a.verifiedAt === b.verifiedAt &&
    a.primary === b.primary
  );
}

function referencedSourceIds(funnel: DailyCaseFunnelResult): Set<string> {
  const ids = new Set<string>();
  for (const candidate of funnel.marketCandidateAudit) {
    for (const sourceId of candidate.knownSourceIds) ids.add(sourceId);
  }
  for (const candidate of funnel.desk.selectionCandidateAudit) {
    for (const sourceId of candidate.knownSourceIds) ids.add(sourceId);
  }
  for (const audit of funnel.desk.preflightAudit) {
    if (audit.preflight) ids.add(audit.preflight.source.id);
  }
  return ids;
}

function assertFunnelBounds(funnel: DailyCaseFunnelResult): void {
  if (funnel.stats.universe < 0 || funnel.stats.universe > 300) {
    throw new Error("daily_case_audit_universe_bound_invalid");
  }
  if (
    funnel.stats.selectedForMethodologyPreflight < 0 ||
    funnel.stats.selectedForMethodologyPreflight > 20
  ) {
    throw new Error("daily_case_audit_preflight_bound_invalid");
  }
  if (
    funnel.stats.methodologyPreflightReady < 0 ||
    funnel.stats.methodologyPreflightReady > funnel.stats.selectedForMethodologyPreflight
  ) {
    throw new Error("daily_case_audit_preflight_ready_invalid");
  }
  if (
    funnel.stats.selectedForDeepResearch < 0 ||
    funnel.stats.selectedForDeepResearch > 4 ||
    funnel.stats.selectedForDeepResearch > funnel.stats.methodologyPreflightReady
  ) {
    throw new Error("daily_case_audit_deep_research_bound_invalid");
  }
}

/**
 * Freezes a Daily Case selection run into a source-complete immutable audit packet.
 * Preflight-generated Yahoo profile sources are merged automatically; all other
 * source metadata must be supplied explicitly by the caller.
 */
export function buildDailyCaseRunAudit(input: {
  funnel: DailyCaseFunnelResult;
  externalSources: readonly AnalysisSource[];
  selectionDate: string;
  runKey: string;
  asOf: string | Date;
}): DailyCaseRunAudit {
  assertFunnelBounds(input.funnel);
  const sourceMap = new Map<string, AnalysisSource>();

  const addSource = (raw: AnalysisSource) => {
    const source = validateSource(raw);
    const existing = sourceMap.get(source.id);
    if (existing && !sameSource(existing, source)) {
      throw new Error(`daily_case_audit_source_collision:${source.id}`);
    }
    sourceMap.set(source.id, source);
  };

  for (const source of input.externalSources) addSource(source);
  for (const audit of input.funnel.desk.preflightAudit) {
    if (audit.preflight) addSource(audit.preflight.source);
  }

  const requiredIds = referencedSourceIds(input.funnel);
  for (const sourceId of requiredIds) {
    if (!sourceMap.has(sourceId)) {
      throw new Error(`daily_case_audit_source_missing:${sourceId}`);
    }
  }

  return {
    version: DIVLAB_DAILY_CASE_RUN_AUDIT_VERSION,
    selectionDate: validSelectionDate(input.selectionDate),
    runKey: validRunKey(input.runKey),
    asOf: validAsOf(input.asOf),
    funnel: input.funnel,
    sources: [...sourceMap.values()]
      .filter((source) => requiredIds.has(source.id))
      .sort((a, b) => a.id.localeCompare(b.id)),
    stats: { ...input.funnel.stats },
  };
}
