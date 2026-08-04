/**
 * DivBrain runtime repository composition for the /brain shell (Ticket 1A-9a).
 *
 * Returns only DivBrainResult<DivBrainConversationRepository>.
 * Never returns a Supabase client, credentials, or persistence internals.
 *
 * Unexpected throws fail closed as a fresh catalog `internal_error`.
 * Thrown public error codes are not preserved.
 *
 * Server-only — must never be imported by client components.
 */

import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode } from "../../results";
import {
  createDivBrainConversationRepository,
  createDivBrainServiceRolePersistencePort,
  type DivBrainConversationRepository,
  type DivBrainPersistencePort,
} from "../repository";

export type CreateDivBrainRuntimeRepositoryOptions = {
  /**
   * Injected persistence-port factory for deterministic tests.
   * Production default uses `createDivBrainServiceRolePersistencePort()`.
   */
  createPersistencePort?: () => DivBrainResult<DivBrainPersistencePort>;
  /**
   * Injected repository factory for deterministic tests.
   * Production default uses `createDivBrainConversationRepository()`.
   */
  createRepository?: (options: {
    persistence: DivBrainPersistencePort;
  }) => DivBrainConversationRepository;
};

/**
 * Compose the privileged persistence port and conversation repository.
 * Missing service-role configuration maps to a safe DivBrainResult failure.
 * Any unexpected throw collapses to a fresh `internal_error` failure.
 */
export function createDivBrainRuntimeRepository(
  options: CreateDivBrainRuntimeRepositoryOptions = {},
): DivBrainResult<DivBrainConversationRepository> {
  const createPersistencePort =
    options.createPersistencePort ?? createDivBrainServiceRolePersistencePort;
  const createRepository =
    options.createRepository ?? createDivBrainConversationRepository;

  let persistence: DivBrainResult<DivBrainPersistencePort>;

  try {
    persistence = createPersistencePort();
  } catch {
    return divBrainFailureFromCode("internal_error");
  }

  if (!persistence.ok) {
    return persistence;
  }

  try {
    return {
      ok: true,
      data: createRepository({
        persistence: persistence.data,
      }),
    };
  } catch {
    return divBrainFailureFromCode("internal_error");
  }
}
