import { NextResponse } from "next/server";
import { createDivLabAiAnalysis } from "@/lib/analysis/ai-analysis-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EXPECTED_BRANCH = "agent/divlab-deep-research-v1";
const SMOKE_MARKER = "divlab-analyst-oidc-v1";

const CASES = {
  evolution: { symbol: "EVO", exchange: "ST", name: "Evolution" },
  atlas: { symbol: "ATCO-A", exchange: "ST", name: "Atlas Copco" },
  embracer: { symbol: "EMBRAC-B", exchange: "ST", name: "Embracer Group" },
} as const;

type SmokeCase = keyof typeof CASES;

function allowedPreviewRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === EXPECTED_BRANCH
  );
}

function requestParameters(request: Request): {
  selectedCase: SmokeCase | null;
  markerValid: boolean;
} {
  const params = new URL(request.url).searchParams;
  const value = params.get("case")?.trim().toLowerCase() ?? "";
  return {
    selectedCase: value in CASES ? (value as SmokeCase) : null,
    markerValid: params.get("smoke") === SMOKE_MARKER,
  };
}

function sourceSummary(sources: readonly { id: string; kind: string; publisher: string; primary: boolean }[]) {
  return sources.map((source) => ({
    id: source.id,
    kind: source.kind,
    publisher: source.publisher,
    primary: source.primary,
  }));
}

export async function GET(request: Request) {
  const { selectedCase, markerValid } = requestParameters(request);
  if (!allowedPreviewRuntime() || !markerValid) {
    return new NextResponse(null, { status: 404 });
  }
  if (!selectedCase) {
    return NextResponse.json({ status: "invalid_case" }, { status: 400 });
  }

  const company = CASES[selectedCase];

  try {
    const result = await createDivLabAiAnalysis({
      symbol: company.symbol,
      exchange: company.exchange,
      name: company.name,
    });

    if (!result.ok) {
      if (result.stage === "research") {
        return NextResponse.json({
          ok: false,
          case: selectedCase,
          stage: result.stage,
          reason: result.reason,
        });
      }

      if (result.stage === "analyst") {
        return NextResponse.json({
          ok: false,
          case: selectedCase,
          stage: result.stage,
          reason: result.reason,
          factsQualityGate: result.factsPacket.qualityGate,
          currencyContext: result.factsPacket.currencyContext,
          valuationInputs: result.factsPacket.valuationInputs,
          trailingValuation: result.factsPacket.valuation.trailing,
          sources: sourceSummary(result.factsPacket.sources),
        });
      }

      return NextResponse.json({
        ok: false,
        case: selectedCase,
        stage: result.stage,
        reason: result.reason,
        analystDraft: result.analystDraft,
        analystQualityGate: result.analystQualityGate,
        valuation: result.finalPacket.valuation,
        currencyContext: result.finalPacket.currencyContext,
        sources: sourceSummary(result.finalPacket.sources),
        model: result.model,
        usage: result.usage,
      });
    }

    return NextResponse.json({
      ok: true,
      case: selectedCase,
      analystDraft: result.analystDraft,
      analystQualityGate: result.analystQualityGate,
      researchQualityGate: result.finalPacket.qualityGate,
      valuation: result.finalPacket.valuation,
      currencyContext: result.finalPacket.currencyContext,
      valuationInputs: result.finalPacket.valuationInputs,
      sources: sourceSummary(result.finalPacket.sources),
      model: result.model,
      usage: result.usage,
      persistence: result.persistence,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 160) : "analysis_smoke_failed";
    return NextResponse.json(
      { ok: false, case: selectedCase, stage: "exception", reason },
      { status: 503 },
    );
  }
}
