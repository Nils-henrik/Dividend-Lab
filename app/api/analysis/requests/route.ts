import { NextResponse } from "next/server";
import {
  createFailClosedAnalysisEntitlementProvider,
  type DivLabAnalysisDepth,
} from "@/lib/analysis/analysis-entitlement";
import { createOrQueueDivLabAnalysisRequest } from "@/lib/analysis/analysis-request-service";
import { createDivLabAnalysisDevAdminClient } from "@/lib/analysis/dev-admin";
import { resolveGlobalEquityAnalysisTarget } from "@/lib/analysis/instrument-search";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_API_FLAG = "DIVLAB_ANALYSIS_REQUEST_API_ENABLED" as const;

type Body = {
  yahooSymbol?: unknown;
  analysisDepth?: unknown;
  idempotencyKey?: unknown;
};

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function analysisDepth(value: unknown): DivLabAnalysisDepth | null {
  return value === "light" || value === "deep" ? value : null;
}

export async function POST(request: Request) {
  // The route shape exists for future on-demand Analysis, but this slice remains
  // Preview-only and requires an explicit server-side feature flag. Production is
  // intentionally closed until migrations, entitlement and worker are accepted.
  if (
    process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview" ||
    process.env[REQUEST_API_FLAG]?.trim().toLowerCase() !== "true"
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return noStore(NextResponse.json({ status: "auth_required" }, { status: 401 }));
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const yahooSymbol = typeof body.yahooSymbol === "string"
    ? body.yahooSymbol.trim().toUpperCase()
    : "";
  const depth = analysisDepth(body.analysisDepth);
  const idempotencyKey = typeof body.idempotencyKey === "string"
    ? body.idempotencyKey.trim().toLowerCase()
    : "";

  if (!yahooSymbol || yahooSymbol.length > 64 || !depth || !UUID_PATTERN.test(idempotencyKey)) {
    return noStore(NextResponse.json({ status: "invalid_request" }, { status: 400 }));
  }

  // Canonical target verification happens before entitlement reservation. The
  // paid request path may only accept equities that the current Analysis engine
  // already marks safe for full analysis; global discovery alone is insufficient.
  const resolved = await resolveGlobalEquityAnalysisTarget({ yahooSymbol });
  if (!resolved || !resolved.canRunAnalysis) {
    return noStore(NextResponse.json({
      status: "analysis_target_not_ready",
      message: "Instrumentet är inte verifierat för full DivLab-analys ännu.",
    }, { status: 422 }));
  }

  // Entitlement is deliberately unconfigured in v1. This check is before the
  // service-role client and request-table write, so the route stays inert even if
  // the feature flag is accidentally enabled while repository migrations are not
  // yet applied to the Preview database.
  const entitlementProvider = createFailClosedAnalysisEntitlementProvider();
  if (entitlementProvider.id === "unconfigured") {
    return noStore(NextResponse.json({
      status: "entitlement_provider_not_configured",
    }, { status: 503 }));
  }

  const admin = createDivLabAnalysisDevAdminClient();
  if (!admin) {
    return noStore(NextResponse.json({ status: "analysis_request_store_unavailable" }, { status: 503 }));
  }

  const result = await createOrQueueDivLabAnalysisRequest({
    supabase: admin,
    entitlementProvider,
    userId: user.id,
    idempotencyKey,
    target: {
      symbol: resolved.symbol,
      exchange: resolved.exchange,
      name: resolved.name,
      yahooSymbol: resolved.yahooSymbol,
    },
    analysisDepth: depth,
  });

  if (!result.ok) {
    if (result.status === "idempotency_conflict") {
      return noStore(NextResponse.json(result, { status: 409 }));
    }
    if (result.status === "entitlement_denied") {
      return noStore(NextResponse.json(result, { status: 403 }));
    }
    if (result.status === "entitlement_reservation_invalid") {
      return noStore(NextResponse.json(result, { status: 502 }));
    }
    return noStore(NextResponse.json(result, { status: 503 }));
  }

  return noStore(NextResponse.json({
    status: result.status,
    requestId: result.requestId,
    existing: result.existing,
    executionStarted: false,
  }, { status: result.status === "queued" ? 202 : 200 }));
}
