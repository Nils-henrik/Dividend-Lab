/**
 * Concrete wiring helpers for Ticket 1A-7b + 1A-8 + Phase 1B/1C runtime wiring.
 *
 * Does not create API routes, server actions, or service-role clients.
 * Repository must be supplied by the caller (Ticket 1A-9+).
 *
 * This module must never be imported by client components.
 */

import type { DivBrainConversationRepository } from "../repository/repository";
import {
  createDivBrainApplicationService,
  createDivBrainApplicationServiceDeps,
} from "../service";
import type {
  CreateDivBrainApplicationServiceDeps,
  DivBrainApplicationService,
} from "../service/types";
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
};

/**
 * Build application-service dependencies with concrete Internal Alpha wiring.
 *
 * Runtime provider selection is server-only and fail-closed:
 * - an explicit `provider` override wins;
 * - otherwise `createDivBrainProvider()` reads approved server config;
 * - missing/malformed config resolves to `UnconfiguredProvider`.
 *
 * Learning grounding is also server-only:
 * - an explicit `contextAssembler` override wins;
 * - otherwise the Alpha service uses the deterministic Learning-aware assembler;
 * - retrieved Learning prose remains `untrusted_context` under the canonical
 *   context assembler's validation, delimiter and budget rules.
 *
 * Merely constructing these dependencies performs no model/network request.
 */
export function createDivBrainAlphaApplicationServiceDeps(
  options: CreateDivBrainAlphaApplicationServiceDepsOptions,
): CreateDivBrainApplicationServiceDeps {
  const access = createDivBrainAlphaAccessModule({
    accessGate: options.accessGate,
    actorResolver: options.actorResolver,
  });
  const provider = options.provider ?? createDivBrainProvider().provider;
  const contextAssembler =
    options.contextAssembler ?? createDivBrainLearningContextAssembler();

  return createDivBrainApplicationServiceDeps({
    actorResolver: access.actorResolver,
    accessGate: access.accessGate,
    repository: options.repository,
    provider,
    contextAssembler,
    ...(options.providerTimeoutMs !== undefined
      ? { providerTimeoutMs: options.providerTimeoutMs }
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
