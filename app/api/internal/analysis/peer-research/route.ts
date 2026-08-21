import { NextResponse } from "next/server";
import { DIVLAB_CURATED_PEER_SETS } from "@/lib/analysis/curated-peer-catalog";
import { createDivLabAnalysisDevAdminClient } from "@/lib/analysis/dev-admin";
import type { DivLabResearchPacket } from "@/lib/analysis/deep-research";
import { createDivLabCuratedPeerResearchExportArtifact } from "@/lib/analysis/peer-research-export-runner";
import { buildPeerResearchOperatorExport } from "@/lib/analysis/peer-research-operator-export";
import { createDivLabPeerResearchVersion } from "@/lib/analysis/peer-research-service";
import { buildPeerResearchValidationExport } from "@/lib/analysis/peer-research-validation-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_CONCURRENCY = 3;

type ExportMode = "none" | "validation" | "operator";

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

async function runPeerResearch(
  member: CuratedPeer,
  supabase?: DevAdminClient,
  exportMode: ExportMode = "none",
) {
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

    const validationExport =
      exportMode === "none"
        ? null
        : buildPeerResearchValidationExport({ packet: result.packet });

    if (exportMode === "operator") {
      if (!validationExport) {
        throw new Error("peer_research_operator_export_validation_missing");
      }
      return {
        httpStatus: 200,
        payload: {
          status: "operator_export_ready",
          operatorExport: buildPeerResearchOperatorExport({ validationExport }),
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
        validationExport,
      },
    } as const;
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message.slice(0, 180)
        : "peer_research_smoke_failed";
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

function setExportFailureStatus(reason: string): number {
  if (reason === "peer_research_export_curated_target_missing") return 404;
  if (reason === "peer_research_export_yahoo_session_unavailable") return 503;
  if (reason.startsWith("peer_research_export_peer_failed:")) return 422;
  return 503;
}

/**
 * Temporary Preview-only validation surface for the curated peer catalog.
 * Production always returns 404. Persistence additionally requires the guarded
 * dividend-lab-dev service-role client; an incorrectly configured Preview can
 * therefore inspect neither nor mutate production through this route.
 *
 * `batch=1` is deliberately dry-run-only and evaluates the complete curated
 * catalog with bounded concurrency. It never exports or persists packets.
 *
 * `export=1` is the single-peer, read-only validation path. Combined with
 * `operator=1` it returns one checksum-bound operator envelope.
 *
 * `set=1&operator=1` is the all-or-nothing curated-set transport path. `symbol`
 * and `exchange` identify a catalog TARGET (for example ATCO-A/ST), never an
 * operator-supplied peer list. The shared server-only export engine resolves
 * exactly the catalog's three members, requires 3/3 peer-ready facts research,
 * and returns one artifact containing three checksum-bound operator envelopes.
 * It cannot be combined with persistence, generic batch, or single-peer export.
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
  const exportPacket = url.searchParams.get("export") === "1";
  const operatorExport = url.searchParams.get("operator") === "1";
  const setExport = url.searchParams.get("set") === "1";

  if (batch) {
    if (persist) {
      return noStore(
        NextResponse.json(
          { status: "batch_persistence_forbidden" },
          { status: 400 },
        ),
      );
    }
    if (exportPacket || operatorExport || setExport) {
      return noStore(
        NextResponse.json(
          { status: "batch_export_forbidden" },
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

  if (setExport) {
    if (!operatorExport) {
      return noStore(
        NextResponse.json(
          { status: "set_requires_operator" },
          { status: 400 },
        ),
      );
    }
    if (persist || exportPacket) {
      return noStore(
        NextResponse.json(
          { status: "set_export_conflict" },
          { status: 400 },
        ),
      );
    }

    try {
      const artifact = await createDivLabCuratedPeerResearchExportArtifact({
        target: { symbol, exchange },
      });
      return noStore(
        NextResponse.json({
          status: "operator_set_export_ready",
          artifact,
        }),
      );
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message.slice(0, 240)
          : "peer_research_set_export_failed";
      return noStore(
        NextResponse.json(
          {
            status: "operator_set_export_failed",
            target: {
              symbol: symbol.trim().toUpperCase(),
              exchange: exchange.trim().toUpperCase(),
            },
            reason,
          },
          { status: setExportFailureStatus(reason) },
        ),
      );
    }
  }

  if (operatorExport && !exportPacket) {
    return noStore(
      NextResponse.json(
        { status: "operator_requires_export" },
        { status: 400 },
      ),
    );
  }

  if (persist && exportPacket) {
    return noStore(
      NextResponse.json(
        { status: "persist_export_conflict" },
        { status: 400 },
      ),
    );
  }

  const member = curatedPeer(symbol, exchange);
  if (!member) {
    return noStore(
      NextResponse.json(
        {
          status: "not_curated",
          symbol: symbol.trim().toUpperCase(),
          exchange: exchange.trim().toUpperCase(),
        },
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
        {
          status: "dev_admin_unavailable",
          symbol: member.symbol,
          exchange: member.exchange,
        },
        { status: 503 },
      ),
    );
  }

  const exportMode: ExportMode = operatorExport
    ? "operator"
    : exportPacket
      ? "validation"
      : "none";
  const result = await runPeerResearch(member, supabase, exportMode);
  return noStore(NextResponse.json(result.payload, { status: result.httpStatus }));
}
