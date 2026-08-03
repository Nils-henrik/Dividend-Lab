/**
 * Presentation-boundary helper for `/brain` Alpha access (Ticket 1A-8).
 *
 * Maps gate results to unavailable vs honest placeholder — never exposes
 * configured ids, environment names, or configuration reasons.
 *
 * This module must never be imported by client components.
 */

import type { DivBrainAccessGate } from "../service/types";
import { createDivBrainAlphaAccessGateFromEnvironment } from "./gate";
import type { DivBrainAlphaPageAccess } from "./types";

export type ResolveDivBrainAlphaPageAccessOptions = {
  actorId: string;
  accessGate?: DivBrainAccessGate;
};

/**
 * Resolve the `/brain` presentation state for an already-authenticated actor.
 * Unauthenticated handling remains with `requireAuthenticatedUser()` / redirect.
 */
export async function resolveDivBrainAlphaPageAccess(
  options: ResolveDivBrainAlphaPageAccessOptions,
): Promise<DivBrainAlphaPageAccess> {
  const gate =
    options.accessGate ?? createDivBrainAlphaAccessGateFromEnvironment();

  try {
    const access = await gate.checkAccess(options.actorId);
    if (!access.ok) {
      return { status: "unavailable" };
    }

    return { status: "allowed_placeholder" };
  } catch {
    // Injected or unexpected gate failures must fail closed — never escape.
    return { status: "unavailable" };
  }
}
