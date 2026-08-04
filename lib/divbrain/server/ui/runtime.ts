/**
 * DivBrain runtime repository composition for the /brain shell (Ticket 1A-9a).
 *
 * Returns only DivBrainResult<DivBrainConversationRepository>.
 * Never returns a Supabase client, credentials, or persistence internals.
 *
 * Server-only — must never be imported by client components.
 */

import type { DivBrainResult } from "../../results";
import {
  createDivBrainConversationRepository,
  createDivBrainServiceRolePersistencePort,
  type DivBrainConversationRepository,
} from "../repository";

/**
 * Compose the privileged persistence port and conversation repository.
 * Missing service-role configuration maps to a safe DivBrainResult failure.
 */
export function createDivBrainRuntimeRepository(): DivBrainResult<DivBrainConversationRepository> {
  const persistence = createDivBrainServiceRolePersistencePort();
  if (!persistence.ok) {
    return persistence;
  }

  return {
    ok: true,
    data: createDivBrainConversationRepository({
      persistence: persistence.data,
    }),
  };
}
