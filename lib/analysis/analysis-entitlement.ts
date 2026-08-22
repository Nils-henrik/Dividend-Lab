import "server-only";

export const DIVLAB_ANALYSIS_ENTITLEMENT_INTERFACE_VERSION = "analysis_entitlement_v1" as const;

export type DivLabAnalysisDepth = "light" | "deep";

export type DivLabAnalysisEntitlementDenyReason =
  | "provider_not_configured"
  | "provider_unavailable"
  | "not_entitled"
  | "account_restricted"
  | "request_limit_reached"
  | "invalid_request";

export type DivLabAnalysisEntitlementReleaseReason =
  | "request_failed_before_queue"
  | "request_cancelled_before_execution"
  | "internal_recovery";

export type DivLabAnalysisEntitlementReservation = {
  /** Internal UUID stored on divlab_analysis_requests.entitlement_reservation_id. */
  reservationId: string;
  /** Provider-neutral machine id for whichever future adapter grants access. */
  providerId: string;
  requestId: string;
  userId: string;
  analysisDepth: DivLabAnalysisDepth;
  reservedAt: string;
  expiresAt: string;
};

export type DivLabAnalysisEntitlementReserveInput = {
  requestId: string;
  userId: string;
  analysisDepth: DivLabAnalysisDepth;
  now: Date;
};

export type DivLabAnalysisEntitlementReserveResult =
  | {
      ok: true;
      reservation: DivLabAnalysisEntitlementReservation;
    }
  | {
      ok: false;
      reason: DivLabAnalysisEntitlementDenyReason;
    };

export type DivLabAnalysisEntitlementReleaseInput = {
  reservation: DivLabAnalysisEntitlementReservation;
  reason: DivLabAnalysisEntitlementReleaseReason;
  now: Date;
};

export type DivLabAnalysisEntitlementReleaseResult =
  | { ok: true; alreadyReleased?: boolean }
  | { ok: false; reason: "provider_unavailable" | "reservation_not_found" | "reservation_mismatch" };

/**
 * Provider-neutral server contract for future Light/Deep Analysis entitlement.
 *
 * The Request API will own orchestration later. The Analysis engine must depend
 * only on this contract, never directly on a commercial provider SDK/schema.
 */
export interface DivLabAnalysisEntitlementProvider {
  readonly id: string;

  reserve(
    input: DivLabAnalysisEntitlementReserveInput,
  ): Promise<DivLabAnalysisEntitlementReserveResult>;

  release(
    input: DivLabAnalysisEntitlementReleaseInput,
  ): Promise<DivLabAnalysisEntitlementReleaseResult>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROVIDER_ID_PATTERN = /^[a-z0-9_.:-]{1,64}$/;
const MAX_RESERVATION_CLOCK_SKEW_MS = 60_000;

function validIsoDate(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Validate adapter output before reservation metadata is persisted on a request.
 * This prevents a provider adapter from smuggling mismatched user/depth/request
 * identity or an already-expired entitlement into the queue boundary.
 */
export function validateDivLabAnalysisEntitlementReservation(input: {
  reservation: DivLabAnalysisEntitlementReservation;
  expected: DivLabAnalysisEntitlementReserveInput;
}): boolean {
  const { reservation, expected } = input;
  const reservedAt = validIsoDate(reservation.reservedAt);
  const expiresAt = validIsoDate(reservation.expiresAt);
  const nowMs = expected.now.getTime();

  return Boolean(
    UUID_PATTERN.test(expected.requestId) &&
      UUID_PATTERN.test(expected.userId) &&
      UUID_PATTERN.test(reservation.reservationId) &&
      UUID_PATTERN.test(reservation.requestId) &&
      UUID_PATTERN.test(reservation.userId) &&
      PROVIDER_ID_PATTERN.test(reservation.providerId) &&
      reservation.requestId === expected.requestId &&
      reservation.userId === expected.userId &&
      reservation.analysisDepth === expected.analysisDepth &&
      reservedAt !== null &&
      expiresAt !== null &&
      reservedAt <= nowMs + MAX_RESERVATION_CLOCK_SKEW_MS &&
      expiresAt > nowMs &&
      expiresAt > reservedAt,
  );
}

/**
 * Safe default until a real entitlement adapter is explicitly configured.
 * Importing the interface must never make paid Analysis available by accident.
 */
export function createFailClosedAnalysisEntitlementProvider(): DivLabAnalysisEntitlementProvider {
  return {
    id: "unconfigured",
    async reserve() {
      return { ok: false, reason: "provider_not_configured" };
    },
    async release() {
      return { ok: false, reason: "provider_unavailable" };
    },
  };
}
