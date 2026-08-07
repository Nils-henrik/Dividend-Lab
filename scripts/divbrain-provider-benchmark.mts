/**
 * Live DivBrain provider benchmark CLI (Ticket 1B-1).
 *
 * SAFETY GATE:
 * - Requires DIVBRAIN_PROVIDER_BENCHMARK_LIVE=1
 * - Requires gateway auth material (AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN)
 * - Hard-caps cases and output tokens
 * - Never runs as part of npm test / Quality Gate / build / Vercel deploy
 *
 * Usage:
 *   DIVBRAIN_PROVIDER_BENCHMARK_LIVE=1 AI_GATEWAY_API_KEY=… \
 *     npx tsx scripts/divbrain-provider-benchmark.mts
 */

import {
  DIVBRAIN_BENCHMARK_CANDIDATES,
  DIVBRAIN_BENCHMARK_LIVE_MAX_CASES,
  DIVBRAIN_BENCHMARK_LIVE_MAX_OUTPUT_TOKENS,
} from "../lib/divbrain/server/providers/candidates";
import { hasDivBrainGatewayAuthMaterial } from "../lib/divbrain/server/providers/config";
import { createAiGatewayProvider } from "../lib/divbrain/server/providers/ai-gateway-provider";
import {
  runDivBrainProviderBenchmark,
  serializeDivBrainBenchmarkReport,
} from "../lib/divbrain/server/benchmark";

function fail(message: string): never {
  console.error(`[divbrain-benchmark] ${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  if (process.env.DIVBRAIN_PROVIDER_BENCHMARK_LIVE !== "1") {
    fail(
      "Refusing to run: set DIVBRAIN_PROVIDER_BENCHMARK_LIVE=1 for explicit opt-in.",
    );
  }

  if (!hasDivBrainGatewayAuthMaterial()) {
    fail(
      "Refusing to run: missing AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN (presence check only).",
    );
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim() || undefined;

  console.error(
    `[divbrain-benchmark] Starting LIVE run (maxCases=${DIVBRAIN_BENCHMARK_LIVE_MAX_CASES}, maxOutputTokens=${DIVBRAIN_BENCHMARK_LIVE_MAX_OUTPUT_TOKENS}, candidates=${DIVBRAIN_BENCHMARK_CANDIDATES.length})`,
  );

  const report = await runDivBrainProviderBenchmark({
    mode: "live",
    maxCases: DIVBRAIN_BENCHMARK_LIVE_MAX_CASES,
    maxOutputTokens: DIVBRAIN_BENCHMARK_LIVE_MAX_OUTPUT_TOKENS,
    candidates: DIVBRAIN_BENCHMARK_CANDIDATES,
    providerFactory: ({ modelId, maxOutputTokens }) =>
      createAiGatewayProvider({
        modelId,
        maxOutputTokens,
        apiKey,
      }),
  });

  process.stdout.write(serializeDivBrainBenchmarkReport(report));
  process.exit(report.allPassed ? 0 : 2);
}

main().catch(() => {
  fail("Unexpected benchmark failure (details omitted).");
});
