/**
 * DivBrain application-service contracts (Ticket 1A-7b).
 * Server-only orchestration types. Must never be imported by client components.
 */

import type { DivBrainError } from "../../errors";
import type { DivBrainGuardrailAssessment } from "../../guardrails";
import type { DivBrainResult } from "../../results";
import type { DivBrainSource } from "../../sources";
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

export type DivBrainActorResolver = {
  resolveActor(): Promise<DivBrainResult<{ actorId: DivBrainTrustedActorId }>>;
};

export type DivBrainAccessGate = {
  checkAccess(actorId: DivBrainTrustedActorId): Promise<DivBrainResult<void>>;
};

export type DivBrainGuardrailEvaluator = {
  evaluate(content: unknown): DivBrainResult<DivBrainGuardrailAssessment>;
};

export type DivBrainContextAssembler = {
  assemble(input: DivBrainContextAssemblyInput): DivBrainResult<DivBrainAssembledContext>;
};

/** Optional server-only grounding loader. It may fail closed by returning []. */
export type DivBrainSupplementalSourceLoader = {
  load(query: string): Promise<readonly DivBrainSource[]>;
};

export type DivBrainProviderRequestMapper = {
  map(
    assembled: DivBrainAssembledContext,
    options: MapAssembledContextToProviderRequestOptions,
  ): DivBrainResult<DivBrainProviderRequest>;
};

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
  sourceLoader?: DivBrainSupplementalSourceLoader;
  costGuard?: DivBrainCostGuard;
  usageLedger?: DivBrainUsageLedgerRepository;
  providerModelId?: string;
  providerMaxOutputTokens?: number;
};

export type DivBrainSubmitMessageOptions = {
  signal?: AbortSignal;
};

export type DivBrainSubmitMessageOutcome =
  | {
      status: "blocked";
      persisted: false;
      error: DivBrainError;
      guardrailAssessment: DivBrainGuardrailAssessment;
    }
  | {
      status: "completed" | "provider_unavailable" | "failed" | "cancelled";
      persisted: true;
      guardrailAssessment: DivBrainGuardrailAssessment;
      userMessage: DivBrainMessage;
      assistantMessage: DivBrainMessage;
    };

export type DivBrainApplicationService = {
  submitMessage(
    input: unknown,
    options?: DivBrainSubmitMessageOptions,
  ): Promise<DivBrainResult<DivBrainSubmitMessageOutcome>>;
};
