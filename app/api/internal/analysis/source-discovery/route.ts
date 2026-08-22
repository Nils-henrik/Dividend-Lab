import { NextResponse } from "next/server";
import { discoverGlobalPrimarySources } from "@/lib/analysis/global-primary-sources";
import { resolveGlobalEquityAnalysisTarget } from "@/lib/analysis/instrument-search";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CREATOR_ROLES = new Set(["founder", "ceo_divlab", "admin"]);

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return noStore(NextResponse.json({ status: "founder_auth_required" }, { status: 401 }));
  }
  const roles = await getStaffRolesForUser(user.id);
  if (!roles.some((role) => CREATOR_ROLES.has(role))) {
    return noStore(NextResponse.json({ status: "founder_role_required" }, { status: 403 }));
  }

  const url = new URL(request.url);
  const yahooSymbol = url.searchParams.get("yahooSymbol")?.trim().toUpperCase() ?? "";
  if (!yahooSymbol || yahooSymbol.length > 64) {
    return noStore(NextResponse.json({
      status: "invalid_target",
      researchCoverageReady: false,
      evidenceExtractionReady: false,
      message: "Välj en giltig noterad aktie innan källorna verifieras.",
    }, { status: 400 }));
  }

  const resolved = await resolveGlobalEquityAnalysisTarget({ yahooSymbol });
  if (!resolved) {
    return noStore(NextResponse.json({
      status: "target_not_supported",
      researchCoverageReady: false,
      evidenceExtractionReady: false,
      message: "Instrumentet kunde inte verifieras som en noterad aktie.",
    }, { status: 404 }));
  }

  // The existing Nordic source stack is already the only runtime-approved path
  // for full Deep Research. This endpoint must never replace or weaken it.
  if (resolved.canRunAnalysis) {
    return noStore(NextResponse.json({
      status: "existing_nordic_coverage",
      target: resolved,
      researchCoverageReady: true,
      evidenceExtractionReady: true,
      discovery: null,
      message: "Instrumentet använder redan DivLabs verifierade nordiska primärkällekedja.",
    }));
  }

  const discovery = await discoverGlobalPrimarySources({
    yahooSymbol: resolved.yahooSymbol,
    symbol: resolved.symbol,
    exchange: resolved.exchange,
    companyName: resolved.name,
  });

  return noStore(NextResponse.json({
    status: "ok",
    target: resolved,
    discovery,
    // Source discovery is intentionally not equivalent to publication-grade
    // Deep Research coverage. A separate evidence extraction + quality gate is
    // required before this can ever become true for a new global market.
    researchCoverageReady: false,
    evidenceExtractionReady: discovery.readyForEvidenceExtraction,
    message: discovery.reason,
  }));
}
