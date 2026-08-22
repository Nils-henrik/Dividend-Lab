import { NextResponse } from "next/server";
import { extractGlobalSecEvidence } from "@/lib/analysis/global-evidence-extraction";
import { discoverGlobalPrimarySources } from "@/lib/analysis/global-primary-sources";
import { resolveGlobalEquityAnalysisTarget } from "@/lib/analysis/instrument-search";
import { loadDivLabResearchInputs } from "@/lib/analysis/research-loader";
import {
  buildUsResearchCoverageFactsPacket,
  evaluateUsResearchCoverage,
} from "@/lib/analysis/us-research-coverage";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CREATOR_ROLES = new Set(["founder", "ceo_divlab", "admin"]);
const US_RESEARCH_V1_TARGETS = new Set(["MSFT"]);

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function failed(status: string, message: string, httpStatus: number, extra: Record<string, unknown> = {}) {
  return noStore(NextResponse.json({
    status,
    researchCoverageReady: false,
    analysisExecutionEnabled: false,
    message,
    ...extra,
  }, { status: httpStatus }));
}

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return failed("founder_auth_required", "Founder-inloggning krävs.", 401);
  }
  const roles = await getStaffRolesForUser(user.id);
  if (!roles.some((role) => CREATOR_ROLES.has(role))) {
    return failed("founder_role_required", "Founder/admin-roll krävs.", 403);
  }

  const url = new URL(request.url);
  const yahooSymbol = url.searchParams.get("yahooSymbol")?.trim().toUpperCase() ?? "";
  if (!yahooSymbol || yahooSymbol.length > 64) {
    return failed("invalid_target", "Välj ett giltigt US-bolag för Research Coverage.", 400);
  }
  if (!US_RESEARCH_V1_TARGETS.has(yahooSymbol)) {
    return failed(
      "preview_target_not_allowlisted",
      "US Research Coverage v1 är medvetet låst till MSFT som första verifieringsbolag.",
      422,
      { allowedTargets: [...US_RESEARCH_V1_TARGETS] },
    );
  }

  const resolved = await resolveGlobalEquityAnalysisTarget({ yahooSymbol });
  if (!resolved || resolved.exchange !== "US") {
    return failed(
      "target_not_supported",
      "Målbolaget kunde inte verifieras som en amerikansk noterad aktie.",
      404,
    );
  }

  const discovery = await discoverGlobalPrimarySources({
    yahooSymbol: resolved.yahooSymbol,
    symbol: resolved.symbol,
    exchange: resolved.exchange,
    companyName: resolved.name,
  });
  if (!discovery.readyForEvidenceExtraction) {
    return failed(
      "source_discovery_not_ready",
      discovery.reason,
      422,
      { target: resolved, discovery },
    );
  }

  const extraction = await extractGlobalSecEvidence({
    companyName: discovery.companyName,
    sources: discovery.sources,
  });
  if (!extraction.bundle.qualityGate.ready) {
    const failureReasons = [...new Set(extraction.failures.map((failure) => failure.reason))];
    const transportSuffix = failureReasons.length
      ? ` Transportfel: ${failureReasons.join(", ")}.`
      : "";
    return failed(
      "evidence_quality_failed",
      `SEC-evidensen nådde inte 100/100. Research Coverage förblir låst.${transportSuffix}`,
      422,
      {
        target: resolved,
        discovery,
        evidenceQualityGate: extraction.bundle.qualityGate,
        evidenceFailures: extraction.failures,
      },
    );
  }

  const loaded = await loadDivLabResearchInputs({
    symbol: resolved.symbol,
    exchange: resolved.exchange,
    name: resolved.name,
  });
  if (!loaded.ok) {
    return failed(
      "research_inputs_unavailable",
      `Befintlig Research-loader saknar verifierat underlag: ${loaded.reason}.`,
      422,
      { target: resolved, researchLoadReason: loaded.reason },
    );
  }

  const packet = buildUsResearchCoverageFactsPacket({
    research: loaded.value,
    evidenceBundle: extraction.bundle,
  });
  const coverage = evaluateUsResearchCoverage({
    packet,
    evidenceQualityGate: extraction.bundle.qualityGate,
  });

  return noStore(NextResponse.json({
    status: coverage.ready ? "us_research_coverage_ready" : "us_research_coverage_failed",
    target: resolved,
    researchCoverageReady: coverage.ready,
    // Deliberately false in v1. This endpoint proves inputs only and never calls
    // the Analyst/Deep Research execution service or any persistence path.
    analysisExecutionEnabled: false,
    coverage,
    evidenceQualityGate: extraction.bundle.qualityGate,
    researchSummary: {
      marketCurrency: packet.currencyContext.marketCurrency,
      reportingCurrency: packet.currencyContext.reportingCurrency,
      epsTtmCurrency: packet.currencyContext.epsTtmCurrency,
      historicalPeriodsAnalyzed: packet.fundamental.trends.periodsAnalyzed,
      yearsCovered: packet.fundamental.trends.yearsCovered,
      technicalSessions: packet.technical.snapshot.sessions,
      sourceCount: packet.sources.length,
      primarySourceCount: packet.sources.filter((source) => source.primary).length,
      evidenceCount: packet.evidence.length,
      companyType: packet.companyClassification.type,
      methodologyStatus: packet.fundamental.methodology.status,
    },
    message: coverage.ready
      ? "MSFT uppfyller US Research Coverage v1. Deterministiska Research-inputs och SEC-evidens är redo; AI/Analyst-körning, persist och publicering är fortfarande avstängda."
      : "US Research Coverage nådde inte 100/100. Exakta blockers visas och ingen analyskörning har öppnats.",
  }, { status: coverage.ready ? 200 : 422 }));
}
