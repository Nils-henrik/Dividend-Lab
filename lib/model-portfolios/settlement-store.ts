import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DividendCreditPlan } from "./engine/dividends";
import type { SettledTradePlan } from "./engine/settlement";

export type SettlementPersistResult =
  | { ok: true; transactionId: string; alreadySettled?: boolean }
  | { ok: false; reason: string; detail?: string };

/**
 * Persist a simulated trade settlement:
 * transaction (with fee + FX fields) + cash ledger (net of courtage) + holdings + decision status + snapshot.
 * Courtage lives on the transaction (fee_minor); cash buy/sell amount already includes the fee — no separate fee ledger row.
 */
export async function persistSettledTrade(
  client: SupabaseClient,
  input: {
    portfolioId: string;
    plan: SettledTradePlan;
    contributedCapitalMinor: number;
    investedValueAfterMinor: number;
  },
): Promise<SettlementPersistResult> {
  const { plan, portfolioId } = input;
  const executedAt = new Date().toISOString();

  const { data: existing } = await client
    .from("model_portfolio_transactions")
    .select("id")
    .eq("idempotency_key", plan.idempotencyKey)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, transactionId: String(existing.id), alreadySettled: true };
  }

  const { data: tx, error: txError } = await client
    .from("model_portfolio_transactions")
    .insert({
      portfolio_id: portfolioId,
      decision_id: plan.decisionId,
      transaction_type: plan.side,
      instrument_symbol: plan.symbol,
      exchange: plan.exchange,
      instrument_name: plan.instrumentName,
      quantity: plan.quantity,
      price_minor: plan.priceMinor,
      gross_amount_minor: plan.grossAmountMinor,
      fee_minor: plan.feeMinor,
      currency: "SEK",
      native_price_minor: plan.nativePriceMinor,
      native_currency: plan.nativeCurrency,
      fx_to_sek: plan.fxToSek,
      gross_native_minor: plan.grossNativeMinor,
      executed_at: executedAt,
      market_data_as_of: plan.marketDataAsOf,
      rationale: plan.rationale,
      idempotency_key: plan.idempotencyKey,
    })
    .select("id")
    .single();

  if (txError) {
    if (txError.code === "23505") {
      const { data: raced } = await client
        .from("model_portfolio_transactions")
        .select("id")
        .eq("idempotency_key", plan.idempotencyKey)
        .maybeSingle();
      if (raced?.id) return { ok: true, transactionId: String(raced.id), alreadySettled: true };
    }
    return { ok: false, reason: "transaction_insert_failed", detail: txError.message };
  }

  const transactionId = String(tx.id);

  const { error: cashError } = await client.from("model_portfolio_cash_ledger").insert({
    portfolio_id: portfolioId,
    event_type: plan.side,
    amount_minor: plan.cashDeltaMinor,
    currency: "SEK",
    effective_at: executedAt,
    external_key: plan.idempotencyKey,
    transaction_id: transactionId,
    metadata: {
      fee_minor: plan.feeMinor,
      native_currency: plan.nativeCurrency,
      fx_to_sek: plan.fxToSek,
      courtage_included_in_cash_delta: true,
    },
  });

  if (cashError) {
    return { ok: false, reason: "cash_ledger_insert_failed", detail: cashError.message };
  }

  if (plan.holdingQuantityAfter <= 0) {
    const { error: deleteError } = await client
      .from("model_portfolio_holdings")
      .delete()
      .eq("portfolio_id", portfolioId)
      .eq("instrument_symbol", plan.symbol)
      .eq("exchange", plan.exchange);
    if (deleteError) {
      return { ok: false, reason: "holding_delete_failed", detail: deleteError.message };
    }
  } else {
    const { error: holdingError } = await client.from("model_portfolio_holdings").upsert(
      {
        portfolio_id: portfolioId,
        instrument_symbol: plan.symbol,
        exchange: plan.exchange,
        instrument_name: plan.instrumentName,
        instrument_currency: plan.nativeCurrency,
        quantity: plan.holdingQuantityAfter,
        average_cost_minor: plan.averageCostMinorAfter,
        last_price_minor: plan.priceMinor,
        last_price_as_of: plan.marketDataAsOf,
        updated_at: executedAt,
      },
      { onConflict: "portfolio_id,instrument_symbol,exchange" },
    );
    if (holdingError) {
      return { ok: false, reason: "holding_upsert_failed", detail: holdingError.message };
    }
  }

  const { error: decisionError } = await client
    .from("model_portfolio_decisions")
    .update({ status: "executed", executed_at: executedAt })
    .eq("id", plan.decisionId)
    .in("status", ["proposed", "executed"]);

  if (decisionError) {
    return { ok: false, reason: "decision_update_failed", detail: decisionError.message };
  }

  const totalValueMinor = plan.cashAfterMinor + input.investedValueAfterMinor;
  const { error: snapshotError } = await client.from("model_portfolio_snapshots").insert({
    portfolio_id: portfolioId,
    snapshot_at: executedAt,
    total_value_minor: Math.max(0, totalValueMinor),
    cash_value_minor: Math.max(0, plan.cashAfterMinor),
    invested_value_minor: Math.max(0, input.investedValueAfterMinor),
    contributed_capital_minor: Math.max(0, input.contributedCapitalMinor),
    market_data_as_of: plan.marketDataAsOf,
  });

  if (snapshotError && snapshotError.code !== "23505") {
    return { ok: false, reason: "snapshot_insert_failed", detail: snapshotError.message };
  }

  return { ok: true, transactionId };
}

export async function persistDividendCredit(
  client: SupabaseClient,
  plan: DividendCreditPlan,
): Promise<SettlementPersistResult> {
  const { data: existing } = await client
    .from("model_portfolio_transactions")
    .select("id")
    .eq("idempotency_key", plan.idempotencyKey)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, transactionId: String(existing.id), alreadySettled: true };
  }

  const executedAt = plan.paymentDate;

  const { data: tx, error: txError } = await client
    .from("model_portfolio_transactions")
    .insert({
      portfolio_id: plan.portfolioId,
      decision_id: null,
      transaction_type: "dividend",
      instrument_symbol: plan.instrumentSymbol,
      exchange: plan.exchange,
      instrument_name: plan.instrumentName,
      quantity: plan.quantity,
      price_minor: null,
      gross_amount_minor: plan.grossAmountMinor,
      fee_minor: 0,
      currency: "SEK",
      native_price_minor: null,
      native_currency: plan.nativeCurrency,
      fx_to_sek: plan.fxToSek,
      gross_native_minor: plan.nativeAmountMinor,
      executed_at: executedAt,
      market_data_as_of: plan.marketDataAsOf,
      rationale: plan.rationale,
      idempotency_key: plan.idempotencyKey,
    })
    .select("id")
    .single();

  if (txError) {
    if (txError.code === "23505") {
      const { data: raced } = await client
        .from("model_portfolio_transactions")
        .select("id")
        .eq("idempotency_key", plan.idempotencyKey)
        .maybeSingle();
      if (raced?.id) return { ok: true, transactionId: String(raced.id), alreadySettled: true };
    }
    return { ok: false, reason: "transaction_insert_failed", detail: txError.message };
  }

  const transactionId = String(tx.id);

  const { error: cashError } = await client.from("model_portfolio_cash_ledger").insert({
    portfolio_id: plan.portfolioId,
    event_type: "dividend",
    amount_minor: plan.grossAmountMinor,
    currency: "SEK",
    effective_at: executedAt,
    external_key: plan.cashExternalKey,
    transaction_id: transactionId,
    metadata: {
      native_currency: plan.nativeCurrency,
      native_amount_minor: plan.nativeAmountMinor,
      fx_to_sek: plan.fxToSek,
    },
  });

  if (cashError) {
    if (cashError.code === "23505") {
      return { ok: true, transactionId, alreadySettled: true };
    }
    return { ok: false, reason: "cash_ledger_insert_failed", detail: cashError.message };
  }

  return { ok: true, transactionId };
}
