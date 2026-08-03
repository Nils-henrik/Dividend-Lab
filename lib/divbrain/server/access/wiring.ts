/**
 * Concrete wiring helpers for Ticket 1A-7b + 1A-8 (Alpha access).
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
  provider?: CreateDivBrainApplicationServiceDeps["provider"];
  providerTimeoutMs?: number;
};

/**
 * Build 1A-7b application-service dependencies with concrete Alpha access wiring.
 * Defaults remain UnconfiguredProvider + approved guardrail/context/mapper bindings.
 */
export function createDivBrainAlphaApplicationServiceDeps(
  options: CreateDivBrainAlphaApplicationServiceDepsOptions,
): CreateDivBrainApplicationServiceDeps {
  const access = createDivBrainAlphaAccessModule({
    accessGate: options.accessGate,
    actorResolver: options.actorResolver,
  });

  return createDivBrainApplicationServiceDeps({
    actorResolver: access.actorResolver,
    accessGate: access.accessGate,
    repository: options.repository,
    ...(options.provider !== undefined ? { provider: options.provider } : {}),
    ...(options.providerTimeoutMs !== undefined
      ? { providerTimeoutMs: options.providerTimeoutMs }
      : {}),
  });
}

/** Convenience factory: Alpha-wired application service for later Ticket 1A-9. */
export function createDivBrainAlphaApplicationService(
  options: CreateDivBrainAlphaApplicationServiceDepsOptions,
): DivBrainApplicationService {
  return createDivBrainApplicationService(
    createDivBrainAlphaApplicationServiceDeps(options),
  );
}
