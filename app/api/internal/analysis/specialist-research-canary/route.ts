import { NextResponse } from "next/server";
import { buildBankResearch } from "@/lib/analysis/bank-research";
import { buildDivLabResearchPacket } from "@/lib/analysis/deep-research";
import {
  buildFinancialSpecialistResearch,
  investmentCompanyDiscountProvenanceReady,
} from "@/lib/analysis/financial-specialist-research";
import { loadDivLabResearchInputs } from "@/lib/analysis/research-loader";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CREATOR_ROLES = new Set(["founder", "ceo_divlab", "admin"]);

const TARGETS = {
  "SEB-A.ST": {
    symbol: "SEB-A",
    exchange: "ST",
    name: "Skandinaviska Enskilda Banken AB",
    expectedType: "bank",
  },
  "INVE-B.ST": {
    symbol: "INVE-B",
    exchange: "ST",
    name: "Investor AB ser. B",
    expectedType: "investment_company",
  },
  "EQT.ST": {
    symbol: "EQT",
    exchange: "ST",
    name: "EQT AB",
    expectedType: "asset_manager",
  },
} as const;

type TargetKey = keyof typeof TARGETS;
type MetricRow = {
  name: string;
  status: string;
  value: number | null;
  unit: string;
  sourceIds: string[];
};

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function failure(
  status: string,
  message: string,
  httpStatus: number,
  extra: Record<string, unknown> = {},
) {
  return noStore(
    NextResponse.json(
      {
        status,
        canaryReady: false,
        message,
        persistence: null,
        publication: null,
        ...extra,
      },
      { status: httpStatus },
    ),
  );
}

function row(
  name: string,
  status: string,
  value: number | null,
  unit: string,
  sourceIds: readonly (string | null | undefined)[],
): MetricRow {
  return {
    name,
    status,
    value,
    unit,
    sourceIds: [...new Set(sourceIds.filter((id): id is string => Boolean(id?.trim())))],
  };
}

function sourceIdsKnown(sourceIds: readonly string[], knownSourceIds: ReadonlySet<string>): boolean {
  return sourceIds.length > 0 && sourceIds.every((sourceId) => knownSourceIds.has(sourceId));
}

function metricConfirmedAndKnown(metric: MetricRow, knownSourceIds: ReadonlySet<string>): boolean {
  return metric.status === "confirmed" && metric.value !== null && sourceIdsKnown(metric.sourceIds, knownSourceIds);
}

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return failure("founder_auth_required", "Founder-inloggning krävs för specialist-canaryn.", 401);
  }
  const roles = await getStaffRolesForUser(user.id);
  if (!roles.some((role) => CREATOR_ROLES.has(role))) {
    return failure("founder_role_required", "Founder-, CEO- eller adminroll krävs för specialist-canaryn.", 403);
  }

  const body = (await request.json().catch(() => ({}))) as { target?: unknown };
  const requested = typeof body.target === "string" ? body.target.trim().toUpperCase() : "";
  if (!Object.prototype.hasOwnProperty.call(TARGETS, requested)) {
    return failure(
      "target_not_allowed",
      "Canaryn är låst till SEB-A.ST, INVE-B.ST och EQT.ST.",
      400,
    );
  }

  const targetKey = requested as TargetKey;
  const target = TARGETS[targetKey];

  try {
    const now = new Date();
    const loaded = await loadDivLabResearchInputs({
      symbol: target.symbol,
      exchange: target.exchange,
      name: target.name,
      now,
    });
    if (!loaded.ok) {
      return failure(
        "research_load_failed",
        "Research-underlaget kunde inte laddas under den bounded specialist-canaryn.",
        422,
        { target: targetKey, reason: loaded.reason },
      );
    }

    const research = loaded.value;
    const basePacket = buildDivLabResearchPacket({
      symbol: research.instrument.symbol,
      exchange: research.instrument.exchange,
      name: research.instrument.name,
      currency: research.instrument.currency,
      currentPrice: research.instrument.currentPrice,
      history: research.history,
      fundamentals: research.fundamentals,
      companyClassification: research.companyClassification,
      fxConversion: research.fxConversion,
      valuationScenarios: [],
      sources: research.sources,
      evidence: research.evidence,
      now,
    });

    const knownSourceIds = new Set(basePacket.sources.map((source) => source.id));
    const primaryEvidence = basePacket.evidence
      .filter((item) => item.primary && item.documentRetrieved)
      .map((item) => ({
        sourceId: item.sourceId,
        reportPeriod: item.reportPeriod,
        reportYear: item.reportYear,
        documentType: item.documentType,
      }));
    const classificationReady = basePacket.companyClassification.type === target.expectedType;
    const common = {
      target: targetKey,
      expectedType: target.expectedType,
      detectedType: basePacket.companyClassification.type,
      classificationReady,
      sourceCount: basePacket.sources.length,
      primarySourceCount: basePacket.sources.filter((source) => source.primary).length,
      evidenceCount: basePacket.evidence.length,
      primaryEvidence,
      marketSourceIds: basePacket.sources
        .filter((source) => source.kind === "market_data")
        .map((source) => source.id),
      persistence: null,
      publication: null,
    };

    if (target.expectedType === "bank") {
      const bankResearch = buildBankResearch({
        evidence: basePacket.evidence,
        fundamentals: basePacket.fundamentalSnapshot,
        currentPrice: basePacket.instrument.currentPrice,
        marketCurrency: basePacket.instrument.currency,
        reportingCurrency: basePacket.currencyContext.reportingCurrency,
        fxConversion: research.fxConversion,
        sources: basePacket.sources,
      });

      const metrics: MetricRow[] = [
        row(
          "CET1",
          bankResearch.reportMetrics.metrics.cet1Ratio.status,
          bankResearch.reportMetrics.metrics.cet1Ratio.valuePct,
          "%",
          [bankResearch.reportMetrics.metrics.cet1Ratio.sourceId],
        ),
        row(
          "ROE",
          bankResearch.reportMetrics.metrics.returnOnEquity.status,
          bankResearch.reportMetrics.metrics.returnOnEquity.valuePct,
          "%",
          [bankResearch.reportMetrics.metrics.returnOnEquity.sourceId],
        ),
        row(
          "Net ECL level",
          bankResearch.reportMetrics.metrics.creditLossRatio.status,
          bankResearch.reportMetrics.metrics.creditLossRatio.valuePct,
          "%",
          [bankResearch.reportMetrics.metrics.creditLossRatio.sourceId],
        ),
        row(
          "Cost/income",
          bankResearch.reportMetrics.metrics.costIncomeRatio.status,
          bankResearch.reportMetrics.metrics.costIncomeRatio.valuePct,
          "%",
          [bankResearch.reportMetrics.metrics.costIncomeRatio.sourceId],
        ),
        row(
          "LCR",
          bankResearch.funding.metrics.liquidityCoverageRatio.status,
          bankResearch.funding.metrics.liquidityCoverageRatio.valuePct,
          "%",
          [bankResearch.funding.metrics.liquidityCoverageRatio.sourceId],
        ),
        row(
          "NSFR",
          bankResearch.funding.metrics.netStableFundingRatio.status,
          bankResearch.funding.metrics.netStableFundingRatio.valuePct,
          "%",
          [bankResearch.funding.metrics.netStableFundingRatio.sourceId],
        ),
        row(
          "Capital buffer",
          bankResearch.capital.reportedCapitalBuffer.status,
          bankResearch.capital.reportedCapitalBuffer.valuePctPoints,
          "pp",
          [bankResearch.capital.reportedCapitalBuffer.sourceId],
        ),
        row(
          "P/B",
          bankResearch.valuation.status,
          bankResearch.valuation.priceToBook,
          "x",
          bankResearch.valuation.provenance.sourceIds,
        ),
      ];

      const sourceBoundCore = metrics
        .slice(0, 7)
        .every((metric) => metricConfirmedAndKnown(metric, knownSourceIds));
      const valuationTraceable =
        bankResearch.valuation.status === "traceable" &&
        bankResearch.valuation.priceToBook !== null &&
        sourceIdsKnown(bankResearch.valuation.provenance.sourceIds, knownSourceIds);
      const provenanceReady = sourceBoundCore && valuationTraceable;
      const canaryReady =
        classificationReady &&
        bankResearch.status === "research_ready" &&
        provenanceReady;
      const blockers = [...bankResearch.blockers];
      if (!classificationReady) blockers.push("specialist_canary_classification_mismatch");
      if (!provenanceReady) blockers.push("specialist_canary_provenance_incomplete");

      return noStore(NextResponse.json({
        status: canaryReady ? "research_ready" : "research_blocked",
        canaryReady,
        message: canaryReady
          ? "SEB specialist Research är research_ready med source-bound kärnmått."
          : "SEB specialist Research förblir fail-closed; se blockerare och metric provenance.",
        researchStatus: bankResearch.status,
        provenanceReady,
        blockers: [...new Set(blockers)],
        warnings: bankResearch.warnings,
        metrics,
        ...common,
      }));
    }

    const specialistResearch = buildFinancialSpecialistResearch({ basePacket });
    const metrics: MetricRow[] = [
      row(
        "NAV/share",
        specialistResearch.metrics.navPerShare.status,
        specialistResearch.metrics.navPerShare.value,
        specialistResearch.metrics.navPerShare.unit,
        specialistResearch.metrics.navPerShare.sourceIds,
      ),
      row(
        "Discount/premium to NAV",
        specialistResearch.metrics.discountToNavPct.status,
        specialistResearch.metrics.discountToNavPct.value,
        specialistResearch.metrics.discountToNavPct.unit,
        specialistResearch.metrics.discountToNavPct.sourceIds,
      ),
      row(
        "Total AUM",
        specialistResearch.metrics.totalAumEurBn.status,
        specialistResearch.metrics.totalAumEurBn.value,
        specialistResearch.metrics.totalAumEurBn.unit,
        specialistResearch.metrics.totalAumEurBn.sourceIds,
      ),
      row(
        "Fee-generating AUM",
        specialistResearch.metrics.feeGeneratingAumEurBn.status,
        specialistResearch.metrics.feeGeneratingAumEurBn.value,
        specialistResearch.metrics.feeGeneratingAumEurBn.unit,
        specialistResearch.metrics.feeGeneratingAumEurBn.sourceIds,
      ),
      row(
        "Trailing P/E",
        specialistResearch.metrics.trailingPe.status,
        specialistResearch.metrics.trailingPe.value,
        specialistResearch.metrics.trailingPe.unit,
        specialistResearch.metrics.trailingPe.sourceIds,
      ),
    ];

    const marketSourceIds = common.marketSourceIds;
    const totalAum = metrics[2]!;
    const feeAum = metrics[3]!;
    const trailingPe = metrics[4]!;
    const investmentCompanyInputsTraceable = investmentCompanyDiscountProvenanceReady({
      navPerShare: specialistResearch.metrics.navPerShare,
      discountToNavPct: specialistResearch.metrics.discountToNavPct,
      marketSourceIds,
      knownSourceIds,
    });
    const assetManagerInputsTraceable =
      metricConfirmedAndKnown(totalAum, knownSourceIds) &&
      metricConfirmedAndKnown(feeAum, knownSourceIds) &&
      metricConfirmedAndKnown(trailingPe, knownSourceIds);
    const provenanceReady = target.expectedType === "investment_company"
      ? investmentCompanyInputsTraceable
      : assetManagerInputsTraceable;
    const canaryReady =
      classificationReady &&
      specialistResearch.status === "research_ready" &&
      provenanceReady;
    const blockers = [...specialistResearch.blockers];
    if (!classificationReady) blockers.push("specialist_canary_classification_mismatch");
    if (!provenanceReady) blockers.push("specialist_canary_provenance_incomplete");

    return noStore(NextResponse.json({
      status: canaryReady ? "research_ready" : "research_blocked",
      canaryReady,
      message: canaryReady
        ? `${targetKey} specialist Research är research_ready med spårbara deterministiska input.`
        : `${targetKey} specialist Research förblir fail-closed; se blockerare och metric provenance.`,
      researchStatus: specialistResearch.status,
      provenanceReady,
      blockers: [...new Set(blockers)],
      warnings: specialistResearch.warnings,
      metrics,
      ...common,
    }));
  } catch (error) {
    console.error("[specialist-research-canary] failed", {
      target: targetKey,
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return failure(
      "canary_execution_failed",
      "Specialist-canaryn kunde inte slutföra den bounded Research-körningen.",
      503,
      { target: targetKey },
    );
  }
}
