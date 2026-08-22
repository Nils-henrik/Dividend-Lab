import { NextResponse } from "next/server";
import { analysisEngineForCompanyType } from "@/lib/analysis/analysis-engine-dispatch";
import { createDivLabAiAnalysis } from "@/lib/analysis/ai-analysis-service";
import { createDivLabBankAiAnalysis } from "@/lib/analysis/bank-ai-analysis-service";
import { DIVLAB_BANK_ANALYST_SCHEMA_VERSION } from "@/lib/analysis/bank-analyst-schema";
import { getCuratedPeerSet } from "@/lib/analysis/curated-peer-catalog";
import { createDivLabAnalysisDevAdminClient } from "@/lib/analysis/dev-admin";
import { createDivLabFinancialSpecialistAnalysis } from "@/lib/analysis/financial-specialist-ai-analysis-service";
import { DIVLAB_FINANCIAL_SPECIALIST_ANALYST_SCHEMA_VERSION } from "@/lib/analysis/financial-specialist-schema";
import { founderPersistAndPublishDivLabAnalysis } from "@/lib/analysis/founder-publication-service";
import { founderPersistAndPublishSpecialistAnalysis } from "@/lib/analysis/founder-specialist-publication-service";
import { resolveNordicEquityAnalysisTarget } from "@/lib/analysis/instrument-search";
import { methodologyAvailabilityMessage } from "@/lib/analysis/methodology-availability";
import { defaultAnalysisSlug } from "@/lib/analysis/repository";
import { fetchYahooCompanyProfilePreflight } from "@/lib/analysis/yahoo-company-profile";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";
import { createClient as createAuthenticatedSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CREATOR_ROLES = new Set(["founder", "ceo_divlab", "admin"]);

type Body = { symbol?: unknown; exchange?: unknown; persist?: unknown; publish?: unknown; useEscalationModel?: unknown };

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function safeFailure(stage: string, reason: string, extra: Record<string, unknown> = {}) {
  return noStore(NextResponse.json({ status: `${stage}_failed`, stage, reason, ...extra }, { status: 422 }));
}

function failedCheckNames(checks: Record<string, boolean>): string[] {
  return Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
}

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") return new NextResponse(null, { status: 404 });

  // Every heavy Preview execution is staff-gated before target resolution,
  // provider preflight, model execution, persistence or publication. Paid-user
  // access must use a separate entitlement boundary in a later product phase.
  const authSupabase = await createAuthenticatedSupabaseClient();
  const { data: { user }, error } = await authSupabase.auth.getUser();
  if (error || !user) return noStore(NextResponse.json({ status: "founder_auth_required" }, { status: 401 }));
  const roles = await getStaffRolesForUser(user.id);
  if (!roles.some((role) => CREATOR_ROLES.has(role))) {
    return noStore(NextResponse.json({ status: "founder_role_required" }, { status: 403 }));
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const symbol = typeof body.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
  const exchange = typeof body.exchange === "string" ? body.exchange.trim().toUpperCase() : "ST";
  const persist = body.persist === true;
  const publish = body.publish === true;
  const useEscalationModel = body.useEscalationModel === true;
  if (publish && !persist) return noStore(NextResponse.json({ status: "publish_requires_persist" }, { status: 400 }));

  const curated = getCuratedPeerSet({ symbol, exchange });
  const resolved = curated
    ? { symbol: curated.registry.target.symbol, exchange: curated.registry.target.exchange, name: curated.registry.target.name, yahooSymbol: `${curated.registry.target.symbol}.${curated.registry.target.exchange}` }
    : await resolveNordicEquityAnalysisTarget({ symbol, exchange });
  if (!resolved) {
    return noStore(NextResponse.json({ status: "target_not_supported", reason: "Instrumentet kunde inte verifieras som en nordisk aktie." }, { status: 404 }));
  }

  const preflight = await fetchYahooCompanyProfilePreflight({ yahooSymbol: resolved.yahooSymbol });
  if (!preflight) {
    return noStore(NextResponse.json({ status: "methodology_verification_unavailable", reason: "Bolagstyp och metodik kunde inte verifieras. Ingen analys startades." }, { status: 503 }));
  }
  const engine = analysisEngineForCompanyType(preflight.classification.type);
  if (!engine) {
    return noStore(NextResponse.json({
      status: "methodology_not_supported",
      reason: methodologyAvailabilityMessage({
        status: preflight.methodology.status,
        companyType: preflight.classification.type,
        analysisEngine: null,
      }),
      companyType: preflight.classification.type,
    }, { status: 422 }));
  }

  const slug = defaultAnalysisSlug({ instrument: resolved });
  const serviceSupabase = persist && !publish ? createDivLabAnalysisDevAdminClient() : null;
  if (persist && !publish && !serviceSupabase) {
    return noStore(NextResponse.json({ status: "dev_admin_unavailable" }, { status: 503 }));
  }

  try {
    if (engine === "operating_company") {
      const result = await createDivLabAiAnalysis({
        symbol: resolved.symbol, exchange: resolved.exchange, name: resolved.name,
        useEscalationModel, ...(serviceSupabase ? { supabase: serviceSupabase } : {}), slug,
      });
      if (!result.ok) {
        if (result.stage === "research") return safeFailure("research", result.reason);
        if (result.stage === "methodology") return safeFailure("methodology", "Metodiken ändrades mellan preflight och Research. Analysen stoppades säkert.");
        if (result.stage === "analyst") return safeFailure("analyst", result.reason);
        return safeFailure("analyst_quality", result.reason, {
          researchQuality: result.finalPacket.qualityGate.score,
          analystQuality: result.analystQualityGate.score,
          blockers: result.analystQualityGate.blockers,
          failedChecks: failedCheckNames(result.analystQualityGate.checks),
          researchBlockers: result.finalPacket.qualityGate.blockers,
          researchFailedChecks: failedCheckNames(result.finalPacket.qualityGate.checks),
          usage: result.usage,
        });
      }
      if (!result.finalPacket.qualityGate.publishable) {
        return noStore(NextResponse.json({
          status: "research_quality_failed",
          stage: "research_quality",
          reason: "research_quality_gate_failed",
          researchQuality: result.finalPacket.qualityGate.score,
          analystQuality: result.analystQualityGate.score,
          researchBlockers: result.finalPacket.qualityGate.blockers,
          researchFailedChecks: failedCheckNames(result.finalPacket.qualityGate.checks),
          usage: result.usage,
        }, { status: 422 }));
      }
      let publication = null;
      let persistence = result.persistence;
      if (publish) {
        const founder = await founderPersistAndPublishDivLabAnalysis({
          supabase: authSupabase, packet: result.finalPacket, analystDraft: result.analystDraft,
          analystQualityGate: result.analystQualityGate, analystModel: result.model,
          usage: result.usage, generatedAt: result.finalPacket.createdAt, slug,
        });
        persistence = founder.persistence;
        publication = founder.publication;
      }
      return noStore(NextResponse.json({
        status: publication ? "published" : persistence ? "persisted" : "ready",
        analysisEngine: engine, publicPath: publication ? `/analyses/${slug}` : null,
        slug, target: result.finalPacket.instrument,
        researchQuality: result.finalPacket.qualityGate.score,
        analystQuality: result.analystQualityGate.score,
        view: result.analystDraft.view, riskLevel: result.analystDraft.riskLevel,
        confidence: result.analystDraft.confidence, usage: result.usage,
        publication, persistence,
      }));
    }

    if (engine === "bank") {
      const result = await createDivLabBankAiAnalysis({
        symbol: resolved.symbol, exchange: resolved.exchange, name: resolved.name,
        useEscalationModel, ...(serviceSupabase ? { supabase: serviceSupabase, persist: true } : { persist: false }), slug,
      });
      if (!result.ok) {
        if (result.stage === "research") return safeFailure("research", result.reason);
        return safeFailure(result.stage, result.reason, {
          researchQuality: result.packet?.qualityGate.score,
          analystQuality: result.analystQualityGate?.score,
          blockers: result.packet?.qualityGate.blockers ?? result.bankResearch?.blockers ?? [],
          usage: result.usage,
        });
      }
      let publication = null;
      if (publish) {
        const founder = await founderPersistAndPublishSpecialistAnalysis({
          supabase: authSupabase, packet: result.packet, draft: result.draft,
          analystQualityGate: result.analystQualityGate, analystModel: result.analystModel,
          usage: result.usage, schemaVersion: DIVLAB_BANK_ANALYST_SCHEMA_VERSION,
          slug, generatedAt: result.packet.createdAt,
        });
        publication = founder.publication;
      }
      return noStore(NextResponse.json({
        status: publication ? "published" : result.persisted ? "persisted" : "ready",
        analysisEngine: engine, publicPath: publication ? `/analyses/${slug}` : null,
        slug, target: result.packet.instrument,
        researchQuality: result.packet.qualityGate.score,
        analystQuality: result.analystQualityGate.score,
        view: result.draft.view, riskLevel: result.draft.riskLevel,
        confidence: result.draft.confidence, usage: result.usage,
        publication, persistence: result.persisted,
      }));
    }

    const result = await createDivLabFinancialSpecialistAnalysis({
      symbol: resolved.symbol, exchange: resolved.exchange, name: resolved.name,
      useEscalationModel, ...(serviceSupabase ? { supabase: serviceSupabase, persist: true } : { persist: false }), slug,
    });
    if (!result.ok) {
      if (result.stage === "research") return safeFailure("research", result.reason);
      return safeFailure(result.stage, result.reason, {
        researchQuality: result.packet?.qualityGate.score,
        analystQuality: result.analystQualityGate?.score,
        blockers: result.packet?.qualityGate.blockers ?? result.specialistResearch?.blockers ?? [],
        usage: result.usage,
      });
    }
    let publication = null;
    if (publish) {
      const founder = await founderPersistAndPublishSpecialistAnalysis({
        supabase: authSupabase, packet: result.packet, draft: result.draft,
        analystQualityGate: result.analystQualityGate, analystModel: result.analystModel,
        usage: result.usage, schemaVersion: DIVLAB_FINANCIAL_SPECIALIST_ANALYST_SCHEMA_VERSION,
        slug, generatedAt: result.packet.createdAt,
      });
      publication = founder.publication;
    }
    return noStore(NextResponse.json({
      status: publication ? "published" : result.persisted ? "persisted" : "ready",
      analysisEngine: engine, publicPath: publication ? `/analyses/${slug}` : null,
      slug, target: result.packet.instrument,
      researchQuality: result.packet.qualityGate.score,
      analystQuality: result.analystQualityGate.score,
      view: result.draft.view, riskLevel: result.draft.riskLevel,
      confidence: result.draft.confidence, usage: result.usage,
      publication, persistence: result.persisted,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "analysis_operator_failed";
    if (message === "divlab_analysis_founder_auth_required") return noStore(NextResponse.json({ status: "founder_auth_required" }, { status: 401 }));
    if (message === "divlab_analysis_founder_role_required") return noStore(NextResponse.json({ status: "founder_role_required" }, { status: 403 }));
    console.error("[analysis-run] operator failed", { engine, code: message.slice(0, 120) });
    return noStore(NextResponse.json({ status: "failed", reason: "Analysmotorn kunde inte slutföra körningen." }, { status: 503 }));
  }
}