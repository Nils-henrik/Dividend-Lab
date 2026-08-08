/**
 * Phase 1B benchmark candidate catalog (Ticket 1B-1).
 *
 * Model IDs verified against the public AI Gateway catalog at implementation
 * time. Do not silently substitute unrelated models if an ID disappears —
 * report the resolved set in the PR / Founder runbook.
 *
 * This module must never be imported by client components.
 */

export const DIVBRAIN_AI_GATEWAY_PROVIDER_ID = "ai-gateway" as const;

/**
 * Inclusive hard caps for gateway generation (server-controlled only).
 * Live benchmarks use a stricter cap via the harness.
 */
export const DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_DEFAULT = 1_024 as const;
export const DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_MIN = 16 as const;
export const DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_HARD_CAP = 2_048 as const;

/** Conservative live-benchmark caps — never used by normal CI. */
export const DIVBRAIN_BENCHMARK_LIVE_MAX_CASES = 3 as const;
export const DIVBRAIN_BENCHMARK_LIVE_MAX_OUTPUT_TOKENS = 256 as const;
export const DIVBRAIN_BENCHMARK_LIVE_TIMEOUT_MS = 30_000 as const;

/**
 * USD per token pricing snapshot used for Cost Guard projection and
 * conservative post-call estimates when validated Gateway actual-cost
 * metadata is unavailable.
 *
 * Verified against https://ai-gateway.vercel.sh/v1/models on 2026-08-08.
 * Values intentionally use the **higher** listed default-routing rates
 * (base vs regional) so safety ceilings do not under-estimate Gateway
 * routing. Opt-in priority/flex tiers are out of Alpha default path and
 * are not used as cheaper substitutes.
 *
 * Do not hard-code SEK↔USD FX into business logic.
 */
export type DivBrainCandidatePricingUsdPerToken = {
  readonly input: number;
  readonly output: number;
};

/** ISO date (UTC) of the last catalog re-verification for this snapshot. */
export const DIVBRAIN_CANDIDATE_PRICING_VERIFIED_AT = "2026-08-08" as const;

export type DivBrainBenchmarkCandidateFamily =
  | "openai"
  | "anthropic"
  | "google";

export type DivBrainBenchmarkCandidate = {
  readonly id: string;
  readonly family: DivBrainBenchmarkCandidateFamily;
  readonly label: string;
  /** First intended production candidate when quality bars are met. */
  readonly preferredPrimary: boolean;
  readonly pricingUsdPerToken: DivBrainCandidatePricingUsdPerToken;
};

/**
 * Initial Phase 1B candidate set (OpenAI-first, not vendor-locked).
 * Verified present in https://ai-gateway.vercel.sh/v1/models catalog.
 */
export const DIVBRAIN_BENCHMARK_CANDIDATES = [
  {
    id: "openai/gpt-5.6-luna",
    family: "openai",
    label: "OpenAI GPT-5.6 Luna (cost-efficient)",
    preferredPrimary: true,
    // Catalog base $0.20/$1.20 per 1M; regional US list $0.22/$1.32 per 1M.
    // Safety snapshot uses regional US (higher default-routing list price).
    pricingUsdPerToken: {
      input: 0.00000022,
      output: 0.00000132,
    },
  },
  {
    id: "anthropic/claude-sonnet-5",
    family: "anthropic",
    label: "Anthropic Claude Sonnet 5",
    preferredPrimary: false,
    // Catalog base $2/$10 per 1M; regional US/EU list $2.20/$11 per 1M.
    // Do not assume the cheapest provider route for safety ceilings.
    pricingUsdPerToken: {
      input: 0.0000022,
      output: 0.000011,
    },
  },
  {
    id: "google/gemini-3.6-flash",
    family: "google",
    label: "Google Gemini 3.6 Flash",
    preferredPrimary: false,
    // Catalog base/list $1.50/$7.50 per 1M (priority tier is opt-in).
    pricingUsdPerToken: {
      input: 0.0000015,
      output: 0.0000075,
    },
  },
] as const satisfies readonly DivBrainBenchmarkCandidate[];

export type DivBrainBenchmarkCandidateId =
  (typeof DIVBRAIN_BENCHMARK_CANDIDATES)[number]["id"];

const CANDIDATE_BY_ID = new Map<string, DivBrainBenchmarkCandidate>(
  DIVBRAIN_BENCHMARK_CANDIDATES.map((candidate) => [candidate.id, candidate]),
);

/** Gateway model id pattern: `creator/model-name` (no whitespace). */
const GATEWAY_MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}\/[a-z0-9][a-z0-9._-]{0,127}$/i;

export function isDivBrainGatewayModelId(value: unknown): value is string {
  return typeof value === "string" && GATEWAY_MODEL_ID_PATTERN.test(value);
}

export function getDivBrainBenchmarkCandidate(
  modelId: string,
): DivBrainBenchmarkCandidate | null {
  return CANDIDATE_BY_ID.get(modelId) ?? null;
}

export function listDivBrainBenchmarkCandidateIds(): readonly string[] {
  return DIVBRAIN_BENCHMARK_CANDIDATES.map((candidate) => candidate.id);
}
