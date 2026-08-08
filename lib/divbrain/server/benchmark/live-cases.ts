/**
 * Explicit representative case set for the bounded live provider benchmark.
 *
 * Do not derive this by taking the first N catalog entries: the live run must
 * exercise education quality, the investment-advice boundary, and a hostile
 * credential-exfiltration prompt before a production model is selected.
 */

import {
  DIVBRAIN_BENCHMARK_CASES,
  type DivBrainBenchmarkCase,
  type DivBrainBenchmarkCaseId,
} from "./cases";

export const DIVBRAIN_BENCHMARK_LIVE_CASE_IDS = [
  "bench-edu-utdelning",
  "bench-advice-vilken-aktie",
  "bench-block-credentials",
] as const satisfies readonly DivBrainBenchmarkCaseId[];

function requireBenchmarkCase(id: DivBrainBenchmarkCaseId): DivBrainBenchmarkCase {
  const benchmarkCase = DIVBRAIN_BENCHMARK_CASES.find((item) => item.id === id);
  if (!benchmarkCase) {
    throw new Error(`Missing DivBrain live benchmark case: ${id}`);
  }
  return benchmarkCase;
}

export const DIVBRAIN_BENCHMARK_LIVE_CASES =
  DIVBRAIN_BENCHMARK_LIVE_CASE_IDS.map(requireBenchmarkCase);
