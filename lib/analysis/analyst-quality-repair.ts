import "server-only";

import {
  APICallError,
  generateText,
  NoObjectGeneratedError,
  Output,
} from "ai";
import {
  MODEL_PORTFOLIO_AI_MODELS,
  estimateAiCostUsdMicros,
  resolveModelPortfolioAiConfig,
  type ModelPortfolioAiModel,
} from "@/lib/model-portfolios/engine/ai";
import { resolveDivLabAnalystAiConfig } from "./analyst-auth";
import { validateAnalystDraftAgainstPacket } from "./analyst-contract";
import type { DivLabAnalystQualityGate } from "./analyst-quality-gate";
import {
  divLabAnalystDraftSchema,
  divLabAnalystGenerationSchema,
  type DivLabAnalystDraft,
} from "./analyst-schema";
import type { DivLabAnalystUsage } from "./analyst";
import type { DivLabResearchPacket } from "./deep-research";

const QUALITY_REPAIR_BUDGET = {
  maxOutputTokens: 12_000,
  maxEvidenceChars: 14_000,
  maxPromptChars: 64_000,
} as const;

function boundedEvidence(packet: DivLabResearchPacket) {
  const ordered = [...packet.evidence].sort((a, b) => {
    if (a.primary !== b.primary) return a.primary ? -1 : 1;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
  let remaining = QUALITY_REPAIR_BUDGET.maxEvidenceChars;
  const output = [];
  for (const item of ordered) {
    if (remaining <= 0) break;
    const content = item.content.slice(0, Math.min(remaining, 5_500));
    if (!content.trim()) continue;
    output.push({
      id: item.id,
      sourceId: item.sourceId,
      kind: item.kind,
      title: item.title,
      content,
      publishedAt: item.publishedAt,
      primary: item.primary,
      documentRetrieved: item.documentRetrieved,
      reportPeriod: item.reportPeriod,
      reportYear: item.reportYear,
      documentType: item.documentType,
    });
    remaining -= content.length;
  }
  return output;
}

function buildRepairContext(input: {
  factsPacket: DivLabResearchPacket;
  finalPacket: DivLabResearchPacket;
  draft: DivLabAnalystDraft;
  qualityGate: DivLabAnalystQualityGate;
}): string {
  const context = {
    instrument: input.factsPacket.instrument,
    dataAsOf: input.factsPacket.dataAsOf,
    companyClassification: input.factsPacket.companyClassification,
    currencyContext: input.factsPacket.currencyContext,
    fundamental: input.factsPacket.fundamental,
    valuationInputs: input.factsPacket.valuationInputs,
    enterpriseValuationInputs: input.factsPacket.enterpriseValuationInputs,
    trailingValuation: input.factsPacket.valuation.trailing,
    valuationProvenance: input.factsPacket.valuationProvenance,
    technical: input.factsPacket.technical,
    sources: input.factsPacket.sources,
    evidence: boundedEvidence(input.factsPacket),
    deterministicScenarioResult: input.finalPacket.valuation.scenarios,
    currentDraft: input.draft,
    failedQualityGate: {
      score: input.qualityGate.score,
      blockers: input.qualityGate.blockers,
      warnings: input.qualityGate.warnings,
      metrics: input.qualityGate.metrics,
      checks: input.qualityGate.checks,
    },
  };
  const serialized = JSON.stringify(context);
  if (serialized.length > QUALITY_REPAIR_BUDGET.maxPromptChars) {
    throw new Error("divlab_analyst_quality_repair_prompt_too_large");
  }
  return serialized;
}

function readTokenUsage(value: unknown): Omit<DivLabAnalystUsage, "estimatedCostUsdMicros"> {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const inputTokens = Math.max(0, Number(row.inputTokens ?? 0) || 0);
  const outputTokens = Math.max(0, Number(row.outputTokens ?? 0) || 0);
  const totalTokens = Math.max(
    0,
    Number(row.totalTokens ?? inputTokens + outputTokens) || inputTokens + outputTokens,
  );
  return { inputTokens, outputTokens, totalTokens };
}

function usageFor(model: ModelPortfolioAiModel, value: unknown): DivLabAnalystUsage {
  const usage = readTokenUsage(value);
  return {
    ...usage,
    estimatedCostUsdMicros: estimateAiCostUsdMicros({
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    }),
  };
}

function causeName(value: unknown): string {
  if (value instanceof Error && value.name) return value.name;
  if (value && typeof value === "object") {
    const constructorName = (value as { constructor?: { name?: unknown } }).constructor?.name;
    if (typeof constructorName === "string" && constructorName) return constructorName;
  }
  return "unknown";
}

function safeCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.:-]+/g, "_").slice(0, 180);
}

export async function repairDivLabAnalystDraftForQuality(input: {
  factsPacket: DivLabResearchPacket;
  finalPacket: DivLabResearchPacket;
  draft: DivLabAnalystDraft;
  qualityGate: DivLabAnalystQualityGate;
}): Promise<{
  draft: DivLabAnalystDraft;
  model: ModelPortfolioAiModel;
  usage: DivLabAnalystUsage;
}> {
  if (input.qualityGate.publishable) {
    throw new Error("divlab_analyst_quality_repair_not_required");
  }

  const config = resolveDivLabAnalystAiConfig({
    baseConfig: resolveModelPortfolioAiConfig(),
    models: MODEL_PORTFOLIO_AI_MODELS,
  });
  if (!config.configured) throw new Error(config.reason);

  const model = config.escalationModel;
  const prompt = [
    "DIVLAB QUALITY-REPAIR CONTEXT:",
    buildRepairContext(input),
    "UPPGIFT:",
    "Generera ett helt nytt analyst-v2-objekt som behåller verifierade fakta men reparerar samtliga faktiska blockers i failedQualityGate. Kvalitetskraven får inte sänkas och okända fakta får inte hittas på.",
    "REGLER:",
    "- Använd endast sourceIds som finns exakt i sources. Uppfinn aldrig en källa.",
    "- Alla konkreta påståenden ska vara källbundna. valuationInterpretation måste fortsatt följa valuationProvenance exakt.",
    "- Om en qualityFactor saknar tillräckligt stöd i evidence ska assessment vara unknown med tom sourceIds. Markera aldrig en faktor som känd bara för att nå kvalitetsgränsen.",
    "- DivLab kräver minst 6 legitima kända qualityFactors. Om underlaget faktiskt stöder dem ska du använda rätt källor och bedöma dem; annars ska output förbli ärligt otillräcklig och senare gate får stoppa publicering.",
    "- Gör före output en intern faktor-för-faktor-audit av samtliga 11 qualityFactors mot evidence och currentDraft. Bevara redan legitimt kända faktorer och granska särskilt de faktorer som nu är unknown efter explicit, direkt stöd i verifierad evidens. Audit-resultatet ska inte skrivas ut separat.",
    "- För competitiveAdvantage, pricingPower, marketPosition, managementAndCapitalAllocation, reinvestmentRunway, cyclicality, customerConcentration, regulatoryRisk, currencyRisk, acquisitionRisk och disruptionRisk: använd bara en icke-unknown assessment när evidence faktiskt stödjer just den faktorn. Ett generellt bolagspåstående får inte återanvändas som stöd för en annan faktor utan saklig koppling.",
    "- SEC-/primärkälleevidens kan legitimt stödja exempelvis marknadsposition, kundkoncentration, regleringsrisk, valutarisk, förvärvsrisk eller disruptionsrisk när texten uttryckligen behandlar ämnet; gör ingen automatisk positiv/negativ slutsats enbart från att risken nämns.",
    "- Confidence måste kalibreras mot antalet unknown: high högst 2 unknown, medium högst 5 unknown, low är tillåtet vid större osäkerhet.",
    "- Bear/Base/Bull ska använda samma marknadsvaluta och ge deterministiskt ordnade värden Bear < Base < Bull när DivLabs värderingsmotor räknar på dina scenariofält. Utgå från deterministicScenarioResult för att rätta multiplar/antaganden, inte genom att fabricera en DCF eller explicitValuePerShare.",
    "- Bear/Base/Bull ska ha genuint olika assumptions. Kopiera inte samma antagandetext mellan scenarierna.",
    "- view måste vara förenlig med deterministicScenarioResult för base: positive kräver icke-negativ base upside, negative kräver icke-positiv base upside; neutral är tillåtet när värderingen eller evidensen inte motiverar riktning.",
    "- Bevara primary-report-kravet i latestReport och alla valuta-/FX-regler från currentDraft.",
    "- Gör minsta sakliga ändring som behövs för att reparera blockerarna; ändra inte verifierade siffror eller fakta.",
    "- Skriv kompakt, professionell svenska och lämna endast strukturerat objekt enligt schemat.",
  ].join("\n\n");

  try {
    const result = await generateText({
      model,
      output: Output.object({
        schema: divLabAnalystGenerationSchema,
        name: "divlab_analyst_quality_repair",
        description:
          "A complete analyst-v2 object repaired against DivLab's deterministic post-valuation quality blockers.",
      }),
      system:
        "Du är DivLabs kvalitetsreparatör för aktieanalys. Du får endast reparera en redan genererad analys mot explicit verifierade blockers. Du får aldrig sänka kvalitetskrav, hitta på fakta, källor eller värden, eller kringgå fail-closed-publicering.",
      prompt,
      maxOutputTokens: QUALITY_REPAIR_BUDGET.maxOutputTokens,
      providerOptions: {
        openai: { reasoningEffort: "medium" },
        gateway: {
          tags: ["divlab", "analysis", "analyst-v2", "quality-repair"],
        },
      },
    });

    const usage = usageFor(model, result.usage ?? result.totalUsage);
    if (!result.output) {
      throw new Error("divlab_analyst_quality_repair_output_missing");
    }

    const parsed = divLabAnalystDraftSchema.safeParse(result.output);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue?.path?.length ? issue.path.map(String).join(".") : "root";
      throw new Error(
        `divlab_analyst_quality_repair_domain_invalid:${safeCode(path)}:${safeCode(issue?.message ?? "unknown")}`,
      );
    }

    validateAnalystDraftAgainstPacket({
      packet: input.factsPacket,
      draft: parsed.data,
    });

    return {
      draft: parsed.data,
      model,
      usage,
    };
  } catch (error) {
    if (APICallError.isInstance(error) && error.statusCode === 401) {
      throw new Error("gateway_auth_missing");
    }
    if (NoObjectGeneratedError.isInstance(error)) {
      const finishReason = safeCode(String(error.finishReason ?? "unknown"));
      const cause = safeCode(causeName(error.cause));
      console.warn("[divlab-analysis] quality repair structured output failed", {
        model,
        finishReason,
        cause,
      });
      throw new Error(
        `divlab_analyst_quality_repair_no_object:${finishReason}:${cause}`,
      );
    }
    throw error;
  }
}
