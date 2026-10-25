import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { creditModelPortfolioDividendEvent } from "./dividend-service";
import { fetchFxRateToSekOnDate } from "./fx-adapter";
import { isSupportedFxCurrency } from "./fx";
import type { DividendEventInput, DividendLedgerTransaction } from "./dividends";

export type DueDividendCreditSummary = {
  scanned: number;
  credited: number;
  alreadyCredited: number;
  failed: Array<{ eventId: string; reason: string }>;
};

/**
 * Settle already verified/registered dividend events on or after payment day.
 * This is deliberately NOT an external corporate-action discovery source:
 * unverified dividends must never be synthesized from price history or yields.
 *
 * Re-running after a transient error is safe: the credit RPC owns the
 * idempotency key and atomically updates cash, transactions and valuation.
 */
export async function creditDueRegisteredDividends(input: {
  supabase: SupabaseClient;
  now: Date;
  stockholmDate: string;
}): Promise<DueDividendCreditSummary> {
  const summary: DueDividendCreditSummary = {
    scanned: 0, credited: 0, alreadyCredited: 0, failed: [],
  };
  const { data: events, error } = await input.supabase
    .from("model_portfolio_dividend_events")
    .select("id,portfolio_id,instrument_symbol,exchange,instrument_name,ex_date,payment_date,native_amount_per_share_minor,native_currency,source_publisher,source_event_key")
    .eq("status", "registered")
    .lte("payment_date", input.stockholmDate)
    .order("payment_date", { ascending: true })
    .limit(100);

  if (error) throw new Error(`dividend_event_read_failed:${error.code ?? "unknown"}`);
  summary.scanned = events?.length ?? 0;

  for (const row of events ?? []) {
    const event: DividendEventInput = {
      portfolioId: String(row.portfolio_id),
      instrumentSymbol: String(row.instrument_symbol),
      exchange: String(row.exchange),
      instrumentName: String(row.instrument_name),
      exDate: String(row.ex_date),
      paymentDate: String(row.payment_date),
      nativeAmountPerShareMinor: Number(row.native_amount_per_share_minor),
      nativeCurrency: String(row.native_currency),
      sourcePublisher: String(row.source_publisher),
      sourceEventKey: String(row.source_event_key),
    };
    if (!isSupportedFxCurrency(event.nativeCurrency)) {
      summary.failed.push({ eventId: String(row.id), reason: "unsupported_currency" });
      continue;
    }

    const { data: transactions, error: tradeError } = await input.supabase
      .from("model_portfolio_transactions")
      .select("instrument_symbol,exchange,transaction_type,quantity,executed_at")
      .eq("portfolio_id", event.portfolioId)
      .eq("instrument_symbol", event.instrumentSymbol)
      .eq("exchange", event.exchange)
      .in("transaction_type", ["buy", "sell"])
      .order("executed_at", { ascending: true });
    if (tradeError) {
      summary.failed.push({ eventId: String(row.id), reason: "transactions_unavailable" });
      continue;
    }

    const fx = event.nativeCurrency === "SEK"
      ? null
      : await fetchFxRateToSekOnDate(event.nativeCurrency, event.paymentDate);
    if (fx && !fx.ok) {
      summary.failed.push({ eventId: String(row.id), reason: fx.reason });
      continue;
    }
    const result = await creditModelPortfolioDividendEvent(input.supabase, {
      eventId: String(row.id),
      event,
      transactions: ((transactions ?? []) as Array<Record<string, unknown>>).map((trade): DividendLedgerTransaction => ({
        instrumentSymbol: String(trade.instrument_symbol),
        exchange: String(trade.exchange),
        transactionType: String(trade.transaction_type) as "buy" | "sell",
        quantity: Number(trade.quantity),
        executedAt: String(trade.executed_at),
      })),
      fxRateToSek: fx?.ok ? fx.quote : null,
      now: input.now,
    });
    if (!result.ok) {
      summary.failed.push({ eventId: String(row.id), reason: result.reason });
      continue;
    }
    if (result.idempotent) summary.alreadyCredited += 1;
    else summary.credited += 1;
  }

  return summary;
}
