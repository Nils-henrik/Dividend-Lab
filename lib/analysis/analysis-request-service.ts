import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  validateDivLabAnalysisEntitlementReservation,
  type DivLabAnalysisDepth,
  type DivLabAnalysisEntitlementProvider,
} from "./analysis-entitlement";

export type DivLabAnalysisRequestTarget = {
  symbol: string;
  exchange: string;
  name: string;
  yahooSymbol: string;
};

type StoredRequest = {
  id: string;
  user_id: string | null;
  idempotency_key: string;
  instrument_symbol: string;
  exchange: string;
  instrument_name: string;
  yahoo_symbol: string;
  analysis_depth: DivLabAnalysisDepth;
  status: "pending_entitlement" | "queued" | "running" | "completed" | "failed";
};

export type CreateOrQueueDivLabAnalysisRequestResult =
  | {
      ok: true;
      requestId: string;
      status: StoredRequest["status"];
      existing: boolean;
    }
  | {
      ok: false;
      status:
        | "storage_unavailable"
        | "idempotency_conflict"
        | "entitlement_denied"
        | "entitlement_reservation_invalid"
        | "queue_transition_failed";
      reason?: string;
      requestId?: string;
    };

const REQUEST_SELECT = [
  "id",
  "user_id",
  "idempotency_key",
  "instrument_symbol",
  "exchange",
  "instrument_name",
  "yahoo_symbol",
  "analysis_depth",
  "status",
].join(",");

const REQUEST_STATUSES = new Set<StoredRequest["status"]>([
  "pending_entitlement",
  "queued",
  "running",
  "completed",
  "failed",
]);

function storedRequest(value: unknown): StoredRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;

  if (
    typeof row.id !== "string" ||
    (row.user_id !== null && typeof row.user_id !== "string") ||
    typeof row.idempotency_key !== "string" ||
    typeof row.instrument_symbol !== "string" ||
    typeof row.exchange !== "string" ||
    typeof row.instrument_name !== "string" ||
    typeof row.yahoo_symbol !== "string" ||
    (row.analysis_depth !== "light" && row.analysis_depth !== "deep") ||
    typeof row.status !== "string" ||
    !REQUEST_STATUSES.has(row.status as StoredRequest["status"])
  ) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    idempotency_key: row.idempotency_key,
    instrument_symbol: row.instrument_symbol,
    exchange: row.exchange,
    instrument_name: row.instrument_name,
    yahoo_symbol: row.yahoo_symbol,
    analysis_depth: row.analysis_depth,
    status: row.status as StoredRequest["status"],
  };
}

function sameRequestIdentity(input: {
  row: StoredRequest;
  target: DivLabAnalysisRequestTarget;
  analysisDepth: DivLabAnalysisDepth;
}): boolean {
  return (
    input.row.instrument_symbol === input.target.symbol &&
    input.row.exchange === input.target.exchange &&
    input.row.yahoo_symbol === input.target.yahooSymbol &&
    input.row.analysis_depth === input.analysisDepth
  );
}

function boundedFailureCode(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_:-]+/g, "_")
    .slice(0, 96);
  return normalized || "analysis_request_failed";
}

async function markPendingRequestFailed(input: {
  supabase: SupabaseClient;
  requestId: string;
  failureCode: string;
  now: Date;
}): Promise<void> {
  await input.supabase
    .from("divlab_analysis_requests")
    .update({
      status: "failed",
      failure_code: boundedFailureCode(input.failureCode),
      finished_at: input.now.toISOString(),
    })
    .eq("id", input.requestId)
    .eq("status", "pending_entitlement");
}

/**
 * Create/recover one idempotent private request and reserve entitlement only.
 *
 * This function never imports or calls any Analysis/LLM execution engine. A
 * successful result ends at `queued`; Cost Guard + Worker own `running` later.
 *
 * Entitlement adapters must make reserve() idempotent for the same requestId.
 */
export async function createOrQueueDivLabAnalysisRequest(input: {
  supabase: SupabaseClient;
  entitlementProvider: DivLabAnalysisEntitlementProvider;
  userId: string;
  idempotencyKey: string;
  target: DivLabAnalysisRequestTarget;
  analysisDepth: DivLabAnalysisDepth;
  now?: Date;
}): Promise<CreateOrQueueDivLabAnalysisRequestResult> {
  const now = input.now ?? new Date();

  const { error: insertError } = await input.supabase
    .from("divlab_analysis_requests")
    .upsert(
      {
        user_id: input.userId,
        idempotency_key: input.idempotencyKey,
        instrument_symbol: input.target.symbol,
        exchange: input.target.exchange,
        instrument_name: input.target.name,
        yahoo_symbol: input.target.yahooSymbol,
        analysis_depth: input.analysisDepth,
        status: "pending_entitlement",
      },
      {
        onConflict: "user_id,idempotency_key",
        ignoreDuplicates: true,
      },
    );

  if (insertError) {
    return { ok: false, status: "storage_unavailable" };
  }

  const { data, error: readError } = await input.supabase
    .from("divlab_analysis_requests")
    .select(REQUEST_SELECT)
    .eq("user_id", input.userId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (readError || !data) {
    return { ok: false, status: "storage_unavailable" };
  }

  const row = storedRequest(data);
  if (!row) {
    return { ok: false, status: "storage_unavailable" };
  }

  if (!sameRequestIdentity({
    row,
    target: input.target,
    analysisDepth: input.analysisDepth,
  })) {
    return {
      ok: false,
      status: "idempotency_conflict",
      requestId: row.id,
    };
  }

  if (row.status !== "pending_entitlement") {
    return {
      ok: true,
      requestId: row.id,
      status: row.status,
      existing: true,
    };
  }

  const entitlement = await input.entitlementProvider.reserve({
    requestId: row.id,
    userId: input.userId,
    analysisDepth: input.analysisDepth,
    now,
  });

  if (!entitlement.ok) {
    await markPendingRequestFailed({
      supabase: input.supabase,
      requestId: row.id,
      failureCode: `entitlement_${entitlement.reason}`,
      now,
    });
    return {
      ok: false,
      status: "entitlement_denied",
      reason: entitlement.reason,
      requestId: row.id,
    };
  }

  if (
    entitlement.reservation.providerId !== input.entitlementProvider.id ||
    !validateDivLabAnalysisEntitlementReservation({
      reservation: entitlement.reservation,
      expected: {
        requestId: row.id,
        userId: input.userId,
        analysisDepth: input.analysisDepth,
        now,
      },
    })
  ) {
    await input.entitlementProvider.release({
      reservation: entitlement.reservation,
      reason: "internal_recovery",
      now,
    });
    await markPendingRequestFailed({
      supabase: input.supabase,
      requestId: row.id,
      failureCode: "entitlement_reservation_invalid",
      now,
    });
    return {
      ok: false,
      status: "entitlement_reservation_invalid",
      requestId: row.id,
    };
  }

  const { data: queued, error: queueError } = await input.supabase
    .from("divlab_analysis_requests")
    .update({
      status: "queued",
      entitlement_reservation_id: entitlement.reservation.reservationId,
      entitlement_provider_id: entitlement.reservation.providerId,
      entitlement_expires_at: entitlement.reservation.expiresAt,
      queued_at: now.toISOString(),
    })
    .eq("id", row.id)
    .eq("user_id", input.userId)
    .eq("status", "pending_entitlement")
    .select("id,status")
    .maybeSingle();

  if (queueError || !queued) {
    await input.entitlementProvider.release({
      reservation: entitlement.reservation,
      reason: "internal_recovery",
      now,
    });
    await markPendingRequestFailed({
      supabase: input.supabase,
      requestId: row.id,
      failureCode: "entitlement_queue_transition_failed",
      now,
    });
    return {
      ok: false,
      status: "queue_transition_failed",
      requestId: row.id,
    };
  }

  return {
    ok: true,
    requestId: row.id,
    status: "queued",
    existing: false,
  };
}
