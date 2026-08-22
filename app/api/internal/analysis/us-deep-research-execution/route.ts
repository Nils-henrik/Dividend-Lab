import { NextResponse } from "next/server";
import { createDivLabAiAnalysisFromResearchInputs } from "@/lib/analysis/ai-analysis-service";
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
export const maxDuration = 300;

const CREATOR_ROLES = new Set(["founder", "ceo_divlab", "admin"]);
const US_DEEP_RESEARCH_V1_TARGETS = new Set(["MSFT"]);

type Body = {
  yahooSymbol?: unknown;
  useEscalationModel?: unknown;
};

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function failed(
  status: string,
  message: string,
  httpStatus: number,
  extra: Record<string, unknown> = {},
) {
  return noStore(NextResponse.json({
    status,
    executionReady: false,
    persistence: null,
    publication: null,
    message,
    ...extra,
  }, { status: httpStatus }));
}

function failedCheckNames(checks: Record<string, boolean>): string[] {
  return Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
}

function idsPreserved(expected: readonly string[], actual: readonly string[]): boolean {
  const actualIds = new Set(actual);
  return expected.every((id) => actualIds.has(id));
}

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as Body;
  const yahooSymbol = typeof body.yahooSymbol === "string"
    ? body.yahooSymbol.trim().toUpperCase()
    : "";
  const useEscalationModel = body.useEscalationModel === true;

  if (!yahooSymbol || yahooSymbol.length > 64) {
    return failed("invalid_target", "Välj ett giltigt US-bolag för Preview Deep Research.", 400);
  }
  if (!US_DEEP_RESEARCH_V1_TARGETS.has(yahooSymbol)) {
    return failed(
      "preview_target_not_allowlisted",
      "US Preview Deep Research Execution v1 är medvetet låst till MSFT.",
      422,
      { allowedTargets: [...US_DEEP_RESEARCH_V1_TARGETS] },
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
  if (
    !extraction.bundle.qualityGate.ready ||
    extraction.bundle.qualityGate.score !== 100
  ) {
    return failed(
      "evidence_quality_failed",
      "SEC-evidensen nådde inte 100/100. Analyst-körningen startades inte.",
      422,
      {
        target: resolved,
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

  const coveragePacket = buildUsResearchCoverageFactsPacket({
    research: loaded.value,
    evidenceBundle: extraction.bundle,
  });
  const coverage = evaluateUsResearchCoverage({
    packet: coveragePacket,
    evidenceQualityGate: extraction.bundle.qualityGate,
  });
  if (!coverage.ready || coverage.score !== 100) {
    return failed(
      "us_research_coverage_failed",
      "US Research Coverage nådde inte 100/100. Analyst-körningen startades inte.",
      422,
      { target: resolved, coverage },
    );
  }

  const result = await createDivLabAiAnalysisFromResearchInputs({
    research: loaded.value,
    additionalSources: extraction.bundle.analysisSources,
    additionalEvidence: extraction.bundle.evidence,
    useEscalationModel,
  });

  if (!result.ok) {
    if (result.stage === "methodology") {
      return failed(
        "methodology_failed",
        "Operating-company-metodiken blev otillgänglig mellan Research och Analyst. Körningen stoppades.",
        422,
      );
    }
    if (result.stage === "analyst") {
      return failed("analyst_failed", result.reason, 503);
    }
    if (result.stage === "analyst_quality") {
      return failed(
        "analyst_quality_failed",
        "Analyst quality gate nådde inte 100/100. Ingen output sparades eller publicerades.",
        422,
        {
          researchQuality: result.finalPacket.qualityGate.score,
          analystQuality: result.analystQualityGate.score,
          analystBlockers: result.analystQualityGate.blockers,
          analystFailedChecks: failedCheckNames(result.analystQualityGate.checks),
          researchBlockers: result.finalPacket.qualityGate.blockers,
          researchFailedChecks: failedCheckNames(result.finalPacket.qualityGate.checks),
        },
      );
    }
    return failed("research_failed", result.reason, 422);
  }

  const expectedSourceIds = extraction.bundle.analysisSources.map((source) => source.id);
  const expectedEvidenceIds = extraction.bundle.evidence.map((item) => item.id);
  const finalSourceIds = result.finalPacket.sources.map((source) => source.id);
  const finalEvidenceIds = result.finalPacket.evidence.map((item) => item.id);
  const secSourceProvenancePreserved = idsPreserved(expectedSourceIds, finalSourceIds);
  const secEvidenceProvenancePreserved = idsPreserved(expectedEvidenceIds, finalEvidenceIds);

  if (!secSourceProvenancePreserved || !secEvidenceProvenancePreserved) {
    return failed(
      "provenance_failed",
      "Verifierad SEC-proveniens överlevde inte hela Analyst-kedjan. Körningen underkänns.",
      422,
      {
        secSourceProvenancePreserved,
        secEvidenceProvenancePreserved,
      },
    );
  }

  if (result.persistence !== null) {
    return failed(
      "unexpected_persistence",
      "Preview-körningen försökte skapa persistence trots att det är förbjudet i denna fas.",
      500,
    );
  }

  if (
    !result.finalPacket.qualityGate.publishable ||
    result.finalPacket.qualityGate.score !== 100
  ) {
    return failed(
      "research_quality_failed",
      "Final Research quality gate nådde inte 100/100. Ingen output sparades eller publicerades.",
      422,
      {
        researchQuality: result.finalPacket.qualityGate.score,
        analystQuality: result.analystQualityGate.score,
        researchBlockers: result.finalPacket.qualityGate.blockers,
        researchFailedChecks: failedCheckNames(result.finalPacket.qualityGate.checks),
      },
    );
  }

  if (
    !result.analystQualityGate.publishable ||
    result.analystQualityGate.score !== 100
  ) {
    return failed(
      "analyst_quality_failed",
      "Final Analyst quality gate nådde inte 100/100. Ingen output sparades eller publicerades.",
      422,
      {
        researchQuality: result.finalPacket.qualityGate.score,
        analystQuality: result.analystQualityGate.score,
        analystBlockers: result.analystQualityGate.blockers,
        analystFailedChecks: failedCheckNames(result.analystQualityGate.checks),
      },
    );
  }

  return noStore(NextResponse.json({
    status: "ready",
    executionReady: true,
    target: result.finalPacket.instrument,
    usResearchCoverage: {
      ready: coverage.ready,
      score: coverage.score,
    },
    evidenceQuality: extraction.bundle.qualityGate.score,
    researchQuality: result.finalPacket.qualityGate.score,
    analystQuality: result.analystQualityGate.score,
    secSourceProvenancePreserved,
    secEvidenceProvenancePreserved,
    sourceCount: result.finalPacket.sources.length,
    evidenceCount: result.finalPacket.evidence.length,
    model: result.model,
    usage: result.usage,
    view: result.analystDraft.view,
    riskLevel: result.analystDraft.riskLevel,
    confidence: result.analystDraft.confidence,
    scenarios: result.finalPacket.valuation.scenarios.map((scenario) => ({
      name: scenario.name,
      valuePerShare: scenario.valuePerShare,
      upsideDownsidePct: scenario.upsideDownsidePct,
    })),
    persistence: null,
    publication: null,
    message: "MSFT klarade US Research Coverage 100/100 samt final Research 100/100 och Analyst 100/100 i Preview. Ingen persistence eller publicering utfördes.",
  }));
}
