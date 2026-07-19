/**
 * Deterministic UnconfiguredProvider (Ticket 1A-5).
 *
 * Makes the unconfigured state explicit and safe. Never fabricates assistant
 * text, never reads environment variables, and never performs network I/O.
 *
 * This module must never be imported by client components.
 */

import { createDivBrainError } from "../../errors";
import type { DivBrainProvider } from "./provider";
import type { DivBrainProviderRequest, DivBrainProviderResult } from "./types";
import { DIVBRAIN_PROVIDER_UNCONFIGURED_ID } from "./types";
import { validateDivBrainProviderRequest } from "./validation";

/**
 * Phase 1A stand-in provider. Always returns `provider_unavailable` for valid
 * requests (or `cancelled` / `failed` for abort / invalid input).
 */
export class UnconfiguredProvider implements DivBrainProvider {
  readonly id = DIVBRAIN_PROVIDER_UNCONFIGURED_ID;

  async generate(
    request: DivBrainProviderRequest,
  ): Promise<DivBrainProviderResult> {
    const validated = validateDivBrainProviderRequest(request);
    if (!validated.ok) {
      return {
        status: "failed",
        error: createDivBrainError("invalid_request"),
      };
    }

    if (validated.data.signal?.aborted) {
      return { status: "cancelled" };
    }

    return {
      status: "provider_unavailable",
      error: createDivBrainError("provider_unavailable"),
    };
  }
}

/** Factory for callers that prefer a function over `new`. */
export function createUnconfiguredProvider(): DivBrainProvider {
  return new UnconfiguredProvider();
}
