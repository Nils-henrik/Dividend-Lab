import { NextResponse } from "next/server";
import { createDivLabAiAnalysis } from "@/lib/analysis/ai-analysis-service";
import { buildDivLabResearchPacket } from "@/lib/analysis/deep-research";
import { loadDivLabResearchInputs } from "@/lib/analysis/research-loader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const E2E_KEY = "divlab-analyst-e2e-v1";

const CASES = {
  atlas: { symbol: "ATCO-A", exchange: "ST", name: "Atlas Copco AB" },
  evolution: { symbol: "EVO", exchange: "ST", name: "Evolution AB" },
  embracer: { symbol: "EMBRAC-B", exchange: "ST", name: "Embracer Group AB" },
} as const;

type CaseKey = keyof typeof CASES;

function authPresence() {
  return {
    aiGatewayApiKey: Boolean(process.env.AI_GATEWAY_API_KEY?.trim()),
    vercelOidcToken: Boolean(process.env.VERCEL_OIDC_TOKEN?.trim()),
    openAiApiKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
    vercel: process.env.VERCEL === "1",
    vercelEnv: process.env.VERCEL_ENV ?? null,
  };
}

function summarizeResult(result: Awaited<ReturnType<typeof createDivLabAiAnalysis>>) {
  if (!result.ok) return result;

  return {
    ok: true as const,
    instrument: result.finalPacket.instrument,
    model: result.model,
    usage: result.usage,
    persisted: result.persistence !== null,
    qualityGate: result.finalPacket.qualityGate,
    valuation: result.finalPacket.valuation,
    fundamental: {
      metrics: result.finalPacket.fundamental.metrics,
      trends: result.finalPacket.fundamental.trends,
      strengths: result.finalPacket.fundamental.strengths,
      concerns: result.finalPacket.fundamental.concerns,
      unknowns: result.finalPacket.fundamental.unknowns,
    },
    technical: {
      snapshot: result.finalPacket.technical.snapshot,
      levels: result.finalPacket.technical.levels,
    },
    sources: result.finalPacket.sources,
    evidence: result.finalPacket.evidence.map((item) => ({
      id: item.id,
      sourceId: item.sourceId,
      kind: item.kind,
      title: item.title,
      publishedAt: item.publishedAt,
      primary: item.primary,
      documentRetrieved: item.documentRetrieved,
      reportPeriod: item.reportPeriod ?? null,
      reportYear: item.reportYear ?? null,
      contentChars: item.content.length,
    })),
    analystDraft: result.analystDraft,
  };
}

async function buildFacts(selected: CaseKey, now: Date) {
  const loaded = await loadDivLabResearchInputs({
    ...CASES[selected],
    now,
  });
  if (!loaded.ok) return loaded;

  const research = loaded.value;
  const packet = buildDivLabResearchPacket({
    symbol: research.instrument.symbol,
    exchange: research.instrument.exchange,
    name: research.instrument.name,
    currency: research.instrument.currency,
    currentPrice: research.instrument.currentPrice,
    history: research.history,
    fundamentals: research.fundamentals,
    valuationScenarios: [],
    sources: research.sources,
    evidence: research.evidence,
    now,
  });

  return {
    ok: true as const,
    instrument: packet.instrument,
    dataAsOf: packet.dataAsOf,
    qualityGateBeforeAnalyst: packet.qualityGate,
    fundamentalSnapshot: packet.fundamentalSnapshot,
    fundamental: packet.fundamental,
    trailingValuation: packet.valuation.trailing,
    technical: packet.technical,
    sources: packet.sources,
    evidence: packet.evidence,
  };
}

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("key") !== E2E_KEY) {
    return new NextResponse(null, { status: 404 });
  }

  const selected = url.searchParams.get("case") as CaseKey | null;
  if (!selected || !(selected in CASES)) {
    return NextResponse.json(
      { error: "invalid_case", allowed: Object.keys(CASES) },
      { status: 400 },
    );
  }

  const mode = url.searchParams.get("mode") === "facts" ? "facts" : "ai";
  const startedAt = new Date();
  try {
    const result = mode === "facts"
      ? await buildFacts(selected, startedAt)
      : summarizeResult(
          await createDivLabAiAnalysis({
            ...CASES[selected],
            now: startedAt,
          }),
        );

    return NextResponse.json({
      case: selected,
      mode,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      readOnly: true,
      persistence: false,
      authPresence: authPresence(),
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        case: selected,
        mode,
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        readOnly: true,
        persistence: false,
        authPresence: authPresence(),
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
