import { NextResponse } from "next/server";
import { createDivLabAiAnalysis } from "@/lib/analysis/ai-analysis-service";
import { getCuratedPeerSet } from "@/lib/analysis/curated-peer-catalog";
import { createDivLabAnalysisDevAdminClient } from "@/lib/analysis/dev-admin";
import { founderPersistAndPublishDivLabAnalysis } from "@/lib/analysis/founder-publication-service";
import { defaultAnalysisSlug } from "@/lib/analysis/repository";
import { createClient as createAuthenticatedSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
 * `publish=true` uses the signed-in DivLab session and a founder-only database
 * wrapper. The database verifies profile_staff_roles before calling the ordinary
 * immutable persistence + 100/100 publication gates in one transaction. This
 * avoids placing a service-role key in Vercel Preview.
 *
 * A persist-only internal run retains the explicit DEV service-role path for QA
 * compatibility, but the testcenter uses atomic founder publish.
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

  const curated = getCuratedPeerSet({ symbol, exchange });
  if (!curated) {
    return noStore(
      NextResponse.json(
        { status: "target_not_curated", symbol, exchange },
        { status: 404 },
      ),
    );
  }

  const target = curated.registry.target;
  const slug = defaultAnalysisSlug({ instrument: target });

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
      symbol: target.symbol,
      exchange: target.exchange,
      name: target.name,
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

    // The founder publication RPC also enforces this, but expose the exact
    // deterministic Research failure before any publication attempt so Preview
    // QA never hides a 91/100 packet behind a later database error.
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
      const authSupabase = await createAuthenticatedSupabaseClient();
      const {
        data: { user },
        error: authError,
      } = await authSupabase.auth.getUser();

      if (authError || !user) {
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
