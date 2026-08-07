/**
 * Concrete wiring helpers for Ticket 1A-7b + 1A-8 + 1B-2 runtime provider selection.
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
  providerTimeoutMs?: number;
};

/**
 * Build application-service dependencies with concrete Alpha access wiring.
 *
 * Runtime provider selection is server-only and fail-closed:
 * - an explicit `provider` override wins;
 * - otherwise `createDivBrainProvider()` reads the approved server config;
 * - missing/malformed config resolves to `UnconfiguredProvider`.
 *
 * Merely importing or constructing these dependencies never performs a model
 * request. Network generation can occur only later, after auth + Alpha access +
 * validation + guardrails + persistence reach the provider lifecycle.
 */
export function createDivBrainAlphaApplicationServiceDeps(
  options: CreateDivBrainAlphaApplicationServiceDepsOptions,
): CreateDivBrainApplicationServiceDeps {
  const access = createDivBrainAlphaAccessModule({
    accessGate: options.accessGate,
    actorResolver: options.actorResolver,
  });
  const provider = options.provider ?? createDivBrainProvider().provider;

  return createDivBrainApplicationServiceDeps({
    actorResolver: access.actorResolver,
    accessGate: access.accessGate,
    repository: options.repository,
    provider,
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
