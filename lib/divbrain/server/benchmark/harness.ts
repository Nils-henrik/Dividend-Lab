/**
 * Phase 1B DivBrain provider benchmark harness (Ticket 1B-1).
 *
 * Runs the same curated cases against multiple gateway candidates.
 * Unit/CI usage must inject mocked providers — never call paid models.
 *
 * This module must never be imported by client components.
 */

import { createDivBrainError } from "../../errors";
import {
  DIVBRAIN_BENCHMARK_CANDIDATES,
  DIVBRAIN_BENCHMARK_LIVE_MAX_CASES,
  DIVBRAIN_BENCHMARK_LIVE_MAX_OUTPUT_TOKENS,
  DIVBRAIN_BENCHMARK_LIVE_TIMEOUT_MS,
  type DivBrainBenchmarkCandidate,
} from "../providers/candidates";
import { estimateDivBrainCandidateCostUsd } from "../providers/cost";
import type { DivBrainProvider } from "../providers/provider";
import type {
  DivBrainProviderRequest,
  DivBrainProviderResult,
  DivBrainProviderUsage,
} from "../providers/types";
import {
  DIVBRAIN_BENCHMARK_CASES,
  type DivBrainBenchmarkCase,
} from "./cases";
import {
  evaluateDivBrainBenchmarkRubric,
  type DivBrainBenchmarkFailureCategory,
  type DivBrainBenchmarkRubricCheck,
} from "./rubric";

export const DIVBRAIN_BENCHMARK_SCHEMA_VERSION = 1 as const;

export type DivBrainBenchmarkCaseResult = {
  readonly caseId: string;
  readonly caseKind: DivBrainBenchmarkCase["kind"];
  readonly candidateModelId: string;
  readonly providerResultStatus: DivBrainProviderResult["status"];
  readonly passed: boolean;
  readonly latencyMs: number;
  readonly usage: DivBrainProviderUsage;
  readonly estimatedCostUsd: {
    currency: "USD";
    totalUsd: number;
  } | null;
  readonly responseCharCount: number | null;
  readonly checks: readonly DivBrainBenchmarkRubricCheck[];
  readonly failureCategories: readonly DivBrainBenchmarkFailureCategory[];
};

export type DivBrainBenchmarkCandidateSummary = {
  readonly modelId: string;
  readonly family: DivBrainBenchmarkCandidate["family"];
  readonly label: string;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly allPassed: boolean;
  readonly totalLatencyMs: number;
  readonly totalEstimatedCostUsd: number | null;
};

export type DivBrainBenchmarkReport = {
  readonly schemaVersion: typeof DIVBRAIN_BENCHMARK_SCHEMA_VERSION;
  readonly mode: "mock" | "live";
  readonly generatedAt: string;
  readonly caseCount: number;
  readonly candidateCount: number;
  readonly allPassed: boolean;
  readonly candidates: readonly DivBrainBenchmarkCandidateSummary[];
  readonly results: readonly DivBrainBenchmarkCaseResult[];
};

export type DivBrainBenchmarkProviderFactory = (params: {
  modelId: string;
  maxOutputTokens: number;
}) => DivBrainProvider;

export type RunDivBrainProviderBenchmarkOptions = {
  providerFactory: DivBrainBenchmarkProviderFactory;
  candidates?: readonly DivBrainBenchmarkCandidate[];
  cases?: readonly DivBrainBenchmarkCase[];
  mode?: "mock" | "live";
  maxCases?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  /** Injected clock for tests. */
  now?: () => number;
  /** ISO timestamp for the report; defaults to now. */
  generatedAt?: string;
};

function buildProviderRequest(params: {
  prompt: string;
  timeoutMs: number;
}): DivBrainProviderRequest {
  return {
    contextBlocks: [
      {
        kind: "identity",
        content:
          "Du är DivBrain — en svensk utbildande assistent. Svara kort och tydligt.",
      },
      {
        kind: "policy",
        content:
          "Ge inte personliga köp- eller säljråd. Hitta inte på siffror.",
      },
    ],
    messages: [{ role: "user", content: params.prompt }],
    sources: [],
    timeoutMs: params.timeoutMs,
  };
}

function summarizeCandidate(params: {
  candidate: DivBrainBenchmarkCandidate;
  results: readonly DivBrainBenchmarkCaseResult[];
}): DivBrainBenchmarkCandidateSummary {
  const related = params.results.filter(
    (result) => result.candidateModelId === params.candidate.id,
  );
  const passed = related.filter((result) => result.passed).length;
  const failed = related.length - passed;
  const totalLatencyMs = related.reduce(
    (sum, result) => sum + result.latencyMs,
    0,
  );

  let totalEstimatedCostUsd: number | null = 0;
  for (const result of related) {
    if (!result.estimatedCostUsd) {
      totalEstimatedCostUsd = null;
      break;
    }
    totalEstimatedCostUsd += result.estimatedCostUsd.totalUsd;
  }

  if (totalEstimatedCostUsd !== null) {
    totalEstimatedCostUsd =
      Math.round(totalEstimatedCostUsd * 1_000_000) / 1_000_000;
  }

  return {
    modelId: params.candidate.id,
    family: params.candidate.family,
    label: params.candidate.label,
    total: related.length,
    passed,
    failed,
    allPassed: failed === 0 && related.length > 0,
    totalLatencyMs,
    totalEstimatedCostUsd,
  };
}

/**
 * Run the Phase 1B benchmark harness.
 *
 * Live mode enforces hard caps. Callers must still gate network access
 * separately (see live script opt-in flag).
 */
export async function runDivBrainProviderBenchmark(
  options: RunDivBrainProviderBenchmarkOptions,
): Promise<DivBrainBenchmarkReport> {
  const mode = options.mode ?? "mock";
  const maxCases =
    mode === "live"
      ? Math.min(
          options.maxCases ?? DIVBRAIN_BENCHMARK_LIVE_MAX_CASES,
          DIVBRAIN_BENCHMARK_LIVE_MAX_CASES,
        )
      : (options.maxCases ?? DIVBRAIN_BENCHMARK_CASES.length);

  const maxOutputTokens =
    mode === "live"
      ? Math.min(
          options.maxOutputTokens ?? DIVBRAIN_BENCHMARK_LIVE_MAX_OUTPUT_TOKENS,
          DIVBRAIN_BENCHMARK_LIVE_MAX_OUTPUT_TOKENS,
        )
      : (options.maxOutputTokens ?? 512);

  const timeoutMs =
    mode === "live"
      ? Math.min(
          options.timeoutMs ?? DIVBRAIN_BENCHMARK_LIVE_TIMEOUT_MS,
          DIVBRAIN_BENCHMARK_LIVE_TIMEOUT_MS,
        )
      : (options.timeoutMs ?? 30_000);

  const candidates = options.candidates ?? DIVBRAIN_BENCHMARK_CANDIDATES;
  const cases = (options.cases ?? DIVBRAIN_BENCHMARK_CASES).slice(0, maxCases);
  const now = options.now ?? (() => Date.now());
  const generatedAt = options.generatedAt ?? new Date(now()).toISOString();

  const results: DivBrainBenchmarkCaseResult[] = [];

  for (const candidate of candidates) {
    const provider = options.providerFactory({
      modelId: candidate.id,
      maxOutputTokens,
    });

    for (const benchmarkCase of cases) {
      const request = buildProviderRequest({
        prompt: benchmarkCase.prompt,
        timeoutMs,
      });

      const started = now();
      let providerResult: DivBrainProviderResult;
      try {
        providerResult = await provider.generate(request);
      } catch {
        providerResult = {
          status: "failed",
          error: createDivBrainError("internal_error"),
        };
      }
      const latencyMs = Math.max(0, now() - started);

      const rubric = evaluateDivBrainBenchmarkRubric({
        benchmarkCase,
        providerResult,
      });

      const usage =
        providerResult.status === "completed" ? providerResult.usage : {};
      const estimated = estimateDivBrainCandidateCostUsd({
        modelId: candidate.id,
        usage,
      });

      results.push({
        caseId: benchmarkCase.id,
        caseKind: benchmarkCase.kind,
        candidateModelId: candidate.id,
        providerResultStatus: providerResult.status,
        passed: rubric.passed,
        latencyMs,
        usage,
        estimatedCostUsd: estimated
          ? { currency: "USD", totalUsd: estimated.totalUsd }
          : null,
        responseCharCount:
          providerResult.status === "completed"
            ? providerResult.text.length
            : null,
        checks: rubric.checks,
        failureCategories: rubric.failureCategories,
      });
    }
  }

  const candidateSummaries = candidates.map((candidate) =>
    summarizeCandidate({ candidate, results }),
  );

  return {
    schemaVersion: DIVBRAIN_BENCHMARK_SCHEMA_VERSION,
    mode,
    generatedAt,
    caseCount: cases.length,
    candidateCount: candidates.length,
    allPassed: results.every((result) => result.passed),
    candidates: candidateSummaries,
    results,
  };
}

/**
 * Safe JSON serialization for Founder review artifacts.
 * Strips any accidental prompt-like fields if present on extensions.
 */
export function serializeDivBrainBenchmarkReport(
  report: DivBrainBenchmarkReport,
): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
