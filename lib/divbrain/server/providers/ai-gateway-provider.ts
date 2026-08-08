/**
 * Vercel AI Gateway adapter implementing DivBrainProvider (Ticket 1B-1).
 *
 * Server-only. No streaming. Never surfaces raw gateway/provider payloads.
 * Model id comes from server construction options — never browser input.
 *
 * This module must never be imported by client components.
 */

import { createGateway, generateText as defaultGenerateText } from "ai";
import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "../../constants";
import { createDivBrainError } from "../../errors";
import {
  DIVBRAIN_AI_GATEWAY_PROVIDER_ID,
  DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_DEFAULT,
  DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_HARD_CAP,
  DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_MIN,
  isDivBrainGatewayModelId,
} from "./candidates";
import { mapGatewayErrorToDivBrainProviderResult } from "./gateway-errors";
import type { DivBrainProvider } from "./provider";
import { mapDivBrainRequestToGatewayPrompt } from "./request-mapping";
import type {
  DivBrainProviderRequest,
  DivBrainProviderResult,
  DivBrainProviderUsage,
} from "./types";
import { extractValidatedGatewayCostMicroUsd } from "./usage-accounting";
import {
  normalizeDivBrainProviderUsage,
  validateDivBrainProviderRequest,
} from "./validation";

export type AiGatewayGenerateTextResult = {
  text: string;
  usage?: {
    inputTokens?: number | undefined;
    outputTokens?: number | undefined;
    totalTokens?: number | undefined;
  };
  /**
   * Opaque provider metadata. Only a narrow Gateway cost path is validated
   * via `extractValidatedGatewayCostMicroUsd` — never stored raw.
   */
  providerMetadata?: unknown;
};

export type AiGatewayLanguageModel = string | Parameters<
  typeof defaultGenerateText
>[0]["model"];

export type AiGatewayGenerateText = (params: {
  model: AiGatewayLanguageModel;
  system?: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  maxOutputTokens: number;
  abortSignal?: AbortSignal;
  timeout: number;
  maxRetries: number;
}) => Promise<AiGatewayGenerateTextResult>;

export type AiGatewayProviderOptions = {
  modelId: string;
  maxOutputTokens?: number;
  /** Injected for unit tests — defaults to AI SDK `generateText`. */
  generateText?: AiGatewayGenerateText;
  /**
   * Optional API key for local/non-OIDC environments.
   * Prefer Vercel OIDC on deployment; do not log this value.
   */
  apiKey?: string;
};

function resolveMaxOutputTokens(value: number | undefined): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_MIN ||
    value > DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_HARD_CAP
  ) {
    return DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_DEFAULT;
  }
  return value;
}

function normalizeCompletedText(text: unknown): string | null {
  if (typeof text !== "string") {
    return null;
  }

  const normalized = text.normalize("NFC").trim();
  if (!normalized || normalized.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH) {
    return null;
  }

  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized)) {
    return null;
  }

  return normalized;
}

function toUsage(
  usage: AiGatewayGenerateTextResult["usage"],
): DivBrainProviderUsage {
  return normalizeDivBrainProviderUsage({
    inputTokens: usage?.inputTokens,
    outputTokens: usage?.outputTokens,
    totalTokens: usage?.totalTokens,
  });
}

function resolveLanguageModel(
  modelId: string,
  apiKey: string | undefined,
): AiGatewayLanguageModel {
  if (apiKey) {
    return createGateway({ apiKey })(modelId);
  }

  // Plain creator/model string → AI SDK routes via AI Gateway (OIDC on Vercel).
  return modelId;
}

async function defaultGenerateTextAdapter(
  params: Parameters<AiGatewayGenerateText>[0],
): Promise<AiGatewayGenerateTextResult> {
  const result = await defaultGenerateText({
    model: params.model,
    ...(params.system ? { system: params.system } : {}),
    messages: params.messages,
    maxOutputTokens: params.maxOutputTokens,
    abortSignal: params.abortSignal,
    timeout: params.timeout,
    maxRetries: params.maxRetries,
  });

  return {
    text: result.text,
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      totalTokens: result.usage.totalTokens,
    },
    // Pass through only for narrow validation; never log or persist raw.
    providerMetadata: result.providerMetadata,
  };
}

export class AiGatewayProvider implements DivBrainProvider {
  readonly id = DIVBRAIN_AI_GATEWAY_PROVIDER_ID;
  private readonly modelId: string;
  private readonly maxOutputTokens: number;
  private readonly generateText: AiGatewayGenerateText;
  private readonly languageModel: AiGatewayLanguageModel;

  constructor(options: AiGatewayProviderOptions) {
    if (!isDivBrainGatewayModelId(options.modelId)) {
      throw new Error("DivBrain AI Gateway provider: invalid model id");
    }

    const apiKey =
      typeof options.apiKey === "string" && options.apiKey.trim().length > 0
        ? options.apiKey.trim()
        : undefined;

    this.modelId = options.modelId;
    this.maxOutputTokens = resolveMaxOutputTokens(options.maxOutputTokens);
    this.generateText = options.generateText ?? defaultGenerateTextAdapter;
    this.languageModel = resolveLanguageModel(options.modelId, apiKey);
  }

  getModelId(): string {
    return this.modelId;
  }

  getMaxOutputTokens(): number {
    return this.maxOutputTokens;
  }

  async generate(
    request: DivBrainProviderRequest,
  ): Promise<DivBrainProviderResult> {
    const validated = validateDivBrainProviderRequest(request);
    if (!validated.ok) {
      return {
        status: "failed",
        error: createDivBrainError("invalid_request"),
      };
    }

    if (validated.data.signal?.aborted) {
      return { status: "cancelled" };
    }

    const prompt = mapDivBrainRequestToGatewayPrompt(validated.data);
    if (!prompt) {
      return {
        status: "failed",
        error: createDivBrainError("invalid_request"),
      };
    }

    const startedAt = Date.now();

    try {
      const result = await this.generateText({
        model: this.languageModel,
        ...(prompt.system ? { system: prompt.system } : {}),
        messages: prompt.messages,
        maxOutputTokens: this.maxOutputTokens,
        abortSignal: validated.data.signal,
        timeout: validated.data.timeoutMs,
        maxRetries: 0,
      });

      const latencyMs = Math.max(0, Date.now() - startedAt);
      const usage = toUsage(result.usage);
      const gatewayCostMicroUsd = extractValidatedGatewayCostMicroUsd(
        result.providerMetadata,
      );

      const text = normalizeCompletedText(result.text);
      if (text === null) {
        return {
          status: "failed",
          error: createDivBrainError("internal_error"),
          usage,
          latencyMs,
          ...(gatewayCostMicroUsd !== null
            ? { gatewayCostMicroUsd }
            : {}),
        };
      }

      return {
        status: "completed",
        text,
        usage,
        latencyMs,
        ...(gatewayCostMicroUsd !== null ? { gatewayCostMicroUsd } : {}),
        ...(validated.data.sources.length > 0
          ? { sources: validated.data.sources }
          : {}),
      };
    } catch (error) {
      const latencyMs = Math.max(0, Date.now() - startedAt);
      const mapped = mapGatewayErrorToDivBrainProviderResult(error);
      return {
        ...mapped,
        latencyMs,
      };
    }
  }
}

export function createAiGatewayProvider(
  options: AiGatewayProviderOptions,
): DivBrainProvider {
  return new AiGatewayProvider(options);
}
