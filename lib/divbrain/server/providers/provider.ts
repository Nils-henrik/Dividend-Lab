/**
 * Provider-neutral DivBrain generation interface (Ticket 1A-5).
 *
 * Adapters catch SDK exceptions and map them via
 * `mapUnknownToDivBrainProviderResult` — never forward raw vendor payloads.
 *
 * This module must never be imported by client components.
 */

import {
  createDivBrainError,
  isDivBrainError,
  toSafeDivBrainError,
} from "../../errors";
import type {
  DivBrainProviderRequest,
  DivBrainProviderResult,
  DivBrainProviderUsage,
} from "./types";
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

function normalizeProviderUsage(usage: unknown): DivBrainProviderUsage {
  if (typeof usage !== "object" || usage === null) {
    return {};
  }

  const record = usage as Record<string, unknown>;
  const normalized: DivBrainProviderUsage = {};

  if (
    typeof record.inputTokens === "number" &&
    Number.isInteger(record.inputTokens) &&
    record.inputTokens >= 0
  ) {
    normalized.inputTokens = record.inputTokens;
  }

  if (
    typeof record.outputTokens === "number" &&
    Number.isInteger(record.outputTokens) &&
    record.outputTokens >= 0
  ) {
    normalized.outputTokens = record.outputTokens;
  }

  if (
    typeof record.totalTokens === "number" &&
    Number.isInteger(record.totalTokens) &&
    record.totalTokens >= 0
  ) {
    normalized.totalTokens = record.totalTokens;
  }

  return normalized;
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

/**
 * Runtime type guard for provider results.
 *
 * `failed` / `provider_unavailable` require a catalog-valid `DivBrainError`.
 * `provider_unavailable` additionally requires code `provider_unavailable`.
 * Arbitrary `{ code: string }` objects are rejected.
 */
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
    case "provider_unavailable": {
      const withError = value as { error?: unknown };
      return (
        isDivBrainError(withError.error) &&
        withError.error.code === "provider_unavailable"
      );
    }
    case "failed": {
      const withError = value as { error?: unknown };
      return isDivBrainError(withError.error);
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

/**
 * Validate and sanitize an unknown provider return value into a safe copy.
 *
 * - Never returns provider-owned objects unchanged
 * - Unknown / malformed error codes become `failed` + catalog `internal_error`
 * - Valid `provider_unavailable` always uses the exact catalog error
 * - Valid `failed` always rebuilds the error from the catalog by code
 */
export function normalizeDivBrainProviderResult(
  value: unknown,
): DivBrainProviderResult {
  if (!isDivBrainProviderResult(value)) {
    return {
      status: "failed",
      error: createDivBrainError("internal_error"),
    };
  }

  switch (value.status) {
    case "cancelled":
      return { status: "cancelled" };
    case "provider_unavailable":
      return {
        status: "provider_unavailable",
        error: createDivBrainError("provider_unavailable"),
      };
    case "failed":
      return {
        status: "failed",
        error: createDivBrainError(value.error.code),
      };
    case "completed": {
      if (value.sources !== undefined && !Array.isArray(value.sources)) {
        return {
          status: "failed",
          error: createDivBrainError("internal_error"),
        };
      }

      return {
        status: "completed",
        text: value.text,
        usage: normalizeProviderUsage(value.usage),
        ...(value.sources !== undefined
          ? { sources: [...value.sources] }
          : {}),
      };
    }
    default:
      return {
        status: "failed",
        error: createDivBrainError("internal_error"),
      };
  }
}
