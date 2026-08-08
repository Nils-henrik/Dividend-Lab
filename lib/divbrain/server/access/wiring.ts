/**
 * Concrete wiring helpers for Ticket 1A-7b + 1A-8 + Phase 1B/1C + Issue #105.
 *
 * Does not create API routes, server actions, or service-role clients for the
 * conversation repository (caller-supplied). Usage ledger may be resolved from
 * service-role env when a real provider is selected.
 *
 * This module must never be imported by client components.
 */

import type { DivBrainConversationRepository } from "../repository/repository";
import { createDivBrainServiceRoleUsageLedgerRepository } from "../repository/service-role-client";
import {
  createDivBrainApplicationService,
  createDivBrainApplicationServiceDeps,
} from "../service";
import type {
  CreateDivBrainApplicationServiceDeps,
  DivBrainApplicationService,
} from "../service/types";
import {
  createDenyAllDivBrainCostGuard,
  createDivBrainCostGuard,
  providerRequiresDivBrainCostGuard,
} from "../providers/cost-guard";
import {
  isValidDivBrainCostGuardConfig,
  readDivBrainCostGuardConfigFromEnv,
} from "../providers/cost-guard-config";
import { createDivBrainProvider } from "../providers/factory";
import { createDivBrainLearningContextAssembler } from "../learning/context-assembler";
import { createDivBrainSessionActorResolver } from "./actor-resolver";
import { createDivBrainAlphaAccessGate } from "./gate";
import type {
  CreateDivBrainAlphaAccessGateOptions,
  CreateDivBrainSessionActorResolverOptions,
  DivBrainAlphaAccessModule,
} from "./types";

export type CreateDivBrainAlphaAccessModuleOptions = {
  accessGate?: CreateDivBrainAlphaAccessGateOptions;
  actorResolver?: CreateDivBrainSessionActorResolverOptions;
};

/** Build concrete actor resolver + Alpha access gate pair. */
export function createDivBrainAlphaAccessModule(
  options: CreateDivBrainAlphaAccessModuleOptions = {},
): DivBrainAlphaAccessModule {
  return {
    actorResolver: createDivBrainSessionActorResolver(options.actorResolver),
    accessGate: createDivBrainAlphaAccessGate(options.accessGate),
  };
}

export type CreateDivBrainAlphaApplicationServiceDepsOptions = {
  repository: DivBrainConversationRepository;
  accessGate?: CreateDivBrainAlphaAccessGateOptions;
  actorResolver?: CreateDivBrainSessionActorResolverOptions;
  /** Explicit provider override for tests/special server callers. */
  provider?: CreateDivBrainApplicationServiceDeps["provider"];
  /** Explicit context-assembler override for deterministic tests/special callers. */
  contextAssembler?: CreateDivBrainApplicationServiceDeps["contextAssembler"];
  providerTimeoutMs?: number;
  /** Explicit Cost Guard override (tests). */
  costGuard?: CreateDivBrainApplicationServiceDeps["costGuard"];
  /** Explicit usage ledger override (tests). */
  usageLedger?: CreateDivBrainApplicationServiceDeps["usageLedger"];
  providerModelId?: string;
  providerMaxOutputTokens?: number;
};

/**
 * Build application-service dependencies with concrete Internal Alpha wiring.
 *
 * Runtime provider selection is server-only and fail-closed:
 * - an explicit `provider` override wins;
 * - otherwise `createDivBrainProvider()` reads approved server config;
 * - missing/malformed config resolves to `UnconfiguredProvider`.
 *
 * Cost Guard (Issue #105):
 * - required atomic reservation before any real AI Gateway generate call;
 * - missing/malformed guard config or usage ledger fails closed (zero paid calls);
 * - constructing these dependencies performs no model/network request.
 *
 * Learning grounding is also server-only:
 * - an explicit `contextAssembler` override wins;
 * - otherwise the Alpha service uses the deterministic Learning-aware assembler;
 * - retrieved Learning prose remains `untrusted_context` under the canonical
 *   context assembler's validation, delimiter and budget rules.
 */
export function createDivBrainAlphaApplicationServiceDeps(
  options: CreateDivBrainAlphaApplicationServiceDepsOptions,
): CreateDivBrainApplicationServiceDeps {
  const access = createDivBrainAlphaAccessModule({
    accessGate: options.accessGate,
    actorResolver: options.actorResolver,
  });
  const factoryResult =
    options.provider === undefined ? createDivBrainProvider() : null;
  const provider = options.provider ?? factoryResult!.provider;
  const contextAssembler =
    options.contextAssembler ?? createDivBrainLearningContextAssembler();

  const providerModelId =
    options.providerModelId ??
    (factoryResult?.config.kind === "ai-gateway"
      ? factoryResult.config.modelId
      : undefined);
  const providerMaxOutputTokens =
    options.providerMaxOutputTokens ??
    (factoryResult?.config.kind === "ai-gateway"
      ? factoryResult.config.maxOutputTokens
      : undefined);

  let costGuard = options.costGuard;
  let usageLedger = options.usageLedger;

  if (providerRequiresDivBrainCostGuard(provider.id)) {
    if (usageLedger === undefined) {
      const ledgerResult = createDivBrainServiceRoleUsageLedgerRepository();
      if (ledgerResult.ok) {
        usageLedger = ledgerResult.data;
      }
    }

    if (costGuard === undefined) {
      const config = readDivBrainCostGuardConfigFromEnv();
      if (isValidDivBrainCostGuardConfig(config) && usageLedger) {
        costGuard = createDivBrainCostGuard({
          config,
          usageLedger,
        });
      } else {
        // Real provider without valid guard/ledger — deny all paid generation.
        costGuard = createDenyAllDivBrainCostGuard("config_invalid");
      }
    }
  }

  return createDivBrainApplicationServiceDeps({
    actorResolver: access.actorResolver,
    accessGate: access.accessGate,
    repository: options.repository,
    provider,
    contextAssembler,
    ...(options.providerTimeoutMs !== undefined
      ? { providerTimeoutMs: options.providerTimeoutMs }
      : {}),
    ...(costGuard !== undefined ? { costGuard } : {}),
    ...(usageLedger !== undefined ? { usageLedger } : {}),
    ...(providerModelId !== undefined ? { providerModelId } : {}),
    ...(providerMaxOutputTokens !== undefined
      ? { providerMaxOutputTokens }
      : {}),
  });
}

/** Convenience factory: Alpha-wired application service for `/brain`. */
export function createDivBrainAlphaApplicationService(
  options: CreateDivBrainAlphaApplicationServiceDepsOptions,
): DivBrainApplicationService {
  return createDivBrainApplicationService(
    createDivBrainAlphaApplicationServiceDeps(options),
  );
}
