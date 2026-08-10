import { NextResponse } from "next/server";
import { createModelPortfolioAdminClient } from "@/lib/model-portfolios/admin";
import { resolveModelPortfolioExecutionConfig } from "@/lib/model-portfolios/engine/config";
import { runAllModelPortfoliosDryRun } from "@/lib/model-portfolios/engine/dry-run-orchestrator";
import type { ModelPortfolioResearchPass } from "@/lib/model-portfolios/engine/eodhd-budget";
import { resolveModelPortfolioEvaluationSlot } from "@/lib/model-portfolios/engine/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCHEDULER_HEADER = "supabase-cron-v1";
const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";
const PASSES = new Set<ModelPortfolioResearchPass>([
  "nordic_morning",
  "us_1550",
  "us_1830",
  "us_2130",
]);

function stockholmDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function manualResearchPass(value: unknown): ModelPortfolioResearchPass {
  return typeof value === "string" && PASSES.has(value as ModelPortfolioResearchPass)
    ? (value as ModelPortfolioResearchPass)
    : "us_1550";
}

export async function POST(request: Request) {
  if (request.headers.get("x-divlab-scheduler") !== SCHEDULER_HEADER) {
    return new NextResponse(null, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    manualTest?: unknown;
    researchPass?: unknown;
  };
  const manualTest = body.manualTest === true;
  const now = new Date();
  const slot = resolveModelPortfolioEvaluationSlot(now);
  if (!manualTest && !slot) {
    return NextResponse.json({ status: "outside_window" }, { status: 202 });
  }

  const researchPass: ModelPortfolioResearchPass = manualTest
    ? manualResearchPass(body.researchPass)
    : slot!.slotId;
  const slotId = manualTest ? `manual-${researchPass}` : slot!.slotId;
  const localDate = manualTest ? stockholmDate(now) : slot!.stockholmDate;
  const triggerKey = manualTest ? `manual:${researchPass}:${now.toISOString()}` : slot!.triggerKey;

  const supabase = createModelPortfolioAdminClient();
  if (!supabase) {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }

  const executionConfig = resolveModelPortfolioExecutionConfig();
  const runMode = executionConfig.executionEnabled ? "live_simulation" : "dry_run";

  const { data: run, error: insertError } = await supabase
    .from("model_portfolio_runs")
    .insert({
      run_type: manualTest ? "manual" : "scheduled",
      status: "started",
      trigger_key: triggerKey,
      source_snapshot: {
        scheduler: "supabase-cron-v2",
        slot: slotId,
        research_pass: researchPass,
        stockholm_date: localDate,
        mode: runMode,
      },
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ status: "duplicate_slot" }, { status: 202 });
    }
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }

  if (!executionConfig.dryRunEnabled && !executionConfig.executionEnabled) {
    await supabase
      .from("model_portfolio_runs")
      .update({
        status: "skipped",
        error_code: "portfolio_run_not_enabled",
        completed_at: now.toISOString(),
      })
      .eq("id", run.id);
    return NextResponse.json(
      { status: "skipped", reason: "portfolio_run_not_enabled" },
      { status: 202 },
    );
  }

  try {
    const evaluation = await runAllModelPortfoliosDryRun(now, {
      runId: run.id,
      executionAllowed: executionConfig.executionEnabled,
      researchPass,
    });
    await supabase
      .from("model_portfolio_runs")
      .update({
        status: "completed",
        market_data_as_of: now.toISOString(),
        source_snapshot: {
          scheduler: "supabase-cron-v2",
          slot: slotId,
          research_pass: researchPass,
          stockholm_date: localDate,
          ...evaluation,
        },
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return NextResponse.json({
      status: "completed",
      mode: evaluation.mode,
      researchPass: evaluation.researchPass,
      researchSummary: evaluation.researchSummary,
      executionAllowed: evaluation.executionAllowed,
      auditPersisted: evaluation.auditPersisted,
      eodhdBudget: evaluation.eodhdBudget,
      totalEstimatedAiCostUsdMicros: evaluation.totalEstimatedAiCostUsdMicros,
      aiUsage: evaluation.aiUsage,
      portfolioResults: evaluation.portfolios.map((portfolio) => ({
        slug: portfolio.slug,
        ok: portfolio.ok,
        action: portfolio.action,
        symbol: portfolio.symbol,
        convictionScore: portfolio.convictionScore,
        decisionId: portfolio.decisionId,
        settlementStatus: portfolio.settlementStatus,
        settlementReason: portfolio.settlementReason,
        transactionId: portfolio.transactionId,
        model: portfolio.model,
        usage: portfolio.usage
          ? {
              provider: portfolio.usage.provider,
              model: portfolio.usage.model,
              inputTokens: portfolio.usage.inputTokens,
              cachedInputTokens: portfolio.usage.cachedInputTokens,
              outputTokens: portfolio.usage.outputTokens,
              totalTokens: portfolio.usage.totalTokens,
              estimatedCostUsdMicros: portfolio.usage.estimatedCostUsdMicros,
              estimatedCostUsd: portfolio.usage.estimatedCostUsdMicros / 1_000_000,
              costSource: portfolio.usage.costSource,
              timestamp: portfolio.usage.timestamp,
              runId: portfolio.usage.runId,
            }
          : null,
        reason: portfolio.reason,
      })),
    });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 120) : "portfolio_run_failed";
    await supabase
      .from("model_portfolio_runs")
      .update({
        status: "failed",
        error_code: errorCode,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);
    return NextResponse.json(
      { status: "failed", reason: errorCode },
      { status: 503 },
    );
  }
}
