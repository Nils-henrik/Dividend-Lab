/**
 * Safe DivBrain error taxonomy.
 * Browser-facing errors carry only stable codes and calm Swedish messages.
 * Raw Supabase/provider errors, stack traces, secrets, emails and private
 * prompts must never cross this boundary.
 */

export const DIVBRAIN_ERROR_CODES = [
  "authentication_required",
  "access_denied",
  "invalid_request",
  "not_found",
  "safety_blocked",
  "provider_unavailable",
  "rate_limited",
  "persistence_failed",
  "stale_or_unavailable_data",
  "cancelled",
  "internal_error",
] as const;

export type DivBrainErrorCode = (typeof DIVBRAIN_ERROR_CODES)[number];

export type DivBrainError = {
  code: DivBrainErrorCode;
  /** Calm Swedish user-facing message. Never internal policy text. */
  message: string;
  retryable: boolean;
  httpStatus: number;
};

type DivBrainErrorDefinition = Omit<DivBrainError, "code">;

const DIVBRAIN_ERROR_CATALOG: Record<DivBrainErrorCode, DivBrainErrorDefinition> =
  {
    authentication_required: {
      message: "Logga in för att använda DivBrain.",
      retryable: false,
      httpStatus: 401,
    },
    access_denied: {
      message: "DivBrain är inte tillgängligt för det här kontot.",
      retryable: false,
      httpStatus: 403,
    },
    invalid_request: {
      message: "Begäran kunde inte tolkas.",
      retryable: false,
      httpStatus: 400,
    },
    // Owner-scoped reads should normally map both missing and cross-owner
    // resources to not_found so ownership is not leaked. Prefer not_found
    // over access_denied for conversation/message lookup failures.
    not_found: {
      message: "Konversationen hittades inte.",
      retryable: false,
      httpStatus: 404,
    },
    safety_blocked: {
      message: "Kan inte hjälpa med den typen av begäran.",
      retryable: false,
      httpStatus: 422,
    },
    provider_unavailable: {
      message: "AI-motorn är inte tillgänglig just nu.",
      retryable: true,
      httpStatus: 503,
    },
    rate_limited: {
      message: "Tillfällig gräns nådd. Försök senare.",
      retryable: true,
      httpStatus: 429,
    },
    persistence_failed: {
      message: "Kunde inte spara. Försök igen.",
      retryable: true,
      httpStatus: 500,
    },
    stale_or_unavailable_data: {
      message: "Aktuell data saknas eller är inaktuell.",
      retryable: true,
      httpStatus: 503,
    },
    cancelled: {
      message: "Begäran avbröts.",
      retryable: false,
      httpStatus: 499,
    },
    internal_error: {
      message: "Något gick fel. Försök igen.",
      retryable: true,
      httpStatus: 500,
    },
  };

export function isDivBrainErrorCode(value: unknown): value is DivBrainErrorCode {
  return (
    typeof value === "string" &&
    (DIVBRAIN_ERROR_CODES as readonly string[]).includes(value)
  );
}

/** Build a safe public error from a known code. Ignores any raw detail. */
export function createDivBrainError(code: DivBrainErrorCode): DivBrainError {
  const definition = DIVBRAIN_ERROR_CATALOG[code];

  return {
    code,
    message: definition.message,
    retryable: definition.retryable,
    httpStatus: definition.httpStatus,
  };
}

/**
 * Map any unknown failure to a safe DivBrain error.
 * Never forwards raw messages, stacks, or provider/DB payloads.
 * Arbitrary objects are not trusted merely because they contain `code`
 * or `message` — only verified DivBrainError values or known code strings
 * are remapped through the safe catalog; everything else is internal_error.
 */
export function toSafeDivBrainError(error: unknown): DivBrainError {
  if (isDivBrainError(error)) {
    return createDivBrainError(error.code);
  }

  if (isDivBrainErrorCode(error)) {
    return createDivBrainError(error);
  }

  return createDivBrainError("internal_error");
}

export function isDivBrainError(value: unknown): value is DivBrainError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<DivBrainError>;

  return (
    isDivBrainErrorCode(candidate.code) &&
    typeof candidate.message === "string" &&
    typeof candidate.retryable === "boolean" &&
    typeof candidate.httpStatus === "number" &&
    candidate.message === DIVBRAIN_ERROR_CATALOG[candidate.code].message &&
    candidate.retryable === DIVBRAIN_ERROR_CATALOG[candidate.code].retryable &&
    candidate.httpStatus === DIVBRAIN_ERROR_CATALOG[candidate.code].httpStatus
  );
}
