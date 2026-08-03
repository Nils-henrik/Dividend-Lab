/**
 * DivBrain application-service orchestration (Ticket 1A-7b).
 *
 * Canonical submitMessage lifecycle:
 * authenticate → access gate → validate → guardrails →
 * blocked (no persist) | allowed (ownership → history → persist user →
 * context → map → provider → persist terminal assistant → safe response).
 *
 * Phase 1A uses UnconfiguredProvider — honest provider_unavailable only.
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
  mapUnknownToDivBrainProviderResult,
  normalizeDivBrainProviderResult,
} from "../providers/provider";
import type { DivBrainProvider } from "../providers/provider";
import type { DivBrainProviderResult } from "../providers/types";
import {
  DIVBRAIN_PROVIDER_TIMEOUT_MS_MAX,
  DIVBRAIN_PROVIDER_TIMEOUT_MS_MIN,
} from "../providers/types";
import { createUnconfiguredProvider } from "../providers/unconfigured-provider";
import type { DivBrainConversationRepository } from "../repository/repository";
import { loadBoundedDivBrainHistory } from "./history";
import { parseDivBrainSubmitMessageInput } from "./input";
import type {
  CreateDivBrainApplicationServiceDeps,
  DivBrainApplicationService,
  DivBrainSubmitMessageOptions,
  DivBrainSubmitMessageOutcome,
} from "./types";
import { DIVBRAIN_APPLICATION_PROVIDER_TIMEOUT_MS_DEFAULT } from "./types";

function isFiniteTimeoutMs(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= DIVBRAIN_PROVIDER_TIMEOUT_MS_MIN &&
    value <= DIVBRAIN_PROVIDER_TIMEOUT_MS_MAX
  );
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

      const { conversationId, content } = parsed.data;

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

      const historyResult = await loadBoundedDivBrainHistory({
        repository: deps.repository,
        actorId,
        conversationId,
      });
      if (!historyResult.ok) {
        return historyResult;
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

      const assembledResult = deps.contextAssembler.assemble({
        currentUserMessage: content,
        conversationId,
        history: historyResult.data,
        guardrailConstraints:
          assessment.decision === "allow_with_constraints"
            ? assessment.constraints
            : [],
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

      let providerResult: DivBrainProviderResult;
      try {
        if (options?.signal?.aborted) {
          providerResult = { status: "cancelled" };
        } else {
          const raw = await deps.provider.generate(providerRequestResult.data);
          providerResult = normalizeDivBrainProviderResult(raw);
        }
      } catch (error) {
        providerResult = mapUnknownToDivBrainProviderResult(error);
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
  };
}
