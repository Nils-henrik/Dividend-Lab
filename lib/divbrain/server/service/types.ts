/**
 * DivBrain application-service contracts (Ticket 1A-7b).
 *
 * Server-only orchestration types. Must never be imported by client components.
 */

import type { DivBrainError } from "../../errors";
import type { DivBrainGuardrailAssessment } from "../../guardrails";
import type { DivBrainResult } from "../../results";
import type { DivBrainMessage } from "../../types";
import type {
  DivBrainAssembledContext,
  DivBrainContextAssemblyInput,
} from "../context/types";
import type { MapAssembledContextToProviderRequestOptions } from "../context/to-provider-request";
import type { DivBrainCostGuard } from "../providers/cost-guard";
import type { DivBrainProvider } from "../providers/provider";
import type { DivBrainProviderRequest } from "../providers/types";
import type {
  DivBrainConversationRepository,
  DivBrainTrustedActorId,
} from "../repository/repository";
import type { DivBrainUsageLedgerRepository } from "../repository/usage-ledger";

/** Trusted actor resolution — session/auth layer only. Never browser-supplied. */
export type DivBrainActorResolver = {
  resolveActor(): Promise<DivBrainResult<{ actorId: DivBrainTrustedActorId }>>;
};

/**
 * Internal Alpha access gate.
 * Ticket 1A-8 owns the concrete `DIVBRAIN_ALPHA_USER_IDS` implementation.
 */
export type DivBrainAccessGate = {
  checkAccess(
    actorId: DivBrainTrustedActorId,
  ): Promise<DivBrainResult<void>>;
};

export type DivBrainGuardrailEvaluator = {
  evaluate(content: unknown): DivBrainResult<DivBrainGuardrailAssessment>;
};

export type DivBrainContextAssembler = {
  assemble(
    input: DivBrainContextAssemblyInput,
  ): DivBrainResult<DivBrainAssembledContext>;
};

export type DivBrainProviderRequestMapper = {
  map(
    assembled: DivBrainAssembledContext,
    options: MapAssembledContextToProviderRequestOptions,
  ): DivBrainResult<DivBrainProviderRequest>;
};

/** Phase 1A default provider timeout (ms). Server-controlled only. */
export const DIVBRAIN_APPLICATION_PROVIDER_TIMEOUT_MS_DEFAULT = 30_000;

export type CreateDivBrainApplicationServiceDeps = {
  actorResolver: DivBrainActorResolver;
  accessGate: DivBrainAccessGate;
  repository: DivBrainConversationRepository;
  guardrailEvaluator: DivBrainGuardrailEvaluator;
  contextAssembler: DivBrainContextAssembler;
  providerRequestMapper: DivBrainProviderRequestMapper;
  provider: DivBrainProvider;
  providerTimeoutMs: number;
  /**
   * Required before paid AI Gateway generation. Missing/invalid guard for a
   * real provider fails closed with zero provider calls.
   */
  costGuard?: DivBrainCostGuard;
  /** Persistent usage ledger for atomic reserve + durable finalize accounting. */
  usageLedger?: DivBrainUsageLedgerRepository;
  /**
   * Server-configured model id for Cost Guard pricing (AI Gateway).
   * Never accepted from browser input.
   */
  providerModelId?: string;
  /** Server-configured max output tokens for conservative projection. */
  providerMaxOutputTokens?: number;
};

/** Trusted server-only options — never part of the browser JSON payload. */
export type DivBrainSubmitMessageOptions = {
  signal?: AbortSignal;
};

/**
 * Safe lifecycle outcome. Pre-lifecycle failures use `DivBrainResult` failure.
 * Blocked and terminal statuses are expected outcomes (`ok: true`).
 */
export type DivBrainSubmitMessageOutcome =
  | {
      status: "blocked";
      persisted: false;
      error: DivBrainError;
      guardrailAssessment: DivBrainGuardrailAssessment;
    }
  | {
      status:
        | "completed"
        | "provider_unavailable"
        | "failed"
        | "cancelled";
      persisted: true;
      guardrailAssessment: DivBrainGuardrailAssessment;
      userMessage: DivBrainMessage;
      assistantMessage: DivBrainMessage;
    };

export type DivBrainApplicationService = {
  /**
   * Execute one user message through the canonical request lifecycle.
   * Never fabricates assistant answers when the provider is unconfigured.
   */
  submitMessage(
    input: unknown,
    options?: DivBrainSubmitMessageOptions,
  ): Promise<DivBrainResult<DivBrainSubmitMessageOutcome>>;
};
