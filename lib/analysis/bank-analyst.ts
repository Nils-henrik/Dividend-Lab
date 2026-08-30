import "server-only";

import { APICallError, generateText, Output } from "ai";
import {
  MODEL_PORTFOLIO_AI_MODELS,
  estimateAiCostUsdMicros,
  resolveModelPortfolioAiConfig,
  type ModelPortfolioAiModel,
} from "@/lib/model-portfolios/engine/ai";
import { resolveDivLabAnalystAiConfig } from "./analyst-auth";
import type { DivLabAnalystUsage } from "./analyst";
import { validateBankAnalystDraftAgainstResearch } from "./bank-analyst-contract";
import {
  DIVLAB_BANK_ANALYST_SCHEMA_VERSION,
  divLabBankAnalystDraftSchema,
  type DivLabBankAnalystDraft,
} from "./bank-analyst-schema";
import {
  buildBankAnalystFacts,
  buildBankAnalystSystemMandate,
  DIVLAB_BANK_ANALYST_AI_BUDGET,
} from "./bank-analyst-prompt";
import type { DivLabBankResearch } from "./bank-research";
import type { DivLabResearchPacket } from "./deep-research";

export async function generateDivLabBankAnalystDraft(input: {
  packet: DivLabResearchPacket;
  bankResearch: DivLabBankResearch;
  useEscalationModel?: boolean;
}): Promise<{
  draft: DivLabBankAnalystDraft;
  model: ModelPortfolioAiModel;
  usage: DivLabAnalystUsage;
}> {
  if (input.packet.companyClassification.type !== "bank") {
    throw new Error("divlab_bank_analyst_requires_bank_classification");
  }
  if (input.bankResearch.status !== "research_ready") {
    throw new Error("divlab_bank_analyst_research_not_ready");
  }

  const primaryEvidence = input.packet.evidence.some(
    (item) =>
      item.primary &&
      item.documentRetrieved &&
      item.kind === "official_report_excerpt" &&
      item.content.trim().length >= 200,
  );
  if (!primaryEvidence) throw new Error("divlab_bank_analyst_primary_evidence_missing");

  const config = resolveDivLabAnalystAiConfig({
    baseConfig: resolveModelPortfolioAiConfig(),
    models: MODEL_PORTFOLIO_AI_MODELS,
  });
  if (!config.configured) throw new Error(config.reason);
  const model = input.useEscalationModel ? config.escalationModel : config.primaryModel;

  let result: Awaited<ReturnType<typeof generateText>>;
  try {
    result = await generateText({
      model,
      output: Output.object({
        schema: divLabBankAnalystDraftSchema,
        name: "divlab_bank_analyst_draft",
        description:
          "A source-grounded DivLab bank equity-analysis v3 draft. P/B is mandatory and final scenario values are calculated deterministically outside the model.",
      }),
      system: buildBankAnalystSystemMandate(),
      prompt: [
        "VERIFIERAT BANK-RESEARCHUNDERLAG:",
        buildBankAnalystFacts({ packet: input.packet, bankResearch: input.bankResearch }),
        "UPPGIFT:",
        "Analysera banken enligt analyst-v3-bank. Bedöm bankFactors källkritiskt. Fyll valuationInterpretation med en spårbar priceToBook-post och endast dessutom P/E om P/E är available=true och traceable=true i underlaget.",
        "För Bear/Base/Bull ska du föreslå antaganden för bokvärdestillväxt och P/B i samtliga scenarier. Du får dessutom använda EPS-tillväxt och P/E när den spårbara EPS/P-E-basen finns. Räkna inte ut slutvärden eller upp-/nedsida själv.",
        `Alla scenarier ska använda ${input.packet.instrument.currency} och samma forecastYears.`,
        `Schema-version: ${DIVLAB_BANK_ANALYST_SCHEMA_VERSION}.`,
      ].join("\n\n"),
      maxOutputTokens: DIVLAB_BANK_ANALYST_AI_BUDGET.maxOutputTokens,
      temperature: 0.1,
      providerOptions: {
        gateway: {
          tags: ["divlab", "analysis", "deep-research", "analyst-v3-bank"],
        },
      },
    });
  } catch (error) {
    if (APICallError.isInstance(error) && error.statusCode === 401) {
      throw new Error("gateway_auth_missing");
    }
    throw error;
  }

  if (!result.output) throw new Error("divlab_bank_analyst_output_missing");
  validateBankAnalystDraftAgainstResearch({
    packet: input.packet,
    bankResearch: input.bankResearch,
    draft: result.output,
  });

  const inputTokens = Number((result.usage ?? result.totalUsage)?.inputTokens ?? 0);
  const outputTokens = Number((result.usage ?? result.totalUsage)?.outputTokens ?? 0);
  const totalTokens = Number(
    (result.usage ?? result.totalUsage)?.totalTokens ?? inputTokens + outputTokens,
  );
  const estimatedCostUsdMicros = estimateAiCostUsdMicros({
    model,
    inputTokens,
    outputTokens,
  });

  return {
    draft: result.output,
    model,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCostUsdMicros,
    },
  };
}
