import { NextResponse } from "next/server";
import { createDivLabAiAnalysis } from "@/lib/analysis/ai-analysis-service";
import { getCuratedPeerSet } from "@/lib/analysis/curated-peer-catalog";
import { createDivLabAnalysisDevAdminClient } from "@/lib/analysis/dev-admin";
import { founderPersistAndPublishDivLabAnalysis } from "@/lib/analysis/founder-publication-service";
import { resolveNordicEquityAnalysisTarget } from "@/lib/analysis/instrument-search";
import { defaultAnalysisSlug } from "@/lib/analysis/repository";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";
import { createClient as createAuthenticatedSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CREATOR_ROLES = new Set(["founder", "ceo_divlab", "admin"]);

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function failedCheckNames(checks: Readonly<Record<string, boolean>>): string[] {
  return Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
}

type Body = {
  symbol?: unknown;
  exchange?: unknown;
  persist?: unknown;
  publish?: unknown;
  useEscalationModel?: unknown;
};

/**
 * Preview-only operator surface for creating productized DivLab analyses.
 * Production always returns 404.
 *
 * Curated QA targets still resolve locally. Founder/CEO/admin users may also
 * select any Yahoo-verified Nordic equity from the analysis search surface.
 * Indexes/ETFs are deliberately rejected here until their own methodology is
 * implemented; they must never be forced through the company fundamental gate.
 */
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const symbol = typeof body.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
  const exchange = typeof body.exchange === "string" ? body.exchange.trim().toUpperCase() : "ST";
  const persist = body.persist === true;
  const publish = body.publish === true;
  const useEscalationModel = body.useEscalationModel === true;

  if (publish && !persist) {
    return noStore(
      NextResponse.json({ status: "publish_requires_persist" }, { status: 400 }),
    );
  }

  let authSupabase: Awaited<ReturnType<typeof createAuthenticatedSupabaseClient>> | null = null;
  if (publish) {
    authSupabase = await createAuthenticatedSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return noStore(
        NextResponse.json({ status: "founder_auth_required" }, { status: 401 }),
      );
    }
    const roles = await getStaffRolesForUser(user.id);
    if (!roles.some((role) => CREATOR_ROLES.has(role))) {
      return noStore(
        NextResponse.json({ status: "founder_role_required" }, { status: 403 }),
      );
    }
  }

  const curated = getCuratedPeerSet({ symbol, exchange });
  const resolved = curated
    ? {
        symbol: curated.registry.target.symbol,
        exchange: curated.registry.target.exchange,
        name: curated.registry.target.name,
      }
    : await resolveNordicEquityAnalysisTarget({ symbol, exchange });

  if (!resolved) {
    return noStore(
      NextResponse.json(
        {
          status: "target_not_supported",
          symbol,
          exchange,
          reason:
            "Instrumentet kunde inte verifieras som en nordisk aktie med nuvarande bolagsmetodik.",
        },
        { status: 404 },
      ),
    );
  }

  const slug = defaultAnalysisSlug({ instrument: resolved });

  // Persist-only QA retains the explicit DEV service-role client. Atomic
  // publish uses the authenticated founder wrapper instead.
  const serviceSupabase = persist && !publish ? createDivLabAnalysisDevAdminClient() : null;
  if (persist && !publish && !serviceSupabase) {
    return noStore(
      NextResponse.json({ status: "dev_admin_unavailable" }, { status: 503 }),
    );
  }

  try {
    const result = await createDivLabAiAnalysis({
      symbol: resolved.symbol,
      exchange: resolved.exchange,
      name: resolved.name,
      useEscalationModel,
      ...(serviceSupabase ? { supabase: serviceSupabase } : {}),
      slug,
    });

    if (!result.ok) {
      const payload =
        result.stage === "research"
          ? { status: "research_failed", stage: result.stage, reason: result.reason }
          : result.stage === "methodology"
            ? {
                status: "methodology_failed",
                stage: result.stage,
                reason: result.reason,
                methodologyStatus: result.methodologyStatus,
                companyType: result.companyType,
              }
            : result.stage === "analyst"
              ? { status: "analyst_failed", stage: result.stage, reason: result.reason }
              : {
                  status: "analyst_quality_failed",
                  stage: result.stage,
                  reason: result.reason,
                  researchQuality: result.finalPacket.qualityGate.score,
                  analystQuality: result.analystQualityGate.score,
                  view: result.analystDraft.view,
                  riskLevel: result.analystDraft.riskLevel,
                  confidence: result.analystDraft.confidence,
                  blockers: result.analystQualityGate.blockers,
                  warnings: result.analystQualityGate.warnings,
                  failedChecks: failedCheckNames(result.analystQualityGate.checks),
                  researchBlockers: result.finalPacket.qualityGate.blockers,
                  researchWarnings: result.finalPacket.qualityGate.warnings,
                  researchFailedChecks: failedCheckNames(result.finalPacket.qualityGate.checks),
                };
      return noStore(NextResponse.json(payload, { status: 422 }));
    }

    if (!result.finalPacket.qualityGate.publishable) {
      return noStore(
        NextResponse.json(
          {
            status: "research_quality_failed",
            stage: "research_quality",
            reason: "research_quality_gate_failed",
            researchQuality: result.finalPacket.qualityGate.score,
            analystQuality: result.analystQualityGate.score,
            view: result.analystDraft.view,
            riskLevel: result.analystDraft.riskLevel,
            confidence: result.analystDraft.confidence,
            researchBlockers: result.finalPacket.qualityGate.blockers,
            researchWarnings: result.finalPacket.qualityGate.warnings,
            researchFailedChecks: failedCheckNames(result.finalPacket.qualityGate.checks),
          },
          { status: 422 },
        ),
      );
    }

    let persistence = result.persistence;
    let publication = null;

    if (publish) {
      if (!authSupabase) {
        return noStore(
          NextResponse.json({ status: "founder_auth_required" }, { status: 401 }),
        );
      }

      try {
        const founderResult = await founderPersistAndPublishDivLabAnalysis({
          supabase: authSupabase,
          packet: result.finalPacket,
          analystDraft: result.analystDraft,
          analystQualityGate: result.analystQualityGate,
          analystModel: result.model,
          usage: result.usage,
          generatedAt: result.finalPacket.createdAt,
          slug,
        });
        persistence = founderResult.persistence;
        publication = founderResult.publication;
      } catch (error) {
        if (error instanceof Error && error.message === "divlab_analysis_founder_auth_required") {
          return noStore(
            NextResponse.json({ status: "founder_auth_required" }, { status: 401 }),
          );
        }
        if (error instanceof Error && error.message === "divlab_analysis_founder_role_required") {
          return noStore(
            NextResponse.json({ status: "founder_role_required" }, { status: 403 }),
          );
        }
        throw error;
      }
    }

    return noStore(
      NextResponse.json({
        status: publication ? "published" : persistence ? "persisted" : "ready",
        target: {
          symbol: result.finalPacket.instrument.symbol,
          exchange: result.finalPacket.instrument.exchange,
          name: result.finalPacket.instrument.name,
        },
        slug,
        publicPath: publication ? `/analyses/${slug}` : null,
        dataAsOf: result.finalPacket.dataAsOf,
        currentPrice: result.finalPacket.instrument.currentPrice,
        currency: result.finalPacket.instrument.currency,
        researchQuality: result.finalPacket.qualityGate.score,
        analystQuality: result.analystQualityGate.score,
        view: result.analystDraft.view,
        riskLevel: result.analystDraft.riskLevel,
        confidence: result.analystDraft.confidence,
        model: result.model,
        usage: {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
          estimatedCostUsdMicros: result.usage.estimatedCostUsdMicros,
        },
        persistence,
        publication,
      }),
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 180) : "analysis_operator_failed";
    return noStore(
      NextResponse.json({ status: "failed", reason }, { status: 503 }),
    );
  }
}
