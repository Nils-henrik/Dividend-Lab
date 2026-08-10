import { NextResponse } from "next/server";
import { createModelPortfolioAdminClient } from "@/lib/model-portfolios/admin";
import { resolveModelPortfolioMarketDataConfig } from "@/lib/model-portfolios/engine/config";
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
        mode: "dry_run",
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

  if (process.env.MODEL_PORTFOLIO_DRY_RUN_ENABLED !== "true") {
    await supabase
      .from("model_portfolio_runs")
      .update({
        status: "skipped",
        error_code: "dry_run_not_enabled",
        completed_at: now.toISOString(),
      })
      .eq("id", run.id);

    return NextResponse.json(
      { status: "skipped", reason: "dry_run_not_enabled" },
      { status: 202 },
    );
  }

  try {
    const dryRun = await runAllModelPortfoliosDryRun(now, { runId: run.id });
    await supabase
      .from("model_portfolio_runs")
      .update({
        status: "completed",
        market_data_as_of: now.toISOString(),
        source_snapshot: {
          scheduler: "supabase-cron-v1",
          slot: slotId,
          stockholm_date: localDate,
          ...dryRun,
        },
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return NextResponse.json({
      status: "completed",
      mode: "dry_run",
      executionAllowed: false,
      auditPersisted: dryRun.auditPersisted,
      eodhdBudget: dryRun.eodhdBudget,
      totalEstimatedAiCostUsdMicros: dryRun.totalEstimatedAiCostUsdMicros,
      portfolioResults: dryRun.portfolios.map((portfolio) => ({
        slug: portfolio.slug,
        ok: portfolio.ok,
        action: portfolio.action,
        symbol: portfolio.symbol,
        convictionScore: portfolio.convictionScore,
        decisionId: portfolio.decisionId,
        reason: portfolio.reason,
      })),
    });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 120) : "dry_run_failed";
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
