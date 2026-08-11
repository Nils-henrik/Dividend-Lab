/**
 * DivBrain application-service orchestration (Ticket 1A-7b / Issue #105).
 *
 * Canonical submitMessage lifecycle:
 * authenticate → access gate → validate → guardrails →
 * blocked (no persist / no reservation) | allowed (ownership → history →
 * persist user → context → map → Cost Guard atomic reserve → provider →
 * finalize usage accounting → persist terminal assistant → safe response).
 *
 * Real AI Gateway generation is impossible without a successful reservation.
 * Accounting finalizes before assistant persistence so paid attempts remain
 * represented even if transcript persistence fails. Provider generate is
 * invoked at most once (no retry path).
 * Production default remains UnconfiguredProvider until Founder activation.
 * This module must never be imported by client components.
 */

import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "../../constants";
import {
  createDivBrainError,
  type DivBrainErrorCode,
} from "../../errors";
import type { DivBrainGuardrailAssessment } from "../../guardrails";
import type { DivBrainResult } from "../../results";
import {
  divBrainFailureFromCode,
  divBrainSuccess,
} from "../../results";
import { parseDivBrainSources, type DivBrainSource } from "../../sources";
import type { DivBrainMessage } from "../../types";
import { normalizeDivBrainMessageContent } from "../../validation";
import { assembleDivBrainContext } from "../context/assemble";
import { mapAssembledContextToProviderRequest } from "../context/to-provider-request";
import { evaluateDivBrainGuardrails } from "../guardrails";
import {
  DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_DEFAULT,
  DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_HARD_CAP,
  DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_MIN,
} from "../providers/candidates";
import {
  createDenyAllDivBrainCostGuard,
  providerRequiresDivBrainCostGuard,
  type DivBrainCostGuardDecision,
} from "../providers/cost-guard";
import {
  mapUnknownToDivBrainProviderResult,
  normalizeDivBrainProviderResult,
} from "../providers/provider";
import type { DivBrainProvider } from "../providers/provider";
import type {
  DivBrainProviderResult,
  DivBrainProviderUsage,
} from "../providers/types";
import {
  DIVBRAIN_PROVIDER_TIMEOUT_MS_MAX,
  DIVBRAIN_PROVIDER_TIMEOUT_MS_MIN,
} from "../providers/types";
import { createUnconfiguredProvider } from "../providers/unconfigured-provider";
import { accountDivBrainProviderUsage } from "../providers/usage-accounting";
import type { DivBrainConversationRepository } from "../repository/repository";
import type { DivBrainUsageTerminalStatus } from "../repository/usage-ledger-persistence";
import { loadBoundedDivBrainHistory } from "./history";
import {
  parseDivBrainSubmitMessageInput,
  resolveDivBrainSubmitMessageContent,
} from "./input";
import type {
  CreateDivBrainApplicationServiceDeps,
  DivBrainApplicationService,
  DivBrainSubmitMessageOptions,
  DivBrainSubmitMessageOutcome,
} from "./types";
import { DIVBRAIN_APPLICATION_PROVIDER_TIMEOUT_MS_DEFAULT } from "./types";
import {
  prepareDivBrainAttachmentsForGeneration,
  prepareRecentDivBrainAttachmentContext,
  validateDivBrainAttachmentBatchLimits,
} from "../attachments";
import type { DivBrainPreparedAttachmentPayload } from "../attachments/types";
import type { DivBrainProviderFilePart } from "../providers/types";

function isFiniteTimeoutMs(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= DIVBRAIN_PROVIDER_TIMEOUT_MS_MIN &&
    value <= DIVBRAIN_PROVIDER_TIMEOUT_MS_MAX
  );
}

function resolveProviderModelId(
  deps: CreateDivBrainApplicationServiceDeps,
): string | null {
  if (
    typeof deps.providerModelId === "string" &&
    deps.providerModelId.trim().length > 0
  ) {
    return deps.providerModelId.trim();
  }

  const provider = deps.provider as DivBrainProvider & {
    getModelId?: () => string;
  };
  if (typeof provider.getModelId === "function") {
    const modelId = provider.getModelId();
    if (typeof modelId === "string" && modelId.trim().length > 0) {
      return modelId.trim();
    }
  }

  return null;
}

function resolveProviderMaxOutputTokens(
  deps: CreateDivBrainApplicationServiceDeps,
): number {
  if (
    typeof deps.providerMaxOutputTokens === "number" &&
    Number.isInteger(deps.providerMaxOutputTokens) &&
    deps.providerMaxOutputTokens >= DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_MIN &&
    deps.providerMaxOutputTokens <= DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_HARD_CAP
  ) {
    return deps.providerMaxOutputTokens;
  }

  const provider = deps.provider as DivBrainProvider & {
    getMaxOutputTokens?: () => number;
  };
  if (typeof provider.getMaxOutputTokens === "function") {
    const value = provider.getMaxOutputTokens();
    if (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_MIN &&
      value <= DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_HARD_CAP
    ) {
      return value;
    }
  }

  return DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_DEFAULT;
}

function usageFromProviderResult(
  providerResult: DivBrainProviderResult,
): DivBrainProviderUsage | undefined {
  return providerResult.usage;
}

function terminalStatusForUsage(
  providerResult: DivBrainProviderResult,
): DivBrainUsageTerminalStatus {
  if (providerResult.status === "completed") {
    return "completed";
  }
  if (providerResult.status === "cancelled") {
    return "cancelled";
  }
  if (providerResult.status === "provider_unavailable") {
    return "provider_unavailable";
  }
  return "failed";
}

function assertServiceDeps(
  deps: CreateDivBrainApplicationServiceDeps,
): void {
  if (
    typeof deps !== "object" ||
    deps === null ||
    typeof deps.actorResolver?.resolveActor !== "function" ||
    typeof deps.accessGate?.checkAccess !== "function" ||
    typeof deps.repository?.getConversation !== "function" ||
    typeof deps.repository?.listMessages !== "function" ||
    typeof deps.repository?.createMessage !== "function" ||
    typeof deps.guardrailEvaluator?.evaluate !== "function" ||
    typeof deps.contextAssembler?.assemble !== "function" ||
    typeof deps.providerRequestMapper?.map !== "function" ||
    typeof deps.provider?.generate !== "function" ||
    !isFiniteTimeoutMs(deps.providerTimeoutMs)
  ) {
    throw new Error("DivBrain application service: invalid dependencies");
  }

  if (
    deps.costGuard !== undefined &&
    typeof deps.costGuard.reserve !== "function"
  ) {
    throw new Error("DivBrain application service: invalid cost guard");
  }

  if (
    deps.usageLedger !== undefined &&
    (typeof deps.usageLedger.reserveBudget !== "function" ||
      typeof deps.usageLedger.finalizeBudget !== "function" ||
      typeof deps.usageLedger.sumReservedCostMicroUsdForUtcDay !== "function" ||
      typeof deps.usageLedger.sumReservedCostMicroUsdForUtcMonth !== "function")
  ) {
    throw new Error("DivBrain application service: invalid usage ledger");
  }
}

function catalogContent(code: DivBrainErrorCode): string {
  return createDivBrainError(code).message;
}

function normalizeCompletedProviderText(
  text: unknown,
): DivBrainResult<string> {
  if (typeof text !== "string") {
    return divBrainFailureFromCode("internal_error");
  }

  return normalizeDivBrainMessageContent(text);
}

function resolveCompletedSources(
  providerResult: Extract<DivBrainProviderResult, { status: "completed" }>,
): DivBrainResult<readonly DivBrainSource[]> {
  if (providerResult.sources === undefined) {
    return divBrainSuccess([]);
  }

  return parseDivBrainSources(providerResult.sources);
}

async function persistFailedAssistant(params: {
  repository: DivBrainConversationRepository;
  actorId: string;
  conversationId: string;
  assessment: DivBrainGuardrailAssessment;
  errorCode: DivBrainErrorCode;
}): Promise<DivBrainResult<DivBrainMessage>> {
  return params.repository.createMessage({
    actorId: params.actorId,
    conversationId: params.conversationId,
    role: "assistant",
    content: catalogContent(params.errorCode),
    completionStatus: "failed",
    safetyClassification: params.assessment.decision,
    sources: [],
    errorCode: params.errorCode,
  });
}

async function persistTerminalAssistant(params: {
  repository: DivBrainConversationRepository;
  actorId: string;
  conversationId: string;
  assessment: DivBrainGuardrailAssessment;
  providerResult: DivBrainProviderResult;
}): Promise<DivBrainResult<DivBrainMessage>> {
  const { providerResult, assessment } = params;

  if (providerResult.status === "completed") {
    const textResult = normalizeCompletedProviderText(providerResult.text);
    if (!textResult.ok) {
      return persistFailedAssistant({
        repository: params.repository,
        actorId: params.actorId,
        conversationId: params.conversationId,
        assessment,
        errorCode: "internal_error",
      });
    }

    if (textResult.data.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH) {
      return persistFailedAssistant({
        repository: params.repository,
        actorId: params.actorId,
        conversationId: params.conversationId,
        assessment,
        errorCode: "internal_error",
      });
    }

    const sourcesResult = resolveCompletedSources(providerResult);
    if (!sourcesResult.ok) {
      return persistFailedAssistant({
        repository: params.repository,
        actorId: params.actorId,
        conversationId: params.conversationId,
        assessment,
        errorCode: "internal_error",
      });
    }

    return params.repository.createMessage({
      actorId: params.actorId,
      conversationId: params.conversationId,
      role: "assistant",
      content: textResult.data,
      completionStatus: "completed",
      safetyClassification: assessment.decision,
      sources: [...sourcesResult.data],
      errorCode: null,
    });
  }

  if (providerResult.status === "cancelled") {
    return params.repository.createMessage({
      actorId: params.actorId,
      conversationId: params.conversationId,
      role: "assistant",
      content: catalogContent("cancelled"),
      completionStatus: "cancelled",
      safetyClassification: assessment.decision,
      sources: [],
      errorCode: "cancelled",
    });
  }

  if (providerResult.status === "provider_unavailable") {
    return params.repository.createMessage({
      actorId: params.actorId,
      conversationId: params.conversationId,
      role: "assistant",
      content: catalogContent("provider_unavailable"),
      completionStatus: "provider_unavailable",
      safetyClassification: assessment.decision,
      sources: [],
      errorCode: "provider_unavailable",
    });
  }

  const failedCode = providerResult.error.code;
  return params.repository.createMessage({
    actorId: params.actorId,
    conversationId: params.conversationId,
    role: "assistant",
    content: catalogContent(failedCode),
    completionStatus: "failed",
    safetyClassification: assessment.decision,
    sources: [],
    errorCode: failedCode,
  });
}

function toTerminalOutcome(params: {
  status: "completed" | "provider_unavailable" | "failed" | "cancelled";
  assessment: DivBrainGuardrailAssessment;
  userMessage: DivBrainMessage;
  assistantMessage: DivBrainMessage;
}): DivBrainSubmitMessageOutcome {
  return {
    status: params.status,
    persisted: true,
    guardrailAssessment: params.assessment,
    userMessage: params.userMessage,
    assistantMessage: params.assistantMessage,
  };
}

async function recoverAfterUserPersistence(params: {
  repository: DivBrainConversationRepository;
  actorId: string;
  conversationId: string;
  assessment: DivBrainGuardrailAssessment;
  userMessage: DivBrainMessage;
  errorCode: DivBrainErrorCode;
}): Promise<DivBrainResult<DivBrainSubmitMessageOutcome>> {
  const assistantResult = await persistFailedAssistant({
    repository: params.repository,
    actorId: params.actorId,
    conversationId: params.conversationId,
    assessment: params.assessment,
    errorCode: params.errorCode,
  });

  if (!assistantResult.ok) {
    return divBrainFailureFromCode("persistence_failed");
  }

  return divBrainSuccess(
    toTerminalOutcome({
      status: "failed",
      assessment: params.assessment,
      userMessage: params.userMessage,
      assistantMessage: assistantResult.data,
    }),
  );
}

/**
 * Create the DivBrain application service.
 */
export function createDivBrainApplicationService(
  deps: CreateDivBrainApplicationServiceDeps,
): DivBrainApplicationService {
  assertServiceDeps(deps);

  return {
    async submitMessage(
      input: unknown,
      options?: DivBrainSubmitMessageOptions,
    ): Promise<DivBrainResult<DivBrainSubmitMessageOutcome>> {
      const actorResult = await deps.actorResolver.resolveActor();
      if (!actorResult.ok) {
        return actorResult;
      }

      const actorId = actorResult.data.actorId;

      const accessResult = await deps.accessGate.checkAccess(actorId);
      if (!accessResult.ok) {
        return accessResult;
      }

      const parsed = parseDivBrainSubmitMessageInput(input);
      if (!parsed.ok) {
        return parsed;
      }

      const { conversationId, attachmentIds } = parsed.data;
      let content = parsed.data.content;

      let resolvedAttachments: Awaited<
        ReturnType<
          NonNullable<
            CreateDivBrainApplicationServiceDeps["attachmentRepository"]
          >["resolveReadyAttachmentsForSubmit"]
        >
      > | null = null;

      if (attachmentIds.length > 0) {
        if (!deps.attachmentRepository) {
          return divBrainFailureFromCode("internal_error");
        }

        const resolved =
          await deps.attachmentRepository.resolveReadyAttachmentsForSubmit({
            actorId,
            conversationId,
            attachmentIds,
          });
        if (!resolved.ok) {
          return resolved;
        }

        const batchLimits = validateDivBrainAttachmentBatchLimits(
          resolved.data.map((item) => item.byteSize),
        );
        if (!batchLimits.ok) {
          return divBrainFailureFromCode("invalid_request");
        }

        resolvedAttachments = resolved;

        const contentResult = resolveDivBrainSubmitMessageContent({
          content,
          filenames: resolved.data.map((item) => item.originalFilename),
        });
        if (!contentResult.ok) {
          return contentResult;
        }
        content = contentResult.data;
      }

      const guardrailResult = deps.guardrailEvaluator.evaluate(content);
      if (!guardrailResult.ok) {
        return guardrailResult;
      }

      const assessment = guardrailResult.data;

      if (assessment.decision === "block") {
        return divBrainSuccess({
          status: "blocked",
          persisted: false,
          error: createDivBrainError("safety_blocked"),
          guardrailAssessment: assessment,
        });
      }

      const conversationResult = await deps.repository.getConversation({
        actorId,
        conversationId,
      });
      if (!conversationResult.ok) {
        return conversationResult;
      }

      if (conversationResult.data.archivedAt != null) {
        return divBrainFailureFromCode("invalid_request");
      }

      let currentAttachmentPayload: DivBrainPreparedAttachmentPayload | null =
        null;
      const extraSources: DivBrainSource[] = [];
      const userOwnedContextBlocks: string[] = [];
      const currentUserFileParts: DivBrainProviderFilePart[] = [];

      if (resolvedAttachments?.ok && resolvedAttachments.data.length > 0) {
        if (!deps.attachmentRepository) {
          return divBrainFailureFromCode("internal_error");
        }

        const prepared = await prepareDivBrainAttachmentsForGeneration({
          repository: deps.attachmentRepository,
          actorId,
          attachments: resolvedAttachments.data,
        });
        if (!prepared.ok) {
          return prepared;
        }

        currentAttachmentPayload = prepared.data;
        extraSources.push(...prepared.data.sources);
        userOwnedContextBlocks.push(...prepared.data.extractedTextBlocks);
        currentUserFileParts.push(...prepared.data.fileParts);
      }

      const historyResult = await loadBoundedDivBrainHistory({
        repository: deps.repository,
        actorId,
        conversationId,
      });
      if (!historyResult.ok) {
        return historyResult;
      }

      // Bounded recent-attachment follow-up context (not every historical file).
      if (deps.attachmentRepository) {
        const recent = await prepareRecentDivBrainAttachmentContext({
          repository: deps.attachmentRepository,
          actorId,
          conversationId,
          excludeAttachmentIds: attachmentIds,
        });
        if (recent.ok) {
          extraSources.push(...recent.data.sources);
          userOwnedContextBlocks.push(...recent.data.extractedTextBlocks);
          currentUserFileParts.push(...recent.data.fileParts);
        }
      }

      const userMessageResult = await deps.repository.createMessage({
        actorId,
        conversationId,
        role: "user",
        content,
        completionStatus: "completed",
        safetyClassification: assessment.decision,
        errorCode: null,
      });
      if (!userMessageResult.ok) {
        return userMessageResult;
      }

      const userMessage = userMessageResult.data;

      if (
        currentAttachmentPayload &&
        deps.attachmentRepository &&
        currentAttachmentPayload.attachmentIds.length > 0
      ) {
        const linked = await deps.attachmentRepository.linkToMessage({
          actorId,
          conversationId,
          messageId: userMessage.id,
          attachmentIds: currentAttachmentPayload.attachmentIds,
        });
        if (!linked.ok) {
          return recoverAfterUserPersistence({
            repository: deps.repository,
            actorId,
            conversationId,
            assessment,
            userMessage,
            errorCode: linked.error.code,
          });
        }
      }

      const assembledResult = deps.contextAssembler.assemble({
        currentUserMessage: content,
        conversationId,
        history: historyResult.data,
        guardrailConstraints:
          assessment.decision === "allow_with_constraints"
            ? assessment.constraints
            : [],
        sources: extraSources,
      });
      if (!assembledResult.ok) {
        return recoverAfterUserPersistence({
          repository: deps.repository,
          actorId,
          conversationId,
          assessment,
          userMessage,
          errorCode: assembledResult.error.code,
        });
      }

      const providerRequestResult = deps.providerRequestMapper.map(
        assembledResult.data,
        {
          timeoutMs: deps.providerTimeoutMs,
          ...(options?.signal !== undefined
            ? { signal: options.signal }
            : {}),
          ...(currentUserFileParts.length > 0
            ? { currentUserFileParts }
            : {}),
          ...(userOwnedContextBlocks.length > 0
            ? { userOwnedContextBlocks }
            : {}),
        },
      );
      if (!providerRequestResult.ok) {
        return recoverAfterUserPersistence({
          repository: deps.repository,
          actorId,
          conversationId,
          assessment,
          userMessage,
          errorCode: providerRequestResult.error.code,
        });
      }

      const requiresCostGuard = providerRequiresDivBrainCostGuard(
        deps.provider.id,
      );
      let costGuardDecision: DivBrainCostGuardDecision | null = null;

      if (requiresCostGuard) {
        const modelId = resolveProviderModelId(deps);
        const maxOutputTokens = resolveProviderMaxOutputTokens(deps);
        const costGuard =
          deps.costGuard ?? createDenyAllDivBrainCostGuard("config_invalid");

        if (!modelId || !deps.usageLedger) {
          costGuardDecision = { allow: false, reason: "config_invalid" };
        } else {
          costGuardDecision = await costGuard.reserve({
            actorId,
            conversationId,
            providerId: deps.provider.id,
            request: providerRequestResult.data,
            modelId,
            maxOutputTokens,
          });
        }

        if (!costGuardDecision.allow) {
          // Budget / config denial: zero provider/network calls; calm rate_limited.
          const deniedResult: DivBrainProviderResult = {
            status: "failed",
            error: createDivBrainError("rate_limited"),
          };

          const assistantResult = await persistTerminalAssistant({
            repository: deps.repository,
            actorId,
            conversationId,
            assessment,
            providerResult: deniedResult,
          });

          if (!assistantResult.ok) {
            return divBrainFailureFromCode("persistence_failed");
          }

          return divBrainSuccess(
            toTerminalOutcome({
              status: "failed",
              assessment,
              userMessage,
              assistantMessage: assistantResult.data,
            }),
          );
        }
      }

      let providerResult: DivBrainProviderResult;
      try {
        if (options?.signal?.aborted) {
          providerResult = { status: "cancelled" };
        } else {
          // Single generate attempt — no retry path that could double-bill.
          const raw = await deps.provider.generate(providerRequestResult.data);
          providerResult = normalizeDivBrainProviderResult(raw);
        }
      } catch (error) {
        providerResult = mapUnknownToDivBrainProviderResult(error);
      }

      // Finalize reserved spend BEFORE assistant persistence so a transcript
      // failure cannot erase paid/attempted cost from hard-limit accounting.
      // Hard limits continue to use reserved_cost even if finalize fails.
      if (requiresCostGuard && costGuardDecision?.allow && deps.usageLedger) {
        const modelId = resolveProviderModelId(deps);
        if (modelId) {
          const maxOutputTokens = resolveProviderMaxOutputTokens(deps);
          const accounted = accountDivBrainProviderUsage({
            modelId,
            usage: usageFromProviderResult(providerResult),
            gatewayCostMicroUsd: providerResult.gatewayCostMicroUsd,
            failClosedCeilingMicroUsd: costGuardDecision.projectedCostMicroUsd,
            estimatedInputTokens: costGuardDecision.estimatedInputTokens,
            maxOutputTokens,
          });

          await deps.usageLedger.finalizeBudget({
            reservationId: costGuardDecision.reservationId,
            accountedCostMicroUsd: accounted.costMicroUsd,
            costSource: accounted.costSource,
            terminalStatus: terminalStatusForUsage(providerResult),
            inputTokens: accounted.inputTokens,
            outputTokens: accounted.outputTokens,
            totalTokens: accounted.totalTokens,
            latencyMs: providerResult.latencyMs ?? null,
            messageId: null,
          });
        }
      }

      // Malformed completed text / sources become a failed terminal via
      // persistTerminalAssistant (safe catalog content, no raw provider text).
      const assistantResult = await persistTerminalAssistant({
        repository: deps.repository,
        actorId,
        conversationId,
        assessment,
        providerResult,
      });

      if (!assistantResult.ok) {
        // Cost already reserved (+ ideally finalized). Do not retry generate.
        return divBrainFailureFromCode("persistence_failed");
      }

      const assistantMessage = assistantResult.data;

      if (providerResult.status === "completed") {
        if (assistantMessage.completionStatus === "completed") {
          return divBrainSuccess(
            toTerminalOutcome({
              status: "completed",
              assessment,
              userMessage,
              assistantMessage,
            }),
          );
        }

        return divBrainSuccess(
          toTerminalOutcome({
            status: "failed",
            assessment,
            userMessage,
            assistantMessage,
          }),
        );
      }

      if (providerResult.status === "cancelled") {
        return divBrainSuccess(
          toTerminalOutcome({
            status: "cancelled",
            assessment,
            userMessage,
            assistantMessage,
          }),
        );
      }

      if (providerResult.status === "provider_unavailable") {
        return divBrainSuccess(
          toTerminalOutcome({
            status: "provider_unavailable",
            assessment,
            userMessage,
            assistantMessage,
          }),
        );
      }

      return divBrainSuccess(
        toTerminalOutcome({
          status: "failed",
          assessment,
          userMessage,
          assistantMessage,
        }),
      );
    },
  };
}

/**
 * Build deps with approved default evaluator / assembler / mapper / provider.
 * Actor resolver, access gate, and repository remain required.
 */
export function createDivBrainApplicationServiceDeps(params: {
  actorResolver: CreateDivBrainApplicationServiceDeps["actorResolver"];
  accessGate: CreateDivBrainApplicationServiceDeps["accessGate"];
  repository: DivBrainConversationRepository;
  provider?: DivBrainProvider;
  providerTimeoutMs?: number;
  guardrailEvaluator?: CreateDivBrainApplicationServiceDeps["guardrailEvaluator"];
  contextAssembler?: CreateDivBrainApplicationServiceDeps["contextAssembler"];
  providerRequestMapper?: CreateDivBrainApplicationServiceDeps["providerRequestMapper"];
  costGuard?: CreateDivBrainApplicationServiceDeps["costGuard"];
  usageLedger?: CreateDivBrainApplicationServiceDeps["usageLedger"];
  providerModelId?: string;
  providerMaxOutputTokens?: number;
  attachmentRepository?: CreateDivBrainApplicationServiceDeps["attachmentRepository"];
}): CreateDivBrainApplicationServiceDeps {
  return {
    actorResolver: params.actorResolver,
    accessGate: params.accessGate,
    repository: params.repository,
    provider: params.provider ?? createUnconfiguredProvider(),
    providerTimeoutMs:
      params.providerTimeoutMs ??
      DIVBRAIN_APPLICATION_PROVIDER_TIMEOUT_MS_DEFAULT,
    guardrailEvaluator: params.guardrailEvaluator ?? {
      evaluate: evaluateDivBrainGuardrails,
    },
    contextAssembler: params.contextAssembler ?? {
      assemble: assembleDivBrainContext,
    },
    providerRequestMapper: params.providerRequestMapper ?? {
      map: mapAssembledContextToProviderRequest,
    },
    ...(params.costGuard !== undefined ? { costGuard: params.costGuard } : {}),
    ...(params.usageLedger !== undefined
      ? { usageLedger: params.usageLedger }
      : {}),
    ...(params.providerModelId !== undefined
      ? { providerModelId: params.providerModelId }
      : {}),
    ...(params.providerMaxOutputTokens !== undefined
      ? { providerMaxOutputTokens: params.providerMaxOutputTokens }
      : {}),
    ...(params.attachmentRepository !== undefined
      ? { attachmentRepository: params.attachmentRepository }
      : {}),
  };
}
