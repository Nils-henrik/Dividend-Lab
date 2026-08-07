/**
 * Safe mapping from AI SDK / AI Gateway failures to DivBrain provider results.
 *
 * Never forwards raw gateway/provider payloads, response bodies, URLs, or
 * secret-bearing messages across the DivBrain boundary.
 *
 * This module must never be imported by client components.
 */

import {
  APICallError,
  LoadAPIKeyError,
  LoadSettingError,
} from "ai";
import {
  GatewayAuthenticationError,
  GatewayFailedDependencyError,
  GatewayForbiddenError,
  GatewayInternalServerError,
  GatewayInvalidRequestError,
  GatewayModelNotFoundError,
  GatewayRateLimitError,
  GatewayResponseError,
} from "@ai-sdk/gateway";
import { createDivBrainError } from "../../errors";
import type { DivBrainProviderResult } from "./types";

function isAbortLike(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const name = (error as { name?: unknown }).name;
  return name === "AbortError" || name === "TimeoutError";
}

function statusCodeOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return typeof statusCode === "number" && Number.isFinite(statusCode)
    ? statusCode
    : undefined;
}

function completedUnavailable(): DivBrainProviderResult {
  return {
    status: "provider_unavailable",
    error: createDivBrainError("provider_unavailable"),
  };
}

function completedFailed(
  code: "rate_limited" | "invalid_request" | "internal_error",
): DivBrainProviderResult {
  return {
    status: "failed",
    error: createDivBrainError(code),
  };
}

/**
 * Map unknown gateway/SDK failures to a normalized DivBrain provider result.
 * Catalog errors only — never includes stack traces or vendor bodies.
 */
export function mapGatewayErrorToDivBrainProviderResult(
  error: unknown,
): DivBrainProviderResult {
  if (isAbortLike(error)) {
    return { status: "cancelled" };
  }

  if (GatewayRateLimitError.isInstance(error)) {
    return completedFailed("rate_limited");
  }

  if (
    GatewayAuthenticationError.isInstance(error) ||
    GatewayForbiddenError.isInstance(error) ||
    LoadAPIKeyError.isInstance(error) ||
    LoadSettingError.isInstance(error)
  ) {
    return completedUnavailable();
  }

  if (
    GatewayInternalServerError.isInstance(error) ||
    GatewayFailedDependencyError.isInstance(error) ||
    GatewayModelNotFoundError.isInstance(error)
  ) {
    return completedUnavailable();
  }

  if (
    GatewayInvalidRequestError.isInstance(error) ||
    GatewayResponseError.isInstance(error)
  ) {
    return completedFailed("internal_error");
  }

  if (APICallError.isInstance(error)) {
    const statusCode = error.statusCode;

    if (statusCode === 429) {
      return completedFailed("rate_limited");
    }

    if (statusCode === 401 || statusCode === 403) {
      return completedUnavailable();
    }

    if (statusCode !== undefined && statusCode >= 500) {
      return completedUnavailable();
    }

    if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
      return completedFailed("invalid_request");
    }

    if (error.isRetryable) {
      return completedUnavailable();
    }

    return completedFailed("internal_error");
  }

  const statusCode = statusCodeOf(error);
  if (statusCode === 429) {
    return completedFailed("rate_limited");
  }
  if (statusCode === 401 || statusCode === 403) {
    return completedUnavailable();
  }
  if (statusCode !== undefined && statusCode >= 500) {
    return completedUnavailable();
  }

  return completedFailed("internal_error");
}
