import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  planDividendCredit,
  type DividendEventInput,
  type DividendLedgerTransaction,
} from "./dividends";
import { fetchFxRateToSek } from "./fx-adapter";
import { isSupportedFxCurrency, type FxRateQuote } from "./fx";

export type CreditDividendRequest = {
  eventId: string;
  event: DividendEventInput;
  transactions: readonly DividendLedgerTransaction[];
  fxRateToSek?: FxRateQuote | null;
  now?: Date;
};

export async function creditModelPortfolioDividendEvent(
  supabase: SupabaseClient,
  request: CreditDividendRequest,
): Promise<{ ok: true; transactionId: string; idempotent: boolean } | { ok: false; reason: string }> {
  const now = request.now ?? new Date();
  if (!isSupportedFxCurrency(request.event.nativeCurrency)) {
    return { ok: false, reason: "unsupported_currency" };
  }

  let fxRate = request.fxRateToSek ?? null;
  if (request.event.nativeCurrency !== "SEK" && !fxRate) {
    const fetched = await fetchFxRateToSek(request.event.nativeCurrency, now);
    if (!fetched.ok) return { ok: false, reason: "fx_unavailable" };
    fxRate = fetched.quote;
  }

  const plan = planDividendCredit({
    event: request.event,
    transactions: request.transactions,
    fxRateToSek: fxRate,
    now,
  });
  if (!plan.ok) return { ok: false, reason: plan.reason };

  const { data, error } = await supabase.rpc("credit_model_portfolio_dividend_event", {
    p_event_id: request.eventId,
    p_plan: {
      eligibleQuantity: plan.eligibleQuantity,
      grossAmountSekMinor: plan.grossAmountSekMinor,
      nativeCurrency: plan.nativeCurrency,
      nativeGrossMinor: plan.nativeGrossMinor,
      fxRateToSek: plan.fxRateToSek,
      fxAsOf: plan.fxAsOf,
      fxSourcePublisher: plan.fxSourcePublisher,
      idempotencyKey: plan.idempotencyKey,
    },
  });

  if (error) return { ok: false, reason: `rpc_failed:${error.code ?? "unknown"}` };

  const payload = (data ?? {}) as {
    ok?: boolean;
    reason?: string;
    transaction_id?: string;
    idempotent?: boolean;
  };
  if (!payload.ok || !payload.transaction_id) {
    return { ok: false, reason: payload.reason ?? "credit_rejected" };
  }

  return {
    ok: true,
    transactionId: payload.transaction_id,
    idempotent: Boolean(payload.idempotent),
  };
}

/**
 * Corporate-action ingestion remains fail-closed until a verified provider feed
 * is wired. This helper exists so callers cannot invent dividend history.
 */
export function isAutomatedDividendIngestionEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): false {
  void env.MODEL_PORTFOLIO_DIVIDEND_INGESTION_ENABLED;
  return false;
}
