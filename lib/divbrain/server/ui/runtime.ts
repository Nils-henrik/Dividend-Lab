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
  type CreateDivBrainConversationRepositoryOptions,
  type DivBrainConversationRepository,
  type DivBrainPersistencePort,
} from "../repository";
import {
  mapListConversationsPersistenceKindToDiagnosticCategory,
  noopDivBrainShellDiagnosticSink,
  type DivBrainShellDiagnosticSink,
} from "./diagnostic";

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
  createRepository?: (
    options: CreateDivBrainConversationRepositoryOptions,
  ) => DivBrainConversationRepository;
  /**
   * Optional fixed-category diagnostic sink.
   * Must never receive raw errors, secrets, or identity values.
   */
  diagnose?: DivBrainShellDiagnosticSink;
};

/**
 * Compose the privileged persistence port and conversation repository.
 * Missing service-role configuration maps to a safe DivBrainResult failure.
 * Any unexpected throw collapses to a fresh `internal_error` failure.
 */
export function createDivBrainRuntimeRepository(
  options: CreateDivBrainRuntimeRepositoryOptions = {},
): DivBrainResult<DivBrainConversationRepository> {
  const diagnose = options.diagnose ?? noopDivBrainShellDiagnosticSink;
  const createRepository =
    options.createRepository ?? createDivBrainConversationRepository;

  const createPersistencePort =
    options.createPersistencePort ??
    (() =>
      createDivBrainServiceRolePersistencePort({
        onMissingConfiguration: () => {
          diagnose("runtime_configuration_missing");
        },
        onClientCreationThrow: () => {
          diagnose("runtime_client_creation_failed");
        },
      }));

  let persistence: DivBrainResult<DivBrainPersistencePort>;

  try {
    persistence = createPersistencePort();
  } catch {
    diagnose("runtime_client_creation_failed");
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
        onListConversationsPersistenceFailure: (kind) => {
          diagnose(
            mapListConversationsPersistenceKindToDiagnosticCategory(kind),
          );
        },
      }),
    };
  } catch {
    diagnose("runtime_client_creation_failed");
    return divBrainFailureFromCode("internal_error");
  }
}
