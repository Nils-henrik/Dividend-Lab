/**
 * Provider-neutral DivBrain generation interface (Ticket 1A-5).
 *
 * Adapters catch SDK exceptions and map them via
 * `mapUnknownToDivBrainProviderResult` — never forward raw vendor payloads.
 *
 * This module must never be imported by client components.
 */

import { createDivBrainError, toSafeDivBrainError } from "../../errors";
import type { DivBrainProviderRequest, DivBrainProviderResult } from "./types";
import { DIVBRAIN_PROVIDER_RESULT_STATUSES } from "./types";

/**
 * Thin replaceable generation boundary. No registry, factory, or DI framework.
 */
export type DivBrainProvider = {
  /** Stable adapter id (e.g. `"unconfigured"`, later `"grok"`, …). */
  readonly id: string;
  generate(
    request: DivBrainProviderRequest,
  ): Promise<DivBrainProviderResult>;
};

function isAbortLike(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const name = (error as { name?: unknown }).name;
  return name === "AbortError" || name === "TimeoutError";
}

/**
 * Map unknown thrown values to a normalized provider result.
 * Never includes stack traces, SDK bodies, or secret-bearing messages.
 */
export function mapUnknownToDivBrainProviderResult(
  error: unknown,
): DivBrainProviderResult {
  if (isAbortLike(error)) {
    return { status: "cancelled" };
  }

  const safe = toSafeDivBrainError(error);

  if (safe.code === "cancelled") {
    return { status: "cancelled" };
  }

  if (safe.code === "provider_unavailable") {
    return {
      status: "provider_unavailable",
      error: createDivBrainError("provider_unavailable"),
    };
  }

  return {
    status: "failed",
    error: createDivBrainError(safe.code),
  };
}

export function isDivBrainProviderResult(
  value: unknown,
): value is DivBrainProviderResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { status?: unknown };
  if (
    typeof candidate.status !== "string" ||
    !(DIVBRAIN_PROVIDER_RESULT_STATUSES as readonly string[]).includes(
      candidate.status,
    )
  ) {
    return false;
  }

  switch (candidate.status) {
    case "cancelled":
      return true;
    case "provider_unavailable":
    case "failed": {
      const withError = value as { error?: unknown };
      return (
        typeof withError.error === "object" &&
        withError.error !== null &&
        typeof (withError.error as { code?: unknown }).code === "string"
      );
    }
    case "completed": {
      const completed = value as {
        text?: unknown;
        usage?: unknown;
      };
      return (
        typeof completed.text === "string" &&
        typeof completed.usage === "object" &&
        completed.usage !== null
      );
    }
    default:
      return false;
  }
}
