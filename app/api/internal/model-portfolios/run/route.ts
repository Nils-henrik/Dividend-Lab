import { NextResponse } from "next/server";
import { createModelPortfolioAdminClient } from "@/lib/model-portfolios/admin";
import { resolveModelPortfolioMarketDataConfig } from "@/lib/model-portfolios/engine/config";
import { resolveModelPortfolioEvaluationSlot } from "@/lib/model-portfolios/engine/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCHEDULER_HEADER = "supabase-cron-v1";

export async function POST(request: Request) {
  if (request.headers.get("x-divlab-scheduler") !== SCHEDULER_HEADER) {
    return new NextResponse(null, { status: 404 });
  }

  const now = new Date();
  const slot = resolveModelPortfolioEvaluationSlot(now);
  if (!slot) {
    return NextResponse.json({ status: "outside_window" }, { status: 202 });
  }

  const supabase = createModelPortfolioAdminClient();
  if (!supabase) {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }

  const { data: run, error: insertError } = await supabase
    .from("model_portfolio_runs")
    .insert({
      run_type: "scheduled",
      status: "started",
      trigger_key: slot.triggerKey,
      source_snapshot: {
        scheduler: "supabase-cron-v1",
        slot: slot.slotId,
        stockholm_date: slot.stockholmDate,
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

  // The execution engine is intentionally still closed. A verified market-data
  // adapter, candidate universe, post-model validator and separate AI budget
  // guard must land before this branch can perform any portfolio AI call.
  await supabase
    .from("model_portfolio_runs")
    .update({
      status: "skipped",
      error_code: "execution_engine_not_enabled",
      completed_at: now.toISOString(),
    })
    .eq("id", run.id);

  return NextResponse.json(
    { status: "skipped", reason: "execution_engine_not_enabled" },
    { status: 202 },
  );
}
