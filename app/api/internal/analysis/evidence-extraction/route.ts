import { NextResponse } from "next/server";
import { extractGlobalSecEvidence } from "@/lib/analysis/global-evidence-extraction";
import { discoverGlobalPrimarySources } from "@/lib/analysis/global-primary-sources";
import { resolveGlobalEquityAnalysisTarget } from "@/lib/analysis/instrument-search";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

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
      evidenceQualityReady: false,
      researchCoverageReady: false,
      message: "Välj en giltig noterad aktie innan SEC-evidens extraheras.",
    }, { status: 400 }));
  }

  const resolved = await resolveGlobalEquityAnalysisTarget({ yahooSymbol });
  if (!resolved) {
    return noStore(NextResponse.json({
      status: "target_not_supported",
      evidenceQualityReady: false,
      researchCoverageReady: false,
      message: "Instrumentet kunde inte verifieras som en noterad aktie.",
    }, { status: 404 }));
  }

  if (resolved.canRunAnalysis) {
    return noStore(NextResponse.json({
      status: "existing_nordic_coverage",
      target: resolved,
      extraction: null,
      evidenceQualityReady: true,
      researchCoverageReady: true,
      message: "Instrumentet använder redan DivLabs verifierade nordiska dokument- och Research-kedja.",
    }));
  }

  const discovery = await discoverGlobalPrimarySources({
    yahooSymbol: resolved.yahooSymbol,
    symbol: resolved.symbol,
    exchange: resolved.exchange,
    companyName: resolved.name,
  });
  if (!discovery.readyForEvidenceExtraction) {
    return noStore(NextResponse.json({
      status: "source_discovery_not_ready",
      target: resolved,
      discovery,
      extraction: null,
      evidenceQualityReady: false,
      researchCoverageReady: false,
      message: discovery.reason,
    }, { status: 422 }));
  }

  const extraction = await extractGlobalSecEvidence({
    companyName: discovery.companyName,
    sources: discovery.sources,
  });

  return noStore(NextResponse.json({
    status: extraction.bundle.qualityGate.ready ? "evidence_ready" : "evidence_quality_failed",
    target: resolved,
    discovery,
    extraction,
    evidenceQualityReady: extraction.bundle.qualityGate.ready,
    // Even a 100/100 evidence-extraction gate is not sufficient to turn on
    // global Deep Research. Fundamental/provider coverage must be validated in
    // a separate research-coverage phase first.
    researchCoverageReady: false,
    message: extraction.bundle.qualityGate.ready
      ? "SEC-dokumenten är säkert hämtade och sourceId-spårbar evidens är redo för nästa Research-coverage-gate. Full Deep Research är fortfarande låst."
      : "SEC-dokumenten nådde inte DivLabs evidence-extraction quality gate. Full Deep Research förblir låst.",
  }, { status: extraction.bundle.qualityGate.ready ? 200 : 422 }));
}
