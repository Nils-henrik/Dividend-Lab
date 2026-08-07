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
 * USD per token pricing snapshot used only for offline cost estimates when
 * Gateway live pricing metadata is unavailable. Values match the public
 * AI Gateway catalog entries verified for the candidate IDs below
 * (non-regional base rates).
 */
export type DivBrainCandidatePricingUsdPerToken = {
  readonly input: number;
  readonly output: number;
};

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
    pricingUsdPerToken: {
      input: 0.0000002,
      output: 0.0000012,
    },
  },
  {
    id: "anthropic/claude-sonnet-5",
    family: "anthropic",
    label: "Anthropic Claude Sonnet 5",
    preferredPrimary: false,
    pricingUsdPerToken: {
      input: 0.000002,
      output: 0.00001,
    },
  },
  {
    id: "google/gemini-3.6-flash",
    family: "google",
    label: "Google Gemini 3.6 Flash",
    preferredPrimary: false,
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
