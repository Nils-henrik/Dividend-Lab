import { NextResponse } from "next/server";
import { createModelPortfolioAdminClient } from "@/lib/model-portfolios/admin";
import {
  resolveModelPortfolioExecutionConfig,
  resolveModelPortfolioMarketDataConfig,
} from "@/lib/model-portfolios/engine/config";
import { runAllModelPortfoliosDryRun } from "@/lib/model-portfolios/engine/dry-run-orchestrator";
import { resolveModelPortfolioEvaluationSlot } from "@/lib/model-portfolios/engine/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCHEDULER_HEADER = "supabase-cron-v1";
const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";

function stockholmDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export async function POST(request: Request) {
  if (request.headers.get("x-divlab-scheduler") !== SCHEDULER_HEADER) {
    return new NextResponse(null, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { manualTest?: unknown };
  const manualTest = body.manualTest === true;
  const now = new Date();
  const slot = resolveModelPortfolioEvaluationSlot(now);
  if (!manualTest && !slot) {
    return NextResponse.json({ status: "outside_window" }, { status: 202 });
  }

  const slotId = manualTest ? "manual-test" : slot!.slotId;
  const localDate = manualTest ? stockholmDate(now) : slot!.stockholmDate;
  const triggerKey = manualTest ? `manual:${now.toISOString()}` : slot!.triggerKey;

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
        scheduler: "supabase-cron-v1",
        slot: slotId,
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

  const marketDataConfig = resolveModelPortfolioMarketDataConfig();
  if (!marketDataConfig.configured) {
    await supabase
      .from("model_portfolio_runs")
      .update({
        status: "skipped",
        error_code: "market_data_unconfigured",
        completed_at: now.toISOString(),
      })
      .eq("id", run.id);

    return NextResponse.json(
      { status: "skipped", reason: "market_data_unconfigured" },
      { status: 202 },
    );
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
    });
    await supabase
      .from("model_portfolio_runs")
      .update({
        status: "completed",
        market_data_as_of: now.toISOString(),
        source_snapshot: {
          scheduler: "supabase-cron-v1",
          slot: slotId,
          stockholm_date: localDate,
          ...evaluation,
        },
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return NextResponse.json({
      status: "completed",
      mode: evaluation.mode,
      executionAllowed: evaluation.executionAllowed,
      auditPersisted: evaluation.auditPersisted,
      eodhdBudget: evaluation.eodhdBudget,
      totalEstimatedAiCostUsdMicros: evaluation.totalEstimatedAiCostUsdMicros,
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
