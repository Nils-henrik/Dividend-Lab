import { NextResponse } from "next/server";
import { DIVLAB_CURATED_PEER_SETS } from "@/lib/analysis/curated-peer-catalog";
import { createDivLabAnalysisDevAdminClient } from "@/lib/analysis/dev-admin";
import type { DivLabResearchPacket } from "@/lib/analysis/deep-research";
import { createDivLabPeerResearchVersion } from "@/lib/analysis/peer-research-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_CONCURRENCY = 3;

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

function allCuratedPeers() {
  const byIdentity = new Map<string, NonNullable<ReturnType<typeof curatedPeer>>>();
  for (const set of DIVLAB_CURATED_PEER_SETS) {
    for (const member of set.registry.members) {
      byIdentity.set(`${member.exchange}:${member.symbol}`, member);
    }
  }
  return [...byIdentity.values()];
}

function primaryDiagnostics(packet: DivLabResearchPacket) {
  const sources = packet.sources
    .filter((source) => source.id.startsWith("nordic-primary:"))
    .map((source) => ({
      id: source.id,
      kind: source.kind,
      publisher: source.publisher,
      url: source.url,
      publishedAt: source.publishedAt,
      primary: source.primary,
    }));
  const evidence = packet.evidence
    .filter((item) => item.sourceId.startsWith("nordic-primary:"))
    .map((item) => ({
      sourceId: item.sourceId,
      kind: item.kind,
      title: item.title,
      publishedAt: item.publishedAt,
      primary: item.primary,
      documentRetrieved: item.documentRetrieved,
      reportPeriod: item.reportPeriod,
      reportYear: item.reportYear,
      documentType: item.documentType,
    }));

  return {
    sourceCount: sources.length,
    evidenceCount: evidence.length,
    sources,
    evidence,
  };
}

type DevAdminClient = NonNullable<ReturnType<typeof createDivLabAnalysisDevAdminClient>>;
type CuratedPeer = NonNullable<ReturnType<typeof curatedPeer>>;

async function runPeerResearch(member: CuratedPeer, supabase?: DevAdminClient) {
  try {
    const result = await createDivLabPeerResearchVersion({
      symbol: member.symbol,
      exchange: member.exchange,
      name: member.name,
      supabase,
    });

    if (!result.ok) {
      return {
        httpStatus: 422,
        payload: {
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
          primaryDiagnostics:
            result.stage === "peer_readiness"
              ? primaryDiagnostics(result.packet)
              : null,
        },
      } as const;
    }

    return {
      httpStatus: 200,
      payload: {
        status: supabase ? "persisted" : "ready",
        symbol: result.packet.instrument.symbol,
        exchange: result.packet.instrument.exchange,
        name: result.packet.instrument.name,
        dataAsOf: result.packet.dataAsOf,
        ordinaryPublishable: result.packet.qualityGate.publishable,
        readiness: result.readiness,
        primaryDiagnostics: primaryDiagnostics(result.packet),
        persistence: result.persistence,
      },
    } as const;
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 180) : "peer_research_smoke_failed";
    return {
      httpStatus: 503,
      payload: {
        status: "failed",
        symbol: member.symbol,
        exchange: member.exchange,
        reason,
      },
    } as const;
  }
}

async function runBatchDryResearch() {
  const members = allCuratedPeers();
  const results: Array<Awaited<ReturnType<typeof runPeerResearch>>["payload"]> = [];

  for (let index = 0; index < members.length; index += BATCH_CONCURRENCY) {
    const chunk = members.slice(index, index + BATCH_CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (member) => (await runPeerResearch(member)).payload),
    );
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Temporary Preview-only validation surface for the curated peer catalog.
 * Production always returns 404. Persistence additionally requires the guarded
 * dividend-lab-dev service-role client; an incorrectly configured Preview can
 * therefore inspect neither nor mutate production through this route.
 *
 * `batch=1` is deliberately dry-run-only and evaluates the complete curated
 * catalog with bounded concurrency so one protected Preview request can prove
 * real-company readiness without weakening Deployment Protection. Diagnostic
 * output is bounded to source/document metadata; report text is never returned.
 */
export async function GET(request: Request) {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") ?? "";
  const exchange = url.searchParams.get("exchange") ?? "ST";
  const persist = url.searchParams.get("persist") === "1";
  const batch = url.searchParams.get("batch") === "1";

  if (batch) {
    if (persist) {
      return noStore(
        NextResponse.json(
          { status: "batch_persistence_forbidden" },
          { status: 400 },
        ),
      );
    }

    const results = await runBatchDryResearch();
    return noStore(
      NextResponse.json({
        status: "batch_complete",
        persist: false,
        count: results.length,
        results,
      }),
    );
  }

  const member = curatedPeer(symbol, exchange);
  if (!member) {
    return noStore(
      NextResponse.json(
        { status: "not_curated", symbol: symbol.trim().toUpperCase(), exchange: exchange.trim().toUpperCase() },
        { status: 404 },
      ),
    );
  }

  const supabase = persist
    ? createDivLabAnalysisDevAdminClient() ?? undefined
    : undefined;
  if (persist && !supabase) {
    return noStore(
      NextResponse.json(
        { status: "dev_admin_unavailable", symbol: member.symbol, exchange: member.exchange },
        { status: 503 },
      ),
    );
  }

  const result = await runPeerResearch(member, supabase);
  return noStore(NextResponse.json(result.payload, { status: result.httpStatus }));
}
