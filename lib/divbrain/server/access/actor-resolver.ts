/**
 * Concrete DivBrain session actor resolver (Ticket 1A-8).
 *
 * Uses the established server auth/session layer. Never calls redirect().
 * Returns only `{ actorId }` — never email, profile, or session material.
 *
 * This module must never be imported by client components.
 */

import { createDivBrainError } from "../../errors";
import type { DivBrainResult } from "../../results";
import {
  divBrainFailure,
  divBrainFailureFromUnknown,
  divBrainSuccess,
} from "../../results";
import { isDivBrainUuid } from "../repository/ids";
import type { DivBrainActorResolver } from "../service/types";
import type { CreateDivBrainSessionActorResolverOptions } from "./types";

type AuthenticatedIdentity = { id: string };

async function defaultGetAuthenticatedUser(): Promise<AuthenticatedIdentity | null> {
  // Lazy import keeps unit tests free of Next.js session/navigation loading
  // when an injected getAuthenticatedUser is supplied.
  const { getAuthenticatedUser } = await import("@/lib/auth/session");
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }

  return { id: user.id };
}

/**
 * Create a DivBrainActorResolver backed by the server session.
 * Does not accept actor id as an argument and never redirects.
 */
export function createDivBrainSessionActorResolver(
  options: CreateDivBrainSessionActorResolverOptions = {},
): DivBrainActorResolver {
  const getUser = options.getAuthenticatedUser ?? defaultGetAuthenticatedUser;

  return {
    async resolveActor(): Promise<DivBrainResult<{ actorId: string }>> {
      try {
        const user = await getUser();

        if (!user) {
          return divBrainFailure(createDivBrainError("authentication_required"));
        }

        if (!isDivBrainUuid(user.id)) {
          return divBrainFailure(createDivBrainError("internal_error"));
        }

        return divBrainSuccess({ actorId: user.id.toLowerCase() });
      } catch (error) {
        return divBrainFailureFromUnknown(error);
      }
    },
  };
}
