import { NextResponse } from "next/server";
import { DIVLAB_CURATED_PEER_SETS } from "@/lib/analysis/curated-peer-catalog";
import { createDivLabAnalysisDevAdminClient } from "@/lib/analysis/dev-admin";
import { createDivLabPeerResearchVersion } from "@/lib/analysis/peer-research-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function curatedPeer(symbol: string, exchange: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const normalizedExchange = exchange.trim().toUpperCase();
  for (const set of DIVLAB_CURATED_PEER_SETS) {
    const member = set.registry.members.find(
      (candidate) =>
        candidate.symbol === normalizedSymbol &&
        candidate.exchange === normalizedExchange,
    );
    if (member) return member;
  }
  return null;
}

/**
 * Temporary Preview-only validation surface for the curated peer catalog.
 * Production always returns 404. Persistence additionally requires the guarded
 * dividend-lab-dev service-role client; an incorrectly configured Preview can
 * therefore inspect neither nor mutate production through this route.
 */
export async function GET(request: Request) {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") ?? "";
  const exchange = url.searchParams.get("exchange") ?? "ST";
  const persist = url.searchParams.get("persist") === "1";
  const member = curatedPeer(symbol, exchange);
  if (!member) {
    return noStore(
      NextResponse.json(
        { status: "not_curated", symbol: symbol.trim().toUpperCase(), exchange: exchange.trim().toUpperCase() },
        { status: 404 },
      ),
    );
  }

  const supabase = persist ? createDivLabAnalysisDevAdminClient() : undefined;
  if (persist && !supabase) {
    return noStore(
      NextResponse.json(
        { status: "dev_admin_unavailable", symbol: member.symbol, exchange: member.exchange },
        { status: 503 },
      ),
    );
  }

  try {
    const result = await createDivLabPeerResearchVersion({
      symbol: member.symbol,
      exchange: member.exchange,
      name: member.name,
      supabase,
    });

    if (!result.ok) {
      return noStore(
        NextResponse.json(
          {
            status: result.stage === "research" ? "research_failed" : "peer_not_ready",
            symbol: member.symbol,
            exchange: member.exchange,
            reason: result.reason,
            readiness:
              result.stage === "peer_readiness"
                ? {
                    version: result.readiness.version,
                    ready: result.readiness.ready,
                    blockers: result.readiness.blockers,
                    eligibleMetrics: result.readiness.eligibleMetrics,
                    checks: result.readiness.checks,
                  }
                : null,
          },
          { status: 422 },
        ),
      );
    }

    return noStore(
      NextResponse.json({
        status: persist ? "persisted" : "ready",
        symbol: result.packet.instrument.symbol,
        exchange: result.packet.instrument.exchange,
        name: result.packet.instrument.name,
        dataAsOf: result.packet.dataAsOf,
        ordinaryPublishable: result.packet.qualityGate.publishable,
        readiness: result.readiness,
        persistence: result.persistence,
      }),
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 180) : "peer_research_smoke_failed";
    return noStore(
      NextResponse.json(
        { status: "failed", symbol: member.symbol, exchange: member.exchange, reason },
        { status: 503 },
      ),
    );
  }
}
